import {
  identifySupplements,
  buildSupplementGrounding,
  getSupplementReferences,
} from "../supplements";

describe("supplements", () => {
  describe("identifySupplements", () => {
    it("matches a multi-word alias in a sentence", () => {
      const ids = identifySupplements("What did Ra say about men in black?").map((s) => s.id);
      expect(ids).toContain("men-in-black");
    });

    it("matches an alias case-insensitively (MIB)", () => {
      const ids = identifySupplements("tell me about mib").map((s) => s.id);
      expect(ids).toContain("men-in-black");
    });

    it("returns nothing for unrelated text", () => {
      expect(identifySupplements("what is the weather today")).toEqual([]);
    });

    it("matches other curated entries (bigfoot, atlantis, tesla)", () => {
      expect(identifySupplements("is bigfoot real?").map((s) => s.id)).toContain("bigfoot");
      expect(identifySupplements("tell me about Atlantis").map((s) => s.id)).toContain("atlantis");
      expect(identifySupplements("was Nikola Tesla a wanderer?").map((s) => s.id)).toContain(
        "nikola-tesla"
      );
    });

    it("dedupes when several aliases of the same entry appear", () => {
      const hits = identifySupplements("the men in black, aka MIB").filter(
        (s) => s.id === "men-in-black"
      );
      expect(hits.length).toBe(1);
    });

    it("falls back to English aliases for a non-English locale", () => {
      const ids = identifySupplements("¿qué dijo Ra sobre los men in black?", "es").map(
        (s) => s.id
      );
      expect(ids).toContain("men-in-black");
    });
  });

  describe("buildSupplementGrounding", () => {
    it("includes the summary heading and the reference", () => {
      const grounding = buildSupplementGrounding(identifySupplements("men in black"));
      expect(grounding).toContain("ADDITIONAL RELEVANT TOPICS");
      expect(grounding).toContain("12.21");
    });

    it("returns an empty string when there are no matches", () => {
      expect(buildSupplementGrounding([])).toBe("");
    });
  });

  describe("getSupplementReferences", () => {
    it("exposes the seeded reference for the whitelist", () => {
      expect(getSupplementReferences()).toContain("12.21");
    });
  });
});
