// Parser utility to detect and transform citations into clickable links
// Supports both Ra Material citations (Ra 50.7) and Confederation citations (Q'uo, 2024-01-24)

import { type AvailableLanguage, DEFAULT_LOCALE } from "./language-config";

/** Ra Material citation with session/question numbers */
export interface RaCitation {
  type: "ra-citation";
  session: number;
  question: number;
  displayText: string;
  url: string;
}

/** Confederation citation with entity name and reference */
export interface ConfederationCitation {
  type: "confederation-citation";
  reference: string;
  entity: string;
  url: string;
  displayText: string;
}

export type CitationSegment =
  | { type: "text"; content: string }
  | RaCitation
  | ConfederationCitation;

// Backward compatibility: the old "citation" type is a Ra citation
// (used by MarkdownRenderer)
export type LegacyCitationSegment =
  | { type: "text"; content: string }
  | { type: "citation"; session: number; question: number; displayText: string; url: string };

// Regex to match (Ra SESSION.QUESTION) pattern - e.g., (Ra 50.7), (Ra 1.1)
export const CITATION_REGEX = /\(Ra\s+(\d+)\.(\d+)\)/g;

// Regex to match Confederation citations - e.g., (Q'uo, 2024-01-24), (Hatonn, 1989-03-12)
// Entity names can include apostrophes and letters. Date format: YYYY-MM-DD
export const CONFEDERATION_CITATION_REGEX = /\(([A-Za-z][A-Za-z']*(?:\s+[A-Za-z']+)*),\s*(\d{4}-\d{2}-\d{2})\)/g;

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
 * Parse text and identify citations for linking.
 * Supports both Ra Material citations (Ra 50.7) and Confederation citations (Q'uo, 2024-01-24).
 * Returns array of segments: plain text, Ra citations, and Confederation citations.
 */
export function parseCitationsInText(
  text: string,
  locale: AvailableLanguage = DEFAULT_LOCALE
): CitationSegment[] {
  // Collect all citation matches with their positions
  const matches: Array<{
    index: number;
    length: number;
    segment: RaCitation | ConfederationCitation;
  }> = [];

  // Find Ra citations
  const raRegex = new RegExp(CITATION_REGEX.source, "g");
  let raMatch;
  while ((raMatch = raRegex.exec(text)) !== null) {
    const session = parseInt(raMatch[1], 10);
    const question = parseInt(raMatch[2], 10);
    matches.push({
      index: raMatch.index,
      length: raMatch[0].length,
      segment: {
        type: "ra-citation",
        session,
        question,
        displayText: raMatch[0],
        url: buildCitationUrl(session, question, locale),
      },
    });
  }

  // Find Confederation citations
  const confedRegex = new RegExp(CONFEDERATION_CITATION_REGEX.source, "g");
  let confedMatch;
  while ((confedMatch = confedRegex.exec(text)) !== null) {
    const entity = confedMatch[1];
    const date = confedMatch[2];
    const reference = `${entity}, ${date}`;
    matches.push({
      index: confedMatch.index,
      length: confedMatch[0].length,
      segment: {
        type: "confederation-citation",
        reference,
        entity,
        displayText: confedMatch[0],
        url: `https://www.llresearch.org/channeling/transcript/${date}_${entity.toLowerCase().replace(/'/g, "")}`,
      },
    });
  }

  // Sort by position to process in order
  matches.sort((a, b) => a.index - b.index);

  const segments: CitationSegment[] = [];
  let lastIndex = 0;

  for (const m of matches) {
    // Skip overlapping matches
    if (m.index < lastIndex) continue;

    // Add text before match
    if (m.index > lastIndex) {
      segments.push({
        type: "text",
        content: text.slice(lastIndex, m.index),
      });
    }

    segments.push(m.segment);
    lastIndex = m.index + m.length;
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
