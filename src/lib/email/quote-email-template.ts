/**
 * Renders the weekly/daily quote email for MailerLite campaigns.
 *
 * Email-client-safe by design: table-based layout, all styles inline,
 * literal hex colors from the Style Guide (email clients ignore CSS vars),
 * serif fallbacks for the display face, and a max width of 600px.
 * MailerLite derives the plain-text MIME part from this HTML at send time.
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
// Faint indigo tint for the quote card, warmer than plain white.
const QUOTE_CARD_BG = "#f6f4fb";

const EMAIL_MESSAGES: Record<AvailableLanguage, typeof en> = { en, es, de, fr };

/** MailerLite merge tag that expands to the unsubscribe URL at send time. */
export const MAILERLITE_UNSUBSCRIBE_TAG = "{$unsubscribe}";

/** Sender postal address, required by anti-spam law in every email. */
export const POSTAL_ADDRESS = "9169 W State St #2573 Garden City, ID 83741";

export interface QuoteEmailParams {
  /** The quote text, already localized. */
  quote: string;
  /** Citation shown under the quote, e.g. "Ra 1.7". */
  citation: string;
  /** Link to the quoted passage in the source material. */
  quoteUrl: string;
  /** Deep link into Ask on lawofone.study, pre-filled with the quote. */
  askUrl: string;
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
  const quoteUrl = escapeHtml(params.quoteUrl);
  const askUrl = escapeHtml(params.askUrl);
  const sourceUrl = escapeHtml(params.sourceUrl);
  const serif = "'Cormorant Garamond', Georgia, 'Times New Roman', serif";
  const sans = "Helvetica, Arial, sans-serif";
  // Inbox preview line: the quote itself, not boilerplate. Trailing
  // no-break spaces keep clients from pulling footer text into the preview.
  const preheader = escapeHtml(params.quote.slice(0, 140));

  return `<!DOCTYPE html>
<html lang="${params.locale}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="color-scheme" content="light" />
<meta name="supported-color-schemes" content="light" />
<title>${escapeHtml(m.subject)}</title>
<style>
  /* Stack the CTA pair on narrow screens; clients without media-query
     support (old Outlook) keep the side-by-side desktop layout. */
  @media only screen and (max-width: 480px) {
    .btn-col { display: block !important; width: 100% !important; }
    .btn-gap { display: block !important; width: 100% !important; height: 12px !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background-color:${STARLIGHT};">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${preheader}${"&nbsp;&zwnj;".repeat(30)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${STARLIGHT};">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:8px;overflow:hidden;">
          <tr>
            <td style="background-color:${COSMIC_INDIGO};padding:28px 32px;text-align:center;">
              <div style="font-family:${serif};font-size:26px;color:${STARLIGHT};letter-spacing:1px;">Law of One Study</div>
              <div style="font-family:${sans};font-size:11px;letter-spacing:3px;text-transform:uppercase;color:${RA_GOLD};margin-top:10px;">&#10022; ${escapeHtml(m.eyebrow)} &#10022;</div>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:32px 32px 4px;font-family:${sans};font-size:15px;line-height:1.6;color:${BODY_TEXT};text-align:center;">
              ${escapeHtml(m.greeting)}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 8px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="background-color:${QUOTE_CARD_BG};border-radius:12px;padding:8px 28px 28px;text-align:center;">
                    <div style="font-family:${serif};font-size:56px;line-height:1;color:${RA_GOLD};">&ldquo;</div>
                    <p style="margin:0;font-family:${serif};font-style:italic;font-size:23px;line-height:1.55;color:${BODY_TEXT};">${quote}</p>
                    <div style="height:2px;width:48px;background-color:${RA_GOLD};margin:20px auto;"></div>
                    <p style="margin:0;font-family:${sans};font-size:14px;letter-spacing:1px;"><a href="${quoteUrl}" style="color:${COSMIC_INDIGO};text-decoration:none;font-weight:bold;">${citation}</a></p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:28px 32px 8px;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;max-width:440px;">
                <tr>
                  <td class="btn-col" width="50%" style="vertical-align:top;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="border-radius:8px;background-color:${RA_GOLD};padding:14px 10px;">
                          <a href="${askUrl}" style="display:block;font-family:${sans};text-decoration:none;">
                            <span style="display:block;font-size:15px;font-weight:bold;color:${COSMIC_INDIGO};">${escapeHtml(m.askCta)}</span>
                            <span style="display:block;margin-top:3px;font-size:11px;letter-spacing:0.5px;color:${COSMIC_INDIGO};">lawofone.study</span>
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td class="btn-gap" width="16" style="width:16px;font-size:0;line-height:0;">&nbsp;</td>
                  <td class="btn-col" width="50%" style="vertical-align:top;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="border-radius:8px;background-color:${COSMIC_INDIGO};padding:14px 10px;">
                          <a href="${sourceUrl}" style="display:block;font-family:${sans};text-decoration:none;">
                            <span style="display:block;font-size:15px;font-weight:bold;color:${STARLIGHT};">${escapeHtml(m.readCta)}</span>
                            <span style="display:block;margin-top:3px;font-size:11px;letter-spacing:0.5px;color:${STARDUST};">llresearch.org</span>
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:20px 32px 28px;font-family:${serif};font-style:italic;font-size:17px;line-height:1.6;color:${BODY_TEXT};text-align:center;">
              ${escapeHtml(m.signoff)}<br />
              <span style="color:${RA_GOLD};">${escapeHtml(m.signoffName)}</span>
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
              <a href="${escapeHtml(unsubscribe)}" style="color:${STARDUST};">${escapeHtml(m.unsubscribe)}</a><br />
              ${escapeHtml(POSTAL_ADDRESS)}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
