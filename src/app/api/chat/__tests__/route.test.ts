/**
 * @jest-environment node
 *
 * Integration tests for the chat API route.
 *
 * These tests verify:
 * - Request validation (message length, history format)
 * - Rate limiting behavior
 * - Streaming response format (SSE)
 * - Quote marker processing
 * - Error responses
 */

import { POST } from "../route";
import { NextRequest } from "next/server";
import {
  createMockStreamFromText,
  createMockStreamWithQuotes,
  DEFAULT_USAGE,
} from "@/test-utils/mock-stream";

// Mock external dependencies
jest.mock("@/lib/openai", () => ({
  openai: {
    chat: {
      completions: {
        create: jest.fn(),
      },
    },
  },
  createEmbedding: jest.fn().mockResolvedValue(new Array(1536).fill(0)),
}));

// Helper to create a mock non-streaming response (for augmentQuery, generateSuggestions)
function createMockNonStreamingResponse(content: string) {
  return Promise.resolve({
    choices: [{ message: { content } }],
  });
}

// Helper to create mock augmentation response
function createMockAugmentResponse(
  intent = "conceptual",
  augmentedQuery = "test query",
  confidence = "high"
) {
  return createMockNonStreamingResponse(
    JSON.stringify({ intent, augmented_query: augmentedQuery, confidence })
  );
}

// Helper to create mock suggestions response
function createMockSuggestionsResponse(suggestions: string[] = ["Suggestion 1", "Suggestion 2", "Suggestion 3"]) {
  return createMockNonStreamingResponse(JSON.stringify({ suggestions }));
}

jest.mock("@/lib/pinecone", () => ({
  searchRaMaterial: jest.fn().mockResolvedValue([
    {
      text: "Ra: I am Ra. The Law of One states that all things are one.",
      reference: "1.1",
      url: "https://lawofone.info/s/1#1",
    },
    {
      text: "Ra: I am Ra. Love is the great healer.",
      reference: "2.1",
      url: "https://lawofone.info/s/2#1",
    },
  ]),
  searchConcepts: jest.fn().mockResolvedValue([]),
}));

jest.mock("@/lib/posthog-server", () => ({
  trackLLMGeneration: jest.fn(),
}));

jest.mock("@/lib/debug", () => ({
  debug: {
    log: jest.fn(),
  },
}));

// Mock rate limit to be more permissive in tests
jest.mock("@/lib/rate-limit", () => {
  const requestCounts = new Map<string, number>();

  return {
    checkRateLimit: jest.fn((ip: string, config: { maxRequests: number; windowMs: number }) => {
      const count = requestCounts.get(ip) || 0;
      requestCounts.set(ip, count + 1);

      if (count >= config.maxRequests) {
        return {
          success: false,
          limit: config.maxRequests,
          remaining: 0,
          resetAt: Date.now() + config.windowMs,
        };
      }

      return {
        success: true,
        limit: config.maxRequests,
        remaining: config.maxRequests - count - 1,
        resetAt: Date.now() + config.windowMs,
      };
    }),
    getClientIp: jest.fn((req: Request) => {
      return req.headers.get("x-forwarded-for") || "127.0.0.1";
    }),
    // Reset for tests
    _resetCounts: () => requestCounts.clear(),
  };
});

// Helper to create mock request
function createMockRequest(
  body: object,
  headers: Record<string, string> = {}
): NextRequest {
  return new NextRequest("http://localhost:3000/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": "127.0.0.1",
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

// Helper to read SSE stream and extract events
async function readSSEStream(
  response: Response
): Promise<Array<{ event: string; data: unknown }>> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error("No reader available");

  const decoder = new TextDecoder();
  const events: Array<{ event: string; data: unknown }> = [];
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const blocks = buffer.split("\n\n");
    buffer = blocks.pop() || "";

    for (const block of blocks) {
      if (!block.trim()) continue;
      const eventMatch = block.match(/event: (\w+)/);
      const dataMatch = block.match(/data: (.+)/s);
      if (eventMatch && dataMatch) {
        try {
          events.push({
            event: eventMatch[1],
            data: JSON.parse(dataMatch[1]),
          });
        } catch {
          // Skip malformed JSON
        }
      }
    }
  }

  return events;
}

