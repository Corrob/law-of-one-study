/**
 * Client-safe cadence config for the email signup. Kept separate from the
 * MailerLite client so components can import it without pulling server-only
 * code into the bundle.
 */

import { type AvailableLanguage } from "@/lib/language-config";

/**
 * Locales that have a daily list (a MAILERLITE_GROUP_DAILY_* group).
 * The signup card only offers the daily option for these; extend as demand
 * appears — the server code is already locale-generic.
 */
export const DAILY_QUOTE_LOCALES: readonly AvailableLanguage[] = ["en"];
