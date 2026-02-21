"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";

// Total number of thinking messages in translations
const THINKING_MESSAGE_COUNT = 69;

/**
 * Crossfade thinking indicator that smoothly transitions between
 * random Ra-themed messages every 3.5s. Uses two overlapping elements
 * instead of a key-based remount to avoid the hard-cut between messages.
 */
export default function ThinkingIndicator() {
  const t = useTranslations("thinking");

  // Track two messages: the visible one and the incoming one
  const [messages, setMessages] = useState<[string, string]>(() => {
    const key = String(Math.floor(Math.random() * THINKING_MESSAGE_COUNT) + 1);
    return [key, key];
  });
  const [showSecond, setShowSecond] = useState(false);
  const mountedRef = useRef(true);

  const getRandomKey = useCallback((exclude: string) => {
    let key: string;
    do {
      key = String(Math.floor(Math.random() * THINKING_MESSAGE_COUNT) + 1);
    } while (key === exclude && THINKING_MESSAGE_COUNT > 1);
    return key;
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    // Every 3.5s, stage a new message and trigger the crossfade
    const interval = setInterval(() => {
      if (!mountedRef.current) return;

      setMessages(([a, b]) => {
        const current = showSecond ? b : a;
        const next = getRandomKey(current);
        // Place the new message in the hidden slot
        return showSecond ? [next, b] : [a, next];
      });

      // Flip which element is visible (triggers the CSS transition)
      setShowSecond((prev) => !prev);
    }, 3500);

    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, [getRandomKey, showSecond]);

  const [keyA, keyB] = messages;

  return (
    <div className="mb-6 relative h-5" data-testid="thinking-indicator">
      {/* Message A */}
      <div
        className="absolute inset-0 text-sm text-[var(--lo1-stardust)] italic transition-opacity duration-500 ease-in-out"
        style={{ opacity: showSecond ? 0 : 1 }}
        aria-hidden={showSecond}
      >
        {t(keyA)}
      </div>
      {/* Message B */}
      <div
        className="absolute inset-0 text-sm text-[var(--lo1-stardust)] italic transition-opacity duration-500 ease-in-out"
        style={{ opacity: showSecond ? 1 : 0 }}
        aria-hidden={!showSecond}
      >
        {t(keyB)}
      </div>
    </div>
  );
}
