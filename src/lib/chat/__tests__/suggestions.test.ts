import {
  generateSuggestions,
  extractAIQuestions,
  detectSuggestionCategory,
  getFallbackSuggestions,
  SuggestionContext,
} from "../suggestions";
import { QueryIntent } from "@/lib/types";

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

describe("chat/suggestions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("extractAIQuestions", () => {
    it("should extract questions from response", () => {
      const response = "This is interesting. Would you like to know more? Here is the answer.";
      const questions = extractAIQuestions(response);

      expect(questions).toContain("Would you like to know more?");
    });

    it("should return up to 3 questions from the end", () => {
      const response =
        "First? Second? Third? Fourth? Fifth? This is not a question.";
      const questions = extractAIQuestions(response);

      expect(questions).toHaveLength(3);
      expect(questions).toContain("Third?");
      expect(questions).toContain("Fourth?");
      expect(questions).toContain("Fifth?");
    });

    it("should return empty array for response without questions", () => {
      const response = "This is a statement. Here is another statement.";
      const questions = extractAIQuestions(response);

      expect(questions).toEqual([]);
    });

    it("should handle response with only questions", () => {
      const response = "What is love? What is light?";
      const questions = extractAIQuestions(response);

      expect(questions).toHaveLength(2);
    });
  });

  describe("detectSuggestionCategory", () => {
    it("should detect breadth category", () => {
      expect(detectSuggestionCategory("How does this connect to love?")).toBe("breadth");
      expect(detectSuggestionCategory("Compare this to Buddhism")).toBe("breadth");
      expect(detectSuggestionCategory("What's the difference?")).toBe("breadth");
    });

    it("should detect quote category", () => {
      expect(detectSuggestionCategory("What does Ra say about this?")).toBe("quote");
      expect(detectSuggestionCategory("Show me the passage")).toBe("quote");
      expect(detectSuggestionCategory("Which session discusses this?")).toBe("quote");
    });

    it("should detect exit category", () => {
      expect(detectSuggestionCategory("Let's discuss something else")).toBe("exit");
      expect(detectSuggestionCategory("I want a new topic")).toBe("exit");
      expect(detectSuggestionCategory("Show me a different topic")).toBe("exit");
    });

    it("should detect clarify category", () => {
      expect(detectSuggestionCategory("What do you mean by that?")).toBe("clarify");
      expect(detectSuggestionCategory("Can you clarify?")).toBe("clarify");
      expect(detectSuggestionCategory("What is the Law of One?")).toBe("clarify");
    });

    it("should default to depth category", () => {
      expect(detectSuggestionCategory("Tell me more")).toBe("depth");
      expect(detectSuggestionCategory("Expand on that")).toBe("depth");
      expect(detectSuggestionCategory("Go deeper")).toBe("depth");
    });
  });

  describe("getFallbackSuggestions", () => {
    it("should return fallbacks for quote-search intent", () => {
      const fallbacks = getFallbackSuggestions("quote-search", []);

      expect(fallbacks).toHaveLength(3);
      expect(fallbacks).toContain("Show me the full passage");
    });

    it("should return fallbacks for conceptual intent", () => {
      const fallbacks = getFallbackSuggestions("conceptual", []);

      expect(fallbacks).toHaveLength(3);
      expect(fallbacks).toContain("How does this connect to other concepts?");
    });

    it("should filter out existing suggestions", () => {
      const existing = ["Show me the full passage"];
      const fallbacks = getFallbackSuggestions("quote-search", existing);

      expect(fallbacks).not.toContain("Show me the full passage");
    });

    it("should return conceptual fallbacks for unknown intent", () => {
      const fallbacks = getFallbackSuggestions("unknown-intent" as QueryIntent, []);

      expect(fallbacks).toHaveLength(3);
    });

    it("should return fallbacks for all valid intents", () => {
      const intents: QueryIntent[] = [
        "quote-search",
        "conceptual",
        "practical",
        "personal",
        "comparative",
        "meta",
        "off-topic",
      ];

      for (const intent of intents) {
        const fallbacks = getFallbackSuggestions(intent, []);
        expect(fallbacks.length).toBeGreaterThan(0);
      }
    });
  });

  describe("generateSuggestions", () => {
    const defaultContext: SuggestionContext = { turnCount: 1 };

    describe("successful generation", () => {
      it("should return suggestions from LLM", async () => {
        mockCreate.mockResolvedValue({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  suggestions: [
                    "Tell me more about love",
                    "What does Ra say about light?",
                    "How does this relate to meditation?",
                  ],
                }),
              },
            },
          ],
        });

        const suggestions = await generateSuggestions(
          "What is love?",
          "Love is the core concept...",
          "conceptual",
          defaultContext
        );

        expect(suggestions).toHaveLength(3);
        expect(suggestions).toContain("Tell me more about love");
      });

      it("should filter suggestions over 60 characters", async () => {
        mockCreate.mockResolvedValue({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  suggestions: [
                    "Short one",
                    "This is a very long suggestion that definitely exceeds the sixty character limit we have set",
                    "Another short one",
                  ],
                }),
              },
            },
          ],
        });

        const suggestions = await generateSuggestions(
          "Test",
          "Response",
          "conceptual",
          defaultContext
        );

        expect(suggestions.some((s) => s.length > 60)).toBe(false);
      });

      it("should pad with fallbacks if fewer than 3 suggestions", async () => {
        mockCreate.mockResolvedValue({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  suggestions: ["Only one suggestion"],
                }),
              },
            },
          ],
        });

        const suggestions = await generateSuggestions(
          "Test",
          "Response",
          "conceptual",
          defaultContext
        );

        expect(suggestions).toHaveLength(3);
      });

      it("should limit to 3 suggestions", async () => {
        mockCreate.mockResolvedValue({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  suggestions: ["One", "Two", "Three", "Four", "Five"],
                }),
              },
            },
          ],
        });

        const suggestions = await generateSuggestions(
          "Test",
          "Response",
          "conceptual",
          defaultContext
        );

        expect(suggestions).toHaveLength(3);
      });
    });

    describe("personal intent handling", () => {
      it("should filter practice-related suggestions for personal intent", async () => {
        mockCreate.mockResolvedValue({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  suggestions: [
                    "Try this meditation exercise",
                    "What does Ra say about this?",
                    "Start a daily practice routine",
                  ],
                }),
              },
            },
          ],
        });

        const suggestions = await generateSuggestions(
          "I feel lost",
          "I understand...",
          "personal",
          defaultContext
        );

        expect(suggestions).not.toContain("Try this meditation exercise");
        expect(suggestions).not.toContain("Start a daily practice routine");
      });
    });

    describe("context handling", () => {
      it("should handle deep conversations (turnCount >= 5)", async () => {
        mockCreate.mockResolvedValue({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  suggestions: ["One", "Two", "Three"],
                }),
              },
            },
          ],
        });

        await generateSuggestions("Test", "Response", "conceptual", {
          turnCount: 5,
        });

        expect(mockCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            messages: expect.arrayContaining([
              expect.objectContaining({
                role: "user",
                content: expect.stringContaining("deep conversation"),
              }),
            ]),
          })
        );
      });

      it("should truncate long responses in context", async () => {
        const longResponse = "a".repeat(1500);
        mockCreate.mockResolvedValue({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  suggestions: ["One", "Two", "Three"],
                }),
              },
            },
          ],
        });

        await generateSuggestions("Test", longResponse, "conceptual", defaultContext);

        expect(mockCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            messages: expect.arrayContaining([
              expect.objectContaining({
                role: "user",
                content: expect.stringContaining("Response summary"),
              }),
            ]),
          })
        );
      });
    });

    describe("error handling", () => {
      it("should return fallbacks on API error", async () => {
        mockCreate.mockRejectedValue(new Error("API Error"));

        const suggestions = await generateSuggestions(
          "Test",
          "Response",
          "conceptual",
          defaultContext
        );

        expect(suggestions).toHaveLength(3);
        // Should be fallback suggestions
        expect(suggestions).toContain("How does this connect to other concepts?");
      });

      it("should return fallbacks on invalid JSON response", async () => {
        mockCreate.mockResolvedValue({
          choices: [{ message: { content: "not json" } }],
        });

        const suggestions = await generateSuggestions(
          "Test",
          "Response",
          "quote-search",
          defaultContext
        );

        expect(suggestions).toHaveLength(3);
      });

      it("should return fallbacks when suggestions is not an array", async () => {
        mockCreate.mockResolvedValue({
          choices: [
            {
              message: {
                content: JSON.stringify({ suggestions: "not an array" }),
              },
            },
          ],
        });

        const suggestions = await generateSuggestions(
          "Test",
          "Response",
          "conceptual",
          defaultContext
        );

        expect(suggestions).toHaveLength(3);
      });

      it("should filter out non-string suggestions", async () => {
        mockCreate.mockResolvedValue({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  suggestions: ["Valid", 123, null, "Also valid"],
                }),
              },
            },
          ],
        });

        const suggestions = await generateSuggestions(
          "Test",
          "Response",
          "conceptual",
          defaultContext
        );

        expect(suggestions.every((s) => typeof s === "string")).toBe(true);
      });

      it("should filter out empty suggestions", async () => {
        mockCreate.mockResolvedValue({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  suggestions: ["Valid", "", "   ", "Also valid"],
                }),
              },
            },
          ],
        });

        const suggestions = await generateSuggestions(
          "Test",
          "Response",
          "conceptual",
          defaultContext
        );

        expect(suggestions.every((s) => s.length > 0)).toBe(true);
      });
    });
  });
});
