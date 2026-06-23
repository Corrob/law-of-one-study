import fs from "fs";
import path from "path";
import {
  ALL_ANIMATION_HINTS,
  LYRIC_FX_EFFECTS,
  isLyricFxEffect,
} from "../animationHints";

type LyricFile = { cues: Array<{ animationHint?: string }> };

const lyricsDir = path.join(process.cwd(), "src/data/music/lyrics");

describe("lyric animation hints", () => {
  for (let i = 1; i <= 7; i++) {
    const file = `song-0${i}.json`;
    it(`${file} annotates lines with only known hints`, () => {
      const data = JSON.parse(
        fs.readFileSync(path.join(lyricsDir, file), "utf8")
      ) as LyricFile;
      const hints = data.cues
        .map((c) => c.animationHint)
        .filter((h): h is string => h != null);
      hints.forEach((h) => expect(ALL_ANIMATION_HINTS.has(h)).toBe(true));
      // Every song should drive at least one synced moment.
      expect(hints.length).toBeGreaterThan(0);
    });
  }

  it("isLyricFxEffect recognizes the generic FX vocabulary only", () => {
    expect(isLyricFxEffect("bloom")).toBe(true);
    expect(isLyricFxEffect("spark")).toBe(true);
    expect(isLyricFxEffect("higher-self-reveal")).toBe(false);
    expect(isLyricFxEffect("nonsense")).toBe(false);
    expect(isLyricFxEffect(undefined)).toBe(false);
    expect(LYRIC_FX_EFFECTS.length).toBeGreaterThan(0);
  });
});
