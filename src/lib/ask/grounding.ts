/**
 * Grounding pipeline for the Ask feature — NO RAG.
 *
 * Instead of retrieving stored source text, we ground the model on our own
 * concept graph:
 *   1. A stable "atlas" of all concepts (for the cached system prefix).
 *   2. Focused, full-detail context for the concepts most relevant to the
 *      current question, selected with the graph's own alias matching
 *      (`identifyConcepts`) and relationship traversal — no embeddings.
 */

import {
  identifyConcepts,
  getRelatedConcepts,
  buildGroundingContext,
  getConceptExcerpts,
} from "@/lib/concept-graph";
import type { GraphConcept } from "@/lib/types-graph";
import { type AvailableLanguage, DEFAULT_LOCALE } from "@/lib/language-config";
import { ASK_MAX_FOCUSED_CONCEPTS } from "./config";

export interface AskHistoryTurn {
  role: "user" | "assistant";
  content: string;
}

export interface Grounding {
  /** Per-query focused grounding for the relevant concepts. */
  focused: string;
  /** IDs of the concepts injected as focused grounding. */
  matchedConceptIds: string[];
  /**
   * The private source excerpts for the grounded concepts. Server-only — never
   * sent to the client. Used to detect verbatim reproduction after a response.
   */
  excerpts: string[];
}

/**
 * Select the concepts to inject as focused grounding for a query.
 * Detects concepts named in the message (falling back to recent history when
 * the message alone matches nothing), then pads with graph neighbours up to the
 * configured cap so related teachings are available.
 */
export function selectConcepts(
  message: string,
  history: AskHistoryTurn[] = [],
  locale: AvailableLanguage = DEFAULT_LOCALE
): GraphConcept[] {
  let found = identifyConcepts(message, locale);

  // Follow-ups like "tell me more" name no concept — look at recent history.
  if (found.length === 0 && history.length > 0) {
    const recent = history
      .slice(-2)
      .map((turn) => turn.content)
      .join("\n");
    found = identifyConcepts(recent, locale);
  }

  const selectedIds = new Set(found.map((c) => c.id));
  const selected = [...found];

  if (selected.length > 0 && selected.length < ASK_MAX_FOCUSED_CONCEPTS) {
    const related = getRelatedConcepts(
      selected.map((c) => c.id),
      1
    );
    for (const concept of related) {
      if (selected.length >= ASK_MAX_FOCUSED_CONCEPTS) break;
      if (!selectedIds.has(concept.id)) {
        selectedIds.add(concept.id);
        selected.push(concept);
      }
    }
  }

  return selected.slice(0, ASK_MAX_FOCUSED_CONCEPTS);
}

/**
 * Build the full grounding (atlas + focused context) for a query.
 */
export function buildGrounding(
  message: string,
  history: AskHistoryTurn[] = [],
  locale: AvailableLanguage = DEFAULT_LOCALE
): Grounding {
  const concepts = selectConcepts(message, history, locale);
  return {
    focused: buildGroundingContext(concepts, locale),
    matchedConceptIds: concepts.map((c) => c.id),
    excerpts: getConceptExcerpts(concepts, locale),
  };
}
