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
      url: "https://lawofone.info/s/1#1",
    },
    {
      text: "Ra: I am Ra. Consider the nature of love.",
      reference: "Ra 1.2",
      session: 1,
      question: 2,
      url: "https://lawofone.info/s/1#2",
    },
  ]),
}));

import { checkRateLimit } from "@/lib/rate-limit";
import { createEmbedding } from "@/lib/openai";
import { searchRaMaterial } from "@/lib/pinecone";

const mockCheckRateLimit = checkRateLimit as jest.Mock;
const mockCreateEmbedding = createEmbedding as jest.Mock;
const mockSearchRaMaterial = searchRaMaterial as jest.Mock;

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

  describe("successful searches", () => {
    it("should return search results for valid query", async () => {
      const request = createRequest({ query: "Law of One" });
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

    it("should pass limit to search function", async () => {
      const request = createRequest({ query: "densities", limit: 10 });
      await POST(request);

      expect(mockSearchRaMaterial).toHaveBeenCalledWith(
        expect.any(Array),
        { topK: 10 }
      );
    });

    it("should use default limit of 20", async () => {
      const request = createRequest({ query: "densities" });
      await POST(request);

      expect(mockSearchRaMaterial).toHaveBeenCalledWith(
        expect.any(Array),
        { topK: 20 }
      );
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

    it("should return 500 on search error", async () => {
      mockSearchRaMaterial.mockRejectedValue(new Error("Pinecone error"));

      const request = createRequest({ query: "test query" });
      const response = await POST(request);

      expect(response.status).toBe(500);
    });
  });
});
