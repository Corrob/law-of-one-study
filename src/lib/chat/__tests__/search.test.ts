import { createSearchEmbedding, searchPassages, performSearch } from "../search";
import * as openai from "@/lib/openai";
import * as pinecone from "@/lib/pinecone";

// Mock the dependencies
jest.mock("@/lib/openai", () => ({
  createEmbedding: jest.fn(),
}));

jest.mock("@/lib/pinecone", () => ({
  searchRaMaterial: jest.fn(),
  searchConfederationPassages: jest.fn(),
}));

describe("search", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createSearchEmbedding", () => {
    it("should create an embedding for the query", async () => {
      const mockEmbedding = [0.1, 0.2, 0.3];
      (openai.createEmbedding as jest.Mock).mockResolvedValue(mockEmbedding);

      const result = await createSearchEmbedding("What is love?");

      expect(openai.createEmbedding).toHaveBeenCalledWith("What is love?");
      expect(result).toEqual(mockEmbedding);
    });

    it("should throw ChatError on embedding failure", async () => {
      (openai.createEmbedding as jest.Mock).mockRejectedValue(
        new Error("API error")
      );

      await expect(createSearchEmbedding("test")).rejects.toMatchObject({
        code: "EMBEDDING_FAILED",
      });
    });
  });

  describe("searchPassages", () => {
    const mockEmbedding = [0.1, 0.2, 0.3];

    it("should search for passages without session filter", async () => {
      const mockResults = [
        { text: "Quote 1", reference: "Ra 1.1", url: "https://example.com/1" },
        { text: "Quote 2", reference: "Ra 1.2", url: "https://example.com/2" },
      ];
      (pinecone.searchRaMaterial as jest.Mock).mockResolvedValue(mockResults);

      const result = await searchPassages(mockEmbedding);

      expect(pinecone.searchRaMaterial).toHaveBeenCalledWith(mockEmbedding, {
        topK: expect.any(Number),
        sessionFilter: undefined,
      });
      expect(result).toEqual(mockResults);
    });

    it("should search with session filter when provided", async () => {
      const mockResults = [
        { text: "Quote 1", reference: "Ra 50.1", url: "https://example.com/1" },
      ];
      (pinecone.searchRaMaterial as jest.Mock).mockResolvedValue(mockResults);

      const sessionRef = { session: 50, question: 1 };
      const result = await searchPassages(mockEmbedding, sessionRef);

      expect(pinecone.searchRaMaterial).toHaveBeenCalledWith(mockEmbedding, {
        topK: expect.any(Number),
        sessionFilter: sessionRef,
      });
      expect(result).toEqual(mockResults);
    });

    it("should throw ChatError on search failure", async () => {
      (pinecone.searchRaMaterial as jest.Mock).mockRejectedValue(
        new Error("Search error")
      );

      await expect(searchPassages(mockEmbedding)).rejects.toMatchObject({
        code: "SEARCH_FAILED",
      });
    });
  });

  describe("performSearch", () => {
    it("should perform full search flow (Ra only by default)", async () => {
      const mockEmbedding = [0.1, 0.2, 0.3];
      const mockResults = [
        { text: "Quote 1", reference: "Ra 1.1", url: "https://example.com/1" },
      ];

      (openai.createEmbedding as jest.Mock).mockResolvedValue(mockEmbedding);
      (pinecone.searchRaMaterial as jest.Mock).mockResolvedValue(mockResults);

      const result = await performSearch("What is love?");

      expect(result.embedding).toEqual(mockEmbedding);
      expect(result.passages).toEqual(mockResults);
      expect(pinecone.searchConfederationPassages).not.toHaveBeenCalled();
    });

    it("should not search Confederation when includeConfederation is false", async () => {
      const mockEmbedding = [0.1, 0.2, 0.3];
      (openai.createEmbedding as jest.Mock).mockResolvedValue(mockEmbedding);
      (pinecone.searchRaMaterial as jest.Mock).mockResolvedValue([]);

      await performSearch("What is love?", null, false);

      expect(pinecone.searchConfederationPassages).not.toHaveBeenCalled();
    });

    it("should search Confederation when includeConfederation is true", async () => {
      const mockEmbedding = [0.1, 0.2, 0.3];
      const raResults = [
        { text: "Ra quote", reference: "1.1", url: "https://example.com/1" },
      ];
      const confedResults = [
        { text: "Q'uo quote", reference: "Q'uo, 2024-01-01", url: "https://example.com/2" },
      ];

      (openai.createEmbedding as jest.Mock).mockResolvedValue(mockEmbedding);
      (pinecone.searchRaMaterial as jest.Mock).mockResolvedValue(raResults);
      (pinecone.searchConfederationPassages as jest.Mock).mockResolvedValue(confedResults);

      const result = await performSearch("What is love?", null, true);

      expect(pinecone.searchConfederationPassages).toHaveBeenCalledWith(mockEmbedding, 4);
      expect(result.passages).toEqual([...raResults, ...confedResults]);
    });

    it("should search only Confederation when confederationFocused is true", async () => {
      const mockEmbedding = [0.1, 0.2, 0.3];
      const confedResults = [
        { text: "Q'uo quote", reference: "Q'uo, 2024-01-01", url: "https://example.com/1" },
        { text: "Hatonn quote", reference: "Hatonn, 1986-03-02", url: "https://example.com/2" },
      ];

      (openai.createEmbedding as jest.Mock).mockResolvedValue(mockEmbedding);
      (pinecone.searchConfederationPassages as jest.Mock).mockResolvedValue(confedResults);

      const result = await performSearch("What does Q'uo say?", null, true, true);

      expect(pinecone.searchRaMaterial).not.toHaveBeenCalled();
      expect(pinecone.searchConfederationPassages).toHaveBeenCalledWith(mockEmbedding, 8);
      expect(result.passages).toEqual(confedResults);
    });

    it("should pass session reference to search", async () => {
      const mockEmbedding = [0.1, 0.2, 0.3];
      const mockResults = [
        { text: "Quote 1", reference: "Ra 50.1", url: "https://example.com/1" },
      ];

      (openai.createEmbedding as jest.Mock).mockResolvedValue(mockEmbedding);
      (pinecone.searchRaMaterial as jest.Mock).mockResolvedValue(mockResults);

      const sessionRef = { session: 50 };
      await performSearch("session 50", sessionRef);

      expect(pinecone.searchRaMaterial).toHaveBeenCalledWith(
        mockEmbedding,
        expect.objectContaining({ sessionFilter: sessionRef })
      );
    });
  });
});
