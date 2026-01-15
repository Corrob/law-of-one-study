"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useCallback, useState } from "react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("chat");
  // Refs for keyboard navigation
  const chipRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  // Track when suggestions are displayed
  useEffect(() => {
    if (suggestions.length > 0) {
      analytics.suggestionDisplayed({ count: suggestions.length });
    }
  }, [suggestions]);

  // Reset refs when suggestions change
  useEffect(() => {
    chipRefs.current = chipRefs.current.slice(0, suggestions.length);
    setFocusedIndex(-1);
  }, [suggestions]);

  // Keyboard navigation handler
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      const lastIndex = suggestions.length - 1;
      let newIndex = index;

      switch (e.key) {
        case "ArrowRight":
        case "ArrowDown":
          e.preventDefault();
          newIndex = index < lastIndex ? index + 1 : 0;
          break;
        case "ArrowLeft":
        case "ArrowUp":
          e.preventDefault();
          newIndex = index > 0 ? index - 1 : lastIndex;
          break;
        case "Home":
          e.preventDefault();
          newIndex = 0;
          break;
        case "End":
          e.preventDefault();
          newIndex = lastIndex;
          break;
        default:
          return;
      }

      setFocusedIndex(newIndex);
      chipRefs.current[newIndex]?.focus();
    },
    [suggestions.length]
  );

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
      <p id="suggestions-label" className="text-[var(--lo1-stardust)]/60 text-xs mb-3">
        {t("continueExploring")}
      </p>
      {/* Grid layout: 1 column on mobile, 2 columns on tablet, 3 on desktop */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2"
        role="group"
        aria-labelledby="suggestions-label"
      >
        {suggestions.map((suggestion, index) => (
          <motion.button
            key={index}
            ref={(el) => {
              chipRefs.current[index] = el;
            }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.9 + index * 0.1, duration: 0.3 }}
            onClick={() => handleClick(suggestion)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            disabled={disabled}
            tabIndex={focusedIndex === -1 || focusedIndex === index ? 0 : -1}
            data-testid="suggestion-chip"
            aria-label={t("suggestion", { text: suggestion })}
            className={`
              w-full px-4 py-2.5 rounded-lg text-sm text-left
              border border-[var(--lo1-gold)]/40
              bg-[var(--lo1-indigo)]/40 backdrop-blur-sm
              text-[var(--lo1-text-light)]
              transition-all duration-200
              ${
                disabled
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:border-[var(--lo1-gold)]/70 hover:bg-[var(--lo1-indigo)]/60 hover:shadow-[0_0_12px_rgba(212,168,83,0.15)] cursor-pointer active:scale-[0.98]"
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
