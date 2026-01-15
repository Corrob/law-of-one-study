import {
  getDayOfYear,
  getDailyQuote,
  getQuoteForDay,
  formatQuoteForShare,
  getRawQuoteForDay,
} from "../daily-quote";
import { dailyQuotes } from "@/data/daily-quotes";

describe("getDayOfYear", () => {
  it("returns 1 for January 1st", () => {
    const jan1 = new Date(2024, 0, 1); // January 1, 2024
    expect(getDayOfYear(jan1)).toBe(1);
  });

  it("returns 32 for February 1st", () => {
    const feb1 = new Date(2024, 1, 1); // February 1, 2024
    expect(getDayOfYear(feb1)).toBe(32);
  });

  it("returns 366 for December 31st in a leap year", () => {
    const dec31Leap = new Date(2024, 11, 31); // December 31, 2024 (leap year)
    expect(getDayOfYear(dec31Leap)).toBe(366);
  });

  it("returns 365 for December 31st in a non-leap year", () => {
    const dec31NonLeap = new Date(2023, 11, 31); // December 31, 2023
    expect(getDayOfYear(dec31NonLeap)).toBe(365);
  });
});

describe("getDailyQuote", () => {
  it("returns a localized quote object with required fields", () => {
    const quote = getDailyQuote();

    expect(quote).toHaveProperty("text");
    expect(quote).toHaveProperty("reference");
    expect(quote).toHaveProperty("url");
    expect(typeof quote.text).toBe("string");
    expect(typeof quote.reference).toBe("string");
    expect(typeof quote.url).toBe("string");
  });

  it("returns a quote from the dailyQuotes array", () => {
    const quote = getDailyQuote();
    // Check that the reference matches one in the array
    const isInArray = dailyQuotes.some(
      (q) => q.reference === quote.reference && q.text.en === quote.text
    );
    expect(isInArray).toBe(true);
  });

  it("defaults to English locale", () => {
    const quoteEn = getDailyQuote();
    const quoteExplicit = getDailyQuote("en");
    expect(quoteEn.text).toBe(quoteExplicit.text);
  });

  it("returns Spanish text for Spanish locale", () => {
    const quoteEn = getDailyQuote("en");
    const quoteEs = getDailyQuote("es");

    // Same reference for same day
    expect(quoteEn.reference).toBe(quoteEs.reference);

    // Different text (Spanish vs English) - unless Spanish falls back to English
    // Just verify Spanish text is returned
    expect(quoteEs.text).toBeTruthy();
  });

  it("generates locale-aware URL for English", () => {
    const quote = getDailyQuote("en");
    expect(quote.url).toMatch(/^https:\/\/www\.llresearch\.org\/channeling\/ra-contact\/\d+#\d+$/);
    expect(quote.url).not.toContain("/es/");
  });

  it("generates locale-aware URL for Spanish", () => {
    const quote = getDailyQuote("es");
    expect(quote.url).toMatch(/^https:\/\/www\.llresearch\.org\/es\/channeling\/ra-contact\/\d+#\d+$/);
  });
});

describe("getQuoteForDay", () => {
  it("returns the same quote for the same date", () => {
    const date = new Date(2024, 5, 15); // June 15, 2024
    const quote1 = getQuoteForDay(date);
    const quote2 = getQuoteForDay(date);

    expect(quote1.text).toBe(quote2.text);
    expect(quote1.reference).toBe(quote2.reference);
  });

  it("returns different quotes for different dates (usually)", () => {
    const date1 = new Date(2024, 0, 1);
    const date2 = new Date(2024, 0, 2);
    const quote1 = getQuoteForDay(date1);
    const quote2 = getQuoteForDay(date2);

    // With 90+ quotes, consecutive days should have different quotes
    expect(quote1.text).not.toBe(quote2.text);
  });

  it("returns deterministic results based on day of year", () => {
    const date2024 = new Date(2024, 2, 15); // March 15, 2024
    const quote2024 = getQuoteForDay(date2024);

    // Same call should return same result
    expect(getQuoteForDay(date2024)).toEqual(quote2024);
  });

  it("cycles through quotes after exhausting the array", () => {
    // Day 1 and day (quotesLength + 1) should give the same quote
    const day1 = new Date(2024, 0, 1); // Day 1
    const dayCycle = new Date(2024, 0, 1 + dailyQuotes.length);

    const quote1 = getQuoteForDay(day1);
    const quoteCycle = getQuoteForDay(dayCycle);

    expect(quote1.text).toBe(quoteCycle.text);
  });

  it("supports locale parameter", () => {
    const date = new Date(2024, 5, 15);
    const quoteEn = getQuoteForDay(date, "en");
    const quoteEs = getQuoteForDay(date, "es");

    // Same reference
    expect(quoteEn.reference).toBe(quoteEs.reference);

    // Different URLs (locale path)
    expect(quoteEn.url).not.toContain("/es/");
    expect(quoteEs.url).toContain("/es/");
  });
});

describe("getRawQuoteForDay", () => {
  it("returns the raw bilingual quote data", () => {
    const date = new Date(2024, 5, 15);
    const rawQuote = getRawQuoteForDay(date);

    expect(rawQuote).toHaveProperty("reference");
    expect(rawQuote).toHaveProperty("text");
    expect(rawQuote.text).toHaveProperty("en");
    expect(rawQuote.text).toHaveProperty("es");
  });
});

describe("formatQuoteForShare", () => {
  it("formats quote with attribution and URL", () => {
    const quote = {
      text: "Test quote text",
      reference: "Ra 1.7",
      url: "https://www.llresearch.org/channeling/ra-contact/1#7",
    };

    const formatted = formatQuoteForShare(quote);

    expect(formatted).toContain('"Test quote text"');
    expect(formatted).toContain("— Ra 1.7");
    expect(formatted).toContain("https://www.llresearch.org/channeling/ra-contact/1#7");
    // URL should be on its own line (separated by double newline)
    expect(formatted).toMatch(/— Ra 1\.7\n\nhttps:\/\//);
  });

  it("handles quotes with special characters", () => {
    const quote = {
      text: "Quote with \"inner quotes\" and newlines",
      reference: "Ra 10.14",
      url: "https://www.llresearch.org/channeling/ra-contact/10#14",
    };

    const formatted = formatQuoteForShare(quote);

    expect(formatted).toContain(quote.text);
    expect(formatted).toContain(quote.reference);
  });
});

describe("dailyQuotes data", () => {
  it("has at least 30 verified quotes", () => {
    expect(dailyQuotes.length).toBeGreaterThanOrEqual(30);
  });

  it("all quotes have required fields in bilingual format", () => {
    dailyQuotes.forEach((quote) => {
      expect(quote.text).toBeTruthy();
      expect(quote.text.en).toBeTruthy();
      expect(quote.text.es).toBeTruthy();
      expect(quote.reference).toBeTruthy();
    });
  });

  it("all quotes have Ra references", () => {
    dailyQuotes.forEach((quote) => {
      expect(quote.reference).toMatch(/^Ra \d+\.\d+$/);
    });
  });

  it("does not store URLs (they are generated dynamically)", () => {
    dailyQuotes.forEach((quote) => {
      expect(quote).not.toHaveProperty("url");
    });
  });
});
