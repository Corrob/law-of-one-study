import { parseLyricLines, alignWordsToLines, type AlignedWord } from "../alignCues";

describe("parseLyricLines", () => {
  it("keeps singable lines and drops section tags + blanks", () => {
    const text = [
      "[Verse 1 — intro]",
      "hello world",
      "",
      "second line here",
      "[Chorus]",
    ].join("\n");
    expect(parseLyricLines(text)).toEqual(["hello world", "second line here"]);
  });
});

describe("alignWordsToLines", () => {
  const words: AlignedWord[] = [
    { word: "hello", startS: 0, endS: 0.5 },
    { word: "world", startS: 0.5, endS: 1.0 },
    { word: "second", startS: 2.0, endS: 2.4 },
    { word: "line", startS: 2.4, endS: 2.8 },
    { word: "here", startS: 2.8, endS: 3.2 },
  ];

  it("spans each line from its first word's start to its last word's end", () => {
    const cues = alignWordsToLines(["hello world", "second line here"], words);
    expect(cues).toEqual([
      { start: 0, end: 1.0, text: "hello world" },
      { start: 2.0, end: 3.2, text: "second line here" },
    ]);
  });

  it("skips failed alignments and tag tokens in the word stream", () => {
    const noisy: AlignedWord[] = [
      { word: "[Verse]", startS: 0, endS: 0 },
      { word: "hello", startS: 1, endS: 1.5 },
      { word: "ghost", startS: 1.5, endS: 2, success: false },
      { word: "world", startS: 2, endS: 2.5 },
    ];
    const cues = alignWordsToLines(["hello world"], noisy);
    expect(cues).toEqual([{ start: 1, end: 2.5, text: "hello world" }]);
  });

  it("is best-effort when there are fewer words than tokens", () => {
    const cues = alignWordsToLines(["one two three four"], [
      { word: "one", startS: 0, endS: 1 },
      { word: "two", startS: 1, endS: 2 },
    ]);
    expect(cues).toEqual([{ start: 0, end: 2, text: "one two three four" }]);
  });

  it("handles parentheticals and punctuation-rich lines", () => {
    const cues = alignWordsToLines(["(home to me)"], [
      { word: "home", startS: 5, endS: 5.4 },
      { word: "to", startS: 5.4, endS: 5.6 },
      { word: "me", startS: 5.6, endS: 6.0 },
    ]);
    expect(cues).toEqual([{ start: 5, end: 6.0, text: "(home to me)" }]);
  });

  it("returns nothing for empty input", () => {
    expect(alignWordsToLines([], words)).toEqual([]);
    expect(alignWordsToLines(["hello"], [])).toEqual([]);
  });
});
