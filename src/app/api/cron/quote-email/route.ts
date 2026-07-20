/**
 * GET /api/cron/quote-email — invoked by Vercel Cron (see vercel.json).
 *
 * Sends the quote-of-the-week campaign: one MailerLite campaign per locale
 * group, built from the same deterministic daily quote shown on the site
 * (src/lib/daily-quote.ts). Idempotent per day: campaign names embed the
 * year and day-of-year, and locales whose campaign already exists are
 * skipped, so a duplicate cron firing cannot double-send.
 */

import { AVAILABLE_LANGUAGES, type AvailableLanguage } from "@/lib/language-config";
import { getDayOfYear, getQuoteForDay } from "@/lib/daily-quote";
import {
  getEmailMessages,
  getEmailSubject,
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
  return `weekly-quote-${date.getFullYear()}-${getDayOfYear(date)}-${locale}`;
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
  const sent: AvailableLanguage[] = [];
  const skipped: AvailableLanguage[] = [];
  const failed: AvailableLanguage[] = [];

  for (const locale of AVAILABLE_LANGUAGES) {
    const groupId = getGroupIdForLocale(locale);
    if (!groupId) {
      skipped.push(locale);
      continue;
    }

    const name = campaignName(today, locale);
    if (existingNames.includes(name)) {
      skipped.push(locale);
      continue;
    }

    const quote = getQuoteForDay(today, locale);
    // Deep link into Ask with the composer pre-filled, so one tap turns the
    // quote into a conversation.
    const prefill = getEmailMessages(locale)
      .askPrefill.replace("{citation}", quote.reference)
      .replace("{quote}", quote.text);
    const params = {
      quote: quote.text,
      citation: quote.reference,
      quoteUrl: quote.url,
      askUrl: `${SITE_URL}/${locale}/ask?q=${encodeURIComponent(prefill)}&utm_source=email&utm_medium=email&utm_campaign=weekly-quote`,
      sourceUrl: quote.url,
      locale,
    };

    try {
      const campaignId = await createCampaign({
        name,
        // Citation first: mobile inboxes truncate at ~33 chars, so the part
        // that changes each week must survive. It also keeps subjects unique —
        // identical subjects make Gmail thread the emails. The brand lives in
        // the From name, not the subject.
        subject: `${quote.reference} — ${getEmailSubject(locale)}`,
        groupId,
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
