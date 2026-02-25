"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import ModeToggle from "./ModeToggle";
import SourceFilter from "./SourceFilter";
import type { SearchMode, SourceFilter as SourceFilterType } from "@/lib/schemas";

interface SearchWelcomeProps {
  mode: SearchMode;
  sourceFilter?: SourceFilterType;
  greeting: string | null;
  suggestions: string[];
  onModeChange: (mode: SearchMode) => void;
  onSourceChange?: (source: SourceFilterType) => void;
  onSuggestedSearch: (suggestion: string) => void;
  inputElement: ReactNode;
}

const suggestionVariants = {
  hidden: { opacity: 0 },
  visible: (i: number) => ({
    opacity: 1,
    transition: {
      delay: 0.4 + i * 0.05,
      duration: 0.3,
      ease: "easeOut" as const,
    },
  }),
};

export default function SearchWelcome({
  mode,
  sourceFilter,
  greeting,
  suggestions,
  onModeChange,
  onSourceChange,
  onSuggestedSearch,
  inputElement,
}: SearchWelcomeProps) {
  const t = useTranslations("search");
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 pb-16">
      {/* Mode Toggle */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="mb-4"
      >
        <ModeToggle mode={mode} onChange={onModeChange} />
      </motion.div>

      {/* Source Filter - hidden for non-English locales (English-only content) */}
      {onSourceChange && sourceFilter !== undefined && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="mb-6"
        >
          <SourceFilter value={sourceFilter} onChange={onSourceChange} />
        </motion.div>
      )}

      {/* Greeting — always rendered to reserve space, text fades in */}
      <motion.h2
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: greeting ? 1 : 0, scale: greeting ? 1 : 0.95 }}
        transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
        className="font-[family-name:var(--font-cormorant)] text-2xl md:text-3xl text-[var(--lo1-starlight)] mb-6 text-center min-h-[1.5em]"
      >
        {greeting ?? "\u00A0"}
      </motion.h2>

      {/* Search Input with glow */}
      <div className="relative w-full max-w-lg mb-6">
        <div className="welcome-input-glow" />
        {inputElement}
      </div>

      {/* Mode-specific explanation */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.3 }}
        className="text-[var(--lo1-stardust)]/70 text-sm text-center mb-4 max-w-md"
      >
        {mode === "sentence"
          ? t("sentenceExplanation")
          : t("passageExplanation")}
      </motion.p>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="w-full max-w-2xl">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.35 }}
            className="text-[var(--lo1-stardust)]/60 text-xs mb-3 text-center uppercase tracking-wider"
          >
            {t("tryThese")}
          </motion.p>
          <div className="flex flex-wrap justify-center gap-2">
            {suggestions.map((suggestion, index) => (
              <motion.button
                key={suggestion}
                custom={index}
                variants={suggestionVariants}
                initial="hidden"
                animate="visible"
                onClick={() => onSuggestedSearch(suggestion)}
                className="px-3 py-2 rounded-lg text-sm
                           bg-[var(--lo1-indigo)]/60 border border-[var(--lo1-celestial)]/20
                           text-[var(--lo1-stardust)] hover:text-[var(--lo1-starlight)]
                           hover:border-[var(--lo1-gold)]/30 hover:bg-[var(--lo1-indigo)]/80
                           transition-all duration-200 cursor-pointer"
              >
                {suggestion}
              </motion.button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
