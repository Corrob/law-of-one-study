#!/usr/bin/env npx tsx
/**
 * Convert a Suno word-level alignment into our timed-lyrics cue JSON.
 *
 * Suno's `get-timestamped-lyrics` endpoint returns `alignedWords`
 * (`[{ word, startS, endS, success }]`). This pairs that word stream against
 * the song's canonical lyric lines and writes a `{ songId, cues }` file ready
 * to drop into src/data/music/lyrics/.
 *
 * Usage:
 *   npx tsx scripts/suno-aligned-to-cues.ts \
 *     --aligned aligned.json --lyrics lyrics.txt --song a-million-years-ahead --out song-06.json
 *
 *   --aligned  the Suno response (either the raw alignedWords array, or the
 *              full object with an `alignedWords` / `data.alignedWords` field)
 *   --lyrics   the song's lyric block ([section] tags are ignored)
 *   --song     the song id (must match album.ts)
 *   --out      output path
 *
 * Note: animationHint fields (e.g. "higher-self-reveal" on Song 6's reveal
 * line) are NOT inferred — add them by hand after generating.
 */
import * as fs from "fs";
import {
  alignWordsToLines,
  parseLyricLines,
  type AlignedWord,
} from "../src/lib/music/alignCues";

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const alignedPath = arg("aligned");
const lyricsPath = arg("lyrics");
const songId = arg("song");
const outPath = arg("out");

if (!alignedPath || !lyricsPath || !songId || !outPath) {
  console.error(
    "Usage: npx tsx scripts/suno-aligned-to-cues.ts --aligned <aligned.json> --lyrics <lyrics.txt> --song <song-id> --out <out.json>"
  );
  process.exit(1);
}

const alignedRaw = JSON.parse(fs.readFileSync(alignedPath, "utf-8"));
const words: AlignedWord[] = Array.isArray(alignedRaw)
  ? alignedRaw
  : (alignedRaw.alignedWords ?? alignedRaw.data?.alignedWords ?? []);

const lines = parseLyricLines(fs.readFileSync(lyricsPath, "utf-8"));
const cues = alignWordsToLines(lines, words);

fs.writeFileSync(outPath, JSON.stringify({ songId, cues }, null, 2) + "\n");

console.log(
  `Wrote ${cues.length} cues to ${outPath} (from ${words.length} aligned words, ${lines.length} lyric lines).`
);
console.log(
  'Reminder: add animationHint fields by hand (e.g. "higher-self-reveal" on Song 6\'s reveal line).'
);
