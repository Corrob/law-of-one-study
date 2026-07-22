/**
 * QCITE marker handling in the citation/rendering pipeline (the conscious-
 * channeling counterpart of the {{CITE:...}} tests in citations.test.ts).
 */

import { renderCitationsToMarkdown, extractChannelingCitations } from "../citations";
import { stripAskMarkers } from "../resource-links";
import { buildSystemPrompt, buildUserContent } from "../prompts";

describe("renderCitationsToMarkdown with QCITE markers", () => {
  it("renders a known channeling reference as a labeled link", () => {
    const rendered = renderCitationsToMarkdown(
      "Q'uo counsels silence {{QCITE:2000-0220}}.",
      "en"
    );
    expect(rendered).toBe(
      "Q'uo counsels silence [Q'uo · February 20, 2000](https://www.llresearch.org/channeling/2000/0220)."
    );
  });

  it("drops unknown channeling references", () => {
    expect(renderCitationsToMarkdown("Nope {{QCITE:1999-1231}}.", "en")).toBe("Nope .");
  });

  it("renders Ra and channeling citations side by side", () => {
    const rendered = renderCitationsToMarkdown(
      "Ra says {{CITE:6.14}} and Q'uo adds {{QCITE:1980-0518}}.",
      "en"
    );
    expect(rendered).toContain("[6.14](");
    expect(rendered).toContain("[Latwii · May 18, 1980](https://www.llresearch.org/channeling/1980/0518)");
  });

  it("hides a partial trailing QCITE marker mid-stream", () => {
    expect(renderCitationsToMarkdown("Q'uo suggests {{QCITE:2000-02", "en")).toBe(
      "Q'uo suggests "
    );
    expect(renderCitationsToMarkdown("Q'uo suggests {{QC", "en")).toBe("Q'uo suggests ");
    expect(renderCitationsToMarkdown("Q'uo suggests {{Q", "en")).toBe("Q'uo suggests ");
  });

  it("still hides a partial trailing CITE marker", () => {
    expect(renderCitationsToMarkdown("Harvest {{CITE:6.1", "en")).toBe("Harvest ");
  });
});

describe("extractChannelingCitations", () => {
  it("returns distinct known references in order of first appearance", () => {
    const text =
      "One {{QCITE:2000-0220}}, two {{QCITE:1980-0518}}, repeat {{QCITE:2000-0220}}, unknown {{QCITE:1999-1231}}.";
    expect(extractChannelingCitations(text)).toEqual(["2000-0220", "1980-0518"]);
  });
});

describe("stripAskMarkers with QCITE markers", () => {
  it("removes channeling citation markers", () => {
    expect(stripAskMarkers("Silence helps {{QCITE:2000-0220}}.", "en")).toBe("Silence helps.");
  });
});

describe("prompts channeling rules", () => {
  it("includes the channeling context only in the English system prompt", () => {
    expect(buildSystemPrompt("en")).toContain("CONFEDERATION CHANNELING");
    expect(buildSystemPrompt("es")).not.toContain("CONFEDERATION CHANNELING");
    expect(buildSystemPrompt("de")).not.toContain("CONFEDERATION CHANNELING");
    expect(buildSystemPrompt("fr")).not.toContain("CONFEDERATION CHANNELING");
  });

  it("appends the channeling reminder only when channeling topics are grounded", () => {
    const withChanneling = buildUserContent("q", "focused", true);
    const without = buildUserContent("q", "focused", false);
    expect(withChanneling).toContain("{{QCITE:id}}");
    expect(without).not.toContain("QCITE");
  });
});
