"use client";

import { useEffect, useRef } from "react";
import { type LyricCue } from "@/lib/schemas/music";

interface LyricsDisplayProps {
  cues: LyricCue[];
  /** Active cue index from useLyricSync (-1 = none yet). */
  activeIndex: number;
  /** Whether the active line's highlight is lit now (off during instrumental gaps). */
  lit: boolean;
  /** Density ray color of the current song — tints the active line's glow. */
  densityColor: string;
  reducedMotion: boolean;
  /** Seek the audio to a line's start time when tapped. */
  onSeekToLine: (time: number) => void;
}

// Depth-of-field tiers indexed by distance from the active line (clamped 0..3).
const BLUR_PX = [0, 1, 2.5, 4];
const PAST_OPACITY = [0.5, 0.45, 0.32, 0.2];
const UPCOMING_OPACITY = [0.8, 0.7, 0.55, 0.42];

/** Per-line focus style by distance from the active line (Apple-style depth of field). */
function focusStyle(
  isPast: boolean,
  distance: number,
  reducedMotion: boolean
): React.CSSProperties {
  const tier = Math.min(distance, 3);
  const blur = reducedMotion ? 0 : BLUR_PX[tier];
  const opacity = (isPast ? PAST_OPACITY : UPCOMING_OPACITY)[tier];
  return { opacity, filter: blur ? `blur(${blur}px)` : undefined };
}

/**
 * Karaoke-style synced lyrics with an Apple-Music-style depth of field: the
 * active line is sharp, scaled and glows in the song's density color while
 * surrounding lines blur and dim by distance. Each line glows in with a quick
 * entrance when it becomes active, and the highlight turns off during long
 * instrumental gaps (`lit`) so a line never lingers lit while the music plays on.
 *
 * The column eases to keep the active line centered (animated imperatively — no
 * per-frame React re-render); under reduced motion it snaps.
 *
 * The lyrics are the page's semantic content — a labelled list with the active
 * line marked `aria-current`.
 */
export default function LyricsDisplay({
  cues,
  activeIndex,
  lit,
  densityColor,
  reducedMotion,
  onSeekToLine,
}: LyricsDisplayProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const columnRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const targetRef = useRef(0);
  const currentRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  // Compute where the column must sit to center the active line. During an
  // instrumental gap the line stays the scroll anchor even though it's unlit.
  const computeTarget = (): number => {
    const viewport = viewportRef.current;
    if (!viewport) return 0;
    const idx = activeIndex;
    const line = idx >= 0 ? lineRefs.current[idx] : lineRefs.current[0];
    if (!line) return viewport.clientHeight * 0.5;
    return viewport.clientHeight / 2 - (line.offsetTop + line.offsetHeight / 2);
  };

  useEffect(() => {
    const column = columnRef.current;
    if (!column) return;

    targetRef.current = computeTarget();

    if (reducedMotion) {
      // Snap — no animation loop.
      currentRef.current = targetRef.current;
      column.style.transform = `translateY(${targetRef.current}px)`;
      return;
    }

    const ease = () => {
      const delta = targetRef.current - currentRef.current;
      currentRef.current += delta * 0.15;
      if (Math.abs(delta) < 0.5) {
        currentRef.current = targetRef.current;
        column.style.transform = `translateY(${currentRef.current}px)`;
        rafRef.current = null;
        return;
      }
      column.style.transform = `translateY(${currentRef.current}px)`;
      rafRef.current = requestAnimationFrame(ease);
    };

    if (rafRef.current === null) {
      rafRef.current = requestAnimationFrame(ease);
    }

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, reducedMotion, cues.length]);

  return (
    <div
      ref={viewportRef}
      className="relative z-10 flex-1 overflow-hidden"
      aria-label="Lyrics"
      style={{
        maskImage:
          "linear-gradient(to bottom, transparent, black 18%, black 82%, transparent)",
        WebkitMaskImage:
          "linear-gradient(to bottom, transparent, black 18%, black 82%, transparent)",
      }}
    >
      <div
        ref={columnRef}
        className="absolute inset-x-0 top-0 px-6 will-change-transform"
      >
        <ul className="space-y-3 text-center max-w-xl mx-auto">
          {cues.map((cue, i) => {
            const isActive = i === activeIndex && lit;
            // The current line, once it stops being lit, reads as just-sung.
            const isPast =
              (activeIndex >= 0 && i < activeIndex) ||
              (i === activeIndex && !lit);
            const distance = activeIndex < 0 ? i : Math.abs(i - activeIndex);
            return (
              <li key={`${cue.start}-${i}`}>
                <button
                  ref={(el) => {
                    lineRefs.current[i] = el;
                  }}
                  onClick={() => onSeekToLine(cue.start)}
                  aria-current={isActive ? "true" : undefined}
                  className={`block w-full cursor-pointer transition-all duration-500 ease-out leading-snug ${
                    isActive
                      ? // On mobile, keep the active line the same font size as the
                        // rest and grow it with a transform (which doesn't reflow,
                        // so a one-line line stays one line). Wider screens have
                        // room for the larger type.
                        "text-[var(--lo1-starlight)] text-lg md:text-3xl font-medium scale-[1.12] md:scale-[1.04]"
                      : "text-[var(--lo1-stardust)] text-lg md:text-xl"
                  }`}
                  style={
                    isActive
                      ? { filter: `drop-shadow(0 0 18px ${densityColor}66)` }
                      : focusStyle(isPast, distance, reducedMotion)
                  }
                >
                  {isActive ? (
                    <span key={`lit-${activeIndex}`} className="inline-block lyric-glow-in">
                      {cue.text}
                    </span>
                  ) : (
                    cue.text
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
