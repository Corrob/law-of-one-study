import {
  parseCitationsInText,
  buildCitationUrl,
  CITATION_REGEX,
  type CitationSegment,
} from "../citationParser";

describe("citationParser", () => {
  describe("buildCitationUrl", () => {
    it("should build correct URL from session and question", () => {
      expect(buildCitationUrl(50, 7)).toBe("https://www.llresearch.org/channeling/ra-contact/50#7");
    });

    it("should handle single-digit session and question", () => {
      expect(buildCitationUrl(1, 1)).toBe("https://www.llresearch.org/channeling/ra-contact/1#1");
    });

    it("should handle three-digit session", () => {
      expect(buildCitationUrl(106, 23)).toBe("https://www.llresearch.org/channeling/ra-contact/106#23");
    });
  });

  describe("CITATION_REGEX", () => {
    it("should match standard citation format", () => {
      const text = "(Ra 50.7)";
      const regex = new RegExp(CITATION_REGEX.source, "g");
      const match = regex.exec(text);

      expect(match).not.toBeNull();
      expect(match![0]).toBe("(Ra 50.7)");
      expect(match![1]).toBe("50");
      expect(match![2]).toBe("7");
    });

    it("should match citation with space after Ra", () => {
      const regex = new RegExp(CITATION_REGEX.source, "g");
      expect(regex.test("(Ra 1.1)")).toBe(true);
    });

    it("should not match malformed citations", () => {
      const regex = new RegExp(CITATION_REGEX.source, "g");
      expect(regex.test("(Ra 50)")).toBe(false); // Missing question
      expect(regex.test("Ra 50.7")).toBe(false); // Missing parentheses
      expect(regex.test("(Ra50.7)")).toBe(false); // Missing space
    });
  });

  describe("parseCitationsInText", () => {
    it("should return plain text when no citations are present", () => {
      const text = "This is just plain text without any citations.";
      const result = parseCitationsInText(text);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        type: "text",
        content: text,
      });
    });

    it("should parse single citation", () => {
      const text = "Ra explains (Ra 50.7) that the veil is necessary.";
      const result = parseCitationsInText(text);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({
        type: "text",
        content: "Ra explains ",
      });
      expect(result[1]).toEqual({
        type: "citation",
        session: 50,
        question: 7,
        displayText: "(Ra 50.7)",
        url: "https://www.llresearch.org/channeling/ra-contact/50#7",
      });
      expect(result[2]).toEqual({
        type: "text",
        content: " that the veil is necessary.",
      });
    });

    it("should parse multiple citations", () => {
      const text = "This is explained (Ra 50.7) and expanded upon (Ra 51.3).";
      const result = parseCitationsInText(text);

      expect(result).toHaveLength(5);

      const citations = result.filter((s) => s.type === "citation");
      expect(citations).toHaveLength(2);
      expect(citations[0]).toEqual({
        type: "citation",
        session: 50,
        question: 7,
        displayText: "(Ra 50.7)",
        url: "https://www.llresearch.org/channeling/ra-contact/50#7",
      });
      expect(citations[1]).toEqual({
        type: "citation",
        session: 51,
        question: 3,
        displayText: "(Ra 51.3)",
        url: "https://www.llresearch.org/channeling/ra-contact/51#3",
      });
    });

    it("should handle citation at start of text", () => {
      const text = "(Ra 1.1) opens the material.";
      const result = parseCitationsInText(text);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        type: "citation",
        session: 1,
        question: 1,
        displayText: "(Ra 1.1)",
        url: "https://www.llresearch.org/channeling/ra-contact/1#1",
      });
      expect(result[1]).toEqual({
        type: "text",
        content: " opens the material.",
      });
    });

    it("should handle citation at end of text", () => {
      const text = "The veil is explained (Ra 83.17)";
      const result = parseCitationsInText(text);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        type: "text",
        content: "The veil is explained ",
      });
      expect(result[1]).toEqual({
        type: "citation",
        session: 83,
        question: 17,
        displayText: "(Ra 83.17)",
        url: "https://www.llresearch.org/channeling/ra-contact/83#17",
      });
    });

    it("should handle consecutive citations", () => {
      const text = "See (Ra 50.7)(Ra 51.3) for more.";
      const result = parseCitationsInText(text);

      expect(result).toHaveLength(4);
      expect(result[0]).toEqual({ type: "text", content: "See " });
      expect(result[1]).toEqual({
        type: "citation",
        session: 50,
        question: 7,
        displayText: "(Ra 50.7)",
        url: "https://www.llresearch.org/channeling/ra-contact/50#7",
      });
      expect(result[2]).toEqual({
        type: "citation",
        session: 51,
        question: 3,
        displayText: "(Ra 51.3)",
        url: "https://www.llresearch.org/channeling/ra-contact/51#3",
      });
      expect(result[3]).toEqual({ type: "text", content: " for more." });
    });

    it("should handle multi-digit session and question numbers", () => {
      const text = "This is from session 106 (Ra 106.23).";
      const result = parseCitationsInText(text);

      const citation = result.find((s) => s.type === "citation");
      expect(citation).toEqual({
        type: "citation",
        session: 106,
        question: 23,
        displayText: "(Ra 106.23)",
        url: "https://www.llresearch.org/channeling/ra-contact/106#23",
      });
    });

    it("should handle empty text", () => {
      const result = parseCitationsInText("");
      expect(result).toEqual([]);
    });

    it("should handle text with only a citation", () => {
      const text = "(Ra 50.7)";
      const result = parseCitationsInText(text);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        type: "citation",
        session: 50,
        question: 7,
        displayText: "(Ra 50.7)",
        url: "https://www.llresearch.org/channeling/ra-contact/50#7",
      });
    });

    it("should handle real response text with citations", () => {
      const text =
        "Ra describes the veil as essential for meaningful choice in third density (Ra 83.17). Without it, there would be no catalyst for growth (Ra 83.18).";
      const result = parseCitationsInText(text);

      const citations = result.filter((s) => s.type === "citation");
      expect(citations).toHaveLength(2);

      expect(citations[0].type === "citation" && citations[0].session).toBe(83);
      expect(citations[0].type === "citation" && citations[0].question).toBe(17);
      expect(citations[1].type === "citation" && citations[1].session).toBe(83);
      expect(citations[1].type === "citation" && citations[1].question).toBe(18);
    });

    it("should not match malformed citations", () => {
      const text = "This has (Ra 50) and Ra 50.7 but not valid citations.";
      const result = parseCitationsInText(text);

      // Should be a single text segment with no citations
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe("text");
    });

    it("should preserve surrounding punctuation", () => {
      const text = "As Ra states (Ra 50.7), this is important.";
      const result = parseCitationsInText(text);

      expect(result).toHaveLength(3);
      expect(result[2]).toEqual({
        type: "text",
        content: ", this is important.",
      });
    });
  });
});
