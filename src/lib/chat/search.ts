/**
 * Search orchestration for chat queries
 *
 * Handles embedding creation and Pinecone search with proper error handling.
 * Searches both Ra Material and Confederation passages in parallel.
 */

import { createEmbedding } from "@/lib/openai";
import { searchRaMaterial, searchConfederationPassages } from "@/lib/pinecone";
import { Quote } from "@/lib/types";
import { SEARCH_CONFIG } from "@/lib/config";
import { createChatError } from "./errors";

export interface SessionReference {
  session: number;
  question?: number;
}

export interface SearchResult {
  passages: Quote[];
  embedding: number[];
}

/**
 * Creates an embedding for the search query
 */
export async function createSearchEmbedding(query: string): Promise<number[]> {
  try {
    return await createEmbedding(query);
  } catch (e) {
    throw createChatError("EMBEDDING_FAILED", e instanceof Error ? e : undefined);
  }
}

/**
 * Searches the Ra Material with the given embedding
 */
export async function searchPassages(
  embedding: number[],
  sessionRef?: SessionReference | null
): Promise<Quote[]> {
  try {
    const searchResults = await searchRaMaterial(embedding, {
      topK: sessionRef ? SEARCH_CONFIG.sessionRefTopK : SEARCH_CONFIG.defaultTopK,
      sessionFilter: sessionRef || undefined,
    });

    return searchResults.map((r) => ({
      text: r.text,
      reference: r.reference,
      url: r.url,
    }));
  } catch (e) {
    throw createChatError("SEARCH_FAILED", e instanceof Error ? e : undefined);
  }
}

/**
 * Searches the Confederation Library with the given embedding.
 * Non-fatal: returns empty array on failure so chat continues with Ra results only.
 */
async function searchConfederationQuotes(
  embedding: number[],
  topK: number = 4
): Promise<Quote[]> {
  try {
    const results = await searchConfederationPassages(embedding, topK);
    return results.map((r) => ({
      text: r.text,
      reference: r.reference,
      url: r.url,
    }));
  } catch (e) {
    console.warn("[Chat Search] Confederation search failed, continuing with Ra only:", e);
    return [];
  }
}

/**
 * Performs the complete search flow: embedding creation + Ra search,
 * optionally including Confederation passages in parallel.
 * Merges results with Ra passages prioritized.
 *
 * When confederationFocused is true, searches ONLY Confederation (skips Ra)
 * with a larger topK for richer results.
 */
export async function performSearch(
  query: string,
  sessionRef?: SessionReference | null,
  includeConfederation: boolean = false,
  confederationFocused: boolean = false
): Promise<SearchResult> {
  const embedding = await createSearchEmbedding(query);

  // Confederation-focused: search only Confederation with higher topK
  if (confederationFocused) {
    const passages = await searchConfederationQuotes(
      embedding,
      SEARCH_CONFIG.defaultTopK
    );
    return { passages, embedding };
  }

  if (includeConfederation) {
    // Search both sources in parallel
    const [raPassages, confedPassages] = await Promise.all([
      searchPassages(embedding, sessionRef),
      searchConfederationQuotes(embedding),
    ]);

    // Merge: Ra passages first, then Confederation, cap total
    const maxTotal = SEARCH_CONFIG.defaultTopK + 4;
    const passages = [...raPassages, ...confedPassages].slice(0, maxTotal);

    return { passages, embedding };
  }

  // Ra-only search
  const passages = await searchPassages(embedding, sessionRef);
  return { passages, embedding };
}
