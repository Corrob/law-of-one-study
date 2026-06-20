import { useEffect, useMemo, useRef, type RefObject } from "react";

/**
 * A subscribable clock backed by an <audio> element's currentTime.
 *
 * `subscribe(cb)` registers a callback that receives the current playback time;
 * `getTime()` reads it on demand. Consumers (lyrics scroll, density scenes) use
 * the per-frame callback to update the DOM imperatively, avoiding a React
 * re-render every frame.
 */
export interface AudioClock {
  subscribe: (cb: (time: number) => void) => () => void;
  getTime: () => number;
}

/**
 * Drives an {@link AudioClock} from an audio element.
 *
 * While `isPlaying` is true and the tab is visible, a single
 * requestAnimationFrame loop notifies subscribers at ~60fps (smooth scroll +
 * animation). The element's native `timeupdate` event (~4Hz) is always wired up
 * as well, so line-level state stays correct even when the rAF loop is stopped
 * (paused, hidden tab, or `smooth: false` for reduced motion).
 *
 * Mirrors the throttled-rAF pattern in {@link useScrollProgress}.
 */
export function useAudioClock(
  audioRef: RefObject<HTMLAudioElement | null>,
  isPlaying: boolean,
  options?: { smooth?: boolean }
): AudioClock {
  const subscribersRef = useRef(new Set<(time: number) => void>());
  const rafRef = useRef<number | null>(null);
  const smooth = options?.smooth ?? true;

  const clock = useMemo<AudioClock>(
    () => ({
      subscribe(cb) {
        subscribersRef.current.add(cb);
        // Push current time immediately so new subscribers sync on mount.
        cb(audioRef.current?.currentTime ?? 0);
        return () => {
          subscribersRef.current.delete(cb);
        };
      },
      getTime() {
        return audioRef.current?.currentTime ?? 0;
      },
    }),
    [audioRef]
  );

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const notify = () => {
      const t = audio.currentTime;
      subscribersRef.current.forEach((cb) => cb(t));
    };

    let running = false;
    const tick = () => {
      notify();
      if (running) rafRef.current = requestAnimationFrame(tick);
    };
    const start = () => {
      if (running || document.visibilityState !== "visible") return;
      running = true;
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      running = false;
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };

    // Coarse fallback: always keep subscribers fed even without the rAF loop.
    audio.addEventListener("timeupdate", notify);

    const onVisibility = () => {
      if (document.visibilityState === "visible" && isPlaying && smooth) start();
      else stop();
    };
    document.addEventListener("visibilitychange", onVisibility);

    if (isPlaying && smooth) {
      start();
    } else {
      stop();
      notify(); // settle subscribers at the current time
    }

    return () => {
      stop();
      audio.removeEventListener("timeupdate", notify);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [audioRef, isPlaying, smooth]);

  return clock;
}
