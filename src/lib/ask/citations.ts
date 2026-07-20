/**
 * Citation handling for the Ask feature.
 *
 * The model cites sources with inline `{{CITE:session.question}}` markers
 * (e.g. `{{CITE:6.14}}`). We resolve those to locale-aware deep links on
 * llresearch.org — L/L Research's own site, the canonical home of the Ra
 * Material — so the reader goes straight to the authoritative source. We never
 * render the Ra Material verbatim ourselves.
 *
 * Only references that actually exist in our curated concept graph are turned
 * into links; anything else (a hallucinated session number) is dropped. This
 * keeps every citation accurate. The known-reference list is a tiny generated
 * file (see scripts/validate-ra-citations.ts) so this module stays client-safe
 * and does not pull in the full concept graph.
 */

import knownReferences from "@/data/known-references.json";
import { getRaMaterialUrlFromReference } from "@/lib/quote-utils";
import { type AvailableLanguage, DEFAULT_LOCALE } from "@/lib/language-config";

/** Matches a complete citation marker: {{CITE:6.14}} */
const CITE_MARKER = /\{\{CITE:\s*(\d+\.\d+)\s*\}\}/g;

/**
 * Matches a trailing, not-yet-complete citation marker during streaming
 * (e.g. "{{CITE:6.1" before the closing braces arrive). Used to hide the
 * fragment until the full marker is available.
 */
const PARTIAL_TRAILING_MARKER = /\{\{(?:C(?:I(?:T(?:E(?::[\d.]*)?)?)?)?)?$/;

const KNOWN_REFERENCES: ReadonlySet<string> = new Set(knownReferences as string[]);

/**
 * The set of every `session.question` reference known to be real (curated in
 * the concept graph and validated against the source).
 */
export function getKnownReferences(): ReadonlySet<string> {
  return KNOWN_REFERENCES;
}

/**
 * Build the locale-aware llresearch.org deep link for a `session.question`
 * reference, e.g. `6.14` → `https://www.llresearch.org/channeling/ra-contact/6#14`
 * (with a `/es`, `/de`, `/fr` path prefix for non-English locales).
 */
export function citationUrl(
  reference: string,
  locale: AvailableLanguage = DEFAULT_LOCALE
): string {
  return getRaMaterialUrlFromReference(reference, locale);
}

/**
 * Replace `{{CITE:ref}}` markers in a response with Markdown links to the
 * source on llresearch.org. Unknown references are dropped (not linked). Any
 * incomplete trailing marker is stripped so it isn't shown mid-stream.
 *
 * Safe to call on partial text on every streaming tick — only complete markers
 * with known references are transformed.
 */
export function renderCitationsToMarkdown(
  text: string,
  locale: AvailableLanguage = DEFAULT_LOCALE
): string {
  const withLinks = text.replace(CITE_MARKER, (_match, reference: string) => {
    if (!KNOWN_REFERENCES.has(reference)) return "";
    return `[${reference}](${citationUrl(reference, locale)})`;
  });

  // Hide a partial marker still being streamed.
  return withLinks.replace(PARTIAL_TRAILING_MARKER, "");
}

/**
 * Extract the distinct, known references cited in a response (in order of first
 * appearance). Useful for a "sources" summary and for analytics.
 */
export function extractCitedReferences(text: string): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const match of text.matchAll(CITE_MARKER)) {
    const reference = match[1];
    if (KNOWN_REFERENCES.has(reference) && !seen.has(reference)) {
      seen.add(reference);
      result.push(reference);
    }
  }
  return result;
}
