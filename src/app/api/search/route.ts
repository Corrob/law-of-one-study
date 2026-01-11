/**
 * Search API route handler.
 *
 * Provides semantic search over the Ra Material using embeddings.
 */

import { NextRequest } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { RATE_LIMIT_CONFIG } from "@/lib/config";
import { createEmbedding } from "@/lib/openai";
import { searchRaMaterial } from "@/lib/pinecone";
import { parseSearchRequest, SearchResult } from "@/lib/schemas";

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
    // Rate limiting (use same config as chat for now)
    const clientIp = getClientIp(request);
    const rateLimitResult = await checkRateLimit(clientIp, RATE_LIMIT_CONFIG);

    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult);
    }

    // Parse and validate request
    const body = await request.json();
    const validationResult = parseSearchRequest(body);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({ error: validationResult.error }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { query, limit } = validationResult.data;

    // Create embedding for the search query
    const embedding = await createEmbedding(query);

    // Search Pinecone
    const pineconeResults = await searchRaMaterial(embedding, { topK: limit });

    // Transform results
    const results: SearchResult[] = pineconeResults.map((result) => ({
      text: result.text,
      reference: result.reference,
      session: result.session,
      question: result.question,
      url: result.url,
    }));

    return new Response(
      JSON.stringify({
        results,
        query,
        totalResults: results.length,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Search API error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process search request" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
