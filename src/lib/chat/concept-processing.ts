/**
 * Hybrid concept detection for chat queries
 *
 * Combines regex-based and embedding-based concept detection
 * for comprehensive concept identification.
 */

import { createEmbedding } from "@/lib/openai";
import { searchConcepts } from "@/lib/pinecone";
import {
  identifyConcepts,
  getRelatedConcepts,
  buildSearchExpansion,
  buildConceptContextForPrompt,
  findConceptById,
} from "@/lib/concept-graph";
import type { GraphConcept } from "@/lib/types-graph";
import { SEARCH_CONFIG } from "@/lib/config";
import { debug } from "@/lib/debug";

export interface ConceptDetectionResult {
  /** All detected concepts (merged from regex and embedding) */
  detectedConcepts: GraphConcept[];
  /** Related concepts from the concept graph */
  relatedConcepts: GraphConcept[];
  /** Expanded search terms for vector search */
  searchTerms: string[];
  /** Formatted context for the LLM prompt */
  promptContext: string;
  /** Concepts detected via regex (instant, free) */
  regexConcepts: GraphConcept[];
  /** Concepts detected via embedding (semantic) */
  embeddingConcepts: GraphConcept[];
}

/**
 * Performs hybrid concept detection on a message
 *
 * Uses both regex-based detection (instant, free) and
 * embedding-based detection (semantic) for comprehensive coverage.
 */
export async function detectConcepts(message: string): Promise<ConceptDetectionResult> {
  // A) Regex-based detection (instant, free)
  const regexConcepts = identifyConcepts(message);

  // B) Embedding-based detection (semantic, ~$0.00001)
  const conceptEmbedding = await createEmbedding(message);
  const conceptSearchResults = await searchConcepts(conceptEmbedding, SEARCH_CONFIG.conceptTopK);
  const embeddingConcepts = conceptSearchResults
    .filter((r) => r.score !== undefined && r.score > SEARCH_CONFIG.conceptMinScore)
    .map((r) => findConceptById(r.id))
    .filter((c): c is GraphConcept => c !== undefined);

  // C) Merge: regex concepts first (higher confidence), then embedding
  const seenIds = new Set(regexConcepts.map((c) => c.id));
  const detectedConcepts = [...regexConcepts];
  for (const concept of embeddingConcepts) {
    if (!seenIds.has(concept.id)) {
      seenIds.add(concept.id);
      detectedConcepts.push(concept);
    }
  }

  // D) Get related concepts from merged set
  const relatedConcepts = detectedConcepts.length > 0
    ? getRelatedConcepts(detectedConcepts.map((c) => c.id), 1)
    : [];

  // E) Build search expansion and context
  const searchTerms = buildSearchExpansion(detectedConcepts);
  const promptContext = buildConceptContextForPrompt(detectedConcepts);

  // Debug logging
  if (detectedConcepts.length > 0) {
    debug.log("[Concepts] Regex:", regexConcepts.map((c) => c.term));
    debug.log("[Concepts] Embedding:", embeddingConcepts.map((c) => c.term));
    debug.log("[Concepts] Merged:", detectedConcepts.map((c) => c.term));
    debug.log("[Concepts] Related:", relatedConcepts.slice(0, 5).map((c) => c.term));
    debug.log("[Concepts] Search terms:", searchTerms.slice(0, 10));
  }

  return {
    detectedConcepts,
    relatedConcepts,
    searchTerms,
    promptContext,
    regexConcepts,
    embeddingConcepts,
  };
}

/**
 * Formats detected concepts for the meta event
 */
export function formatConceptsForMeta(concepts: GraphConcept[]): Array<{
  id: string;
  term: string;
  definition: string;
  category: string;
}> {
  return concepts.map((c) => ({
    id: c.id,
    term: c.term,
    definition: c.definition,
    category: c.category,
  }));
}

/**
 * Builds an augmented query that includes concept context
 */
export function buildQueryWithConcepts(message: string, searchTerms: string[]): string {
  if (searchTerms.length === 0) {
    return message;
  }
  return `${message} [Related concepts: ${searchTerms.slice(0, 5).join(", ")}]`;
}
