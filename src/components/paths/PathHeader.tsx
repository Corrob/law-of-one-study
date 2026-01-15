"use client";

import { memo, RefObject } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

interface PathHeaderProps {
  /** Path title to display (optional - not shown on intro) */
  title?: string;
  /** Whether to show the reading progress bar */
  showProgressBar?: boolean;
  /** Ref for the progress bar element (for direct DOM updates) */
  progressBarRef?: RefObject<HTMLDivElement | null>;
}

/**
 * Header component for study path pages.
 * Shows back navigation, optional title, and optional reading progress bar.
 */
const PathHeader = memo(function PathHeader({
  title,
  showProgressBar = false,
  progressBarRef,
}: PathHeaderProps) {
  const t = useTranslations("studyPaths");

  return (
    <div
      className={`sticky top-0 bg-[var(--lo1-space)]/95 backdrop-blur-sm z-20 ${
        !showProgressBar ? "border-b border-[var(--lo1-celestial)]/10" : ""
      }`}
    >
      <div className="px-4 py-3 flex items-center justify-between">
        <Link
          href="/paths"
          className="text-sm text-[var(--lo1-text-light)]/60 hover:text-[var(--lo1-starlight)] flex items-center gap-1 cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {t("title")}
        </Link>

        {title ? (
          <h2 className="text-sm font-medium text-[var(--lo1-starlight)]">{title}</h2>
        ) : null}

        <div className="w-20" /> {/* Spacer for centering */}
      </div>

      {showProgressBar && (
        <div className="h-1 bg-[var(--lo1-celestial)]/10 rounded-full overflow-hidden">
          <div
            ref={progressBarRef}
            className="h-full bg-[var(--lo1-gold)]"
            style={{ width: "0%" }}
            role="progressbar"
            aria-label="Reading progress"
          />
        </div>
      )}
    </div>
  );
});

export default PathHeader;
