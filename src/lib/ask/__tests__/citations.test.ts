import {
  lawOfOneUrl,
  getKnownReferences,
  renderCitationsToMarkdown,
  extractCitedReferences,
} from "../citations";

describe("citations", () => {
  describe("lawOfOneUrl", () => {
    it("maps session.question to a lawofone.info deep link", () => {
      expect(lawOfOneUrl("10.14")).toBe("https://www.lawofone.info/s/10#14");
      expect(lawOfOneUrl("6.14")).toBe("https://www.lawofone.info/s/6#14");
    });

    it("handles the session-intro reference form", () => {
      expect(lawOfOneUrl("1.0")).toBe("https://www.lawofone.info/s/1#0");
    });
  });

  describe("getKnownReferences", () => {
    it("includes real references curated in the concept graph", () => {
      const known = getKnownReferences();
      expect(known.size).toBeGreaterThan(0);
      // "6.14" is a curated harvest key passage.
      expect(known.has("6.14")).toBe(true);
      expect(known.has("999.999")).toBe(false);
    });
  });

  describe("renderCitationsToMarkdown", () => {
    it("turns a known citation marker into a Markdown link", () => {
      const out = renderCitationsToMarkdown("Harvest is real {{CITE:6.14}}.");
      expect(out).toBe("Harvest is real [6.14](https://www.lawofone.info/s/6#14).");
    });

    it("drops an unknown (possibly hallucinated) reference", () => {
      const out = renderCitationsToMarkdown("Made up {{CITE:999.999}}.");
      expect(out).toBe("Made up .");
    });

    it("hides an incomplete trailing marker during streaming", () => {
      expect(renderCitationsToMarkdown("Streaming {{CITE:6.1")).toBe("Streaming ");
      expect(renderCitationsToMarkdown("Streaming {{")).toBe("Streaming ");
    });

    it("leaves plain text untouched", () => {
      expect(renderCitationsToMarkdown("No markers here.")).toBe("No markers here.");
    });
  });

  describe("extractCitedReferences", () => {
    it("returns distinct known references in order", () => {
      const refs = extractCitedReferences("A {{CITE:6.14}} B {{CITE:6.14}} C {{CITE:999.999}}");
      expect(refs).toEqual(["6.14"]);
    });
  });
});
