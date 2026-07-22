"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { AskIcon } from "@/components/icons";
import { askAnalytics } from "@/lib/ask/analytics";
import { pickRandomStarters, STARTER_DISPLAY_COUNT } from "@/lib/ask/starters";

interface AskWelcomeProps {
  onPickStarter: (prompt: string) => void;
  /**
   * The composer, rendered centered under the greeting (old Seek placement).
   * It animates down to the footer when the conversation starts.
   */
  composer?: ReactNode;
  /**
   * Overrides the intro paragraph — used when the selected source library is
   * the conscious channeling, so the welcome doesn't describe Ra grounding.
   */
  body?: string;
  /**
   * Selected source library. Picks the matching starter pool so channeling
   * mode surfaces questions the channeling library can actually cite, and
   * re-picks when the seeker flips the selector on the welcome screen.
   */
  source?: "ra" | "channeling";
}

// Rotating greeting keys (map to ask.greetings.* translations).
const GREETING_KEYS = ["seeker", "loveLight", "journey", "serve", "wanderer"] as const;

/**
 * Empty-state for the Ask feature: a rotating greeting, a short intro, and a
 * random handful of starter questions. (The discernment note now appears with
 * the first response, not here.)
 */
export default function AskWelcome({
  onPickStarter,
  composer,
  body,
  source = "ra",
}: AskWelcomeProps) {
  const t = useTranslations("ask");

  // Chosen on mount (client-side) so the random picks don't cause a
  // server/client hydration mismatch.
  const [starters, setStarters] = useState<string[]>([]);
  const [greetingKey, setGreetingKey] = useState<(typeof GREETING_KEYS)[number] | null>(null);

  // Re-pick when the source changes so channeling mode shows channeling-
  // groundable starters (and Ra mode shows the Ra pool). Keyed on `source`
  // only — `t` from useTranslations is not referentially stable, so including
  // it would re-run every render and loop with setStarters.
  useEffect(() => {
    const key = source === "channeling" ? "channelingStarters" : "starters";
    const pool = t.raw(key) as string[];
    setStarters(pickRandomStarters(Array.isArray(pool) ? pool : []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source]);

  useEffect(() => {
    // Pick the greeting once on mount.
    setGreetingKey(GREETING_KEYS[Math.floor(Math.random() * GREETING_KEYS.length)]);
    askAnalytics.welcomeScreenViewed({ starterCount: STARTER_DISPLAY_COUNT });
  }, []);

  const handlePick = (starter: string, index: number) => {
    askAnalytics.conversationStarterClicked({ starterText: starter, starterIndex: index });
    onPickStarter(starter);
  };

  return (
    <div className="flex flex-col items-center text-center px-4 py-8">
      <div className="w-14 h-14 rounded-full bg-[var(--lo1-gold)]/15 flex items-center justify-center mb-4">
        <AskIcon className="w-7 h-7 text-[var(--lo1-gold)]" />
      </div>
      <h2 className="text-xl font-semibold text-[var(--lo1-starlight)] mb-1">
        {t("welcomeTitle")}
      </h2>
      {greetingKey && (
        <p className="text-sm italic text-[var(--lo1-gold)]/80 mb-2">
          {t(`greetings.${greetingKey}`)}
        </p>
      )}
      <p className="text-sm text-[var(--lo1-stardust)] max-w-md mb-6 leading-relaxed">
        {body ?? t("welcomeBody")}
      </p>

      {/* Centered composer with ambient glow (old Seek placement) */}
      {composer && (
        <div className="relative w-full max-w-xl mb-6 animate-input-enter text-left">
          <div className="welcome-input-glow" />
          {composer}
        </div>
      )}

      <div className="grid gap-2 w-full max-w-md">
        {starters.map((starter, index) => (
          <button
            key={starter}
            type="button"
            data-testid="ask-starter"
            onClick={() => handlePick(starter, index)}
            className={`animate-starter-${Math.min(index, 2)} text-left text-sm px-4 py-3 rounded-xl border border-[var(--lo1-gold)]/20
                       bg-[var(--lo1-indigo)]/40 text-[var(--lo1-text-light)]
                       hover:bg-[var(--lo1-gold)]/10 hover:border-[var(--lo1-gold)]/40
                       transition-colors cursor-pointer`}
          >
            {starter}
          </button>
        ))}
      </div>
    </div>
  );
}
