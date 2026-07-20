import {
  renderQuoteEmailHtml,
  getEmailMessages,
  getEmailSubject,
  escapeHtml,
  MAILERLITE_UNSUBSCRIBE_TAG,
  type QuoteEmailParams,
} from "../quote-email-template";
import { AVAILABLE_LANGUAGES } from "@/lib/language-config";

const params: QuoteEmailParams = {
  quote: "I am Ra. The Law of One states that all things are one.",
  citation: "Ra 1.7",
  quoteUrl: "https://www.llresearch.org/channeling/ra-contact/1#7",
  siteUrl: "https://lawofone.study/en?utm_source=email",
  sourceUrl: "https://www.llresearch.org/channeling/ra-contact/1#7",
  locale: "en",
};

describe("renderQuoteEmailHtml", () => {
  it("includes the quote text and citation", () => {
    const html = renderQuoteEmailHtml(params);
    expect(html).toContain("The Law of One states that all things are one.");
    expect(html).toContain("Ra 1.7");
  });

  it("includes both the site link and the source link", () => {
    const html = renderQuoteEmailHtml(params);
    expect(html).toContain(params.siteUrl);
    expect(html).toContain(params.sourceUrl);
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
