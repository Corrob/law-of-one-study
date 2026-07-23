import {
  identifyChannelingThemes,
  buildChannelingGrounding,
  getChannelingThemes,
  getChannelingTheme,
  getChannelingThemeReferences,
  channelingThemeTitle,
} from "../channeling";
import {
  getChannelingReference,
  getKnownChannelingReferenceIds,
  channelingCitationUrl,
  channelingCitationLabel,
} from "../channeling-references";
import { buildGrounding } from "../grounding";
import knownChannelingReferences from "@/data/known-channeling-references.json";

describe("channeling references", () => {
  it("resolves a known reference to its llresearch.org URL", () => {
    expect(channelingCitationUrl("2000-0220")).toBe(
      "https://www.llresearch.org/channeling/2000/0220"
    );
  });

  it("labels a known reference with entity and date", () => {
    expect(channelingCitationLabel("2000-0220")).toBe("Q'uo · February 20, 2000");
    expect(channelingCitationLabel("1980-0518")).toBe("Latwii · May 18, 1980");
  });

  it("returns null for unknown references", () => {
    expect(channelingCitationUrl("1999-1231")).toBeNull();
    expect(channelingCitationLabel("1999-1231")).toBeNull();
    expect(getChannelingReference("1999-1231")).toBeNull();
  });
});

describe("channeling theme data integrity", () => {
  it("every theme reference exists in the known-references whitelist", () => {
    const knownIds = getKnownChannelingReferenceIds();
    for (const reference of getChannelingThemeReferences()) {
      expect(knownIds).toContain(reference);
    }
  });

  it("theme ids are unique", () => {
    const ids = getChannelingThemes().map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every theme resolves a non-empty display title", () => {
    for (const theme of getChannelingThemes()) {
      expect(channelingThemeTitle(theme).length).toBeGreaterThan(0);
    }
  });

  it("every theme has at least one reference that resolves to a live URL + label", () => {
    for (const theme of getChannelingThemes()) {
      const resolved = theme.references.filter(
        (r) => channelingCitationUrl(r) && channelingCitationLabel(r)
      );
      expect(resolved.length).toBeGreaterThan(0);
    }
  });

  it("getChannelingTheme returns a theme by id and null for unknown", () => {
    const first = getChannelingThemes()[0];
    expect(getChannelingTheme(first.id)?.id).toBe(first.id);
    expect(getChannelingTheme("not-a-real-theme")).toBeNull();
  });

  it("channelingThemeTitle humanizes an id when no title is set", () => {
    expect(
      channelingThemeTitle({ id: "the-open-heart", aliases: ["x"], summary: "y", references: ["2000-0220"] })
    ).toBe("The Open Heart");
  });

  it("no alias is shared across themes (last-wins would mis-route it)", () => {
    const owner = new Map<string, string>();
    const collisions: string[] = [];
    for (const theme of getChannelingThemes()) {
      for (const alias of theme.aliases) {
        const key = alias.toLowerCase();
        const prev = owner.get(key);
        if (prev && prev !== theme.id) {
          collisions.push(`"${alias}" in both ${prev} and ${theme.id}`);
        }
        owner.set(key, theme.id);
      }
    }
    expect(collisions).toEqual([]);
  });
});

describe("known-channeling-references internal consistency", () => {
  // Mirrors the offline checks in scripts/validate-channeling-citations.ts so a
  // malformed date/path in the whitelist fails CI, not just the manual script.
  const references = knownChannelingReferences.references as Record<
    string,
    { source: string; date: string; path: string }
  >;

  it("every id's date and path agree with the id", () => {
    const mismatches: string[] = [];
    for (const [id, ref] of Object.entries(references)) {
      const m = id.match(/^(\d{4})-(\d{2})(\d{2})(_\d{2})?$/);
      if (!m) {
        mismatches.push(`${id}: malformed id`);
        continue;
      }
      const [, y, mo, d, suffix] = m;
      const expectedDate = `${y}-${mo}-${d}`;
      const expectedPath = `/channeling/${y}/${mo}${d}${suffix ?? ""}`;
      if (ref.date !== expectedDate) mismatches.push(`${id}: date ${ref.date} != ${expectedDate}`);
      if (ref.path !== expectedPath) mismatches.push(`${id}: path ${ref.path} != ${expectedPath}`);
      if (!ref.source.trim()) mismatches.push(`${id}: empty source`);
    }
    expect(mismatches).toEqual([]);
  });

  it("every whitelisted reference is used by at least one theme", () => {
    const used = new Set(getChannelingThemeReferences());
    const orphans = Object.keys(references).filter((id) => !used.has(id));
    expect(orphans).toEqual([]);
  });
});

