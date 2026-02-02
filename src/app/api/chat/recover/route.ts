/**
 * Chat recovery endpoint.
 *
 * Replays cached SSE events for a given response ID. Used by the client
 * to recover responses after mobile backgrounding kills the SSE connection.
 */

import { NextRequest } from "next/server";
import { getCachedResponse } from "@/lib/chat/response-cache";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { RECOVERY_RATE_LIMIT_CONFIG } from "@/lib/config";

/** UUID v4 format validation */
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest) {
  const clientIp = getClientIp(request);
  const rateLimitResult = await checkRateLimit(clientIp, RECOVERY_RATE_LIMIT_CONFIG);

  if (!rateLimitResult.success) {
    const retryAfter = Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000);
    return Response.json(
      { error: "Too many requests", retryAfter },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    );
  }

  const responseId = request.nextUrl.searchParams.get("id");

  if (!responseId || !UUID_PATTERN.test(responseId)) {
    return Response.json({ error: "Invalid or missing id parameter" }, { status: 400 });
  }

  const cached = await getCachedResponse(responseId);

  if (!cached) {
    return Response.json({ error: "Response not found" }, { status: 404 });
  }

  return Response.json({
    events: cached.events,
    complete: cached.complete,
  });
}
