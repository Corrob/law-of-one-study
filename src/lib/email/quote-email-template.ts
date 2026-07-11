/**
 * Renders the weekly/daily quote email for MailerLite campaigns.
 *
 * Email-client-safe by design: table-based layout, all styles inline,
 * literal hex colors from the Style Guide (email clients ignore CSS vars),
 * serif fallbacks for the display face, and a max width of 600px.
 * A plain-text alternative is provided for deliverability and accessibility.
 */

import { type AvailableLanguage, DEFAULT_LOCALE } from "@/lib/language-config";
import en from "../../../messages/en/email.json";
import es from "../../../messages/es/email.json";
import de from "../../../messages/de/email.json";
import fr from "../../../messages/fr/email.json";

// Style Guide palette (docs/STYLE_GUIDE.md), inlined as literals for email.
const COSMIC_INDIGO = "#1a1f4e";
const RA_GOLD = "#d4a853";
const STARLIGHT = "#e8e6f2";
const STARDUST = "#9a98a9";
const BODY_TEXT = "#2a2a3a";

const EMAIL_MESSAGES: Record<AvailableLanguage, typeof en> = { en, es, de, fr };

/** MailerLite merge tag that expands to the unsubscribe URL at send time. */
export const MAILERLITE_UNSUBSCRIBE_TAG = "{$unsubscribe}";

export interface QuoteEmailParams {
  /** The quote text, already localized. */
  quote: string;
  /** Citation shown under the quote, e.g. "Ra 1.7". */
  citation: string;
  /** Link to the quoted passage in the source material. */
  quoteUrl: string;
  /** Link back to lawofone.study (with UTM params). */
  siteUrl: string;
  /** Link to the full session in the source material. */
  sourceUrl: string;
  locale: AvailableLanguage;
  /** Unsubscribe merge tag or URL; defaults to the MailerLite tag. */
  unsubscribeTag?: string;
}

export function getEmailMessages(locale: AvailableLanguage): typeof en {
  return EMAIL_MESSAGES[locale] ?? EMAIL_MESSAGES[DEFAULT_LOCALE];
}

export function getEmailSubject(locale: AvailableLanguage): string {
  return getEmailMessages(locale).subject;
}

/** Escape a string for safe interpolation into HTML. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Render the quote email as a self-contained HTML document.
 */
export function renderQuoteEmailHtml(params: QuoteEmailParams): string {
  const m = getEmailMessages(params.locale);
  const unsubscribe = params.unsubscribeTag ?? MAILERLITE_UNSUBSCRIBE_TAG;
  const quote = escapeHtml(params.quote);
  const citation = escapeHtml(params.citation);
  const serif = "'Cormorant Garamond', Georgia, 'Times New Roman', serif";
  const sans = "Helvetica, Arial, sans-serif";

  return `<!DOCTYPE html>
<html lang="${params.locale}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(m.subject)}</title>
</head>
<body style="margin:0;padding:0;background-color:${STARLIGHT};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${STARLIGHT};">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:8px;overflow:hidden;">
          <tr>
            <td style="background-color:${COSMIC_INDIGO};padding:28px 32px;text-align:center;">
              <div style="font-family:${serif};font-size:26px;color:${STARLIGHT};letter-spacing:1px;">Law of One Study</div>
              <div style="height:2px;width:64px;background-color:${RA_GOLD};margin:12px auto 0;"></div>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 32px 8px;font-family:${sans};font-size:15px;color:${BODY_TEXT};">
              ${escapeHtml(m.greeting)}
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px 8px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-left:4px solid ${RA_GOLD};padding:8px 8px 8px 20px;">
                    <p style="margin:0;font-family:${serif};font-style:italic;font-size:22px;line-height:1.5;color:${BODY_TEXT};">&ldquo;${quote}&rdquo;</p>
                    <p style="margin:16px 0 0;font-family:${sans};font-size:14px;color:${STARDUST};">&mdash; <a href="${params.quoteUrl}" style="color:${STARDUST};">${citation}</a></p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px;font-family:${sans};font-size:14px;line-height:2;">
              <a href="${params.siteUrl}" style="color:${COSMIC_INDIGO};font-weight:bold;">${escapeHtml(m.readMoreCta)} &rarr;</a><br />
              <a href="${params.sourceUrl}" style="color:${COSMIC_INDIGO};">${escapeHtml(m.readSourceCta)} &rarr;</a>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px;border-top:1px solid ${STARLIGHT};font-family:${sans};font-size:12px;line-height:1.7;color:${STARDUST};">
              <strong style="color:${BODY_TEXT};">${escapeHtml(m.creditTitle)}</strong><br />
              ${escapeHtml(m.creditPublished)}<br /><br />
              ${escapeHtml(m.creditIndependent)}<br /><br />
              ${escapeHtml(m.creditLearnMore)}
              <a href="https://www.llresearch.org" style="color:${COSMIC_INDIGO};">llresearch.org</a> &middot;
              <a href="https://www.lawofone.info" style="color:${COSMIC_INDIGO};">lawofone.info</a>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;background-color:${STARLIGHT};font-family:${sans};font-size:11px;line-height:1.7;color:${STARDUST};text-align:center;">
              ${escapeHtml(m.footerReason)}<br />
              <a href="${unsubscribe}" style="color:${STARDUST};">${escapeHtml(m.unsubscribe)}</a><br />
              {$address}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Render the plain-text alternative of the quote email.
 */
export function renderQuoteEmailText(params: QuoteEmailParams): string {
  const m = getEmailMessages(params.locale);
  const unsubscribe = params.unsubscribeTag ?? MAILERLITE_UNSUBSCRIBE_TAG;

  return [
    m.greeting,
    "",
    `"${params.quote}"`,
    `— ${params.citation}`,
    params.quoteUrl,
    "",
    `${m.readMoreCta}: ${params.siteUrl}`,
    `${m.readSourceCta}: ${params.sourceUrl}`,
    "",
    m.creditTitle,
    m.creditPublished,
    m.creditIndependent,
    `${m.creditLearnMore} https://www.llresearch.org · https://www.lawofone.info`,
    "",
    m.footerReason,
    `${m.unsubscribe}: ${unsubscribe}`,
  ].join("\n");
}
