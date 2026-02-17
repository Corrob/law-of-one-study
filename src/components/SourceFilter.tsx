"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

interface SourceFilterProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

/**
 * Toggle switch for including Confederation material alongside Ra Material.
 * Styled to match ThinkingModeToggle.
 */
export default function SourceFilter({ enabled, onChange }: SourceFilterProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const t = useTranslations("search.confederationToggle");

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={() => onChange(!enabled)}
        className="flex items-center gap-3 px-3 py-1.5 rounded-full text-sm cursor-pointer group"
      >
        {/* Toggle track */}
        <div
          className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
            enabled
              ? "bg-[var(--lo1-gold)]"
              : "bg-[var(--lo1-celestial)]/40 group-hover:bg-[var(--lo1-celestial)]/60"
          }`}
        >
          {/* Toggle knob */}
          <div
            className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200 ${
              enabled ? "translate-x-[22px]" : "translate-x-0.5"
            }`}
          />
        </div>
        {/* Label */}
        <span className={`whitespace-nowrap ${enabled ? "text-[var(--lo1-gold)]" : "text-[var(--lo1-stardust)] group-hover:text-[var(--lo1-starlight)]"}`}>
          {t("label")}
        </span>
        {/* Full text on larger screens */}
        <span className="hidden sm:inline text-[var(--lo1-stardust)]/40">&middot;</span>
        <span className="hidden sm:inline text-[var(--lo1-stardust)]/60">
          {t("description")}
        </span>
      </button>

      {/* Info icon on mobile - separate from toggle */}
      <div className="relative sm:hidden">
        <button
          type="button"
          onClick={() => setShowTooltip(!showTooltip)}
          className="p-1.5 text-[var(--lo1-stardust)]/60 hover:text-[var(--lo1-stardust)] cursor-pointer"
          aria-label={t("label")}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <circle cx="12" cy="12" r="10" />
            <path strokeLinecap="round" d="M12 16v-4M12 8h.01" />
          </svg>
        </button>
        {/* Tooltip */}
        {showTooltip && (
          <>
            <div
              className="fixed inset-0 z-[100]"
              onClick={() => setShowTooltip(false)}
            />
            <div className="absolute right-0 bottom-full mb-2 z-[101] w-48 p-2 rounded-lg bg-[var(--lo1-indigo)] border border-[var(--lo1-celestial)]/40 shadow-lg text-xs text-[var(--lo1-stardust)]">
              {t("tooltip")}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
