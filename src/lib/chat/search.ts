/**
 * Search orchestration for chat queries
 *
 * Handles embedding creation and Pinecone search with proper error handling.
 */

import { createEmbedding } from "@/lib/openai";
import { searchRaMaterial } from "@/lib/pinecone";
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
 * Performs the complete search flow: embedding creation + search
 */
export async function performSearch(
  query: string,
  sessionRef?: SessionReference | null
): Promise<SearchResult> {
  const embedding = await createSearchEmbedding(query);
  const passages = await searchPassages(embedding, sessionRef);

  return { passages, embedding };
}