describe("/api/chat", () => {
  const mockOpenAI = jest.requireMock("@/lib/openai").openai;
  const mockRateLimit = jest.requireMock("@/lib/rate-limit");

  beforeEach(() => {
    jest.clearAllMocks();
    mockRateLimit._resetCounts();

    // Set up mock to handle different types of OpenAI calls
    mockOpenAI.chat.completions.create.mockImplementation(
      (options: { stream?: boolean; messages?: Array<{ role: string; content: string }> }) => {
        // If streaming is requested (main response), return async iterable
        if (options?.stream === true) {
          return createMockStreamFromText(["Hello ", "world!"], DEFAULT_USAGE);
        }

        // Check system prompt to determine call type
        const systemMessage = options?.messages?.[0]?.content || "";

        // augmentQuery uses QUERY_AUGMENTATION_PROMPT (starts with "You optimize search queries")
        if (systemMessage.includes("optimize search queries") || systemMessage.includes("vector database")) {
          return createMockAugmentResponse("conceptual", "test query", "high");
        }

        // generateSuggestions uses SUGGESTION_GENERATION_PROMPT (contains "follow-up suggestions")
        if (systemMessage.includes("follow-up suggestions") || systemMessage.includes("EXACTLY 3")) {
          return createMockSuggestionsResponse();
        }

        // Default fallback - return suggestions response
        return createMockSuggestionsResponse();
      }
    );
  });

  describe("Request Validation", () => {
    it("should reject missing message", async () => {
      const request = createMockRequest({ history: [] });
      const response = await POST(request);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toContain("Message is required");
    });

    it("should reject empty message", async () => {
      const request = createMockRequest({ message: "", history: [] });
      const response = await POST(request);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toMatch(/empty|required/i);
    });

    it("should accept and trim whitespace-only message", async () => {
      // Note: The API accepts whitespace-only messages (they get trimmed)
      // This tests that the API doesn't crash on whitespace input
      const request = createMockRequest({ message: "   ", history: [] });
      const response = await POST(request);

      // The API accepts the message (it may produce an error or continue processing)
      // This is acceptable behavior - the API handles it gracefully
      expect(response.status).toBeLessThan(500);
    });

    it("should reject message exceeding 5000 characters", async () => {
      const longMessage = "a".repeat(5001);
      const request = createMockRequest({ message: longMessage, history: [] });
      const response = await POST(request);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toMatch(/too long|5000/i);
    });

    it("should accept message at exactly 5000 characters", async () => {
      const maxMessage = "a".repeat(5000);
      const request = createMockRequest({ message: maxMessage, history: [] });
      const response = await POST(request);

      // Should not be a 400 validation error
      expect(response.status).not.toBe(400);
    });

    it("should reject non-array history", async () => {
      const request = createMockRequest({
        message: "test",
        history: "not-array",
      });
      const response = await POST(request);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toMatch(/array/i);
    });

    it("should reject history exceeding 20 messages", async () => {
      const history = Array.from({ length: 21 }, (_, i) => ({
        role: i % 2 === 0 ? "user" : "assistant",
        content: `Message ${i}`,
      }));
      const request = createMockRequest({ message: "test", history });
      const response = await POST(request);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toMatch(/too long|20/i);
    });

    it("should accept history at exactly 20 messages", async () => {
      const history = Array.from({ length: 20 }, (_, i) => ({
        role: i % 2 === 0 ? "user" : "assistant",
        content: `Message ${i}`,
      }));
      const request = createMockRequest({ message: "test", history });
      const response = await POST(request);

      expect(response.status).not.toBe(400);
    });

    it("should reject invalid role in history", async () => {
      const history = [{ role: "system", content: "test" }];
      const request = createMockRequest({ message: "test", history });
      const response = await POST(request);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toMatch(/role/i);
    });

    it("should reject history message exceeding 10000 characters", async () => {
      const history = [{ role: "user", content: "a".repeat(10001) }];
      const request = createMockRequest({ message: "test", history });
      const response = await POST(request);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toMatch(/too long/i);
    });

    it("should reject history message missing content", async () => {
      const history = [{ role: "user" }];
      const request = createMockRequest({ message: "test", history });
      const response = await POST(request);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error).toMatch(/content|required/i);
    });
  });

  describe("Rate Limiting", () => {
    it("should return 429 after exceeding rate limit", async () => {
      const testIp = "192.168.1.100";

      // Make requests up to the limit (10 by default)
      for (let i = 0; i < 10; i++) {
        await POST(
          createMockRequest(
            { message: "test", history: [] },
            { "x-forwarded-for": testIp }
          )
        );
      }

      // Next request should be rate limited
      const response = await POST(
        createMockRequest(
          { message: "test", history: [] },
          { "x-forwarded-for": testIp }
        )
      );

      expect(response.status).toBe(429);
      const body = await response.json();
      expect(body.error).toMatch(/too many requests/i);
      expect(body.retryAfter).toBeGreaterThan(0);
    });

    it("should include rate limit headers on 429", async () => {
      const testIp = "192.168.1.200";

      // Exhaust rate limit
      for (let i = 0; i < 11; i++) {
        await POST(
          createMockRequest(
            { message: "test", history: [] },
            { "x-forwarded-for": testIp }
          )
        );
      }

      const response = await POST(
        createMockRequest(
          { message: "test", history: [] },
          { "x-forwarded-for": testIp }
        )
      );

      expect(response.headers.get("X-RateLimit-Limit")).toBe("10");
      expect(response.headers.get("X-RateLimit-Remaining")).toBe("0");
      expect(response.headers.get("Retry-After")).toBeTruthy();
    });

    it("should track different IPs independently", async () => {
      // Use up limit for IP1
      for (let i = 0; i < 10; i++) {
        await POST(
          createMockRequest(
            { message: "test", history: [] },
            { "x-forwarded-for": "10.0.0.1" }
          )
        );
      }

      // IP2 should still work
      const response = await POST(
        createMockRequest(
          { message: "test", history: [] },
          { "x-forwarded-for": "10.0.0.2" }
        )
      );

      expect(response.status).not.toBe(429);
    });
  });

  describe("Streaming Response Format", () => {
    it("should return SSE content type", async () => {
      const request = createMockRequest({ message: "test", history: [] });
      const response = await POST(request);

      expect(response.headers.get("Content-Type")).toBe("text/event-stream");
    });

    it("should include cache control headers", async () => {
      const request = createMockRequest({ message: "test", history: [] });
      const response = await POST(request);

      // Cache-Control header should prevent caching
      expect(response.headers.get("Cache-Control")).toContain("no-cache");
    });

    it("should emit meta event with quotes and intent", async () => {
      const request = createMockRequest({ message: "test", history: [] });
      const response = await POST(request);
      const events = await readSSEStream(response);

      const metaEvent = events.find((e) => e.event === "meta");
      expect(metaEvent).toBeDefined();
      expect(metaEvent?.data).toHaveProperty("quotes");
      expect(metaEvent?.data).toHaveProperty("intent");
    });

    it("should emit chunk events for text", async () => {
      const request = createMockRequest({ message: "test", history: [] });
      const response = await POST(request);
      const events = await readSSEStream(response);

      const chunkEvents = events.filter((e) => e.event === "chunk");
      expect(chunkEvents.length).toBeGreaterThan(0);

      const textChunk = chunkEvents.find(
        (e) => (e.data as { type: string }).type === "text"
      );
      expect(textChunk).toBeDefined();
    });

    it("should emit done event at end", async () => {
      const request = createMockRequest({ message: "test", history: [] });
      const response = await POST(request);
      const events = await readSSEStream(response);

      const doneEvent = events.find((e) => e.event === "done");
      expect(doneEvent).toBeDefined();
    });

    it("should emit suggestions event", async () => {
      const request = createMockRequest({ message: "test", history: [] });
      const response = await POST(request);
      const events = await readSSEStream(response);

      const suggestionsEvent = events.find((e) => e.event === "suggestions");
      expect(suggestionsEvent).toBeDefined();
      // Suggestions are sent as { items: [...] }
      const items = (suggestionsEvent?.data as { items?: string[] })?.items;
      expect(Array.isArray(items)).toBe(true);
    });
  });

  describe("Quote Marker Processing", () => {
    it("should process {{QUOTE:N}} markers", async () => {
      // Mock response with quote marker
      mockOpenAI.chat.completions.create.mockImplementation(() =>
        createMockStreamWithQuotes(
          ["Here is a quote: ", { quoteIndex: 1 }],
          DEFAULT_USAGE
        )
      );

      const request = createMockRequest({
        message: "show me 1.1",
        history: [],
      });
      const response = await POST(request);
      const events = await readSSEStream(response);

      const quoteChunk = events.find(
        (e) =>
          e.event === "chunk" && (e.data as { type: string }).type === "quote"
      );
      expect(quoteChunk).toBeDefined();
      expect((quoteChunk?.data as { reference: string }).reference).toBe("1.1");
    });

    it("should process {{QUOTE:N:sX:sY}} markers with sentence range", async () => {
      // Mock response with sentence range marker
      mockOpenAI.chat.completions.create.mockImplementation(() =>
        createMockStreamWithQuotes(
          [{ quoteIndex: 1, sentenceStart: 1, sentenceEnd: 2 }],
          DEFAULT_USAGE
        )
      );

      const request = createMockRequest({
        message: "show me part of 1.1",
        history: [],
      });
      const response = await POST(request);
      const events = await readSSEStream(response);

      const quoteChunk = events.find(
        (e) =>
          e.event === "chunk" && (e.data as { type: string }).type === "quote"
      );
      expect(quoteChunk).toBeDefined();
    });

    it("should handle multiple quote markers", async () => {
      mockOpenAI.chat.completions.create.mockImplementation(() =>
        createMockStreamWithQuotes(
          [
            "First quote: ",
            { quoteIndex: 1 },
            " Second quote: ",
            { quoteIndex: 2 },
          ],
          DEFAULT_USAGE
        )
      );

      const request = createMockRequest({
        message: "show me quotes",
        history: [],
      });
      const response = await POST(request);
      const events = await readSSEStream(response);

      const quoteChunks = events.filter(
        (e) =>
          e.event === "chunk" && (e.data as { type: string }).type === "quote"
      );
      expect(quoteChunks.length).toBe(2);
    });

    it("should handle text before and after markers", async () => {
      mockOpenAI.chat.completions.create.mockImplementation(() =>
        createMockStreamWithQuotes(
          ["Before ", { quoteIndex: 1 }, " After"],
          DEFAULT_USAGE
        )
      );

      const request = createMockRequest({ message: "test", history: [] });
      const response = await POST(request);
      const events = await readSSEStream(response);

      const textChunks = events.filter(
        (e) =>
          e.event === "chunk" && (e.data as { type: string }).type === "text"
      );

      // Should have text chunks for before and after
      expect(textChunks.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Error Handling", () => {
    it("should emit error event on streaming failure", async () => {
      mockOpenAI.chat.completions.create.mockImplementation(async function* () {
        throw new Error("API Error");
      });

      const request = createMockRequest({ message: "test", history: [] });
      const response = await POST(request);
      const events = await readSSEStream(response);

      const errorEvent = events.find((e) => e.event === "error");
      expect(errorEvent).toBeDefined();
    });

    it("should return 500 on malformed JSON body", async () => {
      const request = new NextRequest("http://localhost:3000/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": "127.0.0.1",
        },
        body: "invalid json {",
      });

      const response = await POST(request);
      expect(response.status).toBe(500);
    });
  });

  describe("History Handling", () => {
    it("should accept valid conversation history", async () => {
      const history = [
        { role: "user", content: "Hello" },
        { role: "assistant", content: "Hi there!" },
        { role: "user", content: "How are you?" },
        { role: "assistant", content: "I'm doing well, thanks!" },
      ];

      const request = createMockRequest({
        message: "That's great!",
        history,
      });
      const response = await POST(request);

      expect(response.status).not.toBe(400);
    });

    it("should accept empty history", async () => {
      const request = createMockRequest({
        message: "Hello",
        history: [],
      });
      const response = await POST(request);

      expect(response.status).not.toBe(400);
    });
  });
});
