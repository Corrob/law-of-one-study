import {
  MODEL_CONFIG,
  MODEL_PRICING,
  RATE_LIMIT_CONFIG,
  VALIDATION_LIMITS,
  CONVERSATION_CONFIG,
  SEARCH_CONFIG,
  SUGGESTION_CONFIG,
  QUOTE_CONFIG,
  calculateCost,
} from "../config";

describe("config", () => {
  describe("MODEL_CONFIG", () => {
    it("should have a valid chat model", () => {
      expect(MODEL_CONFIG.chatModel).toBe("gpt-5-mini");
    });

    it("should have a valid reasoning effort", () => {
      expect(MODEL_CONFIG.reasoningEffort).toBe("low");
    });
  });

  describe("MODEL_PRICING", () => {
    it("should have positive pricing values", () => {
      expect(MODEL_PRICING.inputCostPer1M).toBeGreaterThan(0);
      expect(MODEL_PRICING.outputCostPer1M).toBeGreaterThan(0);
    });

    it("should have output cost higher than input cost", () => {
      expect(MODEL_PRICING.outputCostPer1M).toBeGreaterThan(
        MODEL_PRICING.inputCostPer1M
      );
    });
  });

  describe("RATE_LIMIT_CONFIG", () => {
    it("should have reasonable rate limit values", () => {
      expect(RATE_LIMIT_CONFIG.maxRequests).toBeGreaterThan(0);
      expect(RATE_LIMIT_CONFIG.windowMs).toBeGreaterThan(0);
    });

    it("should have a 1-minute window", () => {
      expect(RATE_LIMIT_CONFIG.windowMs).toBe(60 * 1000);
    });
  });

  describe("VALIDATION_LIMITS", () => {
    it("should have positive validation limits", () => {
      expect(VALIDATION_LIMITS.maxMessageLength).toBeGreaterThan(0);
      expect(VALIDATION_LIMITS.maxHistoryLength).toBeGreaterThan(0);
      expect(VALIDATION_LIMITS.maxHistoryMessageLength).toBeGreaterThan(0);
    });

    it("should allow reasonable message lengths", () => {
      expect(VALIDATION_LIMITS.maxMessageLength).toBe(5000);
      expect(VALIDATION_LIMITS.maxHistoryLength).toBe(20);
    });
  });

  describe("CONVERSATION_CONFIG", () => {
    it("should have valid conversation settings", () => {
      expect(CONVERSATION_CONFIG.recentHistoryCount).toBeGreaterThan(0);
      expect(CONVERSATION_CONFIG.maxConversationHistory).toBeGreaterThan(0);
    });

    it("should have max history greater than recent history count", () => {
      expect(CONVERSATION_CONFIG.maxConversationHistory).toBeGreaterThan(
        CONVERSATION_CONFIG.recentHistoryCount
      );
    });
  });

  describe("SEARCH_CONFIG", () => {
    it("should have valid search settings", () => {
      expect(SEARCH_CONFIG.defaultTopK).toBeGreaterThan(0);
      expect(SEARCH_CONFIG.sessionRefTopK).toBeGreaterThan(0);
      expect(SEARCH_CONFIG.conceptMinScore).toBeGreaterThan(0);
      expect(SEARCH_CONFIG.conceptMinScore).toBeLessThan(1);
      expect(SEARCH_CONFIG.conceptTopK).toBeGreaterThan(0);
    });
  });

  describe("SUGGESTION_CONFIG", () => {
    it("should have valid suggestion settings", () => {
      expect(SUGGESTION_CONFIG.count).toBeGreaterThan(0);
      expect(SUGGESTION_CONFIG.maxLength).toBeGreaterThan(0);
    });
  });

  describe("QUOTE_CONFIG", () => {
    it("should have valid quote settings", () => {
      expect(QUOTE_CONFIG.longQuoteThreshold).toBeGreaterThan(0);
      expect(QUOTE_CONFIG.idealSentenceRange.min).toBeGreaterThan(0);
      expect(QUOTE_CONFIG.idealSentenceRange.max).toBeGreaterThan(
        QUOTE_CONFIG.idealSentenceRange.min
      );
    });
  });

  describe("calculateCost", () => {
    it("should return 0 for 0 tokens", () => {
      expect(calculateCost(0, 0)).toBe(0);
    });

    it("should calculate cost correctly for input tokens only", () => {
      // 1M input tokens at $0.25 per 1M
      const cost = calculateCost(1_000_000, 0);
      expect(cost).toBe(0.25);
    });

    it("should calculate cost correctly for output tokens only", () => {
      // 1M output tokens at $2.0 per 1M
      const cost = calculateCost(0, 1_000_000);
      expect(cost).toBe(2.0);
    });

    it("should calculate combined cost correctly", () => {
      // 500K input ($0.125) + 100K output ($0.20) = $0.325
      const cost = calculateCost(500_000, 100_000);
      expect(cost).toBeCloseTo(0.325, 6);
    });

    it("should handle small token counts", () => {
      // 1000 input + 500 output
      const cost = calculateCost(1000, 500);
      const expected = (1000 / 1_000_000) * 0.25 + (500 / 1_000_000) * 2.0;
      expect(cost).toBeCloseTo(expected, 10);
    });

    it("should handle typical usage", () => {
      // Typical: ~2000 prompt tokens, ~500 completion tokens
      const cost = calculateCost(2000, 500);
      expect(cost).toBeGreaterThan(0);
      expect(cost).toBeLessThan(0.01); // Should be fractions of a cent
    });
  });
});
