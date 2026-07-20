import { parseSuggestions, getFallbackSuggestions } from "../suggestions";

describe("parseSuggestions", () => {
  it("parses a valid JSON suggestions array", () => {
    const out = parseSuggestions('{"suggestions":["What is the harvest?","Tell me about densities","How do I meditate?"]}');
    expect(out).toEqual([
      "What is the harvest?",
      "Tell me about densities",
      "How do I meditate?",
    ]);
  });

  it("trims, drops empties, and caps at three", () => {
    const out = parseSuggestions('{"suggestions":["  a  ","","b","c","d"]}');
    expect(out).toEqual(["a", "b", "c"]);
  });

  it("drops overly long suggestions", () => {
    const long = "x".repeat(200);
    const out = parseSuggestions(`{"suggestions":["ok","${long}"]}`);
    expect(out).toEqual(["ok"]);
  });

  it("returns null for invalid JSON", () => {
    expect(parseSuggestions("not json")).toBeNull();
  });

  it("returns null when suggestions isn't an array", () => {
    expect(parseSuggestions('{"suggestions":"nope"}')).toBeNull();
  });

  it("returns null when nothing usable remains", () => {
    expect(parseSuggestions('{"suggestions":["",""]}')).toBeNull();
  });
});

describe("getFallbackSuggestions", () => {
  it("returns three suggestions per locale", () => {
    for (const locale of ["en", "es", "de", "fr"] as const) {
      expect(getFallbackSuggestions(locale)).toHaveLength(3);
    }
  });
});
