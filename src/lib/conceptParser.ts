// Parser utility to detect and mark Law of One concepts in text

import { buildConceptRegex, getCanonicalTerm } from "@/data/concepts";

export type ParsedSegment =
  | { type: "text"; content: string }
  | { type: "concept"; displayText: string; searchTerm: string };

/**
 * Parse text and identify Law of One concepts for linking
 * Returns array of segments: plain text and concept links
 */
export function parseConceptsInText(text: string): ParsedSegment[] {
  const segments: ParsedSegment[] = [];
  const regex = buildConceptRegex();

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
      searchTerm: getCanonicalTerm(match[0]),
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
