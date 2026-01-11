import { getHighlightTerms, parseRaMaterialText } from "../highlight";

describe("getHighlightTerms", () => {
  it("returns empty array for empty query", () => {
    expect(getHighlightTerms("")).toEqual([]);
    expect(getHighlightTerms("   ")).toEqual([]);
  });

  it("extracts significant words from query", () => {
    expect(getHighlightTerms("law of one")).toEqual(["law", "one"]);
  });

  it("filters out stop words", () => {
    expect(getHighlightTerms("what is the law")).toEqual(["law"]);
    expect(getHighlightTerms("tell me about love")).toEqual(["love"]);
  });

  it("filters out short words (less than 3 chars)", () => {
    expect(getHighlightTerms("is it ok to be")).toEqual([]);
    expect(getHighlightTerms("Ra says we are one")).toEqual(["says", "one"]);
  });

  it("removes punctuation from words", () => {
    expect(getHighlightTerms("love, light, and unity!")).toEqual(["love", "light", "unity"]);
  });

  it("handles mixed case", () => {
    expect(getHighlightTerms("LOVE Light Unity")).toEqual(["love", "light", "unity"]);
  });

  it("handles complex queries", () => {
    // "does" is a stop word, so it's filtered out
    expect(getHighlightTerms("What does Ra say about the harvest?")).toEqual([
      "say",
      "harvest",
    ]);
  });
});

describe("parseRaMaterialText", () => {
  it("returns text segment for empty input", () => {
    expect(parseRaMaterialText("")).toEqual([{ type: "text", content: "" }]);
    expect(parseRaMaterialText("   ")).toEqual([{ type: "text", content: "" }]);
  });

  it("parses text without labels as text type", () => {
    const result = parseRaMaterialText("Some plain text without labels.");
    expect(result).toEqual([{ type: "text", content: "Some plain text without labels." }]);
  });

  it("parses Questioner segment", () => {
    const result = parseRaMaterialText("Questioner: What is love?");
    expect(result).toEqual([{ type: "questioner", content: "What is love?" }]);
  });

  it("parses Ra segment", () => {
    const result = parseRaMaterialText("Ra: I am Ra. Love is the Logos.");
    expect(result).toEqual([{ type: "ra", content: "I am Ra. Love is the Logos." }]);
  });

  it("parses mixed Questioner and Ra segments", () => {
    const text = "Questioner: What is the Law of One? Ra: I am Ra. The Law of One states that all things are one.";
    const result = parseRaMaterialText(text);
    expect(result).toEqual([
      { type: "questioner", content: "What is the Law of One?" },
      { type: "ra", content: "I am Ra. The Law of One states that all things are one." },
    ]);
  });

  it("handles text before any label", () => {
    const text = "Session 1. Questioner: First question. Ra: Response.";
    const result = parseRaMaterialText(text);
    expect(result).toEqual([
      { type: "text", content: "Session 1." },
      { type: "questioner", content: "First question." },
      { type: "ra", content: "Response." },
    ]);
  });

  it("handles multiple exchanges", () => {
    const text = "Questioner: Q1 Ra: A1 Questioner: Q2 Ra: A2";
    const result = parseRaMaterialText(text);
    expect(result).toHaveLength(4);
    expect(result[0]).toEqual({ type: "questioner", content: "Q1" });
    expect(result[1]).toEqual({ type: "ra", content: "A1" });
    expect(result[2]).toEqual({ type: "questioner", content: "Q2" });
    expect(result[3]).toEqual({ type: "ra", content: "A2" });
  });

  it("trims whitespace from segments", () => {
    const text = "Questioner:   Lots of spaces   Ra:   Also spaces   ";
    const result = parseRaMaterialText(text);
    expect(result).toEqual([
      { type: "questioner", content: "Lots of spaces" },
      { type: "ra", content: "Also spaces" },
    ]);
  });
});
