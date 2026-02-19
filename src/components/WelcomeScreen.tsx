"use client";

import { useEffect, useState, ReactNode, useMemo, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import ThinkingModeToggle from "./ThinkingModeToggle";
import SourceFilter from "./SourceFilter";
import type { SourceFilter as SourceFilterType } from "@/lib/schemas";

// Greeting keys that map to translations
const GREETING_KEYS = [
  "seeker",
  "loveLight",
  "journey",
  "serve",
  "wanderer",
] as const;

// Total number of starters available in translations
const STARTER_COUNT = 46;

interface WelcomeScreenProps {
  onSelectStarter: (starter: string) => void;
  inputElement?: ReactNode;
  thinkingMode?: boolean;
  onThinkingModeChange?: (enabled: boolean) => void;
  sourceFilter?: SourceFilterType;
  onSourceChange?: (source: SourceFilterType) => void;
}

export default function WelcomeScreen({ onSelectStarter, inputElement, thinkingMode = false, onThinkingModeChange, sourceFilter, onSourceChange }: WelcomeScreenProps) {
  const [greetingKey, setGreetingKey] = useState<typeof GREETING_KEYS[number] | null>(null);
  const [starterKeys, setStarterKeys] = useState<number[]>([]);
  const t = useTranslations("welcome");
  const tStarters = useTranslations("starters");

  // Generate random starter keys on client to avoid hydration mismatch
  const getRandomStarterKeys = useCallback((count: number): number[] => {
    const keys = Array.from({ length: STARTER_COUNT }, (_, i) => i + 1);
    const shuffled = keys.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }, []);

  useEffect(() => {
    // Only run on client to avoid hydration mismatch
    setGreetingKey(GREETING_KEYS[Math.floor(Math.random() * GREETING_KEYS.length)]);
    setStarterKeys(getRandomStarterKeys(3));
  }, [getRandomStarterKeys]);

  // Get translated starters from the keys
  const starters = useMemo(() => {
    return starterKeys.map(key => tStarters(String(key)));
  }, [starterKeys, tStarters]);

  // Get the translated greeting
  const greeting = useMemo(() => {
    if (!greetingKey) return null;
    return t(`greetings.${greetingKey}`);
  }, [greetingKey, t]);

  return (
    <div className="flex flex-col items-center justify-center flex-1 px-4 py-8">
      {/* Welcome Greeting */}
      {greeting && (
        <div className="animate-quote-wrapper text-center mb-8">
          <h1 className="animate-quote-enter font-[family-name:var(--font-cormorant)] text-3xl md:text-4xl text-[var(--lo1-starlight)]">
            {greeting}
          </h1>
        </div>
      )}

      {/* Input slot with ambient glow */}
      {inputElement && (
        <div className="relative w-full max-w-lg mb-6 animate-input-enter">
          <div className="welcome-input-glow" />
          {inputElement}
        </div>
      )}

      {/* Toggles */}
      {(onThinkingModeChange || onSourceChange) && (
        <div className="w-full max-w-lg mb-8 animate-input-enter flex flex-col items-center gap-2">
          {onSourceChange && sourceFilter !== undefined && (
            <SourceFilter value={sourceFilter} onChange={onSourceChange} />
          )}
          {onThinkingModeChange && (
            <ThinkingModeToggle enabled={thinkingMode} onChange={onThinkingModeChange} />
          )}
        </div>
      )}

      {/* Conversation Starters */}
      <div className="w-full max-w-2xl">
        <p className="light-explore-label text-[var(--lo1-starlight)]/70 text-sm font-medium mb-4 text-center tracking-wide animate-starter-0">
          {t("orExplore")}
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {starters.map((starter, index) => (
            <button
              key={index}
              onClick={() => onSelectStarter(starter)}
              className={`starter-card light-starter-btn animate-starter-${index} p-4 rounded-2xl
                       bg-[var(--lo1-indigo)]/60 backdrop-blur-sm
                       border border-[var(--lo1-celestial)]/40
                       shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]
                       hover:border-[var(--lo1-gold)]/60 hover:bg-[var(--lo1-indigo)]/80
                       hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_0_20px_rgba(212,168,83,0.1)]
                       text-[var(--lo1-text-light)] text-sm text-left
                       transition-all duration-200 cursor-pointer`}
            >
              {starter}
            </button>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="w-full max-w-2xl mt-8 animate-starter-0">
        <p className="text-[var(--lo1-stardust)]/60 text-xs text-center leading-relaxed">
          {t("disclaimer")}{" "}
          <Link
            href="/about"
            className="text-[var(--lo1-gold)]/70 hover:text-[var(--lo1-gold)] underline transition-colors"
          >
            {t("learnMore")}
          </Link>
        </p>
      </div>

    </div>
  );
}
