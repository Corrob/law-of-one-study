// Parser utility to detect and mark Law of One concepts in text
// Uses the bilingual concept graph for locale-aware concept detection

import { buildConceptRegex, getCanonicalTerm } from "@/lib/concept-graph";
import { type AvailableLanguage, DEFAULT_LOCALE } from "@/lib/language-config";

export type ParsedSegment =
  | { type: "text"; content: string }
  | { type: "concept"; displayText: string; searchTerm: string };

/**
 * Parse text and identify Law of One concepts for linking
 * Returns array of segments: plain text and concept links
 * @param text - The text to parse for concepts
 * @param locale - Language for concept matching (defaults to 'en')
 */
export function parseConceptsInText(
  text: string,
  locale: AvailableLanguage = DEFAULT_LOCALE
): ParsedSegment[] {
  const segments: ParsedSegment[] = [];
  const regex = buildConceptRegex(locale);

  // Reset regex lastIndex for fresh matching
  regex.lastIndex = 0;

  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Add text before match
    if (match.index > lastIndex) {
      segments.push({
        type: "text",
        content: text.slice(lastIndex, match.index),
      });
    }

    // Add concept link
    segments.push({
      type: "concept",
      displayText: match[0],
      searchTerm: getCanonicalTerm(match[0], locale),
    });

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text after last match
  if (lastIndex < text.length) {
    segments.push({
      type: "text",
      content: text.slice(lastIndex),
    });
  }

  // If no matches found, return original text as single segment
  if (segments.length === 0 && text.length > 0) {
    segments.push({ type: "text", content: text });
  }

  return segments;
}
