"use client";

import { useEffect, useRef } from "react";

const STALE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in window.navigator &&
      (window.navigator as Navigator & { standalone: boolean }).standalone)
  );
}

export default function PwaResumeReload() {
  const hiddenAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isStandalone()) return;

    function handleVisibilityChange() {
      if (document.visibilityState === "hidden") {
        hiddenAtRef.current = Date.now();
      } else if (document.visibilityState === "visible") {
        const hiddenAt = hiddenAtRef.current;
        if (hiddenAt && Date.now() - hiddenAt > STALE_THRESHOLD_MS) {
          window.location.reload();
        }
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return null;
}
