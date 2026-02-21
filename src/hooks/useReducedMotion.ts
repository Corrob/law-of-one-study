"use client";

import { useState, useEffect } from "react";

/**
 * Returns true when the user has enabled "prefers-reduced-motion: reduce"
 * in their OS accessibility settings. Components can use this to skip
 * JS-driven animations (inline style transitions, timers, etc.).
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);

    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return reduced;
}
