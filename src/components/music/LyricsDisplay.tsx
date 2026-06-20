"use client";

import { useEffect, useRef } from "react";
import { type LyricCue } from "@/lib/schemas/music";

interface LyricsDisplayProps {
  cues: LyricCue[];
  /** Active cue index from useLyricSync (-1 = none yet). */
  activeIndex: number;
  reducedMotion: boolean;
  /** Seek the audio to a line's start time when tapped. */
  onSeekToLine: (time: number) => void;
}

/**
 * Karaoke-style synced lyrics. The active line is spotlit; the column eases
 * to keep it vertically centered. Scroll is animated imperatively via a small
 * self-settling rAF loop (no per-frame React re-render); under reduced motion
 * the column snaps instantly and the loop never runs.
 *
 * The lyrics are the page's semantic content — a labelled list with the active
 * line marked `aria-current`.
 */
export default function LyricsDisplay({
  cues,
  activeIndex,
  reducedMotion,
  onSeekToLine,
}: LyricsDisplayProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const columnRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const targetRef = useRef(0);
  const currentRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  // Compute where the column must sit to center the active line.
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
      className="relative flex-1 overflow-hidden"
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
            const isActive = i === activeIndex;
            const isPast = activeIndex >= 0 && i < activeIndex;
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
                      ? "text-[var(--lo1-starlight)] text-2xl md:text-3xl font-medium scale-[1.02] drop-shadow-[0_0_18px_rgba(232,230,242,0.25)]"
                      : isPast
                        ? "text-[var(--lo1-stardust)]/40 text-lg md:text-xl"
                        : "text-[var(--lo1-stardust)]/70 text-lg md:text-xl"
                  }`}
                >
                  {cue.text}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