describe("identifyChannelingThemes", () => {
  it("matches a theme by alias, case-insensitively", () => {
    const found = identifyChannelingThemes("Am I a Wanderer? I never felt at home here.");
    expect(found.map((t) => t.id)).toContain("wanderers-lived-experience");
  });

  it("matches multi-word aliases as whole phrases", () => {
    const found = identifyChannelingThemes("How do I keep an open heart when I'm afraid?");
    expect(found.map((t) => t.id)).toContain("the-open-heart");
  });

  it("does not match inside larger words", () => {
    // "silence" must not match inside "silenced" etc.
    const found = identifyChannelingThemes("The critics were silencedxyz");
    expect(found).toHaveLength(0);
  });

  it("returns nothing for unrelated text", () => {
    expect(identifyChannelingThemes("What is the density of tungsten?")).toHaveLength(0);
  });
});

describe("buildChannelingGrounding", () => {
  it("returns empty string for no themes", () => {
    expect(buildChannelingGrounding([])).toBe("");
  });

  it("includes summaries, QCITE instructions, and entity-tagged refs", () => {
    const themes = identifyChannelingThemes("tell me about angels");
    const block = buildChannelingGrounding(themes);
    expect(block).toContain("CONFEDERATION CHANNELING TOPICS");
    expect(block).toContain("{{QCITE:id}}");
    expect(block).toContain("2011-0212 (Q'uo)");
    expect(block).toContain("never left the vibration of the Creator");
  });
});

describe("buildGrounding source modes", () => {
  it("uses the Ra library by default, with no channeling", () => {
    const grounding = buildGrounding("what do angels do?", [], "en");
    expect(grounding.channelingIds).toHaveLength(0);
    expect(grounding.focused).not.toContain("CONFEDERATION CHANNELING TOPICS");
  });

  it("grounds ONLY in channeling themes in channeling mode", () => {
    const grounding = buildGrounding(
      "what do angels do in meditation?",
      [],
      "en",
      "channeling"
    );
    expect(grounding.channelingIds).toContain("angels-and-unseen-help");
    expect(grounding.focused).toContain("CONFEDERATION CHANNELING TOPICS");
    expect(grounding.matchedConceptIds).toContain("chan:angels-and-unseen-help");
    expect(grounding.matchedTerms).toContain("angels and unseen help");
    // No Ra grounding in channeling mode: every id is a channeling theme, the
    // focused block is channeling-only, and there are no private excerpts.
    expect(grounding.matchedConceptIds.every((id) => id.startsWith("chan:"))).toBe(true);
    expect(grounding.focused.startsWith("CONFEDERATION CHANNELING TOPICS")).toBe(true);
    expect(grounding.focused).not.toContain("ADDITIONAL RELEVANT TOPICS");
    expect(grounding.excerpts).toHaveLength(0);
  });

  it("falls back to the Ra library for non-English locales", () => {
    const grounding = buildGrounding("what do angels do?", [], "es", "channeling");
    expect(grounding.channelingIds).toHaveLength(0);
    expect(grounding.focused).not.toContain("CONFEDERATION CHANNELING TOPICS");
  });

  it("falls back to recent history when the message names no theme", () => {
    const history = [
      { role: "user" as const, content: "Do angels really help us?" },
      { role: "assistant" as const, content: "Q'uo speaks of unseen help..." },
    ];
    const grounding = buildGrounding("tell me more", history, "en", "channeling");
    expect(grounding.channelingIds).toContain("angels-and-unseen-help");
  });

  it("returns empty focused grounding when channeling mode matches nothing", () => {
    const grounding = buildGrounding("what is tungsten?", [], "en", "channeling");
    expect(grounding.focused).toBe("");
    expect(grounding.channelingIds).toHaveLength(0);
  });
});
