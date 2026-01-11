import {
  textContainsTerms,
  splitIntoParagraphs,
  truncateAtParagraph,
  getSegmentDisplayContent,
} from "../truncation";

describe("textContainsTerms", () => {
  it("returns false for empty terms array", () => {
    expect(textContainsTerms("some text here", [])).toBe(false);
  });

  it("returns true when text contains a term at word start", () => {
    expect(textContainsTerms("The Law of One teaches unity", ["law"])).toBe(true);
  });

  it("is case-insensitive", () => {
    expect(textContainsTerms("LOVE and LIGHT", ["love"])).toBe(true);
    expect(textContainsTerms("love and light", ["LOVE"])).toBe(true);
  });

  it("returns true if any term matches", () => {
    expect(textContainsTerms("The harvest approaches", ["love", "harvest", "unity"])).toBe(true);
  });

  it("returns false when no terms match", () => {
    expect(textContainsTerms("The harvest approaches", ["love", "light"])).toBe(false);
  });

  it("only matches word prefixes, not mid-word", () => {
    // "law" should NOT match "flaw" or "outlaw"
    expect(textContainsTerms("This is a flaw in the system", ["law"])).toBe(false);
    expect(textContainsTerms("He is an outlaw", ["law"])).toBe(false);
    // But should match "law" and "lawful"
    expect(textContainsTerms("The law is clear", ["law"])).toBe(true);
    expect(textContainsTerms("This is lawful behavior", ["law"])).toBe(true);
  });
});

describe("splitIntoParagraphs", () => {
  it("splits text by double newlines", () => {
    const text = "First paragraph.\n\nSecond paragraph.";
    expect(splitIntoParagraphs(text)).toEqual(["First paragraph.", "Second paragraph."]);
  });

  it("handles multiple newlines between paragraphs", () => {
    const text = "First.\n\n\n\nSecond.";
    expect(splitIntoParagraphs(text)).toEqual(["First.", "Second."]);
  });

  it("filters out empty paragraphs", () => {
    const text = "First.\n\n   \n\nSecond.";
    expect(splitIntoParagraphs(text)).toEqual(["First.", "Second."]);
  });

  it("returns single paragraph for text without breaks", () => {
    const text = "Single paragraph with no breaks.";
    expect(splitIntoParagraphs(text)).toEqual(["Single paragraph with no breaks."]);
  });

  it("handles text with single newlines (not paragraph breaks)", () => {
    const text = "Line one.\nLine two.";
    expect(splitIntoParagraphs(text)).toEqual(["Line one.\nLine two."]);
  });
});

describe("truncateAtParagraph", () => {
  it("returns empty content unchanged", () => {
    const result = truncateAtParagraph("");
    expect(result).toEqual({ content: "", isTruncated: false, needsButton: false });
  });

  it("returns single paragraph unchanged", () => {
    const text = "This is a single paragraph with no breaks.";
    const result = truncateAtParagraph(text);
    expect(result).toEqual({ content: text, isTruncated: false, needsButton: false });
  });

  it("shows first paragraph only when no highlight terms provided", () => {
    const text = "First paragraph here.\n\nSecond paragraph here.\n\nThird paragraph.";
    const result = truncateAtParagraph(text);
    expect(result.content).toBe("First paragraph here.");
    expect(result.isTruncated).toBe(true);
    expect(result.needsButton).toBe(true);
  });

  it("includes paragraphs until one contains a highlight term", () => {
    const text = "First paragraph.\n\nSecond has love in it.\n\nThird paragraph.";
    const result = truncateAtParagraph(text, { highlightTerms: ["love"] });
    expect(result.content).toBe("First paragraph.\n\nSecond has love in it.");
    expect(result.isTruncated).toBe(true);
    expect(result.needsButton).toBe(true);
  });

  it("stops after first paragraph with highlight", () => {
    const text = "First has love.\n\nSecond also has love.\n\nThird too.";
    const result = truncateAtParagraph(text, { highlightTerms: ["love"] });
    expect(result.content).toBe("First has love.");
    expect(result.isTruncated).toBe(true);
  });

  it("shows first paragraph only if no highlight found anywhere", () => {
    const text = "First paragraph.\n\nSecond paragraph.\n\nThird paragraph.";
    const result = truncateAtParagraph(text, { highlightTerms: ["nonexistent"] });
    expect(result.content).toBe("First paragraph.");
    expect(result.isTruncated).toBe(true);
  });

  it("shows all if highlight is in last paragraph", () => {
    const text = "First paragraph.\n\nSecond paragraph.\n\nThird has love.";
    const result = truncateAtParagraph(text, { highlightTerms: ["love"] });
    expect(result.content).toBe("First paragraph.\n\nSecond paragraph.\n\nThird has love.");
    expect(result.isTruncated).toBe(false);
    expect(result.needsButton).toBe(false);
  });

  it("never cuts in the middle of a paragraph", () => {
    const longPara = "A".repeat(500);
    const text = `${longPara}\n\nSecond paragraph.`;
    const result = truncateAtParagraph(text);
    // Should show entire first paragraph, not cut at 200 chars
    expect(result.content).toBe(longPara);
    expect(result.isTruncated).toBe(true);
  });

  it("handles case-insensitive highlight matching", () => {
    const text = "First paragraph.\n\nSecond has LOVE.\n\nThird.";
    const result = truncateAtParagraph(text, { highlightTerms: ["love"] });
    expect(result.content).toBe("First paragraph.\n\nSecond has LOVE.");
  });
});

describe("getSegmentDisplayContent", () => {
  describe("questioner segments", () => {
    it("always shows full content", () => {
      const content = "First paragraph.\n\nSecond paragraph.\n\nThird paragraph.";
      const result = getSegmentDisplayContent("questioner", content, false);
      expect(result.content).toBe(content);
      expect(result.isTruncated).toBe(false);
      expect(result.needsButton).toBe(false);
    });

    it("shows full content even when expanded", () => {
      const content = "Full question content here.";
      const result = getSegmentDisplayContent("questioner", content, true);
      expect(result.content).toBe(content);
      expect(result.needsButton).toBe(false);
    });
  });

  describe("text segments", () => {
    it("always shows full content", () => {
      const content = "Some text without speaker label.";
      const result = getSegmentDisplayContent("text", content, false);
      expect(result.content).toBe(content);
      expect(result.needsButton).toBe(false);
    });
  });

  describe("ra segments", () => {
    it("truncates at paragraph boundary when not expanded", () => {
      const content = "First paragraph.\n\nSecond paragraph.\n\nThird.";
      const result = getSegmentDisplayContent("ra", content, false, []);
      expect(result.content).toBe("First paragraph.");
      expect(result.isTruncated).toBe(true);
      expect(result.needsButton).toBe(true);
    });

    it("shows full content when expanded", () => {
      const content = "First paragraph.\n\nSecond paragraph.";
      const result = getSegmentDisplayContent("ra", content, true);
      expect(result.content).toBe(content);
      expect(result.isTruncated).toBe(false);
      expect(result.needsButton).toBe(true); // Button still shown to collapse
    });

    it("includes paragraphs until highlight found", () => {
      const content = "First para.\n\nSecond has densities.\n\nThird.";
      const result = getSegmentDisplayContent("ra", content, false, ["densities"]);
      expect(result.content).toBe("First para.\n\nSecond has densities.");
      expect(result.isTruncated).toBe(true);
    });

    it("does not show button for short single paragraph", () => {
      const content = "Short Ra response.";
      const result = getSegmentDisplayContent("ra", content, false);
      expect(result.content).toBe(content);
      expect(result.needsButton).toBe(false);
    });
  });
});
