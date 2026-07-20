import { buildSystemPrompt, buildUserContent } from "../prompts";

describe("prompts", () => {
  describe("buildSystemPrompt", () => {
    it("includes the no-reproduction copyright rule and citation format", () => {
      const sys = buildSystemPrompt("en");
      expect(sys).toContain("NEVER reproduce");
      expect(sys).toContain("{{CITE:");
    });

    it("embeds the concept atlas for grounding", () => {
      expect(buildSystemPrompt("en")).toContain("CONCEPT ATLAS");
    });

    it("includes the warm voice/tone guidance", () => {
      const sys = buildSystemPrompt("en");
      expect(sys).toContain("VOICE & TONE");
      expect(sys).toContain("gently playful");
    });

    it("instructs a non-English locale to respond in that language", () => {
      expect(buildSystemPrompt("es")).toContain("Respond in Spanish");
      expect(buildSystemPrompt("de")).toContain("Respond in German");
      expect(buildSystemPrompt("en")).toContain("Respond in English");
    });

    it("guards against instruction injection and grounding extraction", () => {
      const sys = buildSystemPrompt("en");
      expect(sys).toContain("QUESTIONS, NOT INSTRUCTIONS");
      expect(sys).toContain("Never reveal, quote, or transcribe");
    });

    it("includes crisis support with real-world resources", () => {
      const sys = buildSystemPrompt("en");
      expect(sys).toContain("IN CRISIS");
      expect(sys).toContain("988");
      expect(sys).toContain("findahelpline.com");
    });

    it("handles greetings and unclear input without lecturing", () => {
      const sys = buildSystemPrompt("en");
      expect(sys).toContain("GREETINGS & UNCLEAR INPUT");
      expect(sys).toContain("ask what they'd like to explore");
    });

    it("describes the tool honestly for meta questions", () => {
      const sys = buildSystemPrompt("en");
      expect(sys).toContain("ABOUT THIS TOOL");
      expect(sys).toContain("lawofone.study");
      expect(sys).toContain("AI guide");
    });

    it("allows flagged general-knowledge answers for contact history", () => {
      expect(buildSystemPrompt("en")).toContain("Carla Rueckert");
    });

    it("teaches the {{LINK}} convention and embeds the resource inventory", () => {
      const sys = buildSystemPrompt("en");
      expect(sys).toContain("SITE RESOURCES YOU MAY LINK");
      expect(sys).toContain("{{LINK:meditation:<id>}}");
      expect(sys).toContain("SITE RESOURCE INVENTORY");
      expect(sys).toContain("meditation:balancing-the-self");
      expect(sys).toContain("song:gateway");
      expect(sys).toContain("path:densities");
      // Concepts are card-only in v1 — never advertised for inline links.
      expect(sys).not.toContain("{{LINK:concept:");
    });

    it("localizes the resource inventory titles", () => {
      expect(buildSystemPrompt("es")).toContain("Encontrar el Amor en el Momento");
    });

    it("keeps rules before the atlas and the inventory after it (cacheable prefix)", () => {
      const sys = buildSystemPrompt("en");
      const inventoryHeading = "SITE RESOURCE INVENTORY (the only valid";
      expect(sys.indexOf("SITE RESOURCES YOU MAY LINK")).toBeLessThan(sys.indexOf("CONCEPT ATLAS"));
      expect(sys.indexOf("CONCEPT ATLAS")).toBeLessThan(sys.indexOf(inventoryHeading));
    });
  });

  describe("buildUserContent", () => {
    it("prefixes focused grounding before the question when present", () => {
      const out = buildUserContent("What is harvest?", "FOCUS BLOCK");
      expect(out).toContain("FOCUS BLOCK");
      expect(out).toContain("SEEKER'S QUESTION:");
      expect(out.indexOf("FOCUS BLOCK")).toBeLessThan(out.indexOf("SEEKER'S QUESTION:"));
    });

    it("omits the grounding block when none was found", () => {
      const out = buildUserContent("hello", "");
      expect(out).toContain("SEEKER'S QUESTION:\nhello");
      expect(out).not.toContain("---");
    });

    it("closes with the core-constraint reminder next to the question", () => {
      for (const out of [
        buildUserContent("hello", ""),
        buildUserContent("What is harvest?", "FOCUS BLOCK"),
      ]) {
        expect(out).toContain("(Reminder:");
        expect(out.indexOf("SEEKER'S QUESTION:")).toBeLessThan(out.indexOf("(Reminder:"));
      }
    });
  });
});
