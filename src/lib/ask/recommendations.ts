/**
 * Deterministic "Explore further" recommendations for an Ask answer.
 *
 * Server-side only (imports the study-path and concept-graph data). Maps the
 * query's matched concept IDs — already computed by the grounding step — to
 * the site's own resources, and the API route streams the result in a
 * `related` SSE event right after `meta`. No LLM involvement: the same
 * question always yields the same cards.
 *
 * Matched IDs may include Ask supplement IDs that are not concept-graph
 * concepts; every lookup here simply ignores unknown IDs.
 */

import { getAllPathMetas } from "@/lib/study-paths";
import { getRelatedConcepts } from "@/lib/concept-graph";
import {
  getRelatedResource,
  type RelatedResource,
  type ResourceType,
} from "@/lib/ask/resources";
import { type AvailableLanguage, DEFAULT_LOCALE } from "@/lib/language-config";

/** At most this many cards per answer — quiet support, not a second answer. */
const MAX_RELATED = 3;

/**
 * Hand-curated concept tags per meditation (only 3 meditations — a curated map
 * beats inference). Every tag must be a real concept-graph ID; a unit test
 * enforces this.
 */
export const MEDITATION_CONCEPT_TAGS: Record<string, string[]> = {
  "balancing-the-self": [
    "balancing",
    "energy-center",
    "energy-center-blockage",
    "catalyst",
    "distortion",
  ],
  "finding-love": ["love", "meditation", "seeking", "green-ray", "catalyst-of-mind"],
  "seeing-the-creator": [
    "unity",
    "one-infinite-creator",
    "law-of-one",
    "forgiveness",
    "mind-body-spirit-complex",
  ],
};

/**
 * Concept tags per song of "The Wanderer's Return" (one song per density).
 * Every tag must be a real concept-graph ID; a unit test enforces this.
 */
export const SONG_CONCEPT_TAGS: Record<string, string[]> = {
  "first-breath": ["first-density"],
  "the-reaching": ["second-density"],
  "behind-the-veil": ["third-density", "veil", "the-choice"],
  known: ["fourth-density", "fourth-density-positive", "social-memory-complex", "harvest"],
  "cold-light": ["fifth-density"],
  "a-million-years-ahead": ["sixth-density", "wanderer"],
  gateway: ["seventh-density", "gateway-to-intelligent-infinity", "octave"],
};

/** Highest-overlap entry of a tag map (ties break by map order); null when nothing overlaps. */
function bestTagMatch(
  tags: Record<string, string[]>,
  matched: ReadonlySet<string>
): string | null {
  let bestId: string | null = null;
  let bestScore = 0;
  for (const [id, conceptIds] of Object.entries(tags)) {
    const score = conceptIds.reduce((n, c) => (matched.has(c) ? n + 1 : n), 0);
    if (score > bestScore) {
      bestScore = score;
      bestId = id;
    }
  }
  return bestId;
}

/** The study path whose concepts overlap the matched set most; null when none do. */
function bestPathMatch(matched: ReadonlySet<string>, locale: AvailableLanguage): string | null {
  let bestId: string | null = null;
  let bestScore = 0;
  for (const meta of getAllPathMetas(locale)) {
    const score = meta.concepts.reduce((n, c) => (matched.has(c) ? n + 1 : n), 0);
    if (score > bestScore) {
      bestScore = score;
      bestId = meta.id;
    }
  }
  return bestId;
}

/** A closely related concept the seeker has NOT already asked about, for the Explore card. */
function nextConceptMatch(matchedConceptIds: string[]): string | null {
  // Unknown (supplement) IDs are skipped inside getRelatedConcepts.
  const related = getRelatedConcepts(matchedConceptIds, 1);
  return related[0]?.id ?? null;
}

/**
 * Build the "Explore further" cards for a query's matched concept IDs.
 * At most one resource per type, priority path > meditation > song > concept,
 * capped at MAX_RELATED. Deterministic; empty input yields no cards.
 */
export function buildRelatedResources(
  matchedConceptIds: string[],
  locale: AvailableLanguage = DEFAULT_LOCALE
): RelatedResource[] {
  if (matchedConceptIds.length === 0) return [];
  const matched: ReadonlySet<string> = new Set(matchedConceptIds);

  const candidates: Array<[ResourceType, string | null]> = [
    ["path", bestPathMatch(matched, locale)],
    ["meditation", bestTagMatch(MEDITATION_CONCEPT_TAGS, matched)],
    ["song", bestTagMatch(SONG_CONCEPT_TAGS, matched)],
    ["concept", nextConceptMatch(matchedConceptIds)],
  ];

  const result: RelatedResource[] = [];
  for (const [type, id] of candidates) {
    if (result.length >= MAX_RELATED) break;
    if (!id) continue;
    const resource = getRelatedResource(type, id, locale);
    if (resource) result.push(resource);
  }
  return result;
}
