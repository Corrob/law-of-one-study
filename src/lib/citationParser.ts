// Parser utility to detect and transform Ra Material citations into clickable links

import { type AvailableLanguage, DEFAULT_LOCALE } from "./language-config";

export type CitationSegment =
  | { type: "text"; content: string }
  | { type: "citation"; session: number; question: number; displayText: string; url: string };

// Regex to match (Ra SESSION.QUESTION) pattern - e.g., (Ra 50.7), (Ra 1.1)
export const CITATION_REGEX = /\(Ra\s+(\d+)\.(\d+)\)/g;

/**
 * Build L/L Research URL from session and question numbers
 */
export function buildCitationUrl(
  session: number,
  question: number,
  locale: AvailableLanguage = DEFAULT_LOCALE
): string {
  const localePath = locale === "en" ? "" : `/${locale}`;
  return `https://www.llresearch.org${localePath}/channeling/ra-contact/${session}#${question}`;
}

/**
 * Parse text and identify Ra Material citations for linking
 * Returns array of segments: plain text and citation links
 */
export function parseCitationsInText(
  text: string,
  locale: AvailableLanguage = DEFAULT_LOCALE
): CitationSegment[] {
  const segments: CitationSegment[] = [];
  const regex = new RegExp(CITATION_REGEX.source, "g");

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

    const session = parseInt(match[1], 10);
    const question = parseInt(match[2], 10);

    // Add citation link
    segments.push({
      type: "citation",
      session,
      question,
      displayText: match[0],
      url: buildCitationUrl(session, question, locale),
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
