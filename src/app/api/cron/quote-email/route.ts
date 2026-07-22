/**
 * GET /api/cron/quote-email — invoked daily by Vercel Cron (see vercel.json).
 *
 * Sends the quote email: one MailerLite campaign per locale, built from the
 * same deterministic daily quote shown on the site (src/lib/daily-quote.ts).
 * Weekday sends target the locale's daily group; Sunday's campaign targets
 * the daily AND weekly groups together — MailerLite dedupes recipients
 * across groups, so someone on both lists still gets one email. Locales
 * with no configured group for the day are skipped. Idempotent per day:
 * campaign names embed the year and day-of-year, and locales whose campaign
 * already exists are skipped, so a duplicate cron firing cannot double-send.
 */

import { AVAILABLE_LANGUAGES, type AvailableLanguage } from "@/lib/language-config";
import { getDayOfYear, getQuoteForDay } from "@/lib/daily-quote";
import {
  getEmailMessages,
  renderQuoteEmailHtml,
} from "@/lib/email/quote-email-template";
import {
  createCampaign,
  getGroupIdForLocale,
  listCampaignNames,
  scheduleCampaign,
} from "@/lib/email/mailerlite";

const SITE_URL = "https://lawofone.study";

function campaignName(date: Date, locale: AvailableLanguage): string {
  return `quote-${date.getFullYear()}-${getDayOfYear(date)}-${locale}`;
}

export async function GET(request: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ status: "error", message: "Unauthorized" }, { status: 401 });
  }

  const today = new Date();
  let existingNames: string[];
  try {
    existingNames = await listCampaignNames();
  } catch (error) {
    console.error("Quote email: listing campaigns failed:", error);
    return Response.json(
      { status: "error", message: "Failed to list existing campaigns" },
      { status: 502 }
    );
  }
  const isSunday = today.getUTCDay() === 0;
  const sent: AvailableLanguage[] = [];
  const skipped: AvailableLanguage[] = [];
  const failed: AvailableLanguage[] = [];

  for (const locale of AVAILABLE_LANGUAGES) {
    const groupIds = [
      getGroupIdForLocale(locale, "daily"),
      ...(isSunday ? [getGroupIdForLocale(locale, "weekly")] : []),
    ].filter((id): id is string => Boolean(id));
    if (groupIds.length === 0) {
      skipped.push(locale);
      continue;
    }

    const name = campaignName(today, locale);
    if (existingNames.includes(name)) {
      skipped.push(locale);
      continue;
    }

    const quote = getQuoteForDay(today, locale);
    const messages = getEmailMessages(locale);
    // Sunday's shared campaign reaches weekly readers too — use the
    // weekly wording; every other day speaks to the daily list.
    const cadence = isSunday ? ("weekly" as const) : ("daily" as const);
    // Deep link into Ask with the composer pre-filled, so one tap turns the
    // quote into a conversation.
    const prefill = messages.askPrefill
      .replace("{citation}", quote.reference)
      .replace("{quote}", quote.text);
    const params = {
      quote: quote.text,
      citation: quote.reference,
      quoteUrl: quote.url,
      askUrl: `${SITE_URL}/${locale}/ask?q=${encodeURIComponent(prefill)}&utm_source=email&utm_medium=email&utm_campaign=${cadence}-quote`,
      sourceUrl: quote.url,
      locale,
      cadence,
    };

    try {
      const campaignId = await createCampaign({
        name,
        // Citation first: mobile inboxes truncate at ~33 chars, so the part
        // that changes each send must survive. It also keeps subjects unique —
        // identical subjects make Gmail thread the emails. The brand lives in
        // the From name, not the subject.
        subject: `${quote.reference} — ${cadence === "weekly" ? messages.subject : messages.subjectDaily}`,
        groupIds,
        html: renderQuoteEmailHtml(params),
      });
      await scheduleCampaign(campaignId);
      sent.push(locale);
    } catch (error) {
      console.error(`Quote email failed for locale ${locale}:`, error);
      failed.push(locale);
    }
  }

  return Response.json(
    { status: failed.length ? "partial" : "ok", sent: sent.length, locales: sent, skipped, failed },
    { status: failed.length ? 500 : 200 }
  );
}
