import { NextRequest } from "next/server";
import { openai } from "@/lib/openai";
import { debug } from "@/lib/debug";
import { UNIFIED_RESPONSE_PROMPT, buildContextFromQuotes } from "@/lib/prompts";
import { ChatMessage } from "@/lib/types";
import { parseSessionQuestionReference } from "@/lib/quote-utils";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { trackLLMGeneration } from "@/lib/posthog-server";
import {
  MODEL_CONFIG,
  RATE_LIMIT_CONFIG,
  CONVERSATION_CONFIG,
  calculateCost,
} from "@/lib/config";

// Chat modules
import {
  createChatError,
  isChatError,
  buildConversationContext,
  augmentQuery,
  generateSuggestions,
  processStreamWithMarkers,
  validateChatRequest,
  validationErrorResponse,
  detectConcepts,
  formatConceptsForMeta,
  buildQueryWithConcepts,
  streamOffTopicResponse,
  performSearch,
} from "@/lib/chat";

interface ChatRequest {
  message: string;
  history: ChatMessage[];
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIp = getClientIp(request);
    const rateLimitResult = await checkRateLimit(clientIp, RATE_LIMIT_CONFIG);

    if (!rateLimitResult.success) {
      return new Response(
        JSON.stringify({
          error: "Too many requests. Please wait before trying again.",
          retryAfter: Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000),
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "X-RateLimit-Limit": rateLimitResult.limit.toString(),
            "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
            "X-RateLimit-Reset": new Date(rateLimitResult.resetAt).toISOString(),
            "Retry-After": Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    const body: ChatRequest = await request.json();
    const { message, history } = body;

    // Input validation
    const validationResult = validateChatRequest(message, history);
    if (!validationResult.valid) {
      return validationErrorResponse(validationResult);
    }

    // Build conversation context
    const recentHistory = history.slice(-CONVERSATION_CONFIG.recentHistoryCount);
    const { turnCount, quotesUsed } = buildConversationContext(history);

    // Create streaming response
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        const send = (event: string, data: object) => {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        };

        try {
          // Check for explicit session/question reference
          const sessionRef = parseSessionQuestionReference(message);
          if (sessionRef) {
            debug.log("[API] Detected session/question reference:", sessionRef);
          }

          // Hybrid concept detection
          const conceptResult = await detectConcepts(message);
          const { detectedConcepts, searchTerms, promptContext } = conceptResult;

          // Query augmentation with concept context
          const augmentStartTime = Date.now();
          const queryWithConcepts = buildQueryWithConcepts(message, searchTerms);
          let { intent, augmentedQuery, confidence } = await augmentQuery(queryWithConcepts);
          const augmentLatencyMs = Date.now() - augmentStartTime;

          // Override intent for session references
          if (sessionRef) {
            intent = "quote-search";
            confidence = "high";
            if (sessionRef.question === undefined) {
              augmentedQuery = `session ${sessionRef.session} Ra Material`;
            }
          }
          debug.log("[API] Query augmentation:", { intent, confidence, augmentedQuery, turnCount, sessionRef, latencyMs: augmentLatencyMs });

          // Handle off-topic queries
          if (intent === "off-topic") {
            await streamOffTopicResponse(send);
            controller.close();
            return;
          }

          // Search for relevant passages
          const { passages } = await performSearch(augmentedQuery, sessionRef);

          // Send metadata
          send("meta", {
            quotes: passages,
            intent,
            confidence,
            concepts: formatConceptsForMeta(detectedConcepts),
          });

          const quotesContext = buildContextFromQuotes(passages);

          // Build context blocks
          const quoteExclusionBlock =
            quotesUsed.length > 0
              ? `\n\nQUOTES ALREADY SHOWN (do not reuse these references): ${quotesUsed.join(", ")}`
              : "";

          const conceptContextBlock = promptContext
            ? `\n\n${promptContext}`
            : "";

          // LLM streaming call
          let response;
          try {
            response = await openai.chat.completions.create({
              model: MODEL_CONFIG.chatModel,
              messages: [
                { role: "system", content: UNIFIED_RESPONSE_PROMPT },
                ...recentHistory.map((m) => ({
                  role: m.role as "user" | "assistant",
                  content: m.content,
                })),
                {
                  role: "user",
                  content: `[Intent: ${intent}] [Confidence: ${confidence}] [Turn: ${turnCount}]\n\n${message}\n\nHere are relevant Ra passages:\n\n${quotesContext}${quoteExclusionBlock}${conceptContextBlock}\n\nRespond to the user, using {{QUOTE:N}} format to include quotes.`,
                },
              ],
              reasoning_effort: MODEL_CONFIG.reasoningEffort,
              stream: true,
              stream_options: { include_usage: true },
            });
          } catch (e) {
            throw createChatError("STREAM_FAILED", e instanceof Error ? e : undefined);
          }

          // Process stream with marker handling
          let fullOutput: string;
          let usage: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } | undefined;
          try {
            const result = await processStreamWithMarkers(
              response as AsyncIterable<{ choices: Array<{ delta?: { content?: string } }>; usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } }>,
              passages,
              send
            );
            fullOutput = result.fullOutput;
            usage = result.usage;
          } catch (e) {
            throw createChatError("STREAM_FAILED", e instanceof Error ? e : undefined);
          }

          // Track LLM generation
          if (usage) {
            const responseLatencyMs = Date.now() - augmentStartTime;
            trackLLMGeneration({
              distinctId: clientIp,
              model: MODEL_CONFIG.chatModel,
              provider: "openai",
              input: message.substring(0, 500),
              output: fullOutput.substring(0, 500),
              promptTokens: usage.prompt_tokens,
              completionTokens: usage.completion_tokens,
              cost: calculateCost(usage.prompt_tokens || 0, usage.completion_tokens || 0),
              latencyMs: responseLatencyMs,
              metadata: {
                intent,
                confidence,
                augmentedQuery: augmentedQuery.substring(0, 200),
                numPassages: passages.length,
              },
            });
          }

          // Generate follow-up suggestions
          const suggestions = await generateSuggestions(message, fullOutput, intent, { turnCount });
          if (suggestions.length > 0) {
            send("suggestions", { items: suggestions });
          }

          send("done", {});
        } catch (error) {
          console.error("Streaming error:", error);

          if (isChatError(error)) {
            send("error", {
              code: error.code,
              message: error.userMessage,
              retryable: error.retryable,
            });
          } else {
            const chatError = createChatError("UNKNOWN_ERROR", error instanceof Error ? error : undefined);
            send("error", {
              code: chatError.code,
              message: chatError.userMessage,
              retryable: chatError.retryable,
            });
          }
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response(JSON.stringify({ error: "Failed to process request" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
