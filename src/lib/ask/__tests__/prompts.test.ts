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
      expect(out).toBe("SEEKER'S QUESTION:\nhello");
    });
  });
});
