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

function jsonError(message: string, status: number, extra?: object): Response {
  return new Response(JSON.stringify({ error: message, ...extra }), {
    status,
    headers: { "Content-Type": "application/json" },
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
    return jsonError("Too many requests. Please slow down.", 429, { retryAfter });
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

  const client = getOpenAIClient();
  const encoder = new TextEncoder();
  const startedAt = Date.now();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: string, data: object) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      let output = "";
      let promptTokens: number | undefined;
      let completionTokens: number | undefined;

      try {
        send("meta", { concepts: grounding.matchedConceptIds });

        const openaiStream = await client.chat.completions.create({
          model: ASK_MODEL,
          messages,
          reasoning_effort: ASK_REASONING_EFFORT,
          max_completion_tokens: ASK_MAX_TOKENS,
          stream: true,
          stream_options: { include_usage: true },
        });

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
        const suggestions = await generateSuggestions(message, output, locale);
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
        console.error("[api/ask] streaming error:", error);
        send("error", { error: "Something went wrong generating a response." });
      } finally {
        controller.close();
        await flushPostHog();
      }
    },
  });

  return new Response(stream, { headers: SSE_HEADERS });
}
