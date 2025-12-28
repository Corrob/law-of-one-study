import { NextRequest } from "next/server";
import { openai, createEmbedding } from "@/lib/openai";
import { searchRaMaterial } from "@/lib/pinecone";
import {
  QUERY_AUGMENTATION_PROMPT,
  UNIFIED_RESPONSE_PROMPT,
  buildContextFromQuotes,
} from "@/lib/prompts";
import { Quote } from "@/lib/types";
import { applySentenceRangeToQuote, formatWholeQuote } from "@/lib/quote-utils";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { trackLLMGeneration } from "@/lib/posthog-server";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatRequest {
  message: string;
  history: ChatMessage[];
}

// Check if string could be the start of a {{QUOTE:N}} or {{QUOTE:N:s2:s5}} marker
function couldBePartialMarker(s: string): boolean {
  const prefixes = ["{", "{{", "{{Q", "{{QU", "{{QUO", "{{QUOT", "{{QUOTE", "{{QUOTE:"];
  if (prefixes.includes(s)) return true;
  if (/^\{\{QUOTE:\d+$/.test(s)) return true;
  if (/^\{\{QUOTE:\d+\}$/.test(s)) return true;
  if (/^\{\{QUOTE:\d+:$/.test(s)) return true;
  if (/^\{\{QUOTE:\d+:s$/.test(s)) return true;
  if (/^\{\{QUOTE:\d+:s\d+$/.test(s)) return true;
  if (/^\{\{QUOTE:\d+:s\d+:$/.test(s)) return true;
  if (/^\{\{QUOTE:\d+:s\d+:s$/.test(s)) return true;
  if (/^\{\{QUOTE:\d+:s\d+:s\d+$/.test(s)) return true;
  if (/^\{\{QUOTE:\d+:s\d+:s\d+\}$/.test(s)) return true;
  return false;
}

// Calculate OpenAI API cost based on model and token usage
function calculateCost(model: string, promptTokens: number, completionTokens: number): number {
  // GPT-5-mini pricing (as of Jan 2025)
  // Input: $0.075 per 1M tokens, Output: $0.30 per 1M tokens
  const inputCostPer1M = 0.075;
  const outputCostPer1M = 0.3;

  const inputCost = (promptTokens / 1_000_000) * inputCostPer1M;
  const outputCost = (completionTokens / 1_000_000) * outputCostPer1M;

  return inputCost + outputCost;
}

// Augment query with Ra Material terminology and detect intent
async function augmentQuery(
  message: string
): Promise<{ intent: "quote-search" | "conceptual"; augmentedQuery: string }> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5-mini",
      messages: [
        { role: "system", content: QUERY_AUGMENTATION_PROMPT },
        { role: "user", content: message },
      ],
      reasoning_effort: "low",
    });

    const content = response.choices[0]?.message?.content || "";

    // Parse JSON response
    const parsed = JSON.parse(content);
    return {
      intent: parsed.intent === "quote-search" ? "quote-search" : "conceptual",
      augmentedQuery: parsed.augmented_query || message,
    };
  } catch (error) {
    console.error("[API] Query augmentation failed, using original message:", error);
    // Fallback: use original message with "conceptual" intent
    return { intent: "conceptual", augmentedQuery: message };
  }
}

// Process streaming response and handle quote markers
async function processStreamWithMarkers(
  stream: AsyncIterable<{ choices: Array<{ delta?: { content?: string } }>; usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } }>,
  passages: Quote[],
  send: (event: string, data: object) => void
): Promise<{ fullOutput: string; usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } }> {
  let buffer = "";
  let accumulatedText = "";
  let fullOutput = "";
  let usageData: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } | undefined;

  for await (const chunk of stream) {
    // Capture usage data from final chunk
    if (chunk.usage) {
      usageData = chunk.usage;
    }

    const content = chunk.choices[0]?.delta?.content || "";
    if (content) {
      fullOutput += content;
      buffer += content;

      // Process buffer for complete markers
      while (true) {
        const markerMatch = buffer.match(/\{\{QUOTE:(\d+)(?::s(\d+):s(\d+))?\}\}/);
        if (!markerMatch || markerMatch.index === undefined) {
          // No complete marker found - check for partial marker
          let partialStart = -1;
          for (let i = Math.max(0, buffer.length - 25); i < buffer.length; i++) {
            if (couldBePartialMarker(buffer.slice(i))) {
              partialStart = i;
              break;
            }
          }

          if (partialStart >= 0) {
            accumulatedText += buffer.slice(0, partialStart);
            buffer = buffer.slice(partialStart);
          } else {
            accumulatedText += buffer;
            buffer = "";
          }
          break;
        }

        // Found complete marker - text before goes to accumulated
        const textBefore = buffer.slice(0, markerMatch.index);
        accumulatedText += textBefore;

        // Emit accumulated text as one complete chunk
        if (accumulatedText.trim()) {
          send("chunk", { type: "text", content: accumulatedText });
          accumulatedText = "";
        }

        // Parse quote marker and apply sentence range filtering
        const quoteIndex = parseInt(markerMatch[1], 10);
        const quote = passages[quoteIndex - 1]; // Convert from 1-indexed to 0-indexed

        if (quote) {
          let quoteText: string;

          // Apply sentence range if specified, otherwise format whole quote
          if (markerMatch[2] && markerMatch[3]) {
            const sentenceStart = parseInt(markerMatch[2], 10);
            const sentenceEnd = parseInt(markerMatch[3], 10);
            quoteText = applySentenceRangeToQuote(quote.text, sentenceStart, sentenceEnd);
            console.log("[API] Applied sentence range", sentenceStart, "-", sentenceEnd, "to quote", quoteIndex);
          } else {
            quoteText = formatWholeQuote(quote.text);
            console.log("[API] Formatted whole quote", quoteIndex);
          }

          console.log("[API] Matched marker:", markerMatch[0]);
          send("chunk", {
            type: "quote",
            text: quoteText,
            reference: quote.reference,
            url: quote.url,
          });
        }

        buffer = buffer.slice(markerMatch.index + markerMatch[0].length);
      }
    }
  }

  // Flush any remaining text
  accumulatedText += buffer;
  if (accumulatedText.trim()) {
    send("chunk", { type: "text", content: accumulatedText });
  }

  return { fullOutput, usage: usageData };
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting - 10 requests per minute per IP
    const clientIp = getClientIp(request);
    const rateLimitResult = checkRateLimit(clientIp, {
      maxRequests: 10,
      windowMs: 60 * 1000, // 1 minute
    });

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

    if (message.length > 5000) {
      return new Response(JSON.stringify({ error: "Message too long. Maximum 5000 characters." }), {
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

    if (history.length > 20) {
      return new Response(JSON.stringify({ error: "History too long. Maximum 20 messages." }), {
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
      if (msg.content.length > 10000) {
        return new Response(JSON.stringify({ error: "Message in history too long" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Build conversation context (last 3 messages)
    const recentHistory = history.slice(-3);

    // Create streaming response
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        const send = (event: string, data: object) => {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        };

        try {
          // Step 1: Augment query with Ra terminology and detect intent
          const augmentStartTime = Date.now();
          const { intent, augmentedQuery } = await augmentQuery(message);
          const augmentLatencyMs = Date.now() - augmentStartTime;
          console.log("[API] Query augmentation:", { intent, augmentedQuery, latencyMs: augmentLatencyMs });

          // Step 2: Create embedding from augmented query
          const embedding = await createEmbedding(augmentedQuery);

          // Step 3: Search Pinecone
          const searchStartTime = Date.now();
          const searchResults = await searchRaMaterial(embedding, 5);
          const searchLatencyMs = Date.now() - searchStartTime;

          const passages: Quote[] = searchResults.map((r) => ({
            text: r.text,
            reference: r.reference,
            url: r.url,
          }));

          // Step 4: Send quotes metadata with intent
          send("meta", { quotes: passages, intent });

          const quotesContext = buildContextFromQuotes(passages);

          // Step 5: Single streaming LLM call with unified prompt
          const responseStartTime = Date.now();
          const response = await openai.chat.completions.create({
            model: "gpt-5-mini",
            messages: [
              { role: "system", content: UNIFIED_RESPONSE_PROMPT },
              ...recentHistory.map((m) => ({
                role: m.role as "user" | "assistant",
                content: m.content,
              })),
              {
                role: "user",
                content: `[Intent: ${intent}]\n\n${message}\n\nHere are relevant Ra passages:\n\n${quotesContext}\n\nRespond to the user, using {{QUOTE:N}} format to include quotes.`,
              },
            ],
            reasoning_effort: "low",
            stream: true,
            stream_options: { include_usage: true },
          });

          // Step 6: Process stream with marker handling
          const { fullOutput, usage } = await processStreamWithMarkers(
            response as AsyncIterable<{ choices: Array<{ delta?: { content?: string } }>; usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } }>,
            passages,
            send
          );

          // Track LLM generation
          if (usage) {
            const responseLatencyMs = Date.now() - responseStartTime;
            const cost = calculateCost(
              "gpt-5-mini",
              usage.prompt_tokens || 0,
              usage.completion_tokens || 0
            );
            trackLLMGeneration({
              distinctId: clientIp,
              model: "gpt-5-mini",
              provider: "openai",
              input: message.substring(0, 500),
              output: fullOutput.substring(0, 500),
              promptTokens: usage.prompt_tokens,
              completionTokens: usage.completion_tokens,
              totalTokens: usage.total_tokens,
              cost,
              latencyMs: responseLatencyMs,
              metadata: {
                mode: "unified",
                intent,
                augmentedQuery: augmentedQuery.substring(0, 200),
                augmentLatencyMs,
                searchLatencyMs,
                numPassages: passages.length,
              },
            });
          }

          send("done", {});
        } catch (error) {
          console.error("Streaming error:", error);
          send("error", { message: "Failed to generate response" });
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
