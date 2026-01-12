/**
 * Tests for chat orchestrator module.
 *
 * Focuses on the thinkingMode parameter and its effect on reasoning effort.
 */

import { MODEL_CONFIG } from "@/lib/config";

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

jest.mock("@/lib/debug", () => ({
  debug: { log: jest.fn() },
}));

jest.mock("@/lib/posthog-server", () => ({
  trackLLMGeneration: jest.fn(),
}));

jest.mock("../augmentation", () => ({
  augmentQuery: jest.fn().mockResolvedValue({
    intent: "conceptual",
    augmentedQuery: "test query",
    confidence: "high",
  }),
}));

jest.mock("../concept-processing", () => ({
  detectConcepts: jest.fn().mockResolvedValue({
    detectedConcepts: [],
    searchTerms: [],
    promptContext: "",
  }),
  formatConceptsForMeta: jest.fn().mockReturnValue([]),
  buildQueryWithConcepts: jest.fn().mockImplementation((msg) => msg),
}));

jest.mock("../search", () => ({
  performSearch: jest.fn().mockResolvedValue({
    passages: [
      {
        text: "Test quote from Ra",
        reference: "1.1",
        url: "https://lawofone.info/s/1#1",
      },
    ],
  }),
}));

jest.mock("../suggestions", () => ({
  generateSuggestions: jest.fn().mockResolvedValue([]),
}));

jest.mock("../stream-processor", () => ({
  processStreamWithMarkers: jest.fn().mockResolvedValue({
    fullOutput: "Test response",
    usage: { prompt_tokens: 100, completion_tokens: 50 },
  }),
}));

import { openai } from "@/lib/openai";
import { executeChatQuery, ExecuteChatParams } from "../orchestrator";

const mockCreate = openai.chat.completions.create as jest.Mock;

describe("chat/orchestrator", () => {
  const mockSend = jest.fn();

  const baseParams: ExecuteChatParams = {
    message: "What is the Law of One?",
    history: [],
    clientIp: "127.0.0.1",
    send: mockSend,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Setup default mock for streaming response
    mockCreate.mockResolvedValue({
      [Symbol.asyncIterator]: async function* () {
        yield { choices: [{ delta: { content: "Test" } }] };
        yield { choices: [{ delta: { content: " response" } }], usage: { prompt_tokens: 100, completion_tokens: 50 } };
      },
    });
  });

  describe("thinkingMode parameter", () => {
    it("should use low reasoning effort by default (thinkingMode: false)", async () => {
      await executeChatQuery({ ...baseParams, thinkingMode: false });

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: MODEL_CONFIG.chatModel,
          reasoning_effort: MODEL_CONFIG.chatReasoningEffort, // "low"
        })
      );
    });

    it("should use low reasoning effort when thinkingMode is undefined", async () => {
      await executeChatQuery(baseParams);

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          reasoning_effort: MODEL_CONFIG.chatReasoningEffort, // "low"
        })
      );
    });

    it("should use higher reasoning effort when thinkingMode is true", async () => {
      await executeChatQuery({ ...baseParams, thinkingMode: true });

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          reasoning_effort: MODEL_CONFIG.thinkingModeReasoningEffort, // "medium"
        })
      );
    });

    it("should pass correct reasoning effort values from config", () => {
      // Verify config values are what we expect
      expect(MODEL_CONFIG.chatReasoningEffort).toBe("low");
      expect(MODEL_CONFIG.thinkingModeReasoningEffort).toBe("medium");
    });
  });

  describe("SSE events", () => {
    it("should send meta event with quotes and intent", async () => {
      await executeChatQuery(baseParams);

      expect(mockSend).toHaveBeenCalledWith(
        "meta",
        expect.objectContaining({
          quotes: expect.any(Array),
          intent: expect.any(String),
          confidence: expect.any(String),
        })
      );
    });

    it("should send done event when complete", async () => {
      await executeChatQuery(baseParams);

      expect(mockSend).toHaveBeenCalledWith("done", {});
    });
  });
});
