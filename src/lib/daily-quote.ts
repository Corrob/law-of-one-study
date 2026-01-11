import { dailyQuotes, type DailyQuote } from "@/data/daily-quotes";
import { formatQuoteWithAttribution } from "@/lib/quote-utils";

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
 * Get today's daily quote.
 * Returns the same quote for all users on a given day (deterministic by day of year).
 * Quote changes at midnight in user's local timezone.
 */
export function getDailyQuote(): DailyQuote {
  const today = new Date();
  const dayOfYear = getDayOfYear(today);
  return dailyQuotes[dayOfYear % dailyQuotes.length];
}

/**
 * Get a specific day's quote (useful for testing or previewing).
 */
export function getQuoteForDay(date: Date): DailyQuote {
  const dayOfYear = getDayOfYear(date);
  return dailyQuotes[dayOfYear % dailyQuotes.length];
}

/**
 * Format a quote for sharing/copying to clipboard.
 * Includes attribution and source link.
 */
export function formatQuoteForShare(quote: DailyQuote): string {
  return formatQuoteWithAttribution(quote.text, quote.reference, quote.url);
}
