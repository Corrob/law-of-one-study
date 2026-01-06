import { NextRequest } from "next/server";
import { openai, createEmbedding } from "@/lib/openai";
import { searchRaMaterial, searchConcepts } from "@/lib/pinecone";
import { debug } from "@/lib/debug";
import { UNIFIED_RESPONSE_PROMPT, buildContextFromQuotes } from "@/lib/prompts";
import { Quote, ChatMessage } from "@/lib/types";
import { parseSessionQuestionReference } from "@/lib/quote-utils";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { trackLLMGeneration } from "@/lib/posthog-server";
import {
  identifyConcepts,
  getRelatedConcepts,
  buildSearchExpansion,
  buildConceptContextForPrompt,
  findConceptById,
} from "@/lib/concept-graph";
import type { GraphConcept } from "@/lib/types-graph";
import {
  MODEL_CONFIG,
  RATE_LIMIT_CONFIG,
  VALIDATION_LIMITS,
  CONVERSATION_CONFIG,
  SEARCH_CONFIG,
  calculateCost,
} from "@/lib/config";

// Extracted chat modules
import {
  createChatError,
  isChatError,
  buildConversationContext,
  augmentQuery,
  generateSuggestions,
  processStreamWithMarkers,
} from "@/lib/chat";

interface ChatRequest {
  message: string;
  history: ChatMessage[];
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting (async for Vercel KV in production)
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

