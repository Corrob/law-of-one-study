import {
  augmentQuery,
  VALID_INTENTS,
  VALID_CONFIDENCES,
  AugmentationResult,
  AugmentationContext,
} from "../augmentation";

// Mock dependencies
jest.mock("@/lib/openai", () => ({
  openai: {
    chat: {
      completions: {
        create: jest.fn(),
      },
    },
  },
}));

jest.mock("@/lib/retry", () => ({
  withRetry: jest.fn((fn) => fn()),
}));

jest.mock("@/lib/debug", () => ({
  debug: { log: jest.fn() },
}));

import { openai } from "@/lib/openai";

const mockCreate = openai.chat.completions.create as jest.Mock;

describe("chat/augmentation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("VALID_INTENTS", () => {
    it("should contain all expected intent types", () => {
      expect(VALID_INTENTS).toContain("quote-search");
      expect(VALID_INTENTS).toContain("conceptual");
      expect(VALID_INTENTS).toContain("practical");
      expect(VALID_INTENTS).toContain("personal");
      expect(VALID_INTENTS).toContain("comparative");
      expect(VALID_INTENTS).toContain("meta");
      expect(VALID_INTENTS).toContain("off-topic");
    });

    it("should have exactly 7 intent types", () => {
      expect(VALID_INTENTS).toHaveLength(7);
    });
  });

  describe("VALID_CONFIDENCES", () => {
    it("should contain all expected confidence levels", () => {
      expect(VALID_CONFIDENCES).toContain("high");
      expect(VALID_CONFIDENCES).toContain("medium");
      expect(VALID_CONFIDENCES).toContain("low");
    });

    it("should have exactly 3 confidence levels", () => {
      expect(VALID_CONFIDENCES).toHaveLength(3);
    });
  });

  describe("augmentQuery", () => {
    describe("successful augmentation", () => {
      it("should return parsed result from LLM", async () => {
        mockCreate.mockResolvedValue({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  intent: "conceptual",
                  augmented_query: "expanded query about unity consciousness",
                  confidence: "high",
                }),
              },
            },
          ],
        });

        const result = await augmentQuery("What is unity?");

        expect(result.intent).toBe("conceptual");
        expect(result.augmentedQuery).toBe("expanded query about unity consciousness");
        expect(result.confidence).toBe("high");
      });

      it("should handle quote-search intent", async () => {
        mockCreate.mockResolvedValue({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  intent: "quote-search",
                  augmented_query: "Ra quotes about love",
                  confidence: "high",
                }),
              },
            },
          ],
        });

        const result = await augmentQuery("What does Ra say about love?");
        expect(result.intent).toBe("quote-search");
      });

      it("should handle practical intent", async () => {
        mockCreate.mockResolvedValue({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  intent: "practical",
                  augmented_query: "meditation techniques from Ra Material",
                  confidence: "medium",
                }),
              },
            },
          ],
        });

        const result = await augmentQuery("How do I meditate?");
        expect(result.intent).toBe("practical");
      });
    });

    describe("with conversation context", () => {
      it("should include recent topics in context", async () => {
        mockCreate.mockResolvedValue({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  intent: "conceptual",
                  augmented_query: "more about densities",
                  confidence: "high",
                }),
              },
            },
          ],
        });

        const context: AugmentationContext = {
          recentTopics: ["densities", "harvest"],
          previousIntent: "conceptual",
        };

        await augmentQuery("Tell me more", context);

        expect(mockCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            messages: expect.arrayContaining([
              expect.objectContaining({
                role: "user",
                content: expect.stringContaining("densities"),
              }),
            ]),
          })
        );
      });

      it("should include previous intent in context", async () => {
        mockCreate.mockResolvedValue({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  intent: "conceptual",
                  augmented_query: "follow up query",
                  confidence: "medium",
                }),
              },
            },
          ],
        });

        const context: AugmentationContext = {
          previousIntent: "quote-search",
        };

        await augmentQuery("What else?", context);

        expect(mockCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            messages: expect.arrayContaining([
              expect.objectContaining({
                role: "user",
                content: expect.stringContaining("quote-search"),
              }),
            ]),
          })
        );
      });
    });

    describe("validation and defaults", () => {
      it("should default to conceptual intent for invalid intent", async () => {
        mockCreate.mockResolvedValue({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  intent: "invalid-intent",
                  augmented_query: "query",
                  confidence: "high",
                }),
              },
            },
          ],
        });

        const result = await augmentQuery("Test message");
        expect(result.intent).toBe("conceptual");
      });

      it("should default to medium confidence for invalid confidence", async () => {
        mockCreate.mockResolvedValue({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  intent: "conceptual",
                  augmented_query: "query",
                  confidence: "super-high",
                }),
              },
            },
          ],
        });

        const result = await augmentQuery("Test message");
        expect(result.confidence).toBe("medium");
      });

      it("should use original message if augmented_query is missing", async () => {
        mockCreate.mockResolvedValue({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  intent: "conceptual",
                  confidence: "high",
                }),
              },
            },
          ],
        });

        const result = await augmentQuery("Original message");
        expect(result.augmentedQuery).toBe("Original message");
      });
    });

    describe("error handling", () => {
      it("should return fallback on JSON parse error", async () => {
        mockCreate.mockResolvedValue({
          choices: [
            {
              message: {
                content: "not valid json",
              },
            },
          ],
        });

        const result = await augmentQuery("Test message");

        expect(result.intent).toBe("conceptual");
        expect(result.augmentedQuery).toBe("Test message");
        expect(result.confidence).toBe("low");
      });

      it("should return fallback on API error", async () => {
        mockCreate.mockRejectedValue(new Error("API Error"));

        const result = await augmentQuery("Test message");

        expect(result.intent).toBe("conceptual");
        expect(result.augmentedQuery).toBe("Test message");
        expect(result.confidence).toBe("low");
      });

      it("should return fallback on empty response", async () => {
        mockCreate.mockResolvedValue({
          choices: [{ message: { content: "" } }],
        });

        const result = await augmentQuery("Test message");

        expect(result.intent).toBe("conceptual");
        expect(result.augmentedQuery).toBe("Test message");
        expect(result.confidence).toBe("low");
      });

      it("should return fallback when choices array is empty", async () => {
        mockCreate.mockResolvedValue({ choices: [] });

        const result = await augmentQuery("Test message");

        expect(result.intent).toBe("conceptual");
        expect(result.confidence).toBe("low");
      });
    });

    describe("API call parameters", () => {
      it("should call OpenAI with correct model", async () => {
        mockCreate.mockResolvedValue({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  intent: "conceptual",
                  augmented_query: "test",
                  confidence: "high",
                }),
              },
            },
          ],
        });

        await augmentQuery("Test");

        expect(mockCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            model: expect.any(String),
            messages: expect.any(Array),
          })
        );
      });
    });
  });
});
