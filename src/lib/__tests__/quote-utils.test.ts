import {
  splitIntoSentences,
  parseIntoParagraphs,
  filterParagraphsByRange,
  reconstructTextFromParagraphs,
  formatWholeQuote,
  applySentenceRangeToQuote,
  parseSessionQuestionReference,
  fetchFullQuote,
  formatQuoteForCopy,
  type Paragraph,
} from "../quote-utils";

describe("quote-utils", () => {
  describe("splitIntoSentences", () => {
    it("should split simple sentences correctly", () => {
      const text = "This is sentence one. This is sentence two. This is sentence three.";
      const result = splitIntoSentences(text);
      expect(result).toEqual([
        "This is sentence one.",
        "This is sentence two.",
        "This is sentence three.",
      ]);
    });

    it("should handle sentences ending with question marks", () => {
      const text = "What is love? Love is unity. Is this true?";
      const result = splitIntoSentences(text);
      expect(result).toEqual(["What is love?", "Love is unity.", "Is this true?"]);
    });

    it("should handle sentences ending with exclamation marks", () => {
      const text = "This is amazing! I agree. Wonderful!";
      const result = splitIntoSentences(text);
      expect(result).toEqual(["This is amazing!", "I agree.", "Wonderful!"]);
    });

    it("should normalize periods without spaces (Ra Material formatting)", () => {
      const text = "Sentence one.Sentence two.Sentence three.";
      const result = splitIntoSentences(text);
      expect(result).toEqual(["Sentence one.", "Sentence two.", "Sentence three."]);
    });

    it("should handle empty text", () => {
      const result = splitIntoSentences("");
      expect(result).toEqual([]);
    });

    it("should handle text with only whitespace", () => {
      const result = splitIntoSentences("   \n  \t  ");
      expect(result).toEqual([]);
    });

    it("should handle text with newlines", () => {
      const text = "First sentence.\nSecond sentence.\nThird sentence.";
      const result = splitIntoSentences(text);
      expect(result).toEqual(["First sentence.", "Second sentence.", "Third sentence."]);
    });

    it("should handle mixed punctuation", () => {
      const text = "Is this correct? Yes, it is! Great. Perfect.";
      const result = splitIntoSentences(text);
      expect(result).toEqual(["Is this correct?", "Yes, it is!", "Great.", "Perfect."]);
    });
  });

  describe("parseIntoParagraphs", () => {
    it("should parse simple text without speaker labels", () => {
      const text = "This is a simple sentence. Another sentence here.";
      const result = parseIntoParagraphs(text);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        type: "text",
        content: "This is a simple sentence. Another sentence here.",
        sentenceStart: 1,
        sentenceEnd: 2,
      });
    });

    it("should parse text with Questioner label", () => {
      const text = "Questioner: What is the nature of love?";
      const result = parseIntoParagraphs(text);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        type: "questioner",
        content: "What is the nature of love?",
        sentenceStart: 1,
        sentenceEnd: 1,
      });
    });

    it("should parse text with Ra label", () => {
      const text = "Ra: I am Ra. Love is the first distortion.";
      const result = parseIntoParagraphs(text);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        type: "ra",
        content: "I am Ra. Love is the first distortion.",
        sentenceStart: 1,
        sentenceEnd: 2,
      });
    });

    it("should parse text with multiple speakers", () => {
      const text = "Questioner: What is love? Ra: I am Ra. Love is unity.";
      const result = parseIntoParagraphs(text);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        type: "questioner",
        content: "What is love?",
        sentenceStart: 1,
        sentenceEnd: 1,
      });
      expect(result[1]).toEqual({
        type: "ra",
        content: "I am Ra. Love is unity.",
        sentenceStart: 2,
        sentenceEnd: 3,
      });
    });

    it("should split paragraphs on period followed by uppercase (no space)", () => {
      const text = "Ra: I am Ra.The Law of One teaches unity.All is one.";
      const result = parseIntoParagraphs(text);

      expect(result).toHaveLength(3);
      expect(result[0].content).toBe("I am Ra.");
      expect(result[1].content).toBe("The Law of One teaches unity.");
      expect(result[2].content).toBe("All is one.");
    });

    it("should correctly assign sentence indices across paragraphs", () => {
      const text = "First sentence. Second sentence.Third paragraph starts here.";
      const result = parseIntoParagraphs(text);

      expect(result[0]).toEqual({
        type: "text",
        content: "First sentence. Second sentence.",
        sentenceStart: 1,
        sentenceEnd: 2,
      });
      expect(result[1]).toEqual({
        type: "text",
        content: "Third paragraph starts here.",
        sentenceStart: 3,
        sentenceEnd: 3,
      });
    });

    it("should handle empty text", () => {
      const result = parseIntoParagraphs("");
      expect(result).toEqual([]);
    });
  });

  describe("filterParagraphsByRange", () => {
    const paragraphs: Paragraph[] = [
      { type: "text", content: "Para 1", sentenceStart: 1, sentenceEnd: 2 },
      { type: "text", content: "Para 2", sentenceStart: 3, sentenceEnd: 5 },
      { type: "text", content: "Para 3", sentenceStart: 6, sentenceEnd: 8 },
      { type: "text", content: "Para 4", sentenceStart: 9, sentenceEnd: 10 },
    ];

    it("should filter paragraphs within range", () => {
      const result = filterParagraphsByRange(paragraphs, 3, 8);
      expect(result).toHaveLength(2);
      expect(result[0].content).toBe("Para 2");
      expect(result[1].content).toBe("Para 3");
    });

    it("should include paragraph that starts before range but ends within", () => {
      const result = filterParagraphsByRange(paragraphs, 2, 4);
      // Should include Para 1 (sentences 1-2, overlaps at sentence 2)
      // and Para 2 (sentences 3-5, overlaps at sentences 3-4)
      expect(result).toHaveLength(2);
      expect(result[0].content).toBe("Para 1");
      expect(result[1].content).toBe("Para 2");
    });

    it("should include paragraph that starts within range but ends after", () => {
      const result = filterParagraphsByRange(paragraphs, 5, 7);
      // Should include Para 2 (sentences 3-5, overlaps at sentence 5)
      // and Para 3 (sentences 6-8, overlaps at sentences 6-7)
      expect(result).toHaveLength(2);
      expect(result[0].content).toBe("Para 2");
      expect(result[1].content).toBe("Para 3");
    });

    it("should include all paragraphs if range encompasses all", () => {
      const result = filterParagraphsByRange(paragraphs, 1, 10);
      expect(result).toHaveLength(4);
    });

    it("should return empty array if range is outside all paragraphs", () => {
      const result = filterParagraphsByRange(paragraphs, 20, 30);
      expect(result).toHaveLength(0);
    });

    it("should handle single sentence range", () => {
      const result = filterParagraphsByRange(paragraphs, 4, 4);
      expect(result).toHaveLength(1);
      expect(result[0].content).toBe("Para 2");
    });
  });

  describe("reconstructTextFromParagraphs", () => {
    it("should reconstruct simple text paragraphs", () => {
      const paragraphs: Paragraph[] = [
        { type: "text", content: "First para.", sentenceStart: 1, sentenceEnd: 1 },
        { type: "text", content: "Second para.", sentenceStart: 2, sentenceEnd: 2 },
      ];

      const result = reconstructTextFromParagraphs(paragraphs, false, false);
      // Parts are joined with spaces
      expect(result).toBe("First para. \n\n Second para.");
    });

    it("should add speaker labels when type changes", () => {
      const paragraphs: Paragraph[] = [
        { type: "questioner", content: "What is love?", sentenceStart: 1, sentenceEnd: 1 },
        { type: "ra", content: "I am Ra. Love is unity.", sentenceStart: 2, sentenceEnd: 3 },
      ];

      const result = reconstructTextFromParagraphs(paragraphs, false, false);
      expect(result).toBe("Questioner: What is love? Ra: I am Ra. Love is unity.");
    });

    it("should add paragraph breaks for same speaker", () => {
      const paragraphs: Paragraph[] = [
        { type: "ra", content: "First paragraph.", sentenceStart: 1, sentenceEnd: 1 },
        { type: "ra", content: "Second paragraph.", sentenceStart: 2, sentenceEnd: 2 },
      ];

      const result = reconstructTextFromParagraphs(paragraphs, false, false);
      expect(result).toBe("Ra: First paragraph. \n\n Second paragraph.");
    });

    it("should add leading ellipsis when hasTextBefore is true", () => {
      const paragraphs: Paragraph[] = [
        { type: "text", content: "Middle text.", sentenceStart: 5, sentenceEnd: 5 },
      ];

      const result = reconstructTextFromParagraphs(paragraphs, true, false);
      expect(result).toBe("...\n\nMiddle text.");
    });

    it("should add trailing ellipsis when hasTextAfter is true", () => {
      const paragraphs: Paragraph[] = [
        { type: "text", content: "Middle text.", sentenceStart: 5, sentenceEnd: 5 },
      ];

      const result = reconstructTextFromParagraphs(paragraphs, false, true);
      expect(result).toBe("Middle text.\n\n...");
    });

    it("should add both ellipses when text exists before and after", () => {
      const paragraphs: Paragraph[] = [
        { type: "text", content: "Middle text.", sentenceStart: 5, sentenceEnd: 5 },
      ];

      const result = reconstructTextFromParagraphs(paragraphs, true, true);
      expect(result).toBe("...\n\nMiddle text.\n\n...");
    });
  });

  describe("formatWholeQuote", () => {
    it("should format entire quote without ellipsis", () => {
      const text = "Questioner: What is love? Ra: I am Ra. Love is unity.";
      const result = formatWholeQuote(text);

      expect(result).toBe("Questioner: What is love? Ra: I am Ra. Love is unity.");
      expect(result).not.toContain("...");
    });

    it("should preserve paragraph breaks", () => {
      const text = "Ra: First paragraph.Second paragraph.";
      const result = formatWholeQuote(text);

      expect(result).toBe("Ra: First paragraph. \n\n Second paragraph.");
    });

    it("should handle empty text", () => {
      const result = formatWholeQuote("");
      expect(result).toBe("");
    });
  });

  describe("applySentenceRangeToQuote", () => {
    it("should extract specific sentence range from quote", () => {
      // Use paragraph breaks (period-uppercase) to create distinct paragraphs
      const text = "Sentence one.Sentence two.Sentence three.Sentence four.";
      const result = applySentenceRangeToQuote(text, 2, 3);

      expect(result).toContain("Sentence two.");
      expect(result).toContain("Sentence three.");
      expect(result).toContain("...");
    });

    it("should add leading ellipsis when range starts after first sentence", () => {
      const text = "Sentence one.Sentence two.Sentence three.";
      const result = applySentenceRangeToQuote(text, 2, 3);

      expect(result).toMatch(/^\.\.\./);
    });

    it("should add trailing ellipsis when range ends before last sentence", () => {
      const text = "Sentence one.Sentence two.Sentence three.";
      const result = applySentenceRangeToQuote(text, 1, 2);

      expect(result).toMatch(/\.\.\.$/);
    });

    it("should not add ellipsis when range covers entire quote", () => {
      const text = "Sentence one. Sentence two.";
      const result = applySentenceRangeToQuote(text, 1, 2);

      expect(result).not.toContain("...");
    });

    it("should return original text if range does not match", () => {
      const text = "Sentence one. Sentence two.";
      const result = applySentenceRangeToQuote(text, 10, 20);

      expect(result).toBe(text);
    });

    it("should handle single sentence extraction", () => {
      const text = "First.Second.Third.";
      const result = applySentenceRangeToQuote(text, 2, 2);

      expect(result).toContain("Second.");
      expect(result).toContain("...");
    });

    it("should work with Ra Material formatting", () => {
      const text = "Questioner: What is love? Ra: I am Ra. Love is unity. All is one.";
      const result = applySentenceRangeToQuote(text, 2, 3);

      expect(result).toContain("Ra:");
      expect(result).toContain("I am Ra.");
      expect(result).toContain("Love is unity.");
    });
  });

  describe("parseSessionQuestionReference", () => {
    // Pattern 1: URL format - lawofone.info/s/SESSION#QUESTION
    it("should parse lawofone.info URL with session and question", () => {
      expect(parseSessionQuestionReference("lawofone.info/s/50#12")).toEqual({
        session: 50,
        question: 12,
      });
    });

    it("should parse lawofone.info URL with session only", () => {
      expect(parseSessionQuestionReference("lawofone.info/s/50")).toEqual({
        session: 50,
        question: undefined,
      });
    });

    it("should parse lawofone.info URL case-insensitively", () => {
      expect(parseSessionQuestionReference("LAWOFONE.INFO/S/50#12")).toEqual({
        session: 50,
        question: 12,
      });
    });

    // Pattern 2: Explicit "session X" or "session X question Y"
    it('should parse "session 5"', () => {
      expect(parseSessionQuestionReference("session 5")).toEqual({
        session: 5,
        question: undefined,
      });
    });

    it('should parse "session 5 question 1"', () => {
      expect(parseSessionQuestionReference("session 5 question 1")).toEqual({
        session: 5,
        question: 1,
      });
    });

    it("should parse session reference case-insensitively", () => {
      expect(parseSessionQuestionReference("SESSION 10 QUESTION 5")).toEqual({
        session: 10,
        question: 5,
      });
    });

    // Pattern 3: "question X.Y" format
    it('should parse "question 5.1"', () => {
      expect(parseSessionQuestionReference("question 5.1")).toEqual({
        session: 5,
        question: 1,
      });
    });

    it('should parse "question 50.12"', () => {
      expect(parseSessionQuestionReference("question 50.12")).toEqual({
        session: 50,
        question: 12,
      });
    });

    // Pattern 4: Shorthand "s5q1" or "s5"
    it('should parse "s5q1"', () => {
      expect(parseSessionQuestionReference("s5q1")).toEqual({
        session: 5,
        question: 1,
      });
    });

    it('should parse "s5"', () => {
      expect(parseSessionQuestionReference("s5")).toEqual({
        session: 5,
        question: undefined,
      });
    });

    it('should parse "s50q12"', () => {
      expect(parseSessionQuestionReference("s50q12")).toEqual({
        session: 50,
        question: 12,
      });
    });

    // Pattern 5: "Ra X.Y" or command with X.Y
    it('should parse "Ra 5.1"', () => {
      expect(parseSessionQuestionReference("Ra 5.1")).toEqual({
        session: 5,
        question: 1,
      });
    });

    it('should parse "show me 50.12"', () => {
      expect(parseSessionQuestionReference("show me 50.12")).toEqual({
        session: 50,
        question: 12,
      });
    });

    it('should parse "find 10.5"', () => {
      expect(parseSessionQuestionReference("find 10.5")).toEqual({
        session: 10,
        question: 5,
      });
    });

    it('should parse "get 1.1"', () => {
      expect(parseSessionQuestionReference("get 1.1")).toEqual({
        session: 1,
        question: 1,
      });
    });

    it('should parse "read 106.23"', () => {
      expect(parseSessionQuestionReference("read 106.23")).toEqual({
        session: 106,
        question: 23,
      });
    });

    // Pattern 6: Standalone X.Y in short queries
    it('should parse standalone "5.1" in short query', () => {
      expect(parseSessionQuestionReference("5.1")).toEqual({
        session: 5,
        question: 1,
      });
    });

    it("should parse standalone reference with surrounding text in short query", () => {
      expect(parseSessionQuestionReference("what is 50.12")).toEqual({
        session: 50,
        question: 12,
      });
    });

    it("should not match X.Y in long queries", () => {
      const longQuery =
        "I have a question about something 5.1 and other things that make this query quite long";
      expect(parseSessionQuestionReference(longQuery)).toBeNull();
    });

    // Edge cases and validation
    it("should return null for no match", () => {
      expect(parseSessionQuestionReference("what is love")).toBeNull();
    });

    it("should validate session range - reject session 0", () => {
      expect(parseSessionQuestionReference("0.1")).toBeNull();
    });

    it("should validate session range - reject session > 106", () => {
      expect(parseSessionQuestionReference("107.1")).toBeNull();
    });

    it("should validate question range - reject question > 50", () => {
      expect(parseSessionQuestionReference("ra 50.51")).toBeNull();
    });

    it("should accept session 106 (maximum valid)", () => {
      expect(parseSessionQuestionReference("ra 106.1")).toEqual({
        session: 106,
        question: 1,
      });
    });

    it("should accept question 0 (valid in Ra material)", () => {
      expect(parseSessionQuestionReference("ra 50.0")).toEqual({
        session: 50,
        question: 0,
      });
    });

    it("should handle whitespace in query", () => {
      expect(parseSessionQuestionReference("  session 5  ")).toEqual({
        session: 5,
        question: undefined,
      });
    });
  });

  describe("fetchFullQuote", () => {
    const originalFetch = global.fetch;

    beforeEach(() => {
      global.fetch = jest.fn();
    });

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it("should fetch and return quote from section JSON", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ "49.8": "I am Ra. This is the quote." }),
      });

      const result = await fetchFullQuote("49.8");
      expect(result).toBe("I am Ra. This is the quote.");
      expect(global.fetch).toHaveBeenCalledWith("/sections/en/49.json");
    });

    it('should handle "Ra 49.8" format', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ "49.8": "Quote content" }),
      });

      const result = await fetchFullQuote("Ra 49.8");
      expect(result).toBe("Quote content");
      expect(global.fetch).toHaveBeenCalledWith("/sections/en/49.json");
    });

    it("should return null on HTTP error", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: "Not Found",
      });

      const result = await fetchFullQuote("999.1");
      expect(result).toBeNull();
    });

    it("should return null if key not found in data", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ "49.1": "Different quote" }),
      });

      const result = await fetchFullQuote("49.8");
      expect(result).toBeNull();
    });

    it("should return null for invalid reference format (no decimal)", async () => {
      const result = await fetchFullQuote("invalid");
      expect(result).toBeNull();
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("should return null on network error", async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("Network error"));

      const result = await fetchFullQuote("49.8");
      expect(result).toBeNull();
    });

    it("should handle references with different session numbers", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ "1.1": "First session quote" }),
      });

      const result = await fetchFullQuote("1.1");
      expect(result).toBe("First session quote");
      expect(global.fetch).toHaveBeenCalledWith("/sections/en/1.json");
    });
  });

  describe("formatQuoteForCopy", () => {
    it("should format quote with single Ra speaker", () => {
      const input = "Ra: I am Ra. This is the message.";
      const result = formatQuoteForCopy(input);
      expect(result).toBe("Ra: I am Ra. This is the message.");
    });

    it("should format quote with single Questioner speaker", () => {
      const input = "Questioner: What is love?";
      const result = formatQuoteForCopy(input);
      expect(result).toBe("Questioner: What is love?");
    });

    it("should add paragraph breaks between different speakers", () => {
      const input = "Questioner: What is love? Ra: I am Ra. Love is unity.";
      const result = formatQuoteForCopy(input);
      expect(result).toContain("Questioner: What is love?");
      expect(result).toContain("\n\n");
      expect(result).toContain("Ra: I am Ra. Love is unity.");
    });

    it("should handle multiple speaker transitions", () => {
      const input =
        "Questioner: First question. Ra: First answer. Questioner: Second question. Ra: Second answer.";
      const result = formatQuoteForCopy(input);
      // Should have 3 paragraph breaks (between each speaker change)
      const breaks = (result.match(/\n\n/g) || []).length;
      expect(breaks).toBe(3);
    });

    it("should handle text without speaker labels", () => {
      const input = "Just some plain text without labels.";
      const result = formatQuoteForCopy(input);
      expect(result).toBe("Just some plain text without labels.");
    });

    it("should handle empty text", () => {
      const result = formatQuoteForCopy("");
      expect(result).toBe("");
    });

    it("should trim leading/trailing whitespace", () => {
      const input = "  Ra: I am Ra.  ";
      const result = formatQuoteForCopy(input);
      expect(result).toBe("Ra: I am Ra.");
    });

    it("should preserve content between speaker labels", () => {
      const input = "Ra: First part. Second part. Third part.";
      const result = formatQuoteForCopy(input);
      expect(result).toBe("Ra: First part. Second part. Third part.");
    });
  });
});
