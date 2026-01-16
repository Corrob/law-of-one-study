import { dailyQuotes, type DailyQuote } from "@/data/daily-quotes";
import { formatQuoteWithAttribution, getRaMaterialUrlFromReference } from "@/lib/quote-utils";
import { type AvailableLanguage, DEFAULT_LOCALE } from "@/lib/language-config";

/**
 * Localized daily quote with text in the requested language and locale-aware URL.
 */
export interface LocalizedDailyQuote {
  text: string;
  reference: string;
  url: string;
}

/**
 * Get the day of year (1-365/366) for a given date.
 * Used for deterministic daily quote selection.
 */
export function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

/**
 * Get today's daily quote in the specified locale.
 * Returns the same quote for all users on a given day (deterministic by day of year).
 * Quote changes at midnight in user's local timezone.
 * URL is generated dynamically based on locale.
 */
export function getDailyQuote(locale: AvailableLanguage = DEFAULT_LOCALE): LocalizedDailyQuote {
  const today = new Date();
  const dayOfYear = getDayOfYear(today);
  const quote = dailyQuotes[dayOfYear % dailyQuotes.length];

  return {
    text: quote.text[locale] || quote.text.en, // Fallback to English
    reference: quote.reference,
    url: getRaMaterialUrlFromReference(quote.reference, locale),
  };
}

/**
 * Get a specific day's quote in the specified locale (useful for testing or previewing).
 */
export function getQuoteForDay(date: Date, locale: AvailableLanguage = DEFAULT_LOCALE): LocalizedDailyQuote {
  const dayOfYear = getDayOfYear(date);
  const quote = dailyQuotes[dayOfYear % dailyQuotes.length];

  return {
    text: quote.text[locale] || quote.text.en,
    reference: quote.reference,
    url: getRaMaterialUrlFromReference(quote.reference, locale),
  };
}

/**
 * Get the raw bilingual quote data for a specific day (useful for components that need both languages).
 */
export function getRawQuoteForDay(date: Date): DailyQuote {
  const dayOfYear = getDayOfYear(date);
  return dailyQuotes[dayOfYear % dailyQuotes.length];
}

/**
 * Format a quote for sharing/copying to clipboard.
 * Includes attribution and source link.
 */
export function formatQuoteForShare(quote: LocalizedDailyQuote): string {
  return formatQuoteWithAttribution(quote.text, quote.reference, quote.url);
}
