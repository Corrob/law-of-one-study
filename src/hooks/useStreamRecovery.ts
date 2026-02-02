"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { z } from "zod";
import { STREAM_RECOVERY_CONFIG } from "@/lib/config";
import { debug } from "@/lib/debug";

/** Zod schema for the /api/chat/recover response */
const RecoveryResponseSchema = z.object({
  events: z.array(
    z.object({
      event: z.string(),
      data: z.object({}).passthrough(),
    })
  ),
  complete: z.boolean(),
});

export type RecoveryResponse = z.infer<typeof RecoveryResponseSchema>;

interface UseStreamRecoveryReturn {
  /** Current response ID from the server (set when "session" event arrives) */
  responseId: string | null;
  /** Store a response ID (from session event) */
  setResponseId: (id: string) => void;
  /** Whether the app was recently backgrounded and came back */
  wasBackgrounded: boolean;
  /** Clear the backgrounded flag */
  clearBackgrounded: () => void;
  /** Attempt recovery from server cache. Returns events or null. */
  recoverFromServer: (id: string) => Promise<RecoveryResponse | null>;
  /**
   * Register an AbortController for the current stream request.
   * When the app is backgrounded and resumed, the hook will abort the
   * stale connection after `staleTimeoutMs` so the caller can recover.
   * Call with `null` to unregister when the request completes.
   */
  registerStreamAbort: (controller: AbortController | null) => void;
}

/**
 * Tracks page visibility and provides server-side response recovery.
 *
 * When the mobile OS backgrounds the app, the SSE connection dies.
 * This hook detects the resume and provides a way to fetch the
 * cached response from the server.
 *
 * The stale-connection abort logic lives here (via registerStreamAbort)
 * so that only one visibility listener exists for the component lifetime,
 * avoiding listener leaks from per-request registration.
 */
export function useStreamRecovery(): UseStreamRecoveryReturn {
  const [responseId, setResponseIdState] = useState<string | null>(null);
  const [wasBackgrounded, setWasBackgrounded] = useState(false);
  const wasHiddenRef = useRef(false);
  const hiddenAtRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const staleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Track visibility changes and abort stale connections
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.hidden) {
        wasHiddenRef.current = true;
        hiddenAtRef.current = Date.now();
      } else if (wasHiddenRef.current) {
        wasHiddenRef.current = false;
        const hiddenDurationMs = Date.now() - hiddenAtRef.current;

        setWasBackgrounded(true);

        // Only start the stale-connection abort timer if the page was hidden
        // long enough to suggest mobile backgrounding (where the OS kills the
        // connection). Desktop tab switches keep the connection alive and don't
        // need recovery — aborting a working stream causes more harm than good.
        if (
          hiddenDurationMs >= STREAM_RECOVERY_CONFIG.minHiddenForRecoveryMs &&
          abortControllerRef.current &&
          !staleTimerRef.current
        ) {
          staleTimerRef.current = setTimeout(() => {
            staleTimerRef.current = null;
            debug.log("[useStreamRecovery] Stream stale after resume, aborting for recovery");
            abortControllerRef.current?.abort();
          }, STREAM_RECOVERY_CONFIG.staleTimeoutMs);
        }
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (staleTimerRef.current) {
        clearTimeout(staleTimerRef.current);
        staleTimerRef.current = null;
      }
    };
  }, []);

  const registerStreamAbort = useCallback((controller: AbortController | null) => {
    abortControllerRef.current = controller;
    // Clear any pending stale timer when the stream finishes or a new one starts
    if (staleTimerRef.current) {
      clearTimeout(staleTimerRef.current);
      staleTimerRef.current = null;
    }
  }, []);

  const setResponseId = useCallback((id: string) => {
    setResponseIdState(id);
    try {
      sessionStorage.setItem(STREAM_RECOVERY_CONFIG.responseIdStorageKey, id);
    } catch {
      // sessionStorage may be unavailable (private browsing, etc.)
    }
  }, []);

  const clearBackgrounded = useCallback(() => {
    setWasBackgrounded(false);
  }, []);

  const recoverFromServer = useCallback(async (id: string): Promise<RecoveryResponse | null> => {
    try {
      const response = await fetch(`/api/chat/recover?id=${encodeURIComponent(id)}`);
      if (!response.ok) return null;
      const json: unknown = await response.json();
      const result = RecoveryResponseSchema.safeParse(json);
      if (!result.success) {
        debug.log("[useStreamRecovery] Invalid recovery response:", result.error);
        return null;
      }
      return result.data;
    } catch {
      return null;
    }
  }, []);

  return {
    responseId,
    setResponseId,
    wasBackgrounded,
    clearBackgrounded,
    recoverFromServer,
    registerStreamAbort,
  };
}
