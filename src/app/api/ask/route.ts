/**
 * POST /api/ask — streaming LLM guide to the Ra Material.
 *
 * Grounded entirely in our concept graph (no RAG, no stored source text). The
 * response is streamed as Server-Sent Events; the assistant paraphrases in its
 * own words and cites sources with {{CITE:...}} markers that the client renders
 * as links to lawofone.info.
 */

import Anthropic from "@anthropic-ai/sdk";
import { AskRequestSchema } from "@/lib/schemas/ask";
import { buildSystemPrompt, buildUserContent } from "@/lib/ask/prompts";
import { buildGrounding } from "@/lib/ask/grounding";
import { checkRateLimit, getClientIp } from "@/lib/ask/rate-limit";
import { ASK_MODEL, ASK_MAX_TOKENS, ASK_THINKING, ASK_RATE_LIMIT } from "@/lib/ask/config";

// The Anthropic SDK needs the Node.js runtime (not Edge).
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

export async function POST(request: Request): Promise<Response> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return jsonError("The Ask feature is not configured. Set ANTHROPIC_API_KEY.", 503);
  }

  // Rate limit by IP.
  const ip = getClientIp(request);
  const limit = checkRateLimit(`ask:${ip}`, ASK_RATE_LIMIT);
  if (!limit.success) {
    const retryAfter = Math.max(1, Math.ceil((limit.resetAt - Date.now()) / 1000));
    return jsonError("Too many requests. Please slow down.", 429, {
      retryAfter,
    });
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
  const { message, history, locale } = parsed.data;

  // Build grounding (no RAG) and prompts.
  const grounding = buildGrounding(message, history, locale);
  const systemPrompt = buildSystemPrompt(locale);
  const userContent = buildUserContent(message, grounding.focused);

  const messages: Anthropic.MessageParam[] = [
    ...history.map((turn) => ({
      role: turn.role,
      content: turn.content,
    })),
    { role: "user" as const, content: userContent },
  ];

  const client = new Anthropic();

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: string, data: object) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      try {
        send("meta", { concepts: grounding.matchedConceptIds });

        const anthropicStream = client.messages.stream({
          model: ASK_MODEL,
          max_tokens: ASK_MAX_TOKENS,
          thinking: ASK_THINKING,
          system: [
            {
              type: "text",
              text: systemPrompt,
              // Stable per-locale prefix (core rules + concept atlas) — cache it.
              cache_control: { type: "ephemeral" },
            },
          ],
          messages,
        });

        for await (const event of anthropicStream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            send("chunk", { text: event.delta.text });
          }
        }

        send("done", {});
      } catch (error) {
        console.error("[api/ask] streaming error:", error);
        send("error", {
          error: "Something went wrong generating a response.",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, { headers: SSE_HEADERS });
}
