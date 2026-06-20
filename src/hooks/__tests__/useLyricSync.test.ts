import { findActiveCueIndex, lineProgress } from "../useLyricSync";
import { type LyricCue } from "@/lib/schemas/music";

const cues: LyricCue[] = [
  { start: 0, end: 2, text: "first" },
  { start: 2, end: 5, text: "second" },
  { start: 6, end: 8, text: "third", animationHint: "reveal" },
];

describe("findActiveCueIndex", () => {
  it("returns -1 before the first cue", () => {
    expect(findActiveCueIndex(cues, -1)).toBe(-1);
  });

  it("returns -1 for an empty cue list", () => {
    expect(findActiveCueIndex([], 3)).toBe(-1);
  });

  it("activates the cue at its exact start", () => {
    expect(findActiveCueIndex(cues, 0)).toBe(0);
    expect(findActiveCueIndex(cues, 2)).toBe(1);
    expect(findActiveCueIndex(cues, 6)).toBe(2);
  });

  it("finds the active cue mid-line", () => {
    expect(findActiveCueIndex(cues, 3.5)).toBe(1);
  });

  it("keeps the last sung line lit during an instrumental gap", () => {
    // 5.0–6.0 is a gap between cue[1].end and cue[2].start
    expect(findActiveCueIndex(cues, 5.5)).toBe(1);
  });

  it("stays on the final cue past the end", () => {
    expect(findActiveCueIndex(cues, 100)).toBe(2);
  });
});

describe("lineProgress", () => {
  it("returns 0 at the start of a cue", () => {
    expect(lineProgress(cues[1], 2)).toBe(0);
  });

  it("returns ~0.5 halfway through", () => {
    expect(lineProgress(cues[1], 3.5)).toBeCloseTo(0.5);
  });

  it("clamps to 1 past the end", () => {
    expect(lineProgress(cues[1], 99)).toBe(1);
  });

  it("clamps to 0 before the start", () => {
    expect(lineProgress(cues[1], 0)).toBe(0);
  });

  it("returns 0 for an undefined cue", () => {
    expect(lineProgress(undefined, 5)).toBe(0);
  });

  it("treats a zero-length cue as fully complete once reached", () => {
    expect(lineProgress({ start: 4, end: 4, text: "x" }, 4)).toBe(1);
    expect(lineProgress({ start: 4, end: 4, text: "x" }, 3)).toBe(0);
  });
});
