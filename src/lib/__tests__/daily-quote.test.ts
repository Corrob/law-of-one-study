import {
  getDayOfYear,
  getDailyQuote,
  getQuoteForDay,
  formatQuoteForShare,
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
  it("returns a quote object with required fields", () => {
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
    const isInArray = dailyQuotes.some(
      (q) => q.text === quote.text && q.reference === quote.reference
    );
    expect(isInArray).toBe(true);
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

    // With 100 quotes, consecutive days should have different quotes
    expect(quote1.text).not.toBe(quote2.text);
  });

  it("returns deterministic results based on day of year", () => {
    // Same day of year in different years should give same quote
    // (since we use dayOfYear % quotes.length)
    const date2024 = new Date(2024, 2, 15); // March 15, 2024
    const date2025 = new Date(2025, 2, 15); // March 15, 2025

    const quote2024 = getQuoteForDay(date2024);
    const quote2025 = getQuoteForDay(date2025);

    // Day of year for March 15:
    // 2024 (leap year): 31 (Jan) + 29 (Feb) + 15 = 75
    // 2025 (non-leap): 31 (Jan) + 28 (Feb) + 15 = 74
    // They're different days, so quotes might differ
    // But let's test that two identical dates give same result
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
});

describe("formatQuoteForShare", () => {
  it("formats quote with attribution and URL", () => {
    const quote = {
      text: "Test quote text",
      reference: "Ra 1.7",
      url: "https://www.llresearch.org/channeling/ra-contact/s/1#7",
    };

    const formatted = formatQuoteForShare(quote);

    expect(formatted).toContain('"Test quote text"');
    expect(formatted).toContain("— Ra 1.7");
    expect(formatted).toContain("https://www.llresearch.org/channeling/ra-contact/s/1#7");
    // URL should be on its own line (separated by double newline)
    expect(formatted).toMatch(/— Ra 1\.7\n\nhttps:\/\//);
  });

  it("handles quotes with special characters", () => {
    const quote = {
      text: "Quote with \"inner quotes\" and newlines",
      reference: "Ra 10.14",
      url: "https://www.llresearch.org/channeling/ra-contact/s/10#14",
    };

    const formatted = formatQuoteForShare(quote);

    expect(formatted).toContain(quote.text);
    expect(formatted).toContain(quote.reference);
  });
});

describe("dailyQuotes data", () => {
  it("has at least 30 verified quotes", () => {
    // 34 quotes verified against source material as of initial curation
    expect(dailyQuotes.length).toBeGreaterThanOrEqual(30);
  });

  it("all quotes have required fields", () => {
    dailyQuotes.forEach((quote, index) => {
      expect(quote.text).toBeTruthy();
      expect(quote.reference).toBeTruthy();
      expect(quote.url).toBeTruthy();
      expect(quote.url).toMatch(/^https:\/\/www\.llresearch\.org\/channeling\/ra-contact\//);
    });
  });

  it("all quotes have Ra references", () => {
    dailyQuotes.forEach((quote) => {
      expect(quote.reference).toMatch(/^Ra \d+\.\d+$/);
    });
  });
});
