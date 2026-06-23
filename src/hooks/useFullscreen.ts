import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

export interface Fullscreen<T extends HTMLElement> {
  /** Attach to the element that should fill the screen. */
  ref: RefObject<T | null>;
  /** True while that element is the fullscreen element. */
  isFullscreen: boolean;
  /** Whether the browser supports element fullscreen (false on e.g. iOS Safari). */
  canFullscreen: boolean;
  /** Enter fullscreen on the ref, or exit if already fullscreen. */
  toggle: () => void;
}

/**
 * Drives the Fullscreen API for a single element.
 *
 * Stays in sync with the browser via `fullscreenchange`, so the native Esc exit
 * flips `isFullscreen` back correctly. `canFullscreen` lets callers hide the
 * control where the API is unavailable; requests that the browser blocks are
 * swallowed.
 */
export function useFullscreen<T extends HTMLElement>(): Fullscreen<T> {
  const ref = useRef<T | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [canFullscreen, setCanFullscreen] = useState(false);

  useEffect(() => {
    setCanFullscreen(
      typeof document !== "undefined" && Boolean(document.fullscreenEnabled)
    );
    const onChange = () => setIsFullscreen(document.fullscreenElement != null);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggle = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      ref.current?.requestFullscreen?.().catch(() => {});
    }
  }, []);

  return { ref, isFullscreen, canFullscreen, toggle };
}
