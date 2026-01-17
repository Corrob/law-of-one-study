"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import ModeToggle from "./ModeToggle";
import SearchResultCard from "./SearchResultCard";
import type { SearchResult, SearchMode } from "@/lib/schemas";

interface SearchResultsProps {
  mode: SearchMode;
  results: SearchResult[];
  searchedQuery: string;
  isLoading: boolean;
  error: string | null;
  hasSearched: boolean;
  onModeChange: (mode: SearchMode) => void;
  onAskAbout: (result: SearchResult, displayText: string) => void;
  inputElement: ReactNode;
}

const resultVariants = {
  hidden: { opacity: 0 },
  visible: (i: number) => ({
    opacity: 1,
    transition: {
      delay: i * 0.05,
      duration: 0.3,
      ease: "easeOut" as const,
    },
  }),
};

export default function SearchResults({
  mode,
  results,
  searchedQuery,
  isLoading,
  error,
  hasSearched,
  onModeChange,
  onAskAbout,
  inputElement,
}: SearchResultsProps) {
  const t = useTranslations("search");
  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Sticky Search Header */}
      <div className="px-4 pt-4 pb-3 bg-[var(--lo1-deep-space)]/50 backdrop-blur-sm shrink-0">
        <div className="max-w-2xl mx-auto">
          {/* Mode Toggle */}
          <div className="flex justify-center mb-3">
            <ModeToggle mode={mode} onChange={onModeChange} />
          </div>
          {inputElement}
        </div>
      </div>

      {/* Results Area */}
      <div className="flex-1 overflow-y-auto px-4 pb-6">
        <div className="max-w-2xl mx-auto">
          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-12">
              <div className="text-[var(--lo1-stardust)] italic animate-pulse">
                {t("searching")}
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <p className="text-[var(--lo1-error)]">{error}</p>
            </motion.div>
          )}

          {/* No Results */}
          {hasSearched && !isLoading && !error && results.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <p className="text-[var(--lo1-stardust)]">
                {t("noResults")}
              </p>
            </motion.div>
          )}

          {/* Results */}
          {results.length > 0 && !isLoading && (
            <div className="space-y-5">
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="text-sm text-[var(--lo1-stardust)]/60 pt-2"
              >
                {t("matchCount", { count: results.length })}
              </motion.p>
              {results.map((result, index) => (
                <motion.div
                  key={`${result.reference}-${index}`}
                  custom={index}
                  variants={resultVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <SearchResultCard
                    result={result}
                    query={searchedQuery}
                    onAskAbout={(displayText) => onAskAbout(result, displayText)}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
