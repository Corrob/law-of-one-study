/**
 * Text highlighting utilities for search results.
 * Handles keyword extraction and highlight term matching.
 */

/**
 * Common stop words to filter out from search queries.
 * These words are too common to provide meaningful highlights.
 */
const STOP_WORDS = new Set([
  "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
  "have", "has", "had", "do", "does", "did", "will", "would", "could",
  "should", "may", "might", "must", "shall", "can", "need", "dare",
  "ought", "used", "to", "of", "in", "for", "on", "with", "at", "by",
  "from", "as", "into", "through", "during", "before", "after", "above",
  "below", "between", "under", "again", "further", "then", "once", "here",
  "there", "when", "where", "why", "how", "all", "each", "few", "more",
  "most", "other", "some", "such", "no", "nor", "not", "only", "own",
  "same", "so", "than", "too", "very", "just", "and", "but", "if", "or",
  "because", "until", "while", "although", "though", "after", "before",
  "what", "which", "who", "whom", "this", "that", "these", "those", "am",
  "about", "tell", "me", "us", "you", "it", "its", "they", "them", "their",
  "i", "we", "he", "she", "my", "your", "his", "her", "our",
]);

/**
 * Minimum word length to be considered for highlighting.
 */
const MIN_WORD_LENGTH = 3;

/**
 * Extract significant words from a search query for highlighting.
 * Filters out common stop words and short words.
 *
 * @param query - The search query string
 * @returns Array of significant terms suitable for highlighting
 */
export function getHighlightTerms(query: string): string[] {
  if (!query || !query.trim()) {
    return [];
  }

  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(word => word.length >= MIN_WORD_LENGTH && !STOP_WORDS.has(word))
    .map(word => word.replace(/[^\w]/g, "")) // Remove punctuation
    .filter(word => word.length >= MIN_WORD_LENGTH);
}

/**
 * Segment types for Ra Material text parsing.
 */
export type SegmentType = "questioner" | "ra" | "text";

/**
 * A parsed segment of Ra Material text.
 */
export interface TextSegment {
  type: SegmentType;
  content: string;
}

/**
 * Parse Ra Material text into formatted segments.
 * Splits text by "Questioner:" and "Ra:" prefixes.
 *
 * @param text - Raw Ra Material text
 * @returns Array of segments with type and content
 */
export function parseRaMaterialText(text: string): TextSegment[] {
  const segments: TextSegment[] = [];

  if (!text || !text.trim()) {
    return [{ type: "text", content: "" }];
  }

  const parts = text.split(/(Questioner:|Ra:)/);
  let currentType: SegmentType = "text";

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    if (trimmed === "Questioner:") {
      currentType = "questioner";
    } else if (trimmed === "Ra:") {
      currentType = "ra";
    } else {
      segments.push({ type: currentType, content: trimmed });
    }
  }

  // If no segments were created, return the original text
  if (segments.length === 0) {
    segments.push({ type: "text", content: text.trim() });
  }

  return segments;
}
