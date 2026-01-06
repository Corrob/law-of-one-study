import { searchRaMaterial, searchConcepts, INDEX_NAME, SearchOptions } from "../pinecone";
import { PineconeMetadata } from "../types";

// Mock the Pinecone client
const mockQuery = jest.fn();
const mockNamespaceQuery = jest.fn();
const mockIndex = jest.fn(() => ({
  query: mockQuery,
  namespace: jest.fn(() => ({
    query: mockNamespaceQuery,
  })),
}));

jest.mock("@pinecone-database/pinecone", () => ({
  Pinecone: jest.fn().mockImplementation(() => ({
    index: mockIndex,
  })),
}));

jest.mock("@/lib/debug", () => ({
  debug: { log: jest.fn() },
}));

describe("pinecone", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, PINECONE_API_KEY: "test-api-key" };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("INDEX_NAME", () => {
    it("should use environment variable or default", () => {
      expect(INDEX_NAME).toBeDefined();
    });
  });

  describe("searchRaMaterial", () => {
    const mockEmbedding = [0.1, 0.2, 0.3, 0.4, 0.5];

    it("should query Pinecone with embedding", async () => {
      mockQuery.mockResolvedValue({
        matches: [
          {
            id: "1.1",
            score: 0.95,
            metadata: {
              text: "Ra: I am Ra.",
              reference: "1.1",
              session: 1,
              question: 1,
            },
          },
        ],
      });

      const results = await searchRaMaterial(mockEmbedding);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          vector: mockEmbedding,
          includeMetadata: true,
        })
      );
      expect(results).toHaveLength(1);
      expect(results[0].reference).toBe("1.1");
    });

    it("should use default topK of 10", async () => {
      mockQuery.mockResolvedValue({ matches: [] });

      await searchRaMaterial(mockEmbedding);

      expect(mockQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          topK: 10,
        })
      );
    });

    it("should use custom topK when provided", async () => {
      mockQuery.mockResolvedValue({ matches: [] });

      await searchRaMaterial(mockEmbedding, { topK: 5 });

      expect(mockQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          topK: 5,
        })
      );
    });

    it("should apply session filter correctly", async () => {
      mockQuery.mockResolvedValue({ matches: [] });

      await searchRaMaterial(mockEmbedding, {
        sessionFilter: { session: 50 },
      });

      expect(mockQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: { session: { $eq: 50 } },
        })
      );
    });

    it("should apply session and question filter correctly", async () => {
      mockQuery.mockResolvedValue({ matches: [] });

      await searchRaMaterial(mockEmbedding, {
        sessionFilter: { session: 50, question: 7 },
      });

      expect(mockQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          filter: {
            $and: [
              { session: { $eq: 50 } },
              { question: { $eq: 7 } },
            ],
          },
        })
      );
    });

    it("should increase topK when using session filter", async () => {
      mockQuery.mockResolvedValue({ matches: [] });

      await searchRaMaterial(mockEmbedding, {
        topK: 5,
        sessionFilter: { session: 50 },
      });

      expect(mockQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          topK: 20, // Math.max(5, 20)
        })
      );
    });

    it("should generate correct URL for results", async () => {
      mockQuery.mockResolvedValue({
        matches: [
          {
            id: "50.7",
            score: 0.9,
            metadata: {
              text: "Ra: I am Ra.",
              reference: "50.7",
              session: 50,
              question: 7,
            },
          },
        ],
      });

      const results = await searchRaMaterial(mockEmbedding);

      expect(results[0].url).toBe("https://lawofone.info/s/50#7");
    });

    it("should filter out results without metadata", async () => {
      mockQuery.mockResolvedValue({
        matches: [
          { id: "1", score: 0.9, metadata: { text: "Ra" } },
          { id: "2", score: 0.8 }, // No metadata
          { id: "3", score: 0.7, metadata: { text: "Ra again" } },
        ],
      });

      const results = await searchRaMaterial(mockEmbedding);

      expect(results).toHaveLength(2);
    });

    it("should return empty array when no matches", async () => {
      mockQuery.mockResolvedValue({ matches: [] });

      const results = await searchRaMaterial(mockEmbedding);

      expect(results).toEqual([]);
    });

    it("should handle undefined matches", async () => {
      mockQuery.mockResolvedValue({});

      const results = await searchRaMaterial(mockEmbedding);

      expect(results).toEqual([]);
    });
  });

  describe("searchConcepts", () => {
    const mockEmbedding = [0.1, 0.2, 0.3, 0.4, 0.5];

    it("should query concepts namespace", async () => {
      mockNamespaceQuery.mockResolvedValue({
        matches: [
          {
            id: "unity",
            score: 0.95,
            metadata: { term: "Unity", category: "core" },
          },
        ],
      });

      const results = await searchConcepts(mockEmbedding);

      expect(mockIndex).toHaveBeenCalled();
      expect(results).toHaveLength(1);
      expect(results[0].term).toBe("Unity");
    });

    it("should use default topK of 5", async () => {
      mockNamespaceQuery.mockResolvedValue({ matches: [] });

      await searchConcepts(mockEmbedding);

      expect(mockNamespaceQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          topK: 5,
        })
      );
    });

    it("should use custom topK", async () => {
      mockNamespaceQuery.mockResolvedValue({ matches: [] });

      await searchConcepts(mockEmbedding, 10);

      expect(mockNamespaceQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          topK: 10,
        })
      );
    });

    it("should return properly formatted results", async () => {
      mockNamespaceQuery.mockResolvedValue({
        matches: [
          {
            id: "love-light",
            score: 0.88,
            metadata: { term: "Love/Light", category: "spiritual" },
          },
        ],
      });

      const results = await searchConcepts(mockEmbedding);

      expect(results[0]).toEqual({
        id: "love-light",
        score: 0.88,
        term: "Love/Light",
        category: "spiritual",
      });
    });

    it("should handle missing metadata fields", async () => {
      mockNamespaceQuery.mockResolvedValue({
        matches: [
          { id: "test", score: 0.5, metadata: {} },
        ],
      });

      const results = await searchConcepts(mockEmbedding);

      expect(results[0]).toEqual({
        id: "test",
        score: 0.5,
        term: "",
        category: "",
      });
    });

    it("should return empty array when no matches", async () => {
      mockNamespaceQuery.mockResolvedValue({ matches: null });

      const results = await searchConcepts(mockEmbedding);

      expect(results).toEqual([]);
    });
  });

  describe("error handling", () => {
    it("should throw error if PINECONE_API_KEY is missing", async () => {
      delete process.env.PINECONE_API_KEY;
      jest.resetModules();

      // Re-import to test the error
      await expect(async () => {
        const { searchRaMaterial: freshSearch } = await import("../pinecone");
        await freshSearch([0.1, 0.2]);
      }).rejects.toThrow("Missing PINECONE_API_KEY");
    });
  });
});
