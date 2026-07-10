/**
 * Opening-question ("starter") selection for the Ask welcome screen.
 *
 * The localized pool lives in `messages/{locale}/ask.json`. We show a random
 * handful each visit so the empty state feels fresh and surfaces the breadth of
 * topics. Selection runs client-side (see AskWelcome) to avoid a server/client
 * hydration mismatch.
 */

/** How many starters to surface on the welcome screen at once. */
export const STARTER_DISPLAY_COUNT = 5;

/**
 * Return up to `count` starters chosen at random from `pool`, without
 * duplicates and without mutating the input. Fewer than `count` items are
 * returned when the pool is smaller.
 */
export function pickRandomStarters(pool: string[], count: number = STARTER_DISPLAY_COUNT): string[] {
  const shuffled = [...pool];
  // Fisher–Yates shuffle.
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, Math.max(0, count));
}
