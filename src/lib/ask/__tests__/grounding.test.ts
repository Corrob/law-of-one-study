import { selectConcepts, buildGrounding } from "../grounding";
import { ASK_MAX_FOCUSED_CONCEPTS } from "../config";

describe("grounding", () => {
  describe("selectConcepts", () => {
    it("finds a concept named in the message", () => {
      const concepts = selectConcepts("What is the harvest?");
      const ids = concepts.map((c) => c.id);
      expect(ids).toContain("harvest");
    });

    it("caps the number of focused concepts", () => {
      const concepts = selectConcepts(
        "Tell me about harvest, polarity, catalyst, densities, wanderers, the veil, and love."
      );
      expect(concepts.length).toBeLessThanOrEqual(ASK_MAX_FOCUSED_CONCEPTS);
    });

    it("falls back to recent history for a context-free follow-up", () => {
      const concepts = selectConcepts("tell me more", [
        { role: "user", content: "What is the harvest?" },
        { role: "assistant", content: "Harvest is a transition..." },
      ]);
      expect(concepts.map((c) => c.id)).toContain("harvest");
    });

    it("returns an empty list when nothing matches", () => {
      expect(selectConcepts("what is the weather today")).toEqual([]);
    });
  });

  describe("buildGrounding", () => {
    it("always produces a non-empty atlas", () => {
      const { atlas } = buildGrounding("anything");
      expect(atlas.length).toBeGreaterThan(0);
      expect(atlas).toContain("CONCEPT ATLAS");
    });

    it("produces focused grounding for a matched concept", () => {
      const { focused, matchedConceptIds } = buildGrounding("Explain the harvest");
      expect(matchedConceptIds).toContain("harvest");
      expect(focused).toContain("RELEVANT CONCEPTS");
      // Excerpts are marked as private grounding, not for reproduction.
      expect(focused).toContain("do not reproduce");
    });

    it("leaves focused grounding empty when no concept matches", () => {
      const { focused, matchedConceptIds } = buildGrounding("what is the weather today");
      expect(matchedConceptIds).toEqual([]);
      expect(focused).toBe("");
    });
  });
});
