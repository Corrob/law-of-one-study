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

/** Progress 0..1 through a single cue at `time` (for karaoke fill / scroll easing). */
export function lineProgress(cue: LyricCue | undefined, time: number): number {
  if (!cue) return 0;
  const dur = cue.end - cue.start;
  if (dur <= 0) return time >= cue.start ? 1 : 0;
  return Math.min(1, Math.max(0, (time - cue.start) / dur));
}

export interface LyricSync {
  /** Active cue index (React state — changes ~once per line). -1 = none yet. */
  activeIndex: number;
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
  const [activeHint, setActiveHint] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!clock) return;
    let lastIndex = -1;

    const unsubscribe = clock.subscribe((time) => {
      const idx = findActiveCueIndex(cues, time);
      if (idx !== lastIndex) {
        lastIndex = idx;
        setActiveIndex(idx);
        setActiveHint(idx >= 0 ? cues[idx].animationHint : undefined);
      }
    });

    return unsubscribe;
  }, [cues, clock]);

  return { activeIndex, activeHint };
}
