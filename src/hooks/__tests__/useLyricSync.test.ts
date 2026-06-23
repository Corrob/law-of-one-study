import { findActiveCueIndex, isCueLit } from "../useLyricSync";
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

describe("isCueLit", () => {
  it("is unlit when there is no active line", () => {
    expect(isCueLit(cues, -1, 1)).toBe(false);
  });

  it("is lit while the line is being sung", () => {
    expect(isCueLit(cues, 1, 3.5)).toBe(true);
    expect(isCueLit(cues, 1, 5)).toBe(true); // at the end
  });

  it("stays lit through a short gap so lines hand off cleanly", () => {
    // cue[1].end = 5, cue[2].start = 6 → 1s gap (< 4s)
    expect(isCueLit(cues, 1, 5.5)).toBe(true);
  });

  it("turns off during a long instrumental gap after a brief linger", () => {
    const gapped: LyricCue[] = [
      { start: 0, end: 2, text: "a" },
      { start: 10, end: 12, text: "b" }, // 8s gap (> 4s)
    ];
    expect(isCueLit(gapped, 0, 3)).toBe(true); // within the 1.5s linger
    expect(isCueLit(gapped, 0, 4)).toBe(false); // past the linger
    expect(isCueLit(gapped, 0, 9)).toBe(false);
  });

  it("does not linger forever on the final line", () => {
    expect(isCueLit(cues, 2, 8.5)).toBe(true); // within linger of end (8)
    expect(isCueLit(cues, 2, 12)).toBe(false); // long after the song's last word
  });
});
