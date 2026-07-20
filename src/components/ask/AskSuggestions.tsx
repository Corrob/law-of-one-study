"use client";

import { askAnalytics } from "@/lib/ask/analytics";

interface AskSuggestionsProps {
  suggestions: string[];
  onPick: (suggestion: string) => void;
}

/** Follow-up question chips for the latest answer (extracted from AskContent). */
export default function AskSuggestions({ suggestions, onPick }: AskSuggestionsProps) {
  if (suggestions.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2 pt-1">
      {suggestions.map((suggestion, index) => (
        <button
          key={suggestion}
          type="button"
          data-testid="ask-suggestion"
          onClick={() => {
            askAnalytics.suggestionClicked({ suggestion, index });
            onPick(suggestion);
          }}
          className="text-sm text-left px-3 py-1.5 rounded-full border border-[var(--lo1-gold)]/25
                     bg-[var(--lo1-indigo)]/40 text-[var(--lo1-stardust)]
                     hover:bg-[var(--lo1-gold)]/10 hover:text-[var(--lo1-starlight)] hover:border-[var(--lo1-gold)]/50
                     transition-colors cursor-pointer"
        >
          {suggestion}
        </button>
      ))}
    </div>
  );
}
