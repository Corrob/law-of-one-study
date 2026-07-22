import {
  renderQuoteEmailHtml,
  getEmailMessages,
  getEmailSubject,
  escapeHtml,
  MAILERLITE_UNSUBSCRIBE_TAG,
  SENDER_IDENTITY_LINES,
  type QuoteEmailParams,
} from "../quote-email-template";
import { AVAILABLE_LANGUAGES } from "@/lib/language-config";

const params: QuoteEmailParams = {
  quote: "I am Ra. The Law of One states that all things are one.",
  citation: "Ra 1.7",
  quoteUrl: "https://www.llresearch.org/channeling/ra-contact/1#7",
  askUrl: "https://lawofone.study/en/ask?q=Please%20help&utm_source=email",
  sourceUrl: "https://www.llresearch.org/channeling/ra-contact/1#7",
  locale: "en",
};

describe("renderQuoteEmailHtml", () => {
  it("includes the quote text and citation", () => {
    const html = renderQuoteEmailHtml(params);
    expect(html).toContain("The Law of One states that all things are one.");
    expect(html).toContain("Ra 1.7");
  });

  it("includes an Ask button and a Read button with their links", () => {
    const html = renderQuoteEmailHtml(params);
    expect(html).toContain(escapeHtml(params.askUrl));
    expect(html).toContain(params.sourceUrl);
    const messages = getEmailMessages("en");
    expect(html).toContain(messages.askCta);
    expect(html).toContain(messages.readCta);
  });

  it("uses the quote as the hidden preheader text", () => {
    const html = renderQuoteEmailHtml(params);
    const preheaderIndex = html.indexOf(params.quote.slice(0, 60));
    const headerIndex = html.indexOf("Law of One Study");
    expect(preheaderIndex).toBeGreaterThan(-1);
    expect(preheaderIndex).toBeLessThan(headerIndex);
  });

  it("includes the full sender identity block (name, address, country)", () => {
    // MailerLite appends its default footer unless all three lines are
    // present verbatim alongside the unsubscribe link.
    const html = renderQuoteEmailHtml(params);
    for (const line of SENDER_IDENTITY_LINES) {
      expect(html).toContain(escapeHtml(line));
    }
  });

  it("includes the L/L Research credit block", () => {
    const html = renderQuoteEmailHtml(params);
    expect(html).toContain("L/L Research");
    expect(html).toContain("not affiliated with or endorsed by L/L Research");
    expect(html).toContain("https://www.llresearch.org");
    expect(html).toContain("https://www.lawofone.info");
  });

  it("includes the MailerLite unsubscribe merge tag by default", () => {
    const html = renderQuoteEmailHtml(params);
    expect(html).toContain(MAILERLITE_UNSUBSCRIBE_TAG);
  });

  it("uses a custom unsubscribe tag when provided", () => {
    const html = renderQuoteEmailHtml({
      ...params,
      unsubscribeTag: "https://example.com/unsubscribe",
    });
    expect(html).toContain("https://example.com/unsubscribe");
    expect(html).not.toContain(MAILERLITE_UNSUBSCRIBE_TAG);
  });

  it("escapes HTML in the quote text", () => {
    const html = renderQuoteEmailHtml({
      ...params,
      quote: 'The <script>alert("x")</script> distortion',
    });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("uses the daily greeting for the daily cadence", () => {
    const weekly = renderQuoteEmailHtml(params);
    const daily = renderQuoteEmailHtml({ ...params, cadence: "daily" });
    const messages = getEmailMessages("en");
    expect(weekly).toContain(escapeHtml(messages.greeting));
    expect(daily).toContain(escapeHtml(messages.greetingDaily));
    expect(daily).not.toContain(escapeHtml(messages.greeting));
  });

  it("uses the daily eyebrow and footer reason for the daily cadence", () => {
    for (const locale of AVAILABLE_LANGUAGES) {
      const m = getEmailMessages(locale);
      const weekly = renderQuoteEmailHtml({ ...params, locale });
      const daily = renderQuoteEmailHtml({ ...params, locale, cadence: "daily" });
      expect(weekly).toContain(escapeHtml(m.eyebrow));
      expect(weekly).toContain(escapeHtml(m.footerReason));
      expect(daily).toContain(escapeHtml(m.eyebrowDaily));
      expect(daily).toContain(escapeHtml(m.footerReasonDaily));
      expect(daily).not.toContain(escapeHtml(m.eyebrow));
      expect(daily).not.toContain(escapeHtml(m.footerReason));
    }
  });

  it("renders localized chrome for every supported locale", () => {
    for (const locale of AVAILABLE_LANGUAGES) {
      const html = renderQuoteEmailHtml({ ...params, locale });
      const messages = getEmailMessages(locale);
      expect(html).toContain(escapeHtml(messages.greeting));
      expect(html).toContain(escapeHtml(messages.creditTitle));
      expect(html).toContain(`lang="${locale}"`);
    }
  });
});

describe("getEmailSubject", () => {
  it("returns a distinct localized subject per locale", () => {
    const subjects = AVAILABLE_LANGUAGES.map((locale) => getEmailSubject(locale));
    expect(new Set(subjects).size).toBe(AVAILABLE_LANGUAGES.length);
    subjects.forEach((subject) => expect(subject.length).toBeGreaterThan(0));
  });
});
