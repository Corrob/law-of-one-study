import { useEffect, useRef } from "react";

/**
 * Holds a Screen Wake Lock while `active` is true so the device screen doesn't
 * dim or sleep — e.g. while a track is playing and the user is watching the
 * synced lyrics without touching the screen.
 *
 * The lock is released by the browser whenever the page is hidden (tab switch,
 * screen off), so we re-acquire it on `visibilitychange` when we still want it.
 * No-ops where the API is unavailable (e.g. iOS < 16.4, SSR). Acquisition can
 * reject (no user gesture, low battery) — failures are swallowed.
 */
export function useWakeLock(active: boolean) {
  const sentinelRef = useRef<WakeLockSentinel | null>(null);
  // Keep the desired state readable inside the visibilitychange listener
  // without re-binding it on every toggle.
  const activeRef = useRef(active);

  useEffect(() => {
    activeRef.current = active;

    const supported =
      typeof navigator !== "undefined" && "wakeLock" in navigator;
    if (!supported) return;

    const acquire = async () => {
      if (sentinelRef.current || !activeRef.current) return;
      try {
        const sentinel = await navigator.wakeLock.request("screen");
        // If we stopped wanting the lock while awaiting, drop it immediately.
        if (!activeRef.current) {
          sentinel.release().catch(() => {});
          return;
        }
        sentinelRef.current = sentinel;
        sentinel.addEventListener("release", () => {
          sentinelRef.current = null;
        });
      } catch {
        // Rejected (no gesture, battery saver, etc.) — fine to ignore.
      }
    };

    const release = () => {
      sentinelRef.current?.release().catch(() => {});
      sentinelRef.current = null;
    };

    if (active) acquire();
    else release();

    // The browser auto-releases the lock when the page is hidden; re-acquire
    // when it becomes visible again and we still want it held.
    const onVisibility = () => {
      if (document.visibilityState === "visible" && activeRef.current) {
        acquire();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      if (!active) return;
      // On unmount while active, release the lock we hold.
      release();
    };
  }, [active]);
}
