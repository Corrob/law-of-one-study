import { type LyricCue } from "@/lib/schemas/music";

/**
 * Convert Suno word-level alignment into our line-level {@link LyricCue}s.
 *
 * Suno's `get-timestamped-lyrics` returns `alignedWords: [{ word, startS, endS,
 * success, ... }]`. We pair that word stream against the song's canonical lyric
 * lines: each line consumes as many words as it has tokens, and its cue spans
 * from the first word's start to the last word's end.
 */
export interface AlignedWord {
  word: string;
  startS: number;
  endS: number;
  success?: boolean;
  palign?: number;
}

const TOKEN_RE = /[a-z0-9']+/gi;
const HAS_TOKEN = /[a-z0-9']/i;

/** Singable lines from raw lyric text: drops `[section tags]` and blank lines. */
export function parseLyricLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("["));
}

function tokenCount(line: string): number {
  return line.match(TOKEN_RE)?.length ?? 0;
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

export function alignWordsToLines(
  lines: string[],
  words: AlignedWord[]
): LyricCue[] {
  // Keep only words with real content (skip failed alignments and tag tokens).
  const stream = words.filter(
    (w) =>
      w.success !== false &&
      HAS_TOKEN.test(w.word) &&
      !w.word.trim().startsWith("[")
  );

  const cues: LyricCue[] = [];
  let i = 0;
  for (const line of lines) {
    const n = tokenCount(line);
    if (n === 0) continue;
    if (i >= stream.length) break;
    const lastIndex = Math.min(i + n - 1, stream.length - 1);
    cues.push({
      start: round(stream[i].startS),
      end: round(stream[lastIndex].endS),
      text: line,
    });
    i = lastIndex + 1;
  }
  return cues;
}
