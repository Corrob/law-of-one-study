"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";

// Number of thinking phrases in ask.thinkingPhrases (keys "1".."69").
const THINKING_PHRASE_COUNT = 69;

/**
 * Loading indicator shown while an answer streams: crossfades between random
 * Ra-themed phrases ("Consulting the Confederation…") every 3.5s. Two
 * overlapping elements are used instead of a key-based remount so the change is
 * a smooth fade rather than a hard cut.
 */
export default function AskThinking() {
  const t = useTranslations("ask");

  // Start deterministic (key "1") to avoid a hydration mismatch, then randomize.
  const [messages, setMessages] = useState<[string, string]>(["1", "1"]);
  const [showSecond, setShowSecond] = useState(false);
  const showSecondRef = useRef(false);
  const mountedRef = useRef(true);

  const getRandomKey = useCallback((exclude: string) => {
    let key: string;
    do {
      key = String(Math.floor(Math.random() * THINKING_PHRASE_COUNT) + 1);
    } while (key === exclude && THINKING_PHRASE_COUNT > 1);
    return key;
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    // Randomize the first phrase on mount (client-only).
    setMessages([getRandomKey(""), getRandomKey("")]);

    const interval = setInterval(() => {
      if (!mountedRef.current) return;
      const flipped = showSecondRef.current;
      setMessages(([a, b]) => {
        const current = flipped ? b : a;
        const next = getRandomKey(current);
        return flipped ? [next, b] : [a, next];
      });
      setShowSecond((prev) => {
        showSecondRef.current = !prev;
        return !prev;
      });
    }, 3500);

    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, [getRandomKey]);

  const [keyA, keyB] = messages;

  return (
    <div
      className="flex items-center gap-2"
      data-testid="ask-thinking"
      role="status"
      aria-label={t("thinking")}
    >
      {/* Crossfading, shimmering phrase */}
      <span className="grid grid-cols-1 grid-rows-1">
        <span
          className="ask-shimmer col-start-1 row-start-1 text-sm italic transition-opacity duration-500 ease-in-out"
          style={{ opacity: showSecond ? 0 : 1 }}
          aria-hidden
        >
          {t(`thinkingPhrases.${keyA}`)}
        </span>
        <span
          className="ask-shimmer col-start-1 row-start-1 text-sm italic transition-opacity duration-500 ease-in-out"
          style={{ opacity: showSecond ? 1 : 0 }}
          aria-hidden
        >
          {t(`thinkingPhrases.${keyB}`)}
        </span>
      </span>
      {/* Pulsing dots */}
      <span className="flex flex-shrink-0 items-center gap-1" aria-hidden>
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--lo1-gold)]/80 animate-pulse" />
        <span
          className="h-1.5 w-1.5 rounded-full bg-[var(--lo1-gold)]/80 animate-pulse"
          style={{ animationDelay: "150ms" }}
        />
        <span
          className="h-1.5 w-1.5 rounded-full bg-[var(--lo1-gold)]/80 animate-pulse"
          style={{ animationDelay: "300ms" }}
        />
      </span>
    </div>
  );
}
