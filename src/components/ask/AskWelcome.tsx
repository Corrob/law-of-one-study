"use client";

import { useTranslations } from "next-intl";
import { AskIcon } from "@/components/icons";

interface AskWelcomeProps {
  onPickStarter: (prompt: string) => void;
}

/**
 * Empty-state for the Ask feature: a short intro plus a few starter questions
 * the seeker can tap to begin.
 */
export default function AskWelcome({ onPickStarter }: AskWelcomeProps) {
  const t = useTranslations("ask");
  const starters = t.raw("starters") as string[];

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
        {Array.isArray(starters) &&
          starters.map((starter, index) => (
            <button
              key={index}
              type="button"
              onClick={() => onPickStarter(starter)}
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
