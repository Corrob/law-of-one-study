"use client";

import { useState, useCallback, useEffect, useRef } from "react";

const STORAGE_KEY = "lo1-include-confederation";

/**
 * Shared hook for the "Include Confederation" preference.
 * Persists to localStorage so the toggle state is shared between Chat and Search.
 *
 * @param initialOverride - If provided, takes precedence over localStorage on first render
 *   (e.g., URL param `?confederation=1` in Search).
 */
export function useConfederationPreference(initialOverride?: boolean) {
  // Always start with `false` (or the override) to match SSR and avoid hydration mismatch.
  // localStorage is read in a useEffect after hydration.
  const [includeConfederation, setIncludeConfederationState] = useState(
    initialOverride ?? false
  );

  // Hydrate from localStorage after mount (client-only)
  const didHydrate = useRef(false);
  useEffect(() => {
    if (didHydrate.current) return;
    didHydrate.current = true;

    // If an override was provided, it takes precedence — write it to storage and skip reading
    if (initialOverride !== undefined) {
      try { localStorage.setItem(STORAGE_KEY, String(initialOverride)); } catch { /* */ }
      return;
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "true") {
        setIncludeConfederationState(true);
      }
    } catch {
      // Private browsing or storage unavailable
    }
  }, [initialOverride]);

  // Sync to localStorage whenever the value changes (skip the initial default)
  const isInitialRender = useRef(true);
  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, String(includeConfederation));
    } catch {
      // Private browsing or storage unavailable
    }
  }, [includeConfederation]);

  const setIncludeConfederation = useCallback((value: boolean) => {
    setIncludeConfederationState(value);
  }, []);

  return { includeConfederation, setIncludeConfederation };
}
