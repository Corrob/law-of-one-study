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
        url: "https://www.llresearch.org/channeling/ra-contact/1#1",
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

jest.mock("../response-cache", () => ({
  appendEvent: jest.fn().mockResolvedValue(undefined),
}));

import { openai } from "@/lib/openai";
import { executeChatQuery, ExecuteChatParams, detectConfederationFocus } from "../orchestrator";
import { performSearch } from "../search";

const mockCreate = openai.chat.completions.create as jest.Mock;
const mockPerformSearch = performSearch as jest.Mock;

describe("chat/orchestrator", () => {
  const mockSend = jest.fn();

  const baseParams: ExecuteChatParams = {
    message: "What is the Law of One?",
    history: [],
    clientIp: "127.0.0.1",
    send: mockSend,
    responseId: "test-response-id",
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

  describe("includeConfederation parameter", () => {
    it("should pass includeConfederation=false to performSearch by default", async () => {
      await executeChatQuery(baseParams);

      expect(mockPerformSearch).toHaveBeenCalledWith(
        expect.any(String),
        null,
        false,
        false
      );
    });

    it("should pass includeConfederation=true to performSearch when enabled", async () => {
      await executeChatQuery({ ...baseParams, includeConfederation: true });

      expect(mockPerformSearch).toHaveBeenCalledWith(
        expect.any(String),
        null,
        true,
        false
      );
    });

    it("should use Ra-only passages label when confederation is disabled", async () => {
      await executeChatQuery({ ...baseParams, includeConfederation: false });

      expect(mockCreate).toHaveBeenCalled();
      const createCall = mockCreate.mock.calls[0][0];
      const userMessage = createCall.messages.find((m: { role: string }) => m.role === "user");
      expect(userMessage.content).toContain("Here are relevant Ra passages");
      expect(userMessage.content).not.toContain("Confederation");
    });

    it("should use combined passages label when confederation is enabled", async () => {
      await executeChatQuery({ ...baseParams, includeConfederation: true });

      expect(mockCreate).toHaveBeenCalled();
      const createCall = mockCreate.mock.calls[0][0];
      const userMessage = createCall.messages.find((m: { role: string }) => m.role === "user");
      expect(userMessage.content).toContain("Here are relevant passages from Ra and the Confederation");
    });

    it("should use confederation-only passages label for confederation-focused queries", async () => {
      await executeChatQuery({
        ...baseParams,
        message: "What does Q'uo say about meditation?",
        includeConfederation: true,
      });

      expect(mockCreate).toHaveBeenCalled();
      const createCall = mockCreate.mock.calls[0][0];
      const userMessage = createCall.messages.find((m: { role: string }) => m.role === "user");
      expect(userMessage.content).toContain("Here are relevant Confederation passages");
    });

    it("should pass confederationFocused=true to performSearch for confederation-focused queries", async () => {
      await executeChatQuery({
        ...baseParams,
        message: "What does Hatonn teach about love?",
        includeConfederation: true,
      });

      expect(mockPerformSearch).toHaveBeenCalledWith(
        expect.any(String),
        null,
        true,
        true
      );
    });

    it("should not activate confederation focus when includeConfederation is false", async () => {
      await executeChatQuery({
        ...baseParams,
        message: "What does Q'uo say about meditation?",
        includeConfederation: false,
      });

      expect(mockPerformSearch).toHaveBeenCalledWith(
        expect.any(String),
        null,
        false,
        false
      );
    });
  });

  describe("detectConfederationFocus", () => {
    it("should detect Q'uo mentions", () => {
      expect(detectConfederationFocus("What does Q'uo say about love?")).toBe(true);
      expect(detectConfederationFocus("Tell me about Quo's teachings")).toBe(true);
      expect(detectConfederationFocus("Q\u2019uo on meditation")).toBe(true);
    });

    it("should detect other Confederation entity names", () => {
      expect(detectConfederationFocus("What does Hatonn say?")).toBe(true);
      expect(detectConfederationFocus("Show me Latwii quotes")).toBe(true);
      expect(detectConfederationFocus("What did Laitos teach?")).toBe(true);
    });

    it("should detect confederation + source context", () => {
      expect(detectConfederationFocus("Show me confederation quotes")).toBe(true);
      expect(detectConfederationFocus("confederation sources on love")).toBe(true);
      expect(detectConfederationFocus("confederation teachings about harvest")).toBe(true);
      expect(detectConfederationFocus("confederation passages on meditation")).toBe(true);
    });

    it("should detect 'more from' patterns", () => {
      expect(detectConfederationFocus("more from Q'uo")).toBe(true);
      expect(detectConfederationFocus("more by Hatonn")).toBe(true);
      expect(detectConfederationFocus("more from confederation")).toBe(true);
    });

    it("should detect 'what does confederation say' patterns", () => {
      expect(detectConfederationFocus("What does the confederation say about this?")).toBe(true);
      expect(detectConfederationFocus("what did confederation teach about love?")).toBe(true);
    });

    it("should not trigger for general Ra questions", () => {
      expect(detectConfederationFocus("What is the Law of One?")).toBe(false);
      expect(detectConfederationFocus("Tell me about catalyst")).toBe(false);
      expect(detectConfederationFocus("How does meditation work?")).toBe(false);
    });

    it("should not trigger for incidental 'confederation' mentions without source context", () => {
      expect(detectConfederationFocus("What is the Confederation of Planets?")).toBe(false);
    });
  });
});
