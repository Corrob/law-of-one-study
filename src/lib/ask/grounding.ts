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
import { getLocalizedText, type GraphConcept } from "@/lib/types-graph";
import { type AvailableLanguage, DEFAULT_LOCALE } from "@/lib/language-config";
import type { AskSource } from "@/lib/schemas/ask";
import { ASK_MAX_FOCUSED_CONCEPTS } from "./config";
import { identifySupplements, buildSupplementGrounding } from "./supplements";
import {
  identifyChannelingThemes,
  buildChannelingGrounding,
  type ChannelingTheme,
} from "./channeling";

/** Prefix marking channeling-theme ids inside `matchedConceptIds` — resource
 * lookups ignore unknown ids, and analytics can tell the layers apart. */
export const CHANNELING_ID_PREFIX = "chan:";

export interface AskHistoryTurn {
  role: "user" | "assistant";
  content: string;
}

export interface Grounding {
  /** Per-query focused grounding for the relevant concepts. */
  focused: string;
  /** IDs of the concepts injected as focused grounding. */
  matchedConceptIds: string[];
  /** Localized display terms for the grounded topics (used to steer follow-up suggestions). */
  matchedTerms: string[];
  /**
   * The private source excerpts for the grounded concepts. Server-only — never
   * sent to the client. Used to detect verbatim reproduction after a response.
   * (Channeling themes contribute nothing here — no source text is stored.)
   */
  excerpts: string[];
  /** Ids of matched conscious-channeling themes (empty when the option is off). */
  channelingIds: string[];
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
 * Match hidden, LLM-only supplements (keywords Ra discusses that aren't in the
 * concept graph). Uses the same message-then-recent-history fallback as
 * `selectConcepts`.
 */
function selectSupplements(
  message: string,
  history: AskHistoryTurn[],
  locale: AvailableLanguage
) {
  let found = identifySupplements(message, locale);
  if (found.length === 0 && history.length > 0) {
    const recent = history
      .slice(-2)
      .map((turn) => turn.content)
      .join("\n");
    found = identifySupplements(recent, locale);
  }
  return found;
}

/**
 * Match conscious-channeling themes for a query, using the same
 * message-then-recent-history fallback as the other layers.
 */
function selectChannelingThemes(
  message: string,
  history: AskHistoryTurn[]
): ChannelingTheme[] {
  let found = identifyChannelingThemes(message);
  if (found.length === 0 && history.length > 0) {
    const recent = history
      .slice(-2)
      .map((turn) => turn.content)
      .join("\n");
    found = identifyChannelingThemes(recent);
  }
  return found;
}

/**
 * Build the full grounding (atlas + focused context) for a query.
 *
 * The two source libraries are never blended:
 * - `"ra"` (default): concepts + hidden supplements, exactly as always.
 * - `"channeling"` (English-only — other locales fall back to "ra"): ONLY the
 *   matched conscious-channeling themes, so the model has no Ra references to
 *   cite in that mode. The concept atlas in the system prompt still provides
 *   background vocabulary, but the citable grounding is channeling alone.
 */
export function buildGrounding(
  message: string,
  history: AskHistoryTurn[] = [],
  locale: AvailableLanguage = DEFAULT_LOCALE,
  source: AskSource = "ra"
): Grounding {
  const channelingMode = source === "channeling" && locale === "en";

  if (channelingMode) {
    const channeling = selectChannelingThemes(message, history);
    return {
      focused: buildChannelingGrounding(channeling),
      matchedConceptIds: channeling.map((t) => `${CHANNELING_ID_PREFIX}${t.id}`),
      matchedTerms: channeling.map((t) => t.id.replace(/-/g, " ")),
      excerpts: [],
      channelingIds: channeling.map((t) => t.id),
    };
  }

  const concepts = selectConcepts(message, history, locale);
  const supplements = selectSupplements(message, history, locale);

  const focused = [
    buildGroundingContext(concepts, locale),
    buildSupplementGrounding(supplements, locale),
  ]
    .filter(Boolean)
    .join("\n\n---\n\n");

  return {
    focused,
    matchedConceptIds: [...concepts.map((c) => c.id), ...supplements.map((s) => s.id)],
    matchedTerms: [
      ...concepts.map((c) => getLocalizedText(c.term, locale)),
      ...supplements.map((s) => s.id.replace(/-/g, " ")),
    ],
    excerpts: getConceptExcerpts(concepts, locale),
    channelingIds: [],
  };
}
