/**
 * Text highlighting utilities for search results.
 * Handles keyword extraction and highlight term matching.
 */

/**
 * Common stop words to filter out from search queries.
 * These words are too common to provide meaningful highlights.
 * Includes both English and Spanish stop words for bilingual support.
 */
const STOP_WORDS = new Set([
  // English stop words
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
  // Spanish stop words
  "el", "la", "los", "las", "un", "una", "unos", "unas", "de", "del",
  "al", "en", "por", "para", "con", "sin", "sobre", "entre", "hacia",
  "desde", "hasta", "durante", "mediante", "según", "contra", "tras",
  "que", "cual", "quien", "cuyo", "donde", "cuando", "como", "porque",
  "aunque", "mientras", "sino", "pero", "mas", "pues", "asi", "así",
  "es", "son", "era", "eran", "fue", "fueron", "ser", "sido", "siendo",
  "está", "están", "estar", "estado", "estando", "ha", "han", "hay",
  "he", "hemos", "haber", "habido", "tiene", "tienen", "tener", "tenido",
  "este", "esta", "esto", "estos", "estas", "ese", "esa", "eso", "esos",
  "esas", "aquel", "aquella", "aquello", "aquellos", "aquellas",
  "yo", "tu", "tú", "él", "ella", "nosotros", "vosotros", "ellos", "ellas",
  "me", "te", "se", "nos", "os", "le", "les", "lo", "mi", "su", "sus",
  "muy", "más", "menos", "tan", "tanto", "mucho", "poco", "todo", "todos",
  "toda", "todas", "otro", "otra", "otros", "otras", "mismo", "misma",
  "cada", "algún", "alguno", "alguna", "algunos", "algunas", "ningún",
  "ninguno", "ninguna", "ningunos", "ningunas", "ambos", "varios",
  "sí", "no", "ya", "aún", "todavía", "también", "tampoco", "solo", "sólo",
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
 * Parse Ra Material or Confederation text into formatted segments.
 * Splits text by "Questioner:" and "Ra:" prefixes (Ra Material),
 * or returns the full text as a single segment (Confederation).
 *
 * @param text - Raw text from Ra Material or Confederation
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
