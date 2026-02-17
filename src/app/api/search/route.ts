/**
 * Search API route handler.
 *
 * Provides semantic search over the Ra Material and Confederation Library using embeddings.
 * Supports two modes:
 * - sentence: Queries sentence index for precise quote matching
 * - passage: Queries passage index for concept exploration
 *
 * Supports three source filters:
 * - all: Search both Ra Material and Confederation (default)
 * - ra: Search Ra Material only
 * - confederation: Search Confederation Library only
 */

import { NextRequest } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { RATE_LIMIT_CONFIG } from "@/lib/config";
import { createEmbedding } from "@/lib/openai";
import {
  searchRaMaterial,
  searchSentences,
  searchConfederationPassages,
  searchConfederationSentences,
} from "@/lib/pinecone";
import { parseSearchRequest, type HybridSearchResult } from "@/lib/schemas";
import type { SourceFilter } from "@/lib/schemas";

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

/**
 * Search sentences across Ra and/or Confederation sources based on filter.
 */
async function searchSentencesBySource(
  embedding: number[],
  limit: number,
  source: SourceFilter,
  language: string
): Promise<HybridSearchResult[]> {
  // Search both sources in parallel when source=all
  const [raRaw, confedRaw] = await Promise.all([
    source === "ra" || source === "all"
      ? searchSentences(embedding, limit, language as "en" | "es")
      : Promise.resolve([]),
    source === "confederation" || source === "all"
      ? searchConfederationSentences(embedding, limit)
      : Promise.resolve([]),
  ]);

  const raResults: HybridSearchResult[] = raRaw.map((s) => ({
    sentence: s.sentence,
    sentenceIndex: s.sentenceIndex,
    speaker: s.speaker,
    reference: s.reference,
    session: s.session,
    question: s.question,
    url: s.url,
    score: s.score,
    source: "ra" as const,
  }));

  const confedResults: HybridSearchResult[] = confedRaw.map((s) => ({
    sentence: s.sentence,
    sentenceIndex: s.sentenceIndex,
    speaker: s.speaker as HybridSearchResult["speaker"],
    reference: s.reference,
    entity: s.entity,
    date: s.date,
    transcriptId: s.transcriptId,
    chunkIndex: s.chunkIndex,
    url: s.url,
    score: s.score,
    source: "confederation" as const,
  }));

  if (source === "all") {
    // Merge by score and take top limit
    return [...raResults, ...confedResults]
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  return source === "ra" ? raResults : confedResults;
}

/**
 * Search passages across Ra and/or Confederation sources based on filter.
 */
async function searchPassagesBySource(
  embedding: number[],
  limit: number,
  source: SourceFilter,
  language: string
): Promise<HybridSearchResult[]> {
  // Search both sources in parallel when source=all
  const [raRaw, confedRaw] = await Promise.all([
    source === "ra" || source === "all"
      ? searchRaMaterial(embedding, { topK: limit, language: language as "en" | "es" })
      : Promise.resolve([]),
    source === "confederation" || source === "all"
      ? searchConfederationPassages(embedding, limit)
      : Promise.resolve([]),
  ]);

  const raResults: HybridSearchResult[] = raRaw.map((p) => ({
    text: p.text,
    reference: p.reference,
    session: p.session,
    question: p.question,
    url: p.url,
    score: 0, // Passage search doesn't return scores from default namespace
    source: "ra" as const,
  }));

  const confedResults: HybridSearchResult[] = confedRaw.map((p) => ({
    text: p.text,
    reference: p.reference,
    entity: p.entity,
    date: p.date,
    transcriptId: p.transcriptId,
    url: p.url,
    score: p.score,
    source: "confederation" as const,
  }));

  if (source === "all") {
    // Interleave Ra and Confederation results evenly.
    // Ra passages lack Pinecone scores (default namespace), so score-based
    // merging would always rank them last. Interleaving preserves each
    // source's internal relevance ordering while giving both fair representation.
    const sorted = confedResults.sort((a, b) => b.score - a.score);
    const merged: HybridSearchResult[] = [];
    const maxLen = Math.max(raResults.length, sorted.length);
    for (let i = 0; i < maxLen && merged.length < limit; i++) {
      if (i < raResults.length) merged.push(raResults[i]);
      if (i < sorted.length && merged.length < limit) merged.push(sorted[i]);
    }
    return merged;
  }

  return source === "ra" ? raResults : confedResults;
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

    const { query, limit, mode, source, language } = validationResult.data;

    // Create embedding for the search query
    const embedding = await createEmbedding(query);

    let results: HybridSearchResult[];

    if (mode === "sentence") {
      results = await searchSentencesBySource(embedding, limit, source, language);
      console.log(`[Search] Sentence mode (source=${source}): ${results.length} results`);
    } else {
      results = await searchPassagesBySource(embedding, limit, source, language);
      console.log(`[Search] Passage mode (source=${source}): ${results.length} results`);
    }

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
