"use client";

import { useTranslations } from "next-intl";
import type { SourceFilter as SourceFilterType } from "@/lib/schemas";

interface SourceFilterProps {
  value: SourceFilterType;
  onChange: (value: SourceFilterType) => void;
}

const options: SourceFilterType[] = ["ra", "confederation", "all"];

/**
 * Segmented control for selecting search source: Ra, Confederation, or All.
 * Styled to match ModeToggle with source-specific color highlights.
 */
export default function SourceFilter({ value, onChange }: SourceFilterProps) {
  const t = useTranslations("search.sourceFilter");

  return (
    <div
      role="radiogroup"
      aria-label={t("label")}
      className="flex rounded-lg bg-[var(--lo1-deep-space)]/60 p-1 border border-[var(--lo1-celestial)]/20"
    >
      {options.map((option) => {
        const isActive = value === option;
        const colorClass = isActive
          ? option === "ra"
            ? "bg-[var(--lo1-gold)]/20 text-[var(--lo1-gold)] border border-[var(--lo1-gold)]/40"
            : option === "confederation"
              ? "bg-[var(--lo1-celestial)]/20 text-[var(--lo1-celestial)] border border-[var(--lo1-celestial)]/40"
              : "bg-[var(--lo1-gold)]/15 text-[var(--lo1-starlight)] border border-[var(--lo1-gold)]/30"
          : "text-[var(--lo1-stardust)] hover:text-[var(--lo1-starlight)] border border-transparent";

        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => onChange(option)}
            className={`px-3 py-1.5 rounded-md text-sm transition-all cursor-pointer ${colorClass}`}
          >
            {t(option)}
          </button>
        );
      })}
    </div>
  );
}
