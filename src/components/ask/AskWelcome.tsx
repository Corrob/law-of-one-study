"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { AskIcon } from "@/components/icons";
import { askAnalytics } from "@/lib/ask/analytics";
import { pickRandomStarters } from "@/lib/ask/starters";

interface AskWelcomeProps {
  onPickStarter: (prompt: string) => void;
}

/**
 * Empty-state for the Ask feature: a short intro plus a random handful of
 * starter questions (from the localized pool) the seeker can tap to begin.
 */
export default function AskWelcome({ onPickStarter }: AskWelcomeProps) {
  const t = useTranslations("ask");

  // Chosen on mount (client-side) so the random pick doesn't cause a
  // server/client hydration mismatch.
  const [starters, setStarters] = useState<string[]>([]);

  useEffect(() => {
    const pool = t.raw("starters") as string[];
    const picked = pickRandomStarters(Array.isArray(pool) ? pool : []);
    setStarters(picked);
    askAnalytics.welcomeScreenViewed({ starterCount: picked.length });
    // Pick once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      <h2 className="text-xl font-semibold text-[var(--lo1-starlight)] mb-2">
        {t("welcomeTitle")}
      </h2>
      <p className="text-sm text-[var(--lo1-stardust)] max-w-md mb-6 leading-relaxed">
        {t("welcomeBody")}
      </p>

      <div className="grid gap-2 w-full max-w-md">
        {starters.map((starter, index) => (
          <button
            key={starter}
            type="button"
            data-testid="ask-starter"
            onClick={() => handlePick(starter, index)}
            className="text-left text-sm px-4 py-3 rounded-xl border border-[var(--lo1-gold)]/20
                       bg-[var(--lo1-indigo)]/40 text-[var(--lo1-text-light)]
                       hover:bg-[var(--lo1-gold)]/10 hover:border-[var(--lo1-gold)]/40
                       transition-colors cursor-pointer"
          >
            {starter}
          </button>
        ))}
      </div>
    </div>
  );
}
