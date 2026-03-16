// Utility functions for Ra Material quote URLs and formatting

import { type AvailableLanguage, DEFAULT_LOCALE } from "./language-config";

/**
 * Generate a URL to the Ra Material on L/L Research website.
 * Uses locale-aware paths for translated content.
 *
 * @param session - Session number (1-106)
 * @param question - Question number within the session
 * @param locale - Language locale (defaults to 'en')
 * @returns URL to the specific passage on llresearch.org
 *
 * @example
 * getRaMaterialUrl(20, 1, 'en') // https://www.llresearch.org/channeling/ra-contact/20#1
 * getRaMaterialUrl(20, 1, 'es') // https://www.llresearch.org/es/channeling/ra-contact/20#1
 */
export function getRaMaterialUrl(
  session: number | string,
  question?: number | string,
  locale: AvailableLanguage = DEFAULT_LOCALE
): string {
  const localePath = locale === "en" ? "" : `/${locale}`;
  const questionHash = question ? `#${question}` : "";
  return `https://www.llresearch.org${localePath}/channeling/ra-contact/${session}${questionHash}`;
}

/**
 * Generate a URL from a reference string (e.g., "20.1" or "Ra 20.1").
 *
 * @param reference - Reference string like "20.1" or "Ra 20.1"
 * @param locale - Language locale (defaults to 'en')
 * @returns URL to the specific passage, or base URL if parsing fails
 */
export function getRaMaterialUrlFromReference(
  reference: string,
  locale: AvailableLanguage = DEFAULT_LOCALE
): string {
  const match = reference.match(/(\d+)\.(\d+)/);
  if (!match) {
    const localePath = locale === "en" ? "" : `/${locale}`;
    return `https://www.llresearch.org${localePath}/channeling/ra-contact`;
  }
  const [, session, question] = match;
  return getRaMaterialUrl(session, question, locale);
}

/**
 * Format a quote with attribution and source URL for clipboard copying.
 * Produces a consistent format across the app:
 *
 * "{quote text}"
 * — Ra {session.question}
 *
 * https://www.llresearch.org/channeling/ra-contact/{session}#{question}
 */
export function formatQuoteWithAttribution(
  text: string,
  reference: string,
  url: string
): string {
  return `"${text}"\n— ${reference}\n\n${url}`;
}

// Re-export language types from centralized config
// Note: Only languages with actual Ra Material translations are available
export { AVAILABLE_LANGUAGES, type AvailableLanguage } from './language-config';

// Alias for backwards compatibility
export type SupportedLanguage = import('./language-config').AvailableLanguage;
