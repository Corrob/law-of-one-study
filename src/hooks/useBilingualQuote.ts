/**
 * SWR hook for fetching bilingual quote data.
 *
 * Provides automatic request deduplication, caching, and cross-component sharing.
 * When the same quote reference is requested by multiple components (e.g., SearchResultCard,
 * BilingualQuoteCard, CitationModal), only one network request is made.
 */

import useSWR from "swr";
import { fetchBilingualQuote, fetchFullQuote } from "@/lib/quote-utils";
import { type AvailableLanguage, DEFAULT_LOCALE } from "@/lib/language-config";

export interface BilingualQuoteData {
  text: string;
  originalText?: string;
}

/**
 * Fetch bilingual quote data with SWR caching and deduplication.
 *
 * @param reference - Quote reference in "session.question" format (e.g., "49.8")
 * @param language - Target language for the quote
 * @returns SWR response with { data, error, isLoading }
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useBilingualQuote("49.8", "es");
 * if (isLoading) return <Spinner />;
 * if (data) {
 *   console.log(data.text);         // Spanish text
 *   console.log(data.originalText); // English original
 * }
 * ```
 */
export function useBilingualQuote(reference: string, language: AvailableLanguage) {
  // Skip fetch if:
  // - Language is English (no translation needed)
  // - Reference is empty (conditional fetch disabled)
  const shouldFetch = language !== DEFAULT_LOCALE && reference.length > 0;

  return useSWR<BilingualQuoteData | null>(
    shouldFetch ? `quote/${reference}/${language}` : null,
    // Fetcher function
    () => fetchBilingualQuote(reference, language),
    {
      // Quote data is static, no need to revalidate
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      // Keep data in cache indefinitely (quotes don't change)
      dedupingInterval: 60000, // 1 minute deduplication window
    }
  );
}

/**
 * Fetch English-only quote data with SWR caching.
 *
 * @param reference - Quote reference in "session.question" format (empty string to skip fetch)
 * @returns SWR response with { data, error, isLoading }
 */
export function useEnglishQuote(reference: string) {
  const shouldFetch = reference.length > 0;

  return useSWR<BilingualQuoteData | null>(
    shouldFetch ? `quote/${reference}/en` : null,
    () => fetchBilingualQuote(reference, DEFAULT_LOCALE),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000,
    }
  );
}

/**
 * Unified hook for fetching quote data that handles both English and non-English cases.
 * Use this when you need quote data regardless of language setting.
 *
 * @param reference - Quote reference in "session.question" format (empty string to skip fetch)
 * @param language - Current language setting
 * @returns SWR response with { data, error, isLoading }
 */
export function useQuoteData(reference: string, language: AvailableLanguage) {
  const shouldFetch = reference.length > 0;

  return useSWR<BilingualQuoteData | null>(
    shouldFetch ? `quote/${reference}/${language}` : null,
    () => fetchBilingualQuote(reference, language),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000,
    }
  );
}

/**
 * Fetch quote text in a specific language with SWR caching.
 * Unlike useBilingualQuote, this only returns the text in the requested language,
 * not the English original.
 *
 * @param reference - Quote reference in "session.question" format (empty string to skip fetch)
 * @param language - Target language for the quote
 * @returns SWR response with { data (string), error, isLoading }
 */
export function useQuoteText(reference: string, language: AvailableLanguage) {
  const shouldFetch = reference.length > 0;

  return useSWR<string | null>(
    shouldFetch ? `quote-text/${reference}/${language}` : null,
    () => fetchFullQuote(reference, language),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000,
    }
  );
}
