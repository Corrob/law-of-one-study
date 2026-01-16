/**
 * @jest-environment node
 */

import { POST } from "../route";
import { NextRequest } from "next/server";

// Mock dependencies
jest.mock("@/lib/rate-limit", () => ({
  checkRateLimit: jest.fn().mockResolvedValue({ success: true }),
  getClientIp: jest.fn().mockReturnValue("127.0.0.1"),
}));

jest.mock("@/lib/openai", () => ({
  createEmbedding: jest.fn().mockResolvedValue([0.1, 0.2, 0.3]),
}));

jest.mock("@/lib/pinecone", () => ({
  searchRaMaterial: jest.fn().mockResolvedValue([
    {
      text: "Ra: I am Ra. The Law of One states simply that all things are one.",
      reference: "Ra 1.1",
      session: 1,
      question: 1,
      url: "https://www.llresearch.org/channeling/ra-contact/1#1",
    },
    {
      text: "Ra: I am Ra. Consider the nature of love.",
      reference: "Ra 1.2",
      session: 1,
      question: 2,
      url: "https://www.llresearch.org/channeling/ra-contact/1#2",
    },
  ]),
  searchSentences: jest.fn().mockResolvedValue([
    {
      sentence: "The Law of One states simply that all things are one.",
      session: 1,
      question: 1,
      sentenceIndex: 0,
      speaker: "ra",
      reference: "Ra 1.1",
      url: "https://www.llresearch.org/channeling/ra-contact/1#1",
      score: 0.9,
    },
  ]),
}));

import { checkRateLimit } from "@/lib/rate-limit";
import { createEmbedding } from "@/lib/openai";
import { searchRaMaterial, searchSentences } from "@/lib/pinecone";

const mockCheckRateLimit = checkRateLimit as jest.Mock;
const mockCreateEmbedding = createEmbedding as jest.Mock;
const mockSearchRaMaterial = searchRaMaterial as jest.Mock;
const mockSearchSentences = searchSentences as jest.Mock;

function createRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest("http://localhost:3000/api/search", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("POST /api/search", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCheckRateLimit.mockResolvedValue({ success: true });
  });

  describe("mode-specific searches", () => {
    it("should only query sentence index when mode=sentence", async () => {
      const request = createRequest({
        query: "You are infinity",
        mode: "sentence",
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockSearchSentences).toHaveBeenCalled();
      expect(mockSearchRaMaterial).not.toHaveBeenCalled();
      expect(data.mode).toBe("sentence");
      expect(data.results[0].sentence).toBe(
        "The Law of One states simply that all things are one."
      );
    });

    it("should only query passage index when mode=passage", async () => {
      const request = createRequest({ query: "Law of One", mode: "passage" });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockSearchRaMaterial).toHaveBeenCalled();
      expect(mockSearchSentences).not.toHaveBeenCalled();
      expect(data.mode).toBe("passage");
      expect(data.results[0].text).toBe(
        "Ra: I am Ra. The Law of One states simply that all things are one."
      );
    });

    it("should default to passage mode when mode not specified", async () => {
      const request = createRequest({ query: "densities" });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(mockSearchRaMaterial).toHaveBeenCalled();
      expect(mockSearchSentences).not.toHaveBeenCalled();
      expect(data.mode).toBe("passage");
    });

    it("should pass limit to sentence search", async () => {
      const request = createRequest({
        query: "love",
        mode: "sentence",
        limit: 15,
      });
      await POST(request);

      expect(mockSearchSentences).toHaveBeenCalledWith(expect.any(Array), 15, "en");
    });

    it("should pass limit to passage search", async () => {
      const request = createRequest({
        query: "love",
        mode: "passage",
        limit: 15,
      });
      await POST(request);

      expect(mockSearchRaMaterial).toHaveBeenCalledWith(expect.any(Array), {
        topK: 15,
        language: "en",
      });
    });
  });

  describe("successful searches", () => {
    it("should return search results for valid query", async () => {
      const request = createRequest({ query: "Law of One", mode: "passage" });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.results).toHaveLength(2);
      expect(data.query).toBe("Law of One");
      expect(data.totalResults).toBe(2);
    });

    it("should pass query to embedding function", async () => {
      const request = createRequest({ query: "love and light" });
      await POST(request);

      expect(mockCreateEmbedding).toHaveBeenCalledWith("love and light");
    });
  });

  describe("validation errors", () => {
    it("should reject query that is too short", async () => {
      const request = createRequest({ query: "a" });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("2 characters");
    });

    it("should reject missing query", async () => {
      const request = createRequest({});
      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it("should reject invalid mode", async () => {
      const request = createRequest({ query: "test", mode: "invalid" });
      const response = await POST(request);

      expect(response.status).toBe(400);
    });
  });

  describe("rate limiting", () => {
    it("should return 429 when rate limited", async () => {
      mockCheckRateLimit.mockResolvedValue({
        success: false,
        limit: 10,
        remaining: 0,
        resetAt: Date.now() + 60000,
      });

      const request = createRequest({ query: "test query" });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.error).toContain("Too many requests");
      expect(response.headers.get("Retry-After")).toBeTruthy();
    });
  });

  describe("error handling", () => {
    it("should return 500 on embedding error", async () => {
      mockCreateEmbedding.mockRejectedValue(new Error("OpenAI error"));

      const request = createRequest({ query: "test query" });
      const response = await POST(request);

      expect(response.status).toBe(500);
    });

    it("should return 500 on sentence search error", async () => {
      mockSearchSentences.mockRejectedValue(new Error("Pinecone error"));

      const request = createRequest({ query: "test query", mode: "sentence" });
      const response = await POST(request);

      expect(response.status).toBe(500);
    });

    it("should return 500 on passage search error", async () => {
      mockSearchRaMaterial.mockRejectedValue(new Error("Pinecone error"));

      const request = createRequest({ query: "test query", mode: "passage" });
      const response = await POST(request);

      expect(response.status).toBe(500);
    });
  });
});
