"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";

// Number of thinking phrases in ask.thinkingPhrases (keys "1".."69").
const THINKING_PHRASE_COUNT = 69;
// How long each phrase is shown — a touch longer than the shimmer pass (3s in
// globals.css) so the light finishes sweeping before the next phrase arrives.
const ROTATE_MS = 3600;

/**
 * Loading indicator shown while an answer streams: a Ra-themed phrase whose
 * gold shimmer sweeps across once, then the next phrase swaps in and sweeps
 * again. The text element is remounted (via `key`) each rotation so its
 * single-pass shimmer replays. Rotation is timer-driven so it still advances
 * when motion is reduced (the shimmer itself is disabled there).
 */
export default function AskThinking() {
  const t = useTranslations("ask");

  const randomKey = useCallback((exclude: string) => {
    let key: string;
    do {
      key = String(Math.floor(Math.random() * THINKING_PHRASE_COUNT) + 1);
    } while (key === exclude && THINKING_PHRASE_COUNT > 1);
    return key;
  }, []);

  // Deterministic first render (key "1") to avoid a hydration mismatch, then
  // randomize on mount and rotate.
  const [phraseKey, setPhraseKey] = useState("1");
  useEffect(() => {
    setPhraseKey(randomKey(""));
    const id = setInterval(() => setPhraseKey((prev) => randomKey(prev)), ROTATE_MS);
    return () => clearInterval(id);
  }, [randomKey]);

  return (
    <div data-testid="ask-thinking" role="status" aria-label={t("thinking")}>
      <span key={phraseKey} className="ask-shimmer text-sm italic" aria-hidden>
        {t(`thinkingPhrases.${phraseKey}`)}
      </span>
    </div>
  );
}
