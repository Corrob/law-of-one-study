import { findReproducedExcerpt } from "../reproduction";

describe("findReproducedExcerpt", () => {
  const excerpt =
    "The harvest is the end of a cycle of experience, a time of transition between densities.";

  it("detects a verbatim excerpt in the output", () => {
    const output = `Ra teaches that ${excerpt} This is important.`;
    expect(findReproducedExcerpt(output, [excerpt])).toBe(excerpt);
  });

  it("matches despite whitespace and case differences", () => {
    const output = `THE HARVEST is the end of a cycle of experience,   a time of transition   between densities.`;
    expect(findReproducedExcerpt(output, [excerpt])).toBe(excerpt);
  });

  it("returns null when the output only paraphrases", () => {
    const output =
      "Ra describes the harvest as a threshold where beings move from one density into the next.";
    expect(findReproducedExcerpt(output, [excerpt])).toBeNull();
  });

  it("ignores short excerpts below the min length", () => {
    expect(findReproducedExcerpt("the harvest", ["the harvest"], 40)).toBeNull();
  });

  it("returns the first matching excerpt when several are given", () => {
    const other = "This is a completely different long passage that will not appear at all here.";
    const output = `intro ${excerpt} outro`;
    expect(findReproducedExcerpt(output, [other, excerpt])).toBe(excerpt);
  });

  it("handles empty inputs", () => {
    expect(findReproducedExcerpt("", [excerpt])).toBeNull();
    expect(findReproducedExcerpt("some text", [])).toBeNull();
  });
});
