import {
  buildContextFromQuotes,
  QUERY_AUGMENTATION_PROMPT,
  UNIFIED_RESPONSE_PROMPT,
  SUGGESTION_GENERATION_PROMPT,
} from "../prompts";

describe("prompts", () => {
  describe("QUERY_AUGMENTATION_PROMPT", () => {
    it("should be exported and non-empty", () => {
      expect(QUERY_AUGMENTATION_PROMPT).toBeDefined();
      expect(QUERY_AUGMENTATION_PROMPT.length).toBeGreaterThan(100);
    });

    it("should contain all intent types", () => {
      expect(QUERY_AUGMENTATION_PROMPT).toContain("quote-search");
      expect(QUERY_AUGMENTATION_PROMPT).toContain("conceptual");
      expect(QUERY_AUGMENTATION_PROMPT).toContain("practical");
      expect(QUERY_AUGMENTATION_PROMPT).toContain("personal");
      expect(QUERY_AUGMENTATION_PROMPT).toContain("comparative");
      expect(QUERY_AUGMENTATION_PROMPT).toContain("meta");
    });

    it("should contain confidence levels", () => {
      expect(QUERY_AUGMENTATION_PROMPT).toContain('"high"');
      expect(QUERY_AUGMENTATION_PROMPT).toContain('"medium"');
      expect(QUERY_AUGMENTATION_PROMPT).toContain('"low"');
    });

    it("should prioritize personal intent for emotional content", () => {
      expect(QUERY_AUGMENTATION_PROMPT).toContain("personal");
      expect(QUERY_AUGMENTATION_PROMPT).toContain("HIGHEST PRIORITY");
    });

    it("should contain Ra Material terminology", () => {
      expect(QUERY_AUGMENTATION_PROMPT).toContain("catalyst");
      expect(QUERY_AUGMENTATION_PROMPT).toContain("distortion");
      expect(QUERY_AUGMENTATION_PROMPT).toContain("harvest");
      expect(QUERY_AUGMENTATION_PROMPT).toContain("density");
    });

    it("should contain JSON output instructions", () => {
      expect(QUERY_AUGMENTATION_PROMPT).toContain("JSON");
      expect(QUERY_AUGMENTATION_PROMPT).toContain("augmented_query");
    });

    it("should contain examples for both intents", () => {
      expect(QUERY_AUGMENTATION_PROMPT).toContain('"intent": "conceptual"');
      expect(QUERY_AUGMENTATION_PROMPT).toContain('"intent": "quote-search"');
    });
  });

  describe("UNIFIED_RESPONSE_PROMPT", () => {
    it("should be exported and non-empty", () => {
      expect(UNIFIED_RESPONSE_PROMPT).toBeDefined();
      expect(UNIFIED_RESPONSE_PROMPT.length).toBeGreaterThan(100);
    });

    it("should contain instructions for both intents", () => {
      expect(UNIFIED_RESPONSE_PROMPT).toContain("quote-search");
      expect(UNIFIED_RESPONSE_PROMPT).toContain("conceptual");
    });

    it("should contain quote format rules", () => {
      expect(UNIFIED_RESPONSE_PROMPT).toContain("{{QUOTE:");
    });

    it("should contain role preamble", () => {
      expect(UNIFIED_RESPONSE_PROMPT).toContain("Ra Material");
      expect(UNIFIED_RESPONSE_PROMPT).toContain("Law of One");
    });

    it("should contain emotional awareness guidance", () => {
      expect(UNIFIED_RESPONSE_PROMPT).toContain("EMOTIONAL");
    });

    it("should contain guidance for all intent types", () => {
      expect(UNIFIED_RESPONSE_PROMPT).toContain('FOR "quote-search" INTENT');
      expect(UNIFIED_RESPONSE_PROMPT).toContain('FOR "conceptual" INTENT');
      expect(UNIFIED_RESPONSE_PROMPT).toContain('FOR "practical" INTENT');
      expect(UNIFIED_RESPONSE_PROMPT).toContain('FOR "personal" INTENT');
      expect(UNIFIED_RESPONSE_PROMPT).toContain('FOR "comparative" INTENT');
      expect(UNIFIED_RESPONSE_PROMPT).toContain('FOR "meta" INTENT');
    });

    it("should contain blended intent handling", () => {
      expect(UNIFIED_RESPONSE_PROMPT).toContain("BLENDED INTENTS");
    });

    it("should contain intent mismatch guidance", () => {
      expect(UNIFIED_RESPONSE_PROMPT).toContain("INTENT MISMATCH");
      expect(UNIFIED_RESPONSE_PROMPT).toContain("[Confidence: low]");
    });
  });

  describe("SUGGESTION_GENERATION_PROMPT", () => {
    it("should be exported and non-empty", () => {
      expect(SUGGESTION_GENERATION_PROMPT).toBeDefined();
      expect(SUGGESTION_GENERATION_PROMPT.length).toBeGreaterThan(100);
    });

    it("should request exactly 3 suggestions", () => {
      expect(SUGGESTION_GENERATION_PROMPT).toContain("EXACTLY 3");
    });

    it("should contain rules for suggestion generation", () => {
      expect(SUGGESTION_GENERATION_PROMPT).toContain("RULE 1");
      expect(SUGGESTION_GENERATION_PROMPT).toContain("RULE 2");
      expect(SUGGESTION_GENERATION_PROMPT).toContain("RULE 3");
    });

    it("should specify output format", () => {
      expect(SUGGESTION_GENERATION_PROMPT).toContain("suggestions");
      expect(SUGGESTION_GENERATION_PROMPT).toContain('{ "suggestions":');
    });

    it("should contain bad patterns to avoid", () => {
      expect(SUGGESTION_GENERATION_PROMPT).toContain("BAD PATTERNS");
      expect(SUGGESTION_GENERATION_PROMPT).toContain("Tell me more");
    });

    it("should handle personal intent with care", () => {
      expect(SUGGESTION_GENERATION_PROMPT).toContain("personal");
      expect(SUGGESTION_GENERATION_PROMPT).toContain("gentle");
    });

    it("should consider conversation depth", () => {
      expect(SUGGESTION_GENERATION_PROMPT).toContain("CONVERSATION DEPTH");
      expect(SUGGESTION_GENERATION_PROMPT).toContain("Turn");
    });
  });

  describe("buildContextFromQuotes", () => {
    it("should format single quote correctly", () => {
      const quotes = [
        {
          text: "Ra: I am Ra. Love is unity.",
          reference: "Ra 50.12",
          url: "https://www.llresearch.org/channeling/ra-contact/50#12",
        },
      ];

      const result = buildContextFromQuotes(quotes);

      expect(result).toContain("[1]");
      expect(result).toContain('"Ra: I am Ra. Love is unity."');
      expect(result).toContain("— Ra 50.12");
      expect(result).toContain("sentences");
    });

    it("should format multiple quotes correctly", () => {
      const quotes = [
        {
          text: "First quote.",
          reference: "Ra 1.1",
          url: "https://example.com/1",
        },
        {
          text: "Second quote.",
          reference: "Ra 2.2",
          url: "https://example.com/2",
        },
      ];

      const result = buildContextFromQuotes(quotes);

      expect(result).toContain("[1]");
      expect(result).toContain("[2]");
      expect(result).toContain("First quote");
      expect(result).toContain("Second quote");
      expect(result).toContain("Ra 1.1");
      expect(result).toContain("Ra 2.2");
    });

    it("should count sentences correctly", () => {
      const quotes = [
        {
          text: "Sentence one. Sentence two. Sentence three.",
          reference: "Ra 10.1",
          url: "https://example.com",
        },
      ];

      const result = buildContextFromQuotes(quotes);

      expect(result).toContain("(3 sentences)");
    });

    it("should handle quotes with question marks", () => {
      const quotes = [
        {
          text: "What is love? Love is unity. Is this true?",
          reference: "Ra 5.5",
          url: "https://example.com",
        },
      ];

      const result = buildContextFromQuotes(quotes);

      expect(result).toContain("(3 sentences)");
    });

    it("should handle quotes with exclamation marks", () => {
      const quotes = [
        {
          text: "This is amazing! I agree! Wonderful!",
          reference: "Ra 7.7",
          url: "https://example.com",
        },
      ];

      const result = buildContextFromQuotes(quotes);

      expect(result).toContain("(3 sentences)");
    });

    it("should handle mixed punctuation", () => {
      const quotes = [
        {
          text: "Is this correct? Yes, it is! Great.",
          reference: "Ra 3.3",
          url: "https://example.com",
        },
      ];

      const result = buildContextFromQuotes(quotes);

      expect(result).toContain("(3 sentences)");
    });

    it("should handle empty quotes array", () => {
      const quotes: Array<{ text: string; reference: string; url: string }> = [];

      const result = buildContextFromQuotes(quotes);

      expect(result).toBe("");
    });

    it("should handle single sentence quote", () => {
      const quotes = [
        {
          text: "Love is unity.",
          reference: "Ra 1.1",
          url: "https://example.com",
        },
      ];

      const result = buildContextFromQuotes(quotes);

      expect(result).toContain("(1 sentences)");
    });

    it("should handle very long quote", () => {
      const longText = "Sentence. ".repeat(50);
      const quotes = [
        {
          text: longText,
          reference: "Ra 100.1",
          url: "https://example.com",
        },
      ];

      const result = buildContextFromQuotes(quotes);

      expect(result).toContain("(50 sentences)");
    });

    it("should separate multiple quotes with double newlines", () => {
      const quotes = [
        {
          text: "First.",
          reference: "Ra 1.1",
          url: "https://example.com",
        },
        {
          text: "Second.",
          reference: "Ra 2.2",
          url: "https://example.com",
        },
      ];

      const result = buildContextFromQuotes(quotes);

      expect(result).toContain("\n\n");
    });

    it("should preserve quote text exactly", () => {
      const quotes = [
        {
          text: "Ra: I am Ra. This is a test quote with special characters: !, ?, ...",
          reference: "Ra 42.0",
          url: "https://example.com",
        },
      ];

      const result = buildContextFromQuotes(quotes);

      expect(result).toContain(
        "Ra: I am Ra. This is a test quote with special characters: !, ?, ..."
      );
    });

    it("should handle quotes with newlines", () => {
      const quotes = [
        {
          text: "Line one.\nLine two.\nLine three.",
          reference: "Ra 20.1",
          url: "https://example.com",
        },
      ];

      const result = buildContextFromQuotes(quotes);

      expect(result).toContain("Line one.\nLine two.\nLine three.");
    });

    it("should handle quotes with Questioner and Ra labels", () => {
      const quotes = [
        {
          text: "Questioner: What is love? Ra: I am Ra. Love is unity.",
          reference: "Ra 50.12",
          url: "https://example.com",
        },
      ];

      const result = buildContextFromQuotes(quotes);

      expect(result).toContain("Questioner: What is love?");
      expect(result).toContain("Ra: I am Ra. Love is unity.");
      expect(result).toContain("(3 sentences)");
    });

    it("should handle quotes with only whitespace after punctuation", () => {
      const quotes = [
        {
          text: "Sentence one.   Sentence two.    Sentence three.",
          reference: "Ra 15.5",
          url: "https://example.com",
        },
      ];

      const result = buildContextFromQuotes(quotes);

      expect(result).toContain("(3 sentences)");
    });

    it("should filter out empty sentences from count", () => {
      const quotes = [
        {
          text: "Real sentence.   ",
          reference: "Ra 1.1",
          url: "https://example.com",
        },
      ];

      const result = buildContextFromQuotes(quotes);

      expect(result).toContain("(1 sentences)");
    });

    it("should number quotes starting from 1", () => {
      const quotes = [
        { text: "First.", reference: "Ra 1.1", url: "https://example.com" },
        { text: "Second.", reference: "Ra 2.2", url: "https://example.com" },
        { text: "Third.", reference: "Ra 3.3", url: "https://example.com" },
      ];

      const result = buildContextFromQuotes(quotes);

      expect(result).toContain("[1]");
      expect(result).toContain("[2]");
      expect(result).toContain("[3]");
      expect(result).not.toContain("[0]");
    });
  });
});
