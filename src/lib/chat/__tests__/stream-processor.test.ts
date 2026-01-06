import {
  processStreamWithMarkers,
  StreamProcessorResult,
  SSESender,
  TokenUsage,
} from "../stream-processor";
import { Quote } from "@/lib/types";
import {
  createMockStream,
  createMockStreamFromText,
  createMockStreamWithQuotes,
  createMockStreamWithSplitMarker,
  DEFAULT_USAGE,
} from "@/test-utils/mock-stream";

// Mock dependencies
jest.mock("@/lib/quote-utils", () => ({
  applySentenceRangeToQuote: jest.fn((text, start, end) => `[sentences ${start}-${end}] ${text}`),
  formatWholeQuote: jest.fn((text) => text),
}));

jest.mock("@/lib/debug", () => ({
  debug: { log: jest.fn() },
}));

describe("chat/stream-processor", () => {
  let sendMock: jest.Mock<ReturnType<SSESender>, Parameters<SSESender>>;
  let sentEvents: Array<{ event: string; data: object }>;

  const mockQuotes: Quote[] = [
    { text: "Ra: I am Ra. First quote text.", reference: "1.1", url: "https://lawofone.info/s/1#1" },
    { text: "Ra: I am Ra. Second quote text.", reference: "2.5", url: "https://lawofone.info/s/2#5" },
    { text: "Ra: I am Ra. Third quote with many sentences. Sentence two. Sentence three. Sentence four. Sentence five.", reference: "3.10", url: "https://lawofone.info/s/3#10" },
  ];

  beforeEach(() => {
    sentEvents = [];
    sendMock = jest.fn((event: string, data: object) => {
      sentEvents.push({ event, data });
    });
    jest.clearAllMocks();
  });

  describe("basic text streaming", () => {
    it("should process text-only stream", async () => {
      const stream = createMockStreamFromText(["Hello ", "world", "!"]);

      const result = await processStreamWithMarkers(stream, [], sendMock);

      expect(result.fullOutput).toBe("Hello world!");
      expect(sendMock).toHaveBeenCalledWith("chunk", {
        type: "text",
        content: "Hello world!",
      });
    });

    it("should accumulate multiple text chunks before sending", async () => {
      const stream = createMockStreamFromText(["A", "B", "C", "D", "E"]);

      await processStreamWithMarkers(stream, [], sendMock);

      // Should send accumulated text, not individual chunks
      expect(sentEvents.filter((e) => e.event === "chunk")).toHaveLength(1);
    });

    it("should handle empty stream", async () => {
      const stream = createMockStream([]);

      const result = await processStreamWithMarkers(stream, [], sendMock);

      expect(result.fullOutput).toBe("");
      expect(sendMock).not.toHaveBeenCalled();
    });

    it("should handle stream with empty content chunks", async () => {
      const stream = createMockStream([
        { content: "" },
        { content: "Hello" },
        { content: "" },
      ]);

      const result = await processStreamWithMarkers(stream, [], sendMock);

      expect(result.fullOutput).toBe("Hello");
    });
  });

  describe("quote marker processing", () => {
    it("should process simple quote marker", async () => {
      const stream = createMockStreamWithQuotes([
        "Here is a quote: ",
        { quoteIndex: 1 },
        " That was it.",
      ]);

      await processStreamWithMarkers(stream, mockQuotes, sendMock);

      expect(sentEvents).toContainEqual({
        event: "chunk",
        data: { type: "text", content: "Here is a quote: " },
      });

      expect(sentEvents).toContainEqual({
        event: "chunk",
        data: expect.objectContaining({
          type: "quote",
          reference: "1.1",
        }),
      });

      expect(sentEvents).toContainEqual({
        event: "chunk",
        data: { type: "text", content: " That was it." },
      });
    });

    it("should process multiple quote markers", async () => {
      const stream = createMockStreamWithQuotes([
        "First: ",
        { quoteIndex: 1 },
        " Second: ",
        { quoteIndex: 2 },
      ]);

      await processStreamWithMarkers(stream, mockQuotes, sendMock);

      const quoteEvents = sentEvents.filter(
        (e) => e.event === "chunk" && (e.data as { type: string }).type === "quote"
      );
      expect(quoteEvents).toHaveLength(2);
    });

    it("should process quote marker with sentence range", async () => {
      const stream = createMockStreamWithQuotes([
        "Excerpt: ",
        { quoteIndex: 3, sentenceStart: 1, sentenceEnd: 3 },
      ]);

      const { applySentenceRangeToQuote } = require("@/lib/quote-utils");

      await processStreamWithMarkers(stream, mockQuotes, sendMock);

      expect(applySentenceRangeToQuote).toHaveBeenCalledWith(
        mockQuotes[2].text,
        1,
        3
      );
    });

    it("should handle quote marker at start of stream", async () => {
      const stream = createMockStreamWithQuotes([{ quoteIndex: 1 }, " More text"]);

      await processStreamWithMarkers(stream, mockQuotes, sendMock);

      expect(sentEvents[0]).toEqual({
        event: "chunk",
        data: expect.objectContaining({ type: "quote" }),
      });
    });

    it("should handle quote marker at end of stream", async () => {
      const stream = createMockStreamWithQuotes(["Text before ", { quoteIndex: 2 }]);

      await processStreamWithMarkers(stream, mockQuotes, sendMock);

      const lastQuoteEvent = sentEvents
        .filter((e) => e.event === "chunk")
        .pop();
      expect(lastQuoteEvent?.data).toEqual(
        expect.objectContaining({ type: "quote" })
      );
    });

    it("should handle invalid quote index gracefully", async () => {
      const stream = createMockStreamWithQuotes([
        "Invalid: ",
        { quoteIndex: 99 }, // Index doesn't exist
        " More text",
      ]);

      await processStreamWithMarkers(stream, mockQuotes, sendMock);

      // Should skip the invalid quote but continue processing
      expect(sentEvents.some((e) => (e.data as { type: string }).type === "quote")).toBe(false);
    });
  });

  describe("split marker handling", () => {
    it("should handle marker split across chunks", async () => {
      const stream = createMockStreamWithSplitMarker(
        "Quote: ",
        "{{QUOTE:",
        "1}}",
        " done"
      );

      await processStreamWithMarkers(stream, mockQuotes, sendMock);

      expect(sentEvents).toContainEqual({
        event: "chunk",
        data: expect.objectContaining({ type: "quote", reference: "1.1" }),
      });
    });

    it("should buffer partial markers at end of chunk", async () => {
      const stream = createMockStreamFromText([
        "Text {{QUOTE",
        ":2}} more",
      ]);

      await processStreamWithMarkers(stream, mockQuotes, sendMock);

      expect(sentEvents).toContainEqual({
        event: "chunk",
        data: expect.objectContaining({ type: "quote", reference: "2.5" }),
      });
    });

    it("should handle marker split at various points", async () => {
      // Test split at different positions
      const splits = [
        ["{{", "QUOTE:1}}"],
        ["{{Q", "UOTE:1}}"],
        ["{{QUOTE", ":1}}"],
        ["{{QUOTE:", "1}}"],
        ["{{QUOTE:1", "}}"],
        ["{{QUOTE:1}", "}"],
      ];

      for (const [part1, part2] of splits) {
        sentEvents = [];
        sendMock.mockClear();

        const stream = createMockStreamFromText([`Before ${part1}`, `${part2} after`]);
        await processStreamWithMarkers(stream, mockQuotes, sendMock);

        expect(sentEvents.some((e) => (e.data as { type: string }).type === "quote")).toBe(
          true
        );
      }
    });
  });

  describe("token usage tracking", () => {
    it("should capture usage data from final chunk", async () => {
      const stream = createMockStreamFromText(["Hello"], DEFAULT_USAGE);

      const result = await processStreamWithMarkers(stream, [], sendMock);

      expect(result.usage).toEqual(DEFAULT_USAGE);
    });

    it("should return undefined usage if not provided", async () => {
      const stream = createMockStreamFromText(["Hello"]);

      const result = await processStreamWithMarkers(stream, [], sendMock);

      expect(result.usage).toBeUndefined();
    });

    it("should capture usage from any chunk that provides it", async () => {
      const customUsage: TokenUsage = {
        prompt_tokens: 200,
        completion_tokens: 100,
        total_tokens: 300,
      };

      const stream = createMockStream([
        { content: "Hello" },
        { content: " world", usage: customUsage },
      ]);

      const result = await processStreamWithMarkers(stream, [], sendMock);

      expect(result.usage).toEqual(customUsage);
    });
  });

  describe("fullOutput tracking", () => {
    it("should include all text in fullOutput", async () => {
      const stream = createMockStreamFromText(["Hello ", "world!"]);

      const result = await processStreamWithMarkers(stream, [], sendMock);

      expect(result.fullOutput).toBe("Hello world!");
    });

    it("should include quote markers in fullOutput", async () => {
      const stream = createMockStreamWithQuotes([
        "Quote: ",
        { quoteIndex: 1 },
        " end",
      ]);

      const result = await processStreamWithMarkers(stream, mockQuotes, sendMock);

      expect(result.fullOutput).toContain("{{QUOTE:1}}");
    });

    it("should include range markers in fullOutput", async () => {
      const stream = createMockStreamWithQuotes([
        "Range: ",
        { quoteIndex: 2, sentenceStart: 0, sentenceEnd: 5 },
      ]);

      const result = await processStreamWithMarkers(stream, mockQuotes, sendMock);

      expect(result.fullOutput).toContain("{{QUOTE:2:s0:s5}}");
    });
  });

  describe("edge cases", () => {
    it("should handle consecutive quote markers", async () => {
      const stream = createMockStreamWithQuotes([
        { quoteIndex: 1 },
        { quoteIndex: 2 },
      ]);

      await processStreamWithMarkers(stream, mockQuotes, sendMock);

      const quoteEvents = sentEvents.filter(
        (e) => (e.data as { type: string }).type === "quote"
      );
      expect(quoteEvents).toHaveLength(2);
    });

    it("should handle text with curly braces that are not markers", async () => {
      const stream = createMockStreamFromText(["JSON: {key: value} end"]);

      await processStreamWithMarkers(stream, [], sendMock);

      expect(sentEvents).toContainEqual({
        event: "chunk",
        data: { type: "text", content: "JSON: {key: value} end" },
      });
    });

    it("should not send empty text chunks", async () => {
      const stream = createMockStreamWithQuotes([{ quoteIndex: 1 }]);

      await processStreamWithMarkers(stream, mockQuotes, sendMock);

      const textEvents = sentEvents.filter(
        (e) => (e.data as { type: string }).type === "text"
      );
      for (const event of textEvents) {
        expect((event.data as { content: string }).content.trim()).not.toBe("");
      }
    });

    it("should handle whitespace-only content between markers", async () => {
      const stream = createMockStreamWithQuotes([
        { quoteIndex: 1 },
        "   ",
        { quoteIndex: 2 },
      ]);

      await processStreamWithMarkers(stream, mockQuotes, sendMock);

      // Whitespace-only content should not generate text chunk
      const textEvents = sentEvents.filter(
        (e) => (e.data as { type: string }).type === "text"
      );
      expect(textEvents).toHaveLength(0);
    });
  });
});
