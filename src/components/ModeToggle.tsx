"use client";

import { useTranslations } from "next-intl";
import { type SearchMode } from "@/lib/schemas";

/**
 * Mode toggle component for switching between sentence and passage search.
 */
export default function ModeToggle({
  mode,
  onChange,
}: {
  mode: SearchMode;
  onChange: (mode: SearchMode) => void;
}) {
  const t = useTranslations("search.modeToggle");
  return (
    <div className="flex rounded-lg bg-[var(--lo1-deep-space)]/60 p-1 border border-[var(--lo1-celestial)]/20">
      <button
        onClick={() => onChange("sentence")}
        className={`px-4 py-1.5 rounded-md text-sm transition-all cursor-pointer ${
          mode === "sentence"
            ? "bg-[var(--lo1-gold)]/20 text-[var(--lo1-gold)] border border-[var(--lo1-gold)]/40"
            : "text-[var(--lo1-stardust)] hover:text-[var(--lo1-starlight)] border border-transparent"
        }`}
      >
        {t("sentence")}
      </button>
      <button
        onClick={() => onChange("passage")}
        className={`px-4 py-1.5 rounded-md text-sm transition-all cursor-pointer ${
          mode === "passage"
            ? "bg-[var(--lo1-gold)]/20 text-[var(--lo1-gold)] border border-[var(--lo1-gold)]/40"
            : "text-[var(--lo1-stardust)] hover:text-[var(--lo1-starlight)] border border-transparent"
        }`}
      >
        {t("passage")}
      </button>
    </div>
  );
}
