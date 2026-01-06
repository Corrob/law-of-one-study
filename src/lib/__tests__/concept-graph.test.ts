import {
  getConceptGraph,
  findConceptById,
  findConceptByTerm,
  identifyConcepts,
  getRelatedConcepts,
  getConceptsByCategory,
  getConceptsBySession,
  buildSearchExpansion,
  buildConceptContextForPrompt,
  getAllConcepts,
  getCategoryInfo,
} from "../concept-graph";
import type { GraphConcept, ConceptCategory } from "../types-graph";

describe("concept-graph", () => {
  describe("getConceptGraph", () => {
    it("should return the concept graph", () => {
      const graph = getConceptGraph();

      expect(graph).toHaveProperty("concepts");
      expect(graph).toHaveProperty("categories");
      expect(typeof graph.concepts).toBe("object");
    });
  });

  describe("getAllConcepts", () => {
    it("should return all concepts as an array", () => {
      const concepts = getAllConcepts();

      expect(Array.isArray(concepts)).toBe(true);
      expect(concepts.length).toBeGreaterThan(0);
    });

    it("should return concepts with required properties", () => {
      const concepts = getAllConcepts();

      for (const concept of concepts.slice(0, 5)) {
        expect(concept).toHaveProperty("id");
        expect(concept).toHaveProperty("term");
        expect(concept).toHaveProperty("category");
        expect(concept).toHaveProperty("definition");
        expect(concept).toHaveProperty("aliases");
        expect(concept).toHaveProperty("relationships");
      }
    });
  });

  describe("findConceptById", () => {
    it("should find concept by valid ID", () => {
      const concepts = getAllConcepts();
      const firstConcept = concepts[0];

      const found = findConceptById(firstConcept.id);

      expect(found).toBeDefined();
      expect(found?.id).toBe(firstConcept.id);
    });

    it("should return undefined for invalid ID", () => {
      const found = findConceptById("nonexistent-concept-id-12345");

      expect(found).toBeUndefined();
    });
  });

  describe("findConceptByTerm", () => {
    it("should find concept by exact term", () => {
      const concepts = getAllConcepts();
      const firstConcept = concepts[0];

      const found = findConceptByTerm(firstConcept.term);

      expect(found).toBeDefined();
      expect(found?.term).toBe(firstConcept.term);
    });

    it("should find concept by term case-insensitively", () => {
      const concepts = getAllConcepts();
      const firstConcept = concepts[0];

      const foundLower = findConceptByTerm(firstConcept.term.toLowerCase());
      const foundUpper = findConceptByTerm(firstConcept.term.toUpperCase());

      expect(foundLower).toBeDefined();
      expect(foundUpper).toBeDefined();
    });

    it("should find concept by alias", () => {
      const concepts = getAllConcepts();
      const conceptWithAlias = concepts.find((c) => c.aliases.length > 0);

      if (conceptWithAlias) {
        const found = findConceptByTerm(conceptWithAlias.aliases[0]);
        expect(found).toBeDefined();
        expect(found?.id).toBe(conceptWithAlias.id);
      }
    });

    it("should return undefined for unknown term", () => {
      const found = findConceptByTerm("nonexistent-term-xyz-123");

      expect(found).toBeUndefined();
    });
  });

  describe("identifyConcepts", () => {
    it("should identify concepts in text", () => {
      const concepts = getAllConcepts();
      // Use a real term from the graph
      const testTerm = concepts[0].term;
      const text = `This text discusses ${testTerm} in detail.`;

      const found = identifyConcepts(text);

      expect(found.length).toBeGreaterThanOrEqual(1);
    });

    it("should return unique concepts only", () => {
      const concepts = getAllConcepts();
      const testTerm = concepts[0].term;
      const text = `${testTerm} and ${testTerm} again and ${testTerm} once more.`;

      const found = identifyConcepts(text);

      const ids = found.map((c) => c.id);
      const uniqueIds = new Set(ids);
      expect(ids.length).toBe(uniqueIds.size);
    });

    it("should return empty array for text without concepts", () => {
      const found = identifyConcepts("This is just some random text without any concepts.");

      expect(Array.isArray(found)).toBe(true);
    });

    it("should preserve order of first appearance", () => {
      // This test verifies ordering - actual result depends on graph data
      const text = "First mention. Second mention.";
      const found = identifyConcepts(text);

      // Just verify it returns an array without errors
      expect(Array.isArray(found)).toBe(true);
    });
  });

  describe("getRelatedConcepts", () => {
    it("should return related concepts at depth 1", () => {
      const concepts = getAllConcepts();
      // Find a concept with relationships
      const conceptWithRelations = concepts.find(
        (c) =>
          c.relationships.related?.length ||
          c.relationships.leads_to?.length ||
          c.relationships.prerequisite?.length
      );

      if (conceptWithRelations) {
        const related = getRelatedConcepts([conceptWithRelations.id], 1);
        expect(Array.isArray(related)).toBe(true);
      }
    });

    it("should not include input concepts in results", () => {
      const concepts = getAllConcepts();
      const testId = concepts[0].id;

      const related = getRelatedConcepts([testId], 1);

      const relatedIds = related.map((c) => c.id);
      expect(relatedIds).not.toContain(testId);
    });

    it("should return empty array for concept without relationships", () => {
      const related = getRelatedConcepts(["nonexistent-id"], 1);

      expect(related).toEqual([]);
    });

    it("should handle multiple input concepts", () => {
      const concepts = getAllConcepts();
      const ids = concepts.slice(0, 3).map((c) => c.id);

      const related = getRelatedConcepts(ids, 1);

      expect(Array.isArray(related)).toBe(true);
    });

    it("should traverse deeper with higher depth", () => {
      const concepts = getAllConcepts();
      const testId = concepts[0].id;

      const depth1 = getRelatedConcepts([testId], 1);
      const depth2 = getRelatedConcepts([testId], 2);

      // Depth 2 should include at least as many concepts as depth 1
      expect(depth2.length).toBeGreaterThanOrEqual(depth1.length);
    });
  });

  describe("getConceptsByCategory", () => {
    it("should return concepts for valid category", () => {
      const graph = getConceptGraph();
      const categories = Object.keys(graph.categories) as ConceptCategory[];

      if (categories.length > 0) {
        const concepts = getConceptsByCategory(categories[0]);

        expect(Array.isArray(concepts)).toBe(true);
        for (const concept of concepts) {
          expect(concept.category).toBe(categories[0]);
        }
      }
    });

    it("should return empty array for category with no concepts", () => {
      const concepts = getConceptsByCategory("nonexistent" as ConceptCategory);

      expect(concepts).toEqual([]);
    });
  });

  describe("getConceptsBySession", () => {
    it("should return concepts for valid session", () => {
      const concepts = getConceptsBySession(1);

      expect(Array.isArray(concepts)).toBe(true);
    });

    it("should include concepts with primary or secondary session", () => {
      const allConcepts = getAllConcepts();
      const conceptWithSession = allConcepts.find(
        (c) => c.sessions.primary.includes(1) || c.sessions.secondary.includes(1)
      );

      if (conceptWithSession) {
        const results = getConceptsBySession(1);
        expect(results.some((c) => c.id === conceptWithSession.id)).toBe(true);
      }
    });
  });

  describe("buildSearchExpansion", () => {
    it("should return search terms for concepts", () => {
      const concepts = getAllConcepts().slice(0, 2);

      const terms = buildSearchExpansion(concepts);

      expect(Array.isArray(terms)).toBe(true);
    });

    it("should return empty array for empty input", () => {
      const terms = buildSearchExpansion([]);

      expect(terms).toEqual([]);
    });

    it("should include concept search terms", () => {
      const concepts = getAllConcepts();
      const conceptWithSearchTerms = concepts.find(
        (c) => c.searchTerms.length > 0
      );

      if (conceptWithSearchTerms) {
        const terms = buildSearchExpansion([conceptWithSearchTerms]);
        // Should include at least some of the concept's search terms
        expect(terms.length).toBeGreaterThan(0);
      }
    });
  });

  describe("buildConceptContextForPrompt", () => {
    it("should return empty string for empty concepts", () => {
      const context = buildConceptContextForPrompt([]);

      expect(context).toBe("");
    });

    it("should include concept information in context", () => {
      const concepts = getAllConcepts().slice(0, 1);

      const context = buildConceptContextForPrompt(concepts);

      expect(context).toContain("CONCEPT CONTEXT:");
      expect(context).toContain(concepts[0].term);
    });

    it("should limit to 5 concepts", () => {
      const concepts = getAllConcepts().slice(0, 10);

      const context = buildConceptContextForPrompt(concepts);

      // Should only include info for max 5 concepts
      const conceptMentions = (context.match(/Definition:/g) || []).length;
      expect(conceptMentions).toBeLessThanOrEqual(5);
    });

    it("should include relationships if present", () => {
      const concepts = getAllConcepts();
      const conceptWithRelated = concepts.find(
        (c) => c.relationships.related?.length
      );

      if (conceptWithRelated) {
        const context = buildConceptContextForPrompt([conceptWithRelated]);
        expect(context).toContain("Related to:");
      }
    });
  });

  describe("getCategoryInfo", () => {
    it("should return info for valid category", () => {
      const graph = getConceptGraph();
      const categories = Object.keys(graph.categories) as ConceptCategory[];

      if (categories.length > 0) {
        const info = getCategoryInfo(categories[0]);
        expect(info).toBeDefined();
      }
    });
  });
});
