/**
 * Search API route handler.
 *
 * Provides semantic search over the Ra Material using embeddings.
 * Supports two modes:
 * - sentence: Queries sentence index for precise quote matching
 * - passage: Queries passage index for concept exploration
 */

import { NextRequest } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { RATE_LIMIT_CONFIG } from "@/lib/config";
import { createEmbedding } from "@/lib/openai";
import { searchRaMaterial, searchSentences } from "@/lib/pinecone";
import { parseSearchRequest, type HybridSearchResult } from "@/lib/schemas";

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

    const { query, limit, mode, language } = validationResult.data;

    // Create embedding for the search query
    const embedding = await createEmbedding(query);

    // Mode-specific search - query only the selected index
    if (mode === "sentence") {
      const sentenceResults = await searchSentences(embedding, limit, language);

      console.log(`[Search] Sentence mode: ${sentenceResults.length} results`);

      // Map sentence results to response format
      const results: HybridSearchResult[] = sentenceResults.map((s) => ({
        sentence: s.sentence,
        sentenceIndex: s.sentenceIndex,
        speaker: s.speaker,
        reference: s.reference,
        session: s.session,
        question: s.question,
        url: s.url,
        score: s.score,
      }));

      return new Response(
        JSON.stringify({
          results,
          query,
          totalResults: results.length,
          mode,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Passage mode (default)
    const passageResults = await searchRaMaterial(embedding, { topK: limit, language });

    console.log(`[Search] Passage mode: ${passageResults.length} results`);

    const results: HybridSearchResult[] = passageResults.map((p) => ({
      text: p.text,
      reference: p.reference,
      session: p.session,
      question: p.question,
      url: p.url,
      score: 0, // Passage search doesn't return scores
    }));

    return new Response(
      JSON.stringify({
        results,
        query,
        totalResults: results.length,
        mode,
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
