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

    it("matches localized aliases in each supported locale", () => {
      expect(identifySupplements("¿Quiénes son los hombres de negro?", "es").map((s) => s.id)).toContain("men-in-black");
      expect(identifySupplements("Wer sind die Männer in Schwarz?", "de").map((s) => s.id)).toContain("men-in-black");
      expect(identifySupplements("Qui sont les hommes en noir ?", "fr").map((s) => s.id)).toContain("men-in-black");
      expect(identifySupplements("¿Qué son los ovnis?", "es").map((s) => s.id)).toContain("ufo");
      expect(identifySupplements("Que sont les ovnis ?", "fr").map((s) => s.id)).toContain("ufo");
      expect(identifySupplements("Was ist eine Gedankenform?", "de").map((s) => s.id)).toContain("thought-form");
      expect(identifySupplements("Was sagt Ra über Träume?", "de").map((s) => s.id)).toContain("dreams");
      expect(identifySupplements("Que dit Ra sur les rêves ?", "fr").map((s) => s.id)).toContain("dreams");
    });

    it("matches aliases that start or end with accented letters (unicode boundaries)", () => {
      expect(identifySupplements("Qui a fait les têtes de l'île de Pâques ?", "fr").map((s) => s.id)).toContain("easter-island");
      expect(identifySupplements("Qu'est-ce qu'une forme-pensée ?", "fr").map((s) => s.id)).toContain("thought-form");
      expect(identifySupplements("¿Qué dice Ra sobre Jesús?", "es").map((s) => s.id)).toContain("jesus");
    });

    it("matches curated off-graph topics Ra discusses", () => {
      expect(identifySupplements("What are the Nazca lines?").map((s) => s.id)).toContain("nazca-lines");
      expect(identifySupplements("What caused the Tunguska explosion?").map((s) => s.id)).toContain("tunguska");
      expect(identifySupplements("What causes cattle mutilations?").map((s) => s.id)).toContain("cattle-mutilations");
      expect(identifySupplements("I found silver flecks on my face").map((s) => s.id)).toContain("silver-flecks");
      expect(identifySupplements("What was the Philadelphia Experiment?").map((s) => s.id)).toContain("philadelphia-experiment");
      expect(identifySupplements("Who gave the Urantia book?").map((s) => s.id)).toContain("urantia-book");
      expect(identifySupplements("What does Ra say about crystals?").map((s) => s.id)).toContain("crystal-healing");
      expect(identifySupplements("Who was Akhenaten?").map((s) => s.id)).toContain("akhenaten");
      expect(identifySupplements("What contact happened in South America?").map((s) => s.id)).toContain("south-america-contact");
      expect(identifySupplements("What does Ra say about Yahweh?").map((s) => s.id)).toContain("yahweh");
    });

    it("does not match 'crystal' inside 'crystallization'", () => {
      expect(identifySupplements("What is crystallization of the healer?").map((s) => s.id)).not.toContain("crystal-healing");
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
