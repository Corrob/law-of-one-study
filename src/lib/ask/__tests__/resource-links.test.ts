import {
  extractRawResourceMarkers,
  extractResourceLinks,
  renderAskMarkdown,
  renderResourceLinksToMarkdown,
  stripAskMarkers,
} from "../resource-links";

describe("resource-links", () => {
  describe("renderResourceLinksToMarkdown", () => {
    it("renders a known meditation marker as a titled internal link", () => {
      expect(
        renderResourceLinksToMarkdown("Try {{LINK:meditation:balancing-the-self}} tonight.")
      ).toBe("Try [Balancing the Self](/meditate?meditation=balancing-the-self) tonight.");
    });

    it("renders song, path, and concept markers", () => {
      expect(renderResourceLinksToMarkdown("{{LINK:song:gateway}}")).toBe(
        "[Gateway](/listen?song=gateway)"
      );
      expect(renderResourceLinksToMarkdown("{{LINK:path:densities}}")).toContain(
        "](/paths/densities)"
      );
      expect(renderResourceLinksToMarkdown("{{LINK:concept:harvest}}")).toBe(
        "[Harvest](/explore?concept=harvest)"
      );
    });

    it("uses localized titles", () => {
      expect(
        renderResourceLinksToMarkdown("{{LINK:meditation:finding-love}}", "es")
      ).toBe("[Encontrar el Amor en el Momento](/meditate?meditation=finding-love)");
    });

    it("tolerates whitespace inside the marker", () => {
      expect(renderResourceLinksToMarkdown("{{LINK: song : gateway }}")).toBe(
        "[Gateway](/listen?song=gateway)"
      );
    });

    it("drops unknown ids and unknown types", () => {
      expect(renderResourceLinksToMarkdown("Try {{LINK:meditation:made-up}}.")).toBe("Try .");
      expect(renderResourceLinksToMarkdown("Try {{LINK:video:gateway}}.")).toBe("Try .");
    });

    it("emits absolute URLs when requested", () => {
      expect(
        renderResourceLinksToMarkdown("{{LINK:path:densities}}", "fr", { absolute: true })
      ).toContain("](https://lawofone.study/fr/paths/densities)");
      expect(
        renderResourceLinksToMarkdown("{{LINK:path:densities}}", "en", { absolute: true })
      ).toContain("](https://lawofone.study/paths/densities)");
    });

    it("strips every partial trailing marker prefix during streaming", () => {
      const full = "{{LINK:meditation:balancing-the-self}}";
      for (let cut = 3; cut < full.length; cut++) {
        const partial = `Before text ${full.slice(0, cut)}`;
        expect(renderResourceLinksToMarkdown(partial)).toBe("Before text ");
      }
    });

    it("leaves marker-free text untouched", () => {
      const text = "Nothing to do here, not even {braces} or {{almost.";
      expect(renderResourceLinksToMarkdown(text)).toBe(text);
    });
  });

  describe("renderAskMarkdown", () => {
    it("renders citations and resource links in one pass", () => {
      const out = renderAskMarkdown(
        "Balance matters {{CITE:5.2}}. Try {{LINK:meditation:balancing-the-self}}."
      );
      expect(out).toContain("[5.2](https://www.llresearch.org/channeling/ra-contact/5#2)");
      expect(out).toContain("[Balancing the Self](/meditate?meditation=balancing-the-self)");
    });

    it("strips a lone trailing {{ (citation pass) and a trailing {{L (link pass)", () => {
      expect(renderAskMarkdown("streaming {{")).toBe("streaming ");
      expect(renderAskMarkdown("streaming {{LINK:son")).toBe("streaming ");
    });
  });

  describe("extractResourceLinks", () => {
    it("returns distinct known links in order, skipping unknown ones", () => {
      const text =
        "{{LINK:song:gateway}} {{LINK:meditation:made-up}} {{LINK:path:densities}} {{LINK:song:gateway}}";
      expect(extractResourceLinks(text)).toEqual([
        { type: "song", id: "gateway" },
        { type: "path", id: "densities" },
      ]);
    });
  });

  describe("extractRawResourceMarkers", () => {
    it("returns every marker including invalid ones", () => {
      expect(
        extractRawResourceMarkers("{{LINK:song:gateway}} {{LINK:video:nope}}")
      ).toEqual(["song:gateway", "video:nope"]);
    });
  });

  describe("stripAskMarkers", () => {
    it("drops citations but keeps resource titles as plain text", () => {
      expect(
        stripAskMarkers("Balance {{CITE:5.2}} and rest. Try {{LINK:song:gateway}} now.")
      ).toBe("Balance and rest. Try Gateway now.");
    });

    it("removes unknown link markers without stranding punctuation", () => {
      expect(stripAskMarkers("Try {{LINK:meditation:made-up}}.")).toBe("Try.");
    });

    it("localizes the substituted title", () => {
      expect(stripAskMarkers("Try {{LINK:meditation:finding-love}}.", "es")).toBe(
        "Try Encontrar el Amor en el Momento."
      );
    });
  });
});
