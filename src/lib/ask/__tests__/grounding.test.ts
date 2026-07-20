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
    it("produces focused grounding for a matched concept", () => {
      const { focused, matchedConceptIds } = buildGrounding("Explain the harvest");
      expect(matchedConceptIds).toContain("harvest");
      expect(focused).toContain("RELEVANT CONCEPTS");
      // Excerpts are marked as private grounding, not for reproduction.
      expect(focused).toContain("do not reproduce");
    });

    it("matches common misspellings via typo aliases", () => {
      expect(buildGrounding("what is the harvist?").matchedConceptIds).toContain("harvest");
      expect(buildGrounding("tell me about wanderes and there purpose").matchedConceptIds).toContain(
        "wanderer"
      );
      expect(buildGrounding("what is cataylst").matchedConceptIds).toContain("catalyst");
    });

    it("leaves focused grounding empty when no concept matches", () => {
      const { focused, matchedConceptIds, matchedTerms } = buildGrounding(
        "what is the weather today"
      );
      expect(matchedConceptIds).toEqual([]);
      expect(matchedTerms).toEqual([]);
      expect(focused).toBe("");
    });

    it("exposes localized display terms for the grounded topics", () => {
      expect(buildGrounding("Explain the harvest", [], "en").matchedTerms).toContain("Harvest");
      expect(buildGrounding("Explica la cosecha", [], "es").matchedTerms).toContain("Cosecha");
      // Supplement ids become readable terms.
      expect(buildGrounding("Who are the men in black?", [], "en").matchedTerms).toContain(
        "men in black"
      );
    });

    it("injects a hidden supplement not in the concept graph (men in black → 12.21)", () => {
      const { focused, matchedConceptIds } = buildGrounding("Who are the men in black?");
      expect(matchedConceptIds).toContain("men-in-black");
      expect(focused).toContain("ADDITIONAL RELEVANT TOPICS");
      expect(focused).toContain("12.21");
    });
  });
});
