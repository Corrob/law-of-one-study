/**
 * @jest-environment jsdom
 */

import { renderHook, act } from "@testing-library/react";
import { useChatStream } from "../useChatStream";
import { AnimationChunk } from "@/lib/types";

// Simple mock response that simulates streaming
class MockResponse {
  public status: number;
  public headers: Map<string, string>;
  private sseText: string;
  private jsonData: unknown;

  constructor(body: string, init?: { status?: number; headers?: Record<string, string> }) {
    this.sseText = body;
    this.status = init?.status ?? 200;
    this.headers = new Map(Object.entries(init?.headers ?? {}));
    // Parse JSON if not SSE
    if (!init?.headers?.["Content-Type"]?.includes("event-stream")) {
      try {
        this.jsonData = JSON.parse(body);
      } catch {
        this.jsonData = {};
      }
    }
  }

  get ok() {
    return this.status >= 200 && this.status < 300;
  }

  get body() {
    // Return a simple async iterator that yields the SSE text
    const text = this.sseText;
    const encoder = new globalThis.TextEncoder();
    return {
      getReader: () => ({
        read: (() => {
          let done = false;
          return async () => {
            if (done) return { done: true, value: undefined };
            done = true;
            return { done: false, value: encoder.encode(text) };
          };
        })(),
      }),
    };
  }

  async json() {
    return this.jsonData ?? {};
  }
}

// Mock dependencies
jest.mock("@/lib/debug", () => ({
  debug: { log: jest.fn() },
}));

