/**
 * Chat API route handler.
 *
 * Thin orchestrator that handles HTTP concerns (rate limiting, validation, response creation)
 * and delegates business logic to the chat orchestrator module.
 */

import { NextRequest } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { RATE_LIMIT_CONFIG, SSE_CONFIG } from "@/lib/config";
import { ChatMessage } from "@/lib/types";

import {
  validateChatRequest,
  validationErrorResponse,
  executeChatQuery,
  createSSESender,
  createSSEResponse,
  startHeartbeat,
} from "@/lib/chat";

interface ChatRequest {
  message: string;
  history: ChatMessage[];
  thinkingMode?: boolean;
  targetLanguage?: string;
}

/**
 * Create a rate limit error response with proper headers.
 */
function createRateLimitResponse(rateLimitResult: {
  limit: number;
  remaining: number;
  resetAt: number;
}): Response {
  const retryAfter = Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000);

  return new Response(
    JSON.stringify({
      error: "Too many requests. Please wait before trying again.",
      retryAfter,
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "X-RateLimit-Limit": rateLimitResult.limit.toString(),
        "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
        "X-RateLimit-Reset": new Date(rateLimitResult.resetAt).toISOString(),
        "Retry-After": retryAfter.toString(),
      },
    }
  );
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIp = getClientIp(request);
    const rateLimitResult = await checkRateLimit(clientIp, RATE_LIMIT_CONFIG);

    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult);
    }

    // Parse and validate request
    const body: ChatRequest = await request.json();
    const { message, history, thinkingMode, targetLanguage } = body;

    const validationResult = validateChatRequest(message, history);
    if (!validationResult.valid) {
      return validationErrorResponse(validationResult);
    }

    // Create streaming response
    const responseId = crypto.randomUUID();

    const stream = new ReadableStream({
      async start(controller) {
        const send = createSSESender(controller);
        const stopHeartbeat = startHeartbeat(controller, SSE_CONFIG.heartbeatIntervalMs);

        // Send responseId as the first event so the client can use it for recovery
        send("session", { responseId });

        try {
          await executeChatQuery({
            message,
            history,
            clientIp,
            send,
            thinkingMode: thinkingMode ?? false,
            targetLanguage: targetLanguage ?? 'en',
            responseId,
          });
        } finally {
          stopHeartbeat();
          try {
            controller.close();
          } catch {
            // Controller may already be closed if the client disconnected
          }
        }
      },
    });

    return createSSEResponse(stream);
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process request" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
