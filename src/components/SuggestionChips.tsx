"use client";

import { motion } from "framer-motion";
import { useEffect } from "react";
import { analytics } from "@/lib/analytics";

interface SuggestionChipsProps {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
  disabled?: boolean;
}

export default function SuggestionChips({
  suggestions,
  onSelect,
  disabled = false,
}: SuggestionChipsProps) {
  // Track when suggestions are displayed
  useEffect(() => {
    if (suggestions.length > 0) {
      analytics.suggestionDisplayed({ count: suggestions.length });
    }
  }, [suggestions]);

  if (suggestions.length === 0) return null;

  const handleClick = (suggestion: string) => {
    if (disabled) return;

    // Track the click
    analytics.suggestionClicked({ suggestion });

    // Send the suggestion as a new message
    onSelect(suggestion);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8, duration: 0.4, ease: "easeOut" }}
      className="mt-4 pt-4 border-t border-[var(--lo1-celestial)]/20"
    >
      <p className="text-[var(--lo1-stardust)]/60 text-xs mb-3">
        Continue exploring:
      </p>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion, index) => (
          <motion.button
            key={index}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.9 + index * 0.1, duration: 0.3 }}
            onClick={() => handleClick(suggestion)}
            disabled={disabled}
            className={`
              px-3 py-1.5 rounded-full text-sm
              border border-[var(--lo1-gold)]/40
              bg-[var(--lo1-indigo)]/40 backdrop-blur-sm
              text-[var(--lo1-text-light)]
              transition-all duration-200
              ${
                disabled
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:border-[var(--lo1-gold)]/70 hover:bg-[var(--lo1-indigo)]/60 hover:shadow-[0_0_12px_rgba(212,168,83,0.15)] cursor-pointer"
              }
            `}
          >
            {suggestion}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