    // Input validation - message
    if (!message || typeof message !== "string") {
      return new Response(JSON.stringify({ error: "Message is required and must be a string" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (message.length === 0) {
      return new Response(JSON.stringify({ error: "Message cannot be empty" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (message.length > VALIDATION_LIMITS.maxMessageLength) {
      return new Response(JSON.stringify({ error: `Message too long. Maximum ${VALIDATION_LIMITS.maxMessageLength} characters.` }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Input validation - history
    if (!Array.isArray(history)) {
      return new Response(JSON.stringify({ error: "History must be an array" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (history.length > VALIDATION_LIMITS.maxHistoryLength) {
      return new Response(JSON.stringify({ error: `History too long. Maximum ${VALIDATION_LIMITS.maxHistoryLength} messages.` }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate history structure
    for (const msg of history) {
      if (!msg || typeof msg !== "object") {
        return new Response(JSON.stringify({ error: "Invalid history format" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      if (!msg.role || (msg.role !== "user" && msg.role !== "assistant")) {
        return new Response(JSON.stringify({ error: "Invalid message role in history" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      if (!msg.content || typeof msg.content !== "string") {
        return new Response(JSON.stringify({ error: "Invalid message content in history" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      if (msg.content.length > VALIDATION_LIMITS.maxHistoryMessageLength) {
        return new Response(JSON.stringify({ error: "Message in history too long" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Build conversation context (recent messages for LLM, full history for metadata)
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
          // Step 0: Check for explicit session/question reference
          const sessionRef = parseSessionQuestionReference(message);
          if (sessionRef) {
            debug.log("[API] Detected session/question reference:", sessionRef);
          }

          // Step 0.5: HYBRID CONCEPT DETECTION
          // A) Regex-based detection (instant, free)
          const regexConcepts = identifyConcepts(message);

          // B) Embedding-based detection (semantic, ~$0.00001)
          const conceptEmbedding = await createEmbedding(message);
          const conceptSearchResults = await searchConcepts(conceptEmbedding, SEARCH_CONFIG.conceptTopK);
          const embeddingConcepts = conceptSearchResults
            .filter((r) => r.score !== undefined && r.score > SEARCH_CONFIG.conceptMinScore)
            .map((r) => findConceptById(r.id))
            .filter((c): c is GraphConcept => c !== undefined);

          // C) Merge: regex concepts first (higher confidence), then embedding
          const seenIds = new Set(regexConcepts.map((c) => c.id));
          const detectedConcepts = [...regexConcepts];
          for (const concept of embeddingConcepts) {
            if (!seenIds.has(concept.id)) {
              seenIds.add(concept.id);
              detectedConcepts.push(concept);
            }
          }

          // D) Get related concepts from merged set
          const relatedConcepts = detectedConcepts.length > 0
            ? getRelatedConcepts(detectedConcepts.map(c => c.id), 1)
            : [];
          const conceptSearchTerms = buildSearchExpansion(detectedConcepts);
          const conceptContext = buildConceptContextForPrompt(detectedConcepts);

          if (detectedConcepts.length > 0) {
            debug.log("[API] Regex concepts:", regexConcepts.map(c => c.term));
            debug.log("[API] Embedding concepts:", embeddingConcepts.map(c => c.term));
            debug.log("[API] Merged concepts:", detectedConcepts.map(c => c.term));
            debug.log("[API] Related concepts:", relatedConcepts.slice(0, 5).map(c => c.term));
            debug.log("[API] Search expansion terms:", conceptSearchTerms.slice(0, 10));
          }

          // Step 1: Augment query with Ra terminology and detect intent
          const augmentStartTime = Date.now();
          // Include concept terms in query for better augmentation
          const queryWithConcepts = conceptSearchTerms.length > 0
            ? `${message} [Related concepts: ${conceptSearchTerms.slice(0, 5).join(", ")}]`
            : message;
          let { intent, augmentedQuery, confidence } = await augmentQuery(queryWithConcepts);
          const augmentLatencyMs = Date.now() - augmentStartTime;

          // If session ref detected, override to quote-search intent for better response handling
          if (sessionRef) {
            intent = "quote-search";
            confidence = "high";
            // For session-only queries, augment with session topics
            if (sessionRef.question === undefined) {
              augmentedQuery = `session ${sessionRef.session} Ra Material`;
            }
          }
          debug.log("[API] Query augmentation:", { intent, confidence, augmentedQuery, turnCount, sessionRef, latencyMs: augmentLatencyMs });

          // Handle off-topic queries - skip search, return redirect
          if (intent === "off-topic") {
            // Send meta event with no quotes
            send("meta", { quotes: [], intent, confidence });

            // Stream redirect message
            const redirectMessage = "That's outside my focus on the Ra Material, but I'd be happy to explore any Law of One topics with you. Is there something about consciousness, spiritual evolution, or Ra's teachings you're curious about?";

            // Stream the message character by character for consistent UX
            for (let i = 0; i < redirectMessage.length; i += 10) {
              const chunk = redirectMessage.slice(i, i + 10);
              send("chunk", { type: "text", content: chunk });
              await new Promise((resolve) => setTimeout(resolve, 10));
            }

            // Generate welcoming suggestions for Ra topics
            const offTopicSuggestions = [
              "What is the Law of One?",
              "Tell me about densities",
              "What topics can I explore?",
            ];
            send("suggestions", { items: offTopicSuggestions });

            send("done", {});
            // Small delay to ensure client receives all data before connection closes
            await new Promise((resolve) => setTimeout(resolve, 100));
            controller.close();
            return;
          }

          // Step 2: Create embedding from augmented query
          let embedding: number[];
          try {
            embedding = await createEmbedding(augmentedQuery);
          } catch (e) {
            throw createChatError("EMBEDDING_FAILED", e instanceof Error ? e : undefined);
          }

          // Step 3: Search Pinecone (with metadata filter if session ref detected)
          let searchResults;
          try {
            searchResults = await searchRaMaterial(embedding, {
              topK: sessionRef ? SEARCH_CONFIG.sessionRefTopK : SEARCH_CONFIG.defaultTopK,
              sessionFilter: sessionRef || undefined,
            });
          } catch (e) {
            throw createChatError("SEARCH_FAILED", e instanceof Error ? e : undefined);
          }

          const passages: Quote[] = searchResults.map((r) => ({
            text: r.text,
            reference: r.reference,
            url: r.url,
          }));

          // Step 4: Send quotes metadata with intent, confidence, and detected concepts
          send("meta", {
            quotes: passages,
            intent,
            confidence,
            concepts: detectedConcepts.map(c => ({
              id: c.id,
              term: c.term,
              definition: c.definition,
              category: c.category,
            })),
          });

          const quotesContext = buildContextFromQuotes(passages);

          // Build quote exclusion block if quotes were previously shown
          const quoteExclusionBlock =
            quotesUsed.length > 0
              ? `\n\nQUOTES ALREADY SHOWN (do not reuse these references): ${quotesUsed.join(", ")}`
              : "";

          // Build concept context block if concepts were detected
          const conceptContextBlock = conceptContext
            ? `\n\n${conceptContext}`
            : "";

          // Step 5: Single streaming LLM call with unified prompt
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

          // Step 6: Process stream with marker handling
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

          // Track LLM generation with PostHog
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

          // Step 7: Generate follow-up suggestions
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
