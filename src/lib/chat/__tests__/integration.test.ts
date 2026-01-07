/**
 * Integration tests for chat pipeline modules.
 *
 * Tests the interaction between modules without mocking,
 * ensuring error propagation and data flow work correctly.
 */

import { buildConversationContext } from "../context";
import { createChatError, isChatError, toChatError } from "../errors";
import { toErrorEventData, isErrorEventData } from "../error-response";
import { encodeSSEEvent, createSSESender, SSE_HEADERS } from "../sse-encoder";
import { validateChatRequest } from "../validation";
import { getFallbackSuggestions } from "../suggestions";
import { ChatMessage, QueryIntent } from "@/lib/types";

describe("chat/integration", () => {
  describe("error propagation through modules", () => {
    it("should convert ChatError to ErrorEventData correctly", () => {
      const chatError = createChatError("EMBEDDING_FAILED", new Error("API timeout"));

      expect(isChatError(chatError)).toBe(true);

      const eventData = toErrorEventData(chatError);

      expect(isErrorEventData(eventData)).toBe(true);
      expect(eventData.code).toBe("EMBEDDING_FAILED");
      expect(eventData.retryable).toBe(true);
      expect(eventData.message).toContain("couldn't process");
    });

    it("should convert unknown error to ErrorEventData", () => {
      const unknownError = { weird: "object" };

      const eventData = toErrorEventData(unknownError);

      expect(eventData.code).toBe("UNKNOWN_ERROR");
      expect(eventData.retryable).toBe(true);
    });

    it("should convert string error to ErrorEventData", () => {
      const stringError = "Something went wrong";

      const eventData = toErrorEventData(stringError);

      expect(eventData.code).toBe("UNKNOWN_ERROR");
    });
  });

  describe("SSE encoding flow", () => {
    it("should encode events correctly", () => {
      const encoded = encodeSSEEvent("chunk", { type: "text", content: "Hello" });
      const decoded = new TextDecoder().decode(encoded);

      expect(decoded).toContain("event: chunk");
      expect(decoded).toContain("data: ");
      expect(decoded).toContain('"type":"text"');
      expect(decoded).toContain('"content":"Hello"');
      expect(decoded).toMatch(/\n\n$/);
    });

    it("should create SSE sender that encodes correctly", () => {
      const chunks: Uint8Array[] = [];
      const mockController = {
        enqueue: (chunk: Uint8Array) => chunks.push(chunk),
      } as unknown as ReadableStreamDefaultController<Uint8Array>;

      const send = createSSESender(mockController);
      send("done", {});

      expect(chunks).toHaveLength(1);
      const decoded = new TextDecoder().decode(chunks[0]);
      expect(decoded).toContain("event: done");
    });

    it("should have correct SSE headers", () => {
      expect(SSE_HEADERS["Content-Type"]).toBe("text/event-stream");
      expect(SSE_HEADERS["Cache-Control"]).toBe("no-cache");
      expect(SSE_HEADERS["Connection"]).toBe("keep-alive");
    });
  });

  describe("validation to context flow", () => {
    it("should accept validated messages for context building", () => {
      const history: ChatMessage[] = [
        { role: "user", content: "What is love?" },
        { role: "assistant", content: "Love is the core...", quotesUsed: ["50.7"] },
        { role: "user", content: "Tell me more" },
        { role: "assistant", content: "More details...", quotesUsed: ["51.1", "52.3"] },
      ];

      // Validate first
      const validationResult = validateChatRequest("New question", history);
      expect(validationResult.valid).toBe(true);

      // Then build context
      const context = buildConversationContext(history);

      expect(context.turnCount).toBe(3); // 2 user messages + 1 new
      expect(context.quotesUsed).toContain("50.7");
      expect(context.quotesUsed).toContain("51.1");
      expect(context.quotesUsed).toContain("52.3");
    });

    it("should handle empty history", () => {
      const validationResult = validateChatRequest("First message", []);
      expect(validationResult.valid).toBe(true);

      const context = buildConversationContext([]);
      expect(context.turnCount).toBe(1);
      expect(context.quotesUsed).toEqual([]);
    });
  });

  describe("fallback suggestions for all intents", () => {
    const intents: QueryIntent[] = [
      "quote-search",
      "conceptual",
      "practical",
      "personal",
      "comparative",
      "meta",
      "off-topic",
    ];

    it.each(intents)("should provide fallbacks for %s intent", (intent) => {
      const fallbacks = getFallbackSuggestions(intent, []);

      expect(fallbacks).toHaveLength(3);
      expect(fallbacks.every((s) => typeof s === "string")).toBe(true);
      expect(fallbacks.every((s) => s.length > 0)).toBe(true);
    });

    it("should filter existing suggestions from fallbacks", () => {
      const existing = ["How does this connect to other concepts?"];
      const fallbacks = getFallbackSuggestions("conceptual", existing);

      expect(fallbacks).not.toContain(existing[0]);
      // Should have at least some fallbacks (may be fewer than 3 if filtered)
      expect(fallbacks.length).toBeGreaterThan(0);
    });
  });

  describe("error code coverage", () => {
    const errorCodes = [
      "AUGMENTATION_FAILED",
      "EMBEDDING_FAILED",
      "SEARCH_FAILED",
      "STREAM_FAILED",
      "QUOTE_PROCESSING_FAILED",
      "SUGGESTIONS_FAILED",
      "RATE_LIMITED",
      "VALIDATION_ERROR",
      "UNKNOWN_ERROR",
    ] as const;

    it.each(errorCodes)("should create valid error for %s code", (code) => {
      const error = createChatError(code);

      expect(isChatError(error)).toBe(true);
      expect(error.code).toBe(code);
      expect(typeof error.userMessage).toBe("string");
      expect(typeof error.retryable).toBe("boolean");
    });

    it("should preserve cause in error chain", () => {
      const cause = new Error("Original error");
      const error = createChatError("STREAM_FAILED", cause);

      expect(error.cause).toBe(cause);
      expect(error.message).toContain("Original error");
    });
  });

  describe("validation edge cases", () => {
    it("should reject message at exact max length + 1", () => {
      const maxMessage = "a".repeat(5001);
      const result = validateChatRequest(maxMessage, []);

      expect(result.valid).toBe(false);
      expect(result.error).toContain("too long");
    });

    it("should accept message at exact max length", () => {
      const maxMessage = "a".repeat(5000);
      const result = validateChatRequest(maxMessage, []);

      expect(result.valid).toBe(true);
    });

    it("should reject history exceeding max length", () => {
      const longHistory = Array.from({ length: 21 }, (_, i) => ({
        role: (i % 2 === 0 ? "user" : "assistant") as "user" | "assistant",
        content: "Message " + i,
      }));

      const result = validateChatRequest("New message", longHistory);

      expect(result.valid).toBe(false);
      expect(result.error).toContain("History too long");
    });

    it("should handle unicode messages correctly", () => {
      const unicodeMessage = "What does Ra say about \u{1F49C} and \u{2728}?";
      const result = validateChatRequest(unicodeMessage, []);

      expect(result.valid).toBe(true);
    });
  });
});