jest.mock("@/lib/analytics", () => ({
  analytics: {
    questionSubmitted: jest.fn(),
    streamingStarted: jest.fn(),
    responseComplete: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Helper to create mock SSE response
function createMockSSEResponse(events: Array<{ type: string; data: object }>) {
  const sseText = events
    .map((e) => `event: ${e.type}\ndata: ${JSON.stringify(e.data)}\n\n`)
    .join("");

  return new MockResponse(sseText, {
    status: 200,
    headers: { "Content-Type": "text/event-stream" },
  });
}

describe("useChatStream", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("initial state", () => {
    it("should have empty initial state", () => {
      const { result } = renderHook(() => useChatStream());

      expect(result.current.messages).toEqual([]);
      expect(result.current.isStreaming).toBe(false);
      expect(result.current.streamDone).toBe(false);
      expect(result.current.suggestions).toEqual([]);
    });
  });

  describe("sendMessage", () => {
    it("should add user message immediately", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockSSEResponse([{ type: "done", data: {} }])
      );

      const { result } = renderHook(() => useChatStream());
      const addChunk = jest.fn();

      await act(async () => {
        await result.current.sendMessage("Hello", addChunk);
      });

      expect(result.current.messages[0].role).toBe("user");
      expect(result.current.messages[0].content).toBe("Hello");
    });

    it("should set isStreaming while streaming", async () => {
      // Create a promise to control response timing
      let resolveResponse: (value: Response) => void;
      const responsePromise = new Promise<Response>((resolve) => {
        resolveResponse = resolve;
      });
      mockFetch.mockReturnValueOnce(responsePromise);

      const { result } = renderHook(() => useChatStream());
      const addChunk = jest.fn();

      // Start streaming
      act(() => {
        result.current.sendMessage("Hello", addChunk);
      });

      // Should be streaming
      expect(result.current.isStreaming).toBe(true);

      // Complete the response
      await act(async () => {
        resolveResponse!(createMockSSEResponse([{ type: "done", data: {} }]));
      });
    });

    it("should call addChunk for text chunks", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockSSEResponse([
          { type: "chunk", data: { type: "text", content: "Hello world" } },
          { type: "done", data: {} },
        ])
      );

      const { result } = renderHook(() => useChatStream());
      const addChunk = jest.fn();

      await act(async () => {
        await result.current.sendMessage("Hi", addChunk);
      });

      expect(addChunk).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "text",
          content: "Hello world",
        })
      );
    });

    it("should call addChunk for quote chunks", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockSSEResponse([
          {
            type: "chunk",
            data: {
              type: "quote",
              text: "Ra: I am Ra.",
              reference: "1.1",
              url: "https://lawofone.info/s/1#1",
            },
          },
          { type: "done", data: {} },
        ])
      );

      const { result } = renderHook(() => useChatStream());
      const addChunk = jest.fn();

      await act(async () => {
        await result.current.sendMessage("Quote please", addChunk);
      });

      expect(addChunk).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "quote",
          quote: expect.objectContaining({
            text: "Ra: I am Ra.",
            reference: "1.1",
          }),
        })
      );
    });

    it("should set streamDone when done event received", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockSSEResponse([
          { type: "chunk", data: { type: "text", content: "Hello" } },
          { type: "done", data: {} },
        ])
      );

      const { result } = renderHook(() => useChatStream());
      const addChunk = jest.fn();

      await act(async () => {
        await result.current.sendMessage("Hi", addChunk);
      });

      expect(result.current.streamDone).toBe(true);
    });

    it("should handle suggestions event", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockSSEResponse([
          { type: "chunk", data: { type: "text", content: "Hello" } },
          { type: "suggestions", data: { items: ["Tell me more", "What else?"] } },
          { type: "done", data: {} },
        ])
      );

      const { result } = renderHook(() => useChatStream());
      const addChunk = jest.fn();

      await act(async () => {
        await result.current.sendMessage("Hi", addChunk);
      });

      expect(result.current.suggestions).toEqual(["Tell me more", "What else?"]);
    });

    it("should send history with request", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockSSEResponse([{ type: "done", data: {} }])
      );

      const { result } = renderHook(() => useChatStream());
      const addChunk = jest.fn();

      // Add a message to history first
      act(() => {
        result.current.setMessages([
          {
            id: "1",
            role: "user",
            content: "First message",
            timestamp: new Date(),
          },
        ]);
      });

      await act(async () => {
        await result.current.sendMessage("Second message", addChunk);
      });

      expect(mockFetch).toHaveBeenCalledWith(
        "/api/chat",
        expect.objectContaining({
          body: expect.stringContaining("First message"),
        })
      );
    });
  });

  describe("error handling", () => {
    it("should add error message on HTTP error", async () => {
      mockFetch.mockResolvedValueOnce(
        new MockResponse(JSON.stringify({ error: "Rate limited" }), {
          status: 429,
        })
      );

      const { result } = renderHook(() => useChatStream());
      const addChunk = jest.fn();

      await act(async () => {
        await result.current.sendMessage("Hi", addChunk);
      });

      // Should have user message + error message
      expect(result.current.messages).toHaveLength(2);
      expect(result.current.messages[1].role).toBe("assistant");
      expect(result.current.isStreaming).toBe(false);
    });

    it("should handle SSE error events", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockSSEResponse([
          {
            type: "error",
            data: {
              code: "SEARCH_FAILED",
              message: "Search failed",
              retryable: true,
            },
          },
        ])
      );

      const { result } = renderHook(() => useChatStream());
      const addChunk = jest.fn();

      await act(async () => {
        await result.current.sendMessage("Hi", addChunk);
      });

      expect(result.current.messages).toHaveLength(2);
      expect(result.current.messages[1].content).toContain("Search failed");
    });

    it("should handle network errors", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const { result } = renderHook(() => useChatStream());
      const addChunk = jest.fn();

      await act(async () => {
        await result.current.sendMessage("Hi", addChunk);
      });

      expect(result.current.messages).toHaveLength(2);
      expect(result.current.messages[1].role).toBe("assistant");
      expect(result.current.isStreaming).toBe(false);
    });
  });

  describe("finalizeMessage", () => {
    it("should create assistant message from chunks", () => {
      const { result } = renderHook(() => useChatStream());

      const chunks: AnimationChunk[] = [
        { id: "1", type: "text", content: "Hello " },
        { id: "2", type: "text", content: "world!" },
      ];

      act(() => {
        result.current.finalizeMessage(chunks);
      });

      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0].role).toBe("assistant");
      expect(result.current.messages[0].content).toBe("Hello world!");
      expect(result.current.messages[0].segments).toHaveLength(2);
    });

    it("should include quote segments", () => {
      const { result } = renderHook(() => useChatStream());

      const chunks: AnimationChunk[] = [
        { id: "1", type: "text", content: "Quote: " },
        {
          id: "2",
          type: "quote",
          quote: { text: "Ra: I am Ra.", reference: "1.1", url: "https://lawofone.info/s/1#1" },
        },
      ];

      act(() => {
        result.current.finalizeMessage(chunks);
      });

      expect(result.current.messages[0].segments).toHaveLength(2);
      expect(result.current.messages[0].segments![1].type).toBe("quote");
    });

    it("should call onPlaceholderChange with message count", () => {
      const onPlaceholderChange = jest.fn();
      const { result } = renderHook(() => useChatStream(onPlaceholderChange));

      act(() => {
        result.current.finalizeMessage([{ id: "1", type: "text", content: "Hi" }]);
      });

      expect(onPlaceholderChange).toHaveBeenCalledWith(1);
    });

    it("should reset streaming state", () => {
      const { result } = renderHook(() => useChatStream());

      // Set streaming state
      act(() => {
        result.current.setMessages([
          { id: "1", role: "user", content: "Test", timestamp: new Date() },
        ]);
      });

      act(() => {
        result.current.finalizeMessage([{ id: "1", type: "text", content: "Response" }]);
      });

      expect(result.current.isStreaming).toBe(false);
      expect(result.current.streamDone).toBe(false);
    });
  });

  describe("reset", () => {
    it("should clear all state", async () => {
      mockFetch.mockResolvedValueOnce(
        createMockSSEResponse([
          { type: "chunk", data: { type: "text", content: "Hello" } },
          { type: "suggestions", data: { items: ["Option 1"] } },
          { type: "done", data: {} },
        ])
      );

      const { result } = renderHook(() => useChatStream());
      const addChunk = jest.fn();

      await act(async () => {
        await result.current.sendMessage("Hi", addChunk);
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.messages).toEqual([]);
      expect(result.current.isStreaming).toBe(false);
      expect(result.current.streamDone).toBe(false);
      expect(result.current.suggestions).toEqual([]);
    });
  });

  describe("setMessages", () => {
    it("should allow direct message updates", () => {
      const { result } = renderHook(() => useChatStream());

      act(() => {
        result.current.setMessages([
          { id: "1", role: "user", content: "Test", timestamp: new Date() },
        ]);
      });

      expect(result.current.messages).toHaveLength(1);
    });
  });

  describe("conversation history limit", () => {
    it("should limit messages to MAX_CONVERSATION_HISTORY", async () => {
      const { result } = renderHook(() => useChatStream());

      // Add 35 messages
      act(() => {
        const messages = [];
        for (let i = 0; i < 35; i++) {
          messages.push({
            id: `${i}`,
            role: i % 2 === 0 ? ("user" as const) : ("assistant" as const),
            content: `Message ${i}`,
            timestamp: new Date(),
          });
        }
        result.current.setMessages(messages);
      });

      mockFetch.mockResolvedValueOnce(
        createMockSSEResponse([{ type: "done", data: {} }])
      );

      await act(async () => {
        await result.current.sendMessage("New message", jest.fn());
      });

      // Should be limited to 30
      expect(result.current.messages.length).toBeLessThanOrEqual(30);
    });
  });
});
