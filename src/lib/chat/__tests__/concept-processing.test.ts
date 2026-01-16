import {
  detectConcepts,
  formatConceptsForMeta,
  buildQueryWithConcepts,
} from "../concept-processing";
import * as openai from "@/lib/openai";
import * as pinecone from "@/lib/pinecone";
import * as conceptGraph from "@/lib/concept-graph";

// Mock the dependencies
jest.mock("@/lib/openai", () => ({
  createEmbedding: jest.fn(),
}));

jest.mock("@/lib/pinecone", () => ({
  searchConcepts: jest.fn(),
}));

jest.mock("@/lib/concept-graph", () => ({
  identifyConcepts: jest.fn(),
  getRelatedConcepts: jest.fn(),
  buildSearchExpansion: jest.fn(),
  buildConceptContextForPrompt: jest.fn(),
  findConceptById: jest.fn(),
}));

describe("concept-processing", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("detectConcepts", () => {
    const mockConcept = {
      id: "catalyst",
      term: "catalyst",
      definition: "Experience offering growth opportunity",
      category: "core",
      aliases: [],
      related: [],
    };

    it("should detect concepts using regex and embedding", async () => {
      // Setup mocks
      (conceptGraph.identifyConcepts as jest.Mock).mockReturnValue([mockConcept]);
      (openai.createEmbedding as jest.Mock).mockResolvedValue([0.1, 0.2]);
      (pinecone.searchConcepts as jest.Mock).mockResolvedValue([]);
      (conceptGraph.getRelatedConcepts as jest.Mock).mockReturnValue([]);
      (conceptGraph.buildSearchExpansion as jest.Mock).mockReturnValue(["catalyst", "experience"]);
      (conceptGraph.buildConceptContextForPrompt as jest.Mock).mockReturnValue("Context");

      const result = await detectConcepts("What is catalyst?");

      expect(result.detectedConcepts).toContain(mockConcept);
      expect(result.regexConcepts).toContain(mockConcept);
      expect(result.searchTerms).toEqual(["catalyst", "experience"]);
      expect(result.promptContext).toBe("Context");
    });

    it("should merge regex and embedding concepts without duplicates", async () => {
      const embeddingConcept = {
        id: "harvest",
        term: "harvest",
        definition: "Graduation to next density",
        category: "core",
        aliases: [],
        related: [],
      };

      (conceptGraph.identifyConcepts as jest.Mock).mockReturnValue([mockConcept]);
      (openai.createEmbedding as jest.Mock).mockResolvedValue([0.1, 0.2]);
      (pinecone.searchConcepts as jest.Mock).mockResolvedValue([
        { id: "harvest", score: 0.9 },
        { id: "catalyst", score: 0.85 }, // Duplicate - should be filtered
      ]);
      (conceptGraph.findConceptById as jest.Mock).mockImplementation((id) => {
        if (id === "harvest") return embeddingConcept;
        if (id === "catalyst") return mockConcept;
        return undefined;
      });
      (conceptGraph.getRelatedConcepts as jest.Mock).mockReturnValue([]);
      (conceptGraph.buildSearchExpansion as jest.Mock).mockReturnValue([]);
      (conceptGraph.buildConceptContextForPrompt as jest.Mock).mockReturnValue("");

      const result = await detectConcepts("catalyst and harvest");

      // Should have both but no duplicates
      expect(result.detectedConcepts).toHaveLength(2);
      expect(result.detectedConcepts.map((c) => c.id)).toContain("catalyst");
      expect(result.detectedConcepts.map((c) => c.id)).toContain("harvest");
    });

    it("should filter out low-score embedding results", async () => {
      (conceptGraph.identifyConcepts as jest.Mock).mockReturnValue([]);
      (openai.createEmbedding as jest.Mock).mockResolvedValue([0.1, 0.2]);
      (pinecone.searchConcepts as jest.Mock).mockResolvedValue([
        { id: "low-score", score: 0.3 }, // Below threshold
      ]);
      (conceptGraph.findConceptById as jest.Mock).mockReturnValue(undefined);
      (conceptGraph.getRelatedConcepts as jest.Mock).mockReturnValue([]);
      (conceptGraph.buildSearchExpansion as jest.Mock).mockReturnValue([]);
      (conceptGraph.buildConceptContextForPrompt as jest.Mock).mockReturnValue("");

      const result = await detectConcepts("random query");

      expect(result.detectedConcepts).toHaveLength(0);
    });

    it("should get related concepts when concepts are detected", async () => {
      (conceptGraph.identifyConcepts as jest.Mock).mockReturnValue([mockConcept]);
      (openai.createEmbedding as jest.Mock).mockResolvedValue([0.1, 0.2]);
      (pinecone.searchConcepts as jest.Mock).mockResolvedValue([]);
      (conceptGraph.getRelatedConcepts as jest.Mock).mockReturnValue([
        { id: "polarity", term: "polarity" },
      ]);
      (conceptGraph.buildSearchExpansion as jest.Mock).mockReturnValue([]);
      (conceptGraph.buildConceptContextForPrompt as jest.Mock).mockReturnValue("");

      const result = await detectConcepts("catalyst");

      expect(conceptGraph.getRelatedConcepts).toHaveBeenCalledWith(["catalyst"], 1);
      expect(result.relatedConcepts).toHaveLength(1);
    });
  });

  describe("formatConceptsForMeta", () => {
    it("should format concepts for meta event", () => {
      const concepts = [
        {
          id: "catalyst",
          term: { en: "catalyst", es: "catalizador" },
          definition: { en: "Experience", es: "Experiencia" },
          category: "core",
          aliases: { en: ["trigger"], es: ["disparador"] },
          related: ["polarity"],
        },
      ];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = formatConceptsForMeta(concepts as any);

      expect(result).toEqual([
        {
          id: "catalyst",
          term: "catalyst",
          definition: "Experience",
          category: "core",
        },
      ]);
    });

    it("should return empty array for no concepts", () => {
      const result = formatConceptsForMeta([]);
      expect(result).toEqual([]);
    });
  });

  describe("buildQueryWithConcepts", () => {
    it("should append concept terms to message", () => {
      const result = buildQueryWithConcepts("What is love?", [
        "love",
        "light",
        "unity",
      ]);

      expect(result).toBe("What is love? [Related concepts: love, light, unity]");
    });

    it("should limit to 5 concept terms", () => {
      const terms = ["a", "b", "c", "d", "e", "f", "g"];
      const result = buildQueryWithConcepts("Query", terms);

      expect(result).toBe("Query [Related concepts: a, b, c, d, e]");
    });

    it("should return original message if no concepts", () => {
      const result = buildQueryWithConcepts("What is love?", []);
      expect(result).toBe("What is love?");
    });
  });
});
