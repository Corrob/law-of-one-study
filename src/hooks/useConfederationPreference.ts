"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { SourceFilter } from "@/lib/schemas";

const STORAGE_KEY = "lo1-source-filter";
const LEGACY_STORAGE_KEY = "lo1-include-confederation";

/**
 * Shared hook for the source filter preference (Ra, Confederation, or All).
 * Persists to localStorage so the selection is shared between Chat and Search.
 *
 * Migrates from the legacy boolean "lo1-include-confederation" key automatically.
 *
 * @param initialOverride - If provided, takes precedence over localStorage on first render
 *   (e.g., URL param `?source=confederation` in Search).
 */
export function useSourcePreference(initialOverride?: SourceFilter) {
  // Always start with "ra" (or the override) to match SSR and avoid hydration mismatch.
  // localStorage is read in a useEffect after hydration.
  const [sourceFilter, setSourceFilterState] = useState<SourceFilter>(
    initialOverride ?? "ra"
  );

  // Hydrate from localStorage after mount (client-only)
  const didHydrate = useRef(false);
  useEffect(() => {
    if (didHydrate.current) return;
    didHydrate.current = true;

    // If an override was provided, it takes precedence — write it to storage and skip reading
    if (initialOverride !== undefined) {
      try { localStorage.setItem(STORAGE_KEY, initialOverride); } catch { /* */ }
      return;
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "ra" || stored === "confederation" || stored === "all") {
        setSourceFilterState(stored);
        return;
      }

      // Migrate legacy boolean storage ("true" → "all", "false"/missing → "ra")
      const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacy === "true") {
        setSourceFilterState("all");
        localStorage.setItem(STORAGE_KEY, "all");
      }
      // "false" or missing → keep default "ra"
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
      localStorage.setItem(STORAGE_KEY, sourceFilter);
    } catch {
      // Private browsing or storage unavailable
    }
  }, [sourceFilter]);

  const setSourceFilter = useCallback((value: SourceFilter) => {
    setSourceFilterState(value);
  }, []);

  return { sourceFilter, setSourceFilter };
}
