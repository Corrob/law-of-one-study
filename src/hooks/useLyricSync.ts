import { useEffect, useState } from "react";
import { type LyricCue } from "@/lib/schemas/music";
import { type AudioClock } from "./useAudioClock";

/**
 * Index of the cue that should be highlighted at `time`.
 *
 * The active line is the last cue whose `start` is <= time (karaoke
 * convention — the most recently *sung* line stays lit during instrumental
 * gaps). Returns -1 before the first cue. Cues are assumed sorted by `start`.
 */
export function findActiveCueIndex(cues: LyricCue[], time: number): number {
  let active = -1;
  for (let i = 0; i < cues.length; i++) {
    if (time >= cues[i].start) active = i;
    else break;
  }
  return active;
}

/** A gap to the next line longer than this counts as an instrumental break. */
const LONG_GAP_SECONDS = 4;
/** How long the just-sung line keeps glowing into a long instrumental gap. */
const LIT_LINGER_SECONDS = 1.5;

/**
 * Whether the active line's highlight should still be lit at `time`.
 *
 * A line stays lit while it is being sung (`time <= end`). After it ends we keep
 * it lit through *short* gaps so consecutive lines hand off without a flicker —
 * but during a *long* instrumental break it glows for a brief moment and then
 * turns off, so a line never lingers lit while the music plays on without it.
 */
export function isCueLit(
  cues: LyricCue[],
  index: number,
  time: number
): boolean {
  if (index < 0) return false;
  const cue = cues[index];
  if (time <= cue.end) return true;
  const next = cues[index + 1];
  const gap = (next ? next.start : Infinity) - cue.end;
  if (gap > LONG_GAP_SECONDS) return time <= cue.end + LIT_LINGER_SECONDS;
  return true;
}

export interface LyricSync {
  /** Active cue index (React state — changes ~once per line). -1 = none yet. */
  activeIndex: number;
  /** Whether the active line's highlight is currently lit (off in instrumental gaps). */
  lit: boolean;
  /** animationHint of the active cue, if any (drives special scene states). */
  activeHint: string | undefined;
}

/**
 * Subscribes to an {@link AudioClock} and derives the active lyric line.
 *
 * Line-index changes go through React state (cheap — changes about once per
 * line, not per frame).
 */
export function useLyricSync(
  cues: LyricCue[],
  clock: AudioClock | null
): LyricSync {
  const [activeIndex, setActiveIndex] = useState(-1);
  const [lit, setLit] = useState(false);
  const [activeHint, setActiveHint] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!clock) return;
    let lastIndex = -1;
    let lastLit = false;

    const unsubscribe = clock.subscribe((time) => {
      const idx = findActiveCueIndex(cues, time);
      const nextLit = isCueLit(cues, idx, time);
      if (idx !== lastIndex || nextLit !== lastLit) {
        lastIndex = idx;
        lastLit = nextLit;
        setActiveIndex(idx);
        setLit(nextLit);
        setActiveHint(idx >= 0 ? cues[idx].animationHint : undefined);
      }
    });

    return unsubscribe;
  }, [cues, clock]);

  return { activeIndex, lit, activeHint };
}
