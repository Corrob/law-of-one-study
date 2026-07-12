/**
 * POST /api/ask — streaming LLM guide to the Ra Material.
 *
 * Grounded entirely in our concept graph (no RAG, no stored source text). The
 * response is streamed as Server-Sent Events; the assistant paraphrases in its
 * own words and cites sources with {{CITE:...}} markers that the client renders
 * as links to L/L Research (llresearch.org).
 */

import { createHash, randomUUID } from "node:crypto";
import { getOpenAIClient } from "@/lib/ask/openai";
import { AskRequestSchema } from "@/lib/schemas/ask";
import { buildSystemPrompt, buildUserContent } from "@/lib/ask/prompts";
import { buildGrounding } from "@/lib/ask/grounding";
import { checkRateLimit, getClientIp } from "@/lib/ask/rate-limit";
import { trackLLMGeneration, trackEvent, flushPostHog } from "@/lib/ask/posthog-server";
import { findReproducedExcerpt } from "@/lib/ask/reproduction";
import { generateSuggestions } from "@/lib/ask/suggestions";
import {
  ASK_MODEL,
  ASK_REASONING_EFFORT,
  ASK_MAX_TOKENS,
  ASK_TIMEOUT_MS,
  ASK_RATE_LIMIT,
  calculateCost,
} from "@/lib/ask/config";

// The OpenAI SDK needs the Node.js runtime (not Edge).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SSE_HEADERS = {
  "Content-Type": "text/event-stream; charset=utf-8",
  "Cache-Control": "no-cache, no-transform",
  Connection: "keep-alive",
} as const;

function jsonError(
  message: string,
  status: number,
  extra?: object,
  headers?: Record<string, string>
): Response {
  return new Response(JSON.stringify({ error: message, ...extra }), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

/** Salted, non-reversible id derived from an IP — never log the raw IP to analytics. */
function anonymizeIp(ip: string): string {
  const salt = process.env.ASK_IP_SALT ?? "lawofone-ask";
  return "ip_" + createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 16);
}

export async function POST(request: Request): Promise<Response> {
  if (!process.env.OPENAI_API_KEY) {
    return jsonError("The Ask feature is not configured. Set OPENAI_API_KEY.", 503);
  }

  // Rate limit by IP (distributed via Redis when configured).
  const ip = getClientIp(request);
  const limit = await checkRateLimit(`ask:${ip}`, ASK_RATE_LIMIT);
  if (!limit.success) {
    const retryAfter = Math.max(1, Math.ceil((limit.resetAt - Date.now()) / 1000));
    return jsonError(
      "Too many requests. Please slow down.",
      429,
      { retryAfter },
      { "Retry-After": String(retryAfter) }
    );
  }

  // Parse + validate.
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body.", 400);
  }
  const parsed = AskRequestSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Invalid request.", 400);
  }
  const { message, history, locale, distinctId } = parsed.data;

  // Build grounding (no RAG) and prompts.
  const grounding = buildGrounding(message, history, locale);
  const systemPrompt = buildSystemPrompt(locale);
  const userContent = buildUserContent(message, grounding.focused);

  // OpenAI automatically caches the long, stable system prefix (the atlas).
  const messages = [
    { role: "system" as const, content: systemPrompt },
    ...history.map((turn) => ({ role: turn.role, content: turn.content })),
    { role: "user" as const, content: userContent },
  ];

  // Analytics identity: prefer the client's PostHog id; never send the raw IP.
  const analyticsId = distinctId || anonymizeIp(ip);
  const traceId = randomUUID();

  // Grounding-recall telemetry: a question that matches no concept or
  // supplement falls back to the atlas alone. Track the miss (never the text)
  // so we know where the graph needs aliases or new concepts.
  if (grounding.matchedConceptIds.length === 0) {
    trackEvent(analyticsId, "ask_no_focused_grounding", {
      trace_id: traceId,
      locale,
      message_length: message.length,
      has_history: history.length > 0,
    });
  }

  const client = getOpenAIClient();
  const encoder = new TextEncoder();
  const startedAt = Date.now();

  // Stop generating (and paying) the moment the client disconnects, and put a
  // hard ceiling on a hung upstream call. `request.signal` fires on disconnect
  // before the stream starts; `cancelled` covers a mid-stream disconnect.
  const cancelled = new AbortController();
  const timeout = AbortSignal.timeout(ASK_TIMEOUT_MS);
  const signal = AbortSignal.any([request.signal, cancelled.signal, timeout]);

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      // Suppress writes only when the CLIENT is gone — a timeout must still
      // reach the (still connected) client as an error event.
      const clientGone = () => request.signal.aborted || cancelled.signal.aborted;
      const send = (event: string, data: object) => {
        if (clientGone()) return;
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      let output = "";
      let promptTokens: number | undefined;
      let completionTokens: number | undefined;

      try {
        send("meta", { concepts: grounding.matchedConceptIds });

        const openaiStream = await client.chat.completions.create(
          {
            model: ASK_MODEL,
            messages,
            reasoning_effort: ASK_REASONING_EFFORT,
            max_completion_tokens: ASK_MAX_TOKENS,
            stream: true,
            stream_options: { include_usage: true },
          },
          { signal }
        );

        for await (const chunk of openaiStream) {
          const delta = chunk.choices[0]?.delta?.content;
          if (delta) {
            output += delta;
            send("chunk", { text: delta });
          }
          if (chunk.usage) {
            promptTokens = chunk.usage.prompt_tokens;
            completionTokens = chunk.usage.completion_tokens;
          }
        }

        // Follow-up suggestions — a small best-effort second call that never
        // throws (returns a localized fallback on failure).
        const suggestions = await generateSuggestions(
          message,
          output,
          locale,
          grounding.matchedTerms
        );
        send("suggestions", { items: suggestions });

        send("done", {});

        // Non-blocking safety net: flag (never block) any verbatim reproduction
        // of a source excerpt so we can monitor and tighten the prompt. We log
        // the reference for ourselves but never send the excerpt text anywhere.
        const reproduced = findReproducedExcerpt(output, grounding.excerpts);
        if (reproduced) {
          console.warn(
            `[api/ask] possible verbatim reproduction (trace ${traceId}); concepts: ${grounding.matchedConceptIds.join(", ")}`
          );
          trackEvent(analyticsId, "ask_possible_reproduction", {
            trace_id: traceId,
            locale,
            concept_ids: grounding.matchedConceptIds,
          });
        }

        // LLM analytics (cost/latency/tokens) — no raw prompt/answer text.
        trackLLMGeneration({
          distinctId: analyticsId,
          traceId,
          model: ASK_MODEL,
          provider: "openai",
          inputLength: message.length,
          outputLength: output.length,
          promptTokens,
          completionTokens,
          cost: calculateCost(promptTokens ?? 0, completionTokens ?? 0),
          latencyMs: Date.now() - startedAt,
          metadata: { locale, conceptCount: grounding.matchedConceptIds.length },
        });
      } catch (error) {
        if (timeout.aborted) {
          console.error("[api/ask] generation timed out");
          send("error", { error: "The response took too long. Please try again." });
        } else if (signal.aborted) {
          // Client disconnected — nothing to send, nothing went wrong.
        } else {
          console.error("[api/ask] streaming error:", error);
          send("error", { error: "Something went wrong generating a response." });
        }
      } finally {
        try {
          controller.close();
        } catch {
          // Already closed/errored (e.g. client disconnect cancelled the stream).
        }
        await flushPostHog();
      }
    },
    cancel() {
      cancelled.abort();
    },
  });

  return new Response(stream, { headers: SSE_HEADERS });
}
