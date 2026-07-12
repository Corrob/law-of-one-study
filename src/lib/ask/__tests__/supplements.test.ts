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

    it("matches a bare 'pyramid' to the great-pyramid entry, including localized aliases", () => {
      expect(identifySupplements("What about the pyramid?").map((s) => s.id)).toContain(
        "great-pyramid"
      );
      expect(identifySupplements("¿qué es la pirámide?", "es").map((s) => s.id)).toContain(
        "great-pyramid"
      );
    });

    it("grounds psychic greeting/attack questions", () => {
      expect(
        identifySupplements("I think negative entities are attacking me").map((s) => s.id)
      ).toContain("psychic-greeting");
      expect(identifySupplements("what is a psychic greeting?").map((s) => s.id)).toContain(
        "psychic-greeting"
      );
    });

    it("grounds grief and death questions", () => {
      expect(
        identifySupplements("I lost my mother recently and I'm really struggling").map((s) => s.id)
      ).toContain("death-and-grief");
      expect(
        identifySupplements("I'm scared of dying and what comes after").map((s) => s.id)
      ).toContain("death-and-grief");
      expect(identifySupplements("is there life after death?").map((s) => s.id)).toContain(
        "death-and-grief"
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

    it("matches 'dreams' but not the substring in 'daydream'", () => {
      expect(identifySupplements("what do dreams mean?").map((s) => s.id)).toContain("dreams");
      expect(identifySupplements("I was daydreaming today").map((s) => s.id)).not.toContain(
        "dreams"
      );
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
