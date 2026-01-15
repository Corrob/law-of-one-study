"use client";

import { memo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { StudyPathMeta, PathProgress } from "@/lib/schemas/study-paths";

interface PathCardProps {
  /** Path metadata */
  path: StudyPathMeta;
  /** Progress for this path, if any */
  progress?: PathProgress | null;
  /** Whether to show as a "continue" card (larger, more prominent) */
  variant?: "default" | "continue";
}

/**
 * Get difficulty badge color (theme-aware).
 */
function getDifficultyColor(difficulty: StudyPathMeta["difficulty"]): string {
  switch (difficulty) {
    case "beginner":
      return "bg-[var(--lo1-success-bg)] text-[var(--lo1-success-text)] border-[var(--lo1-success-border)]";
    case "intermediate":
      return "bg-[var(--lo1-warning-bg)] text-[var(--lo1-warning-text)] border-[var(--lo1-warning-border)]";
    case "advanced":
      return "bg-[var(--lo1-error)]/15 text-[var(--lo1-error)] border-[var(--lo1-error)]/30";
    default:
      return "bg-[var(--lo1-celestial)]/20 text-[var(--lo1-celestial)]";
  }
}

/**
 * Calculate progress percentage.
 */
function getProgressPercent(
  progress: PathProgress | null | undefined,
  totalLessons: number
): number {
  if (!progress || totalLessons === 0) return 0;
  return Math.round((progress.lessonsCompleted.length / totalLessons) * 100);
}

/**
 * Get relative date info (returns diff data for translation).
 */
function getRelativeDateInfo(isoDate: string): { type: "today" | "yesterday" | "days" | "weeks" | "date"; count?: number; date?: Date } | null {
  try {
    const date = new Date(isoDate);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return { type: "today" };
    if (diffDays === 1) return { type: "yesterday" };
    if (diffDays < 7) return { type: "days", count: diffDays };
    if (diffDays < 30) return { type: "weeks", count: Math.floor(diffDays / 7) };
    return { type: "date", date };
  } catch {
    return null;
  }
}

/**
 * Displays a study path card with:
 * - Title and difficulty badge
 * - Duration and lesson count
 * - Progress bar (if started)
 * - Last accessed date (if in progress)
 */
const PathCard = memo(function PathCard({
  path,
  progress,
  variant = "default",
}: PathCardProps) {
  const locale = useLocale();
  const t = useTranslations("studyPaths");
  const progressPercent = getProgressPercent(progress, path.lessonCount);

  // Format last accessed date
  const formatLastAccessed = (isoDate: string): string => {
    const info = getRelativeDateInfo(isoDate);
    if (!info) return "";
    switch (info.type) {
      case "today": return t("today");
      case "yesterday": return t("yesterday");
      case "days": return t("daysAgo", { count: info.count! });
      case "weeks": return t("weeksAgo", { count: info.count! });
      case "date": return info.date!.toLocaleDateString(locale === "es" ? "es-ES" : "en-US", { month: "short", day: "numeric" });
    }
  };
  const isStarted = progress && progress.status !== "not_started";
  const isCompleted = progress?.status === "completed";
  const isContinue = variant === "continue";

  return (
    <Link
      href={`/paths/${path.id}`}
      className={`
        block rounded-xl transition-all overflow-hidden group
        ${isContinue
          ? "bg-[var(--lo1-indigo)]/60 border border-[var(--lo1-gold)]/30 hover:border-[var(--lo1-gold)]/50"
          : "bg-gradient-to-br from-[var(--lo1-space)]/80 to-[var(--lo1-indigo)]/40 border border-[var(--lo1-celestial)]/20 hover:border-[var(--lo1-celestial)]/40"
        }
        hover:shadow-lg hover:shadow-[var(--lo1-indigo)]/20
      `}
    >
      {/* Subtle top accent bar */}
      <div className={`h-1 ${isCompleted ? "bg-[var(--lo1-gold)]" : "bg-gradient-to-r from-[var(--lo1-gold)]/60 via-[var(--lo1-celestial)]/40 to-transparent"}`} />

      <div className={`p-5 ${isContinue ? "p-6" : ""}`}>
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3
            className={`
              font-medium text-[var(--lo1-starlight)] group-hover:text-white transition-colors
              ${isContinue ? "text-lg" : "text-base"}
            `}
          >
            {path.title}
          </h3>
          {isCompleted && (
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--lo1-gold)]/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-[var(--lo1-gold)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </span>
          )}
        </div>

        {/* Description */}
        <p className="text-sm text-[var(--lo1-text-light)]/80 mb-4 line-clamp-2 leading-relaxed">
          {path.description}
        </p>

        {/* Meta info */}
        <div className="flex flex-wrap items-center gap-2.5 text-sm mb-4">
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getDifficultyColor(path.difficulty)}`}
          >
            {t(`difficulty.${path.difficulty}`)}
          </span>
          <span className="text-[var(--lo1-text-light)]/60 flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {t("minutes", { count: path.estimatedMinutes })}
          </span>
          <span className="text-[var(--lo1-text-light)]/60 flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            {t("lessons", { count: path.lessonCount })}
          </span>
        </div>

        {/* Progress section */}
        {isStarted && !isCompleted && (
          <div className="pt-3 border-t border-[var(--lo1-celestial)]/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-[var(--lo1-stardust)]">
                {t("progress")}
              </span>
              <span className="text-xs font-semibold text-[var(--lo1-gold)]">
                {progressPercent}%
              </span>
            </div>
            <div className="h-2 bg-[var(--lo1-celestial)]/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[var(--lo1-gold)] to-[var(--lo1-gold-light)] rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-[var(--lo1-text-light)]/60">
                {t("lessonsComplete", { completed: progress?.lessonsCompleted.length, total: path.lessonCount })}
              </span>
              {progress?.lastAccessed && (
                <span className="text-xs text-[var(--lo1-text-light)]/50">
                  {formatLastAccessed(progress.lastAccessed)}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Not started indicator */}
        {!isStarted && (
          <div className="pt-3 border-t border-[var(--lo1-celestial)]/10 flex items-center justify-between">
            <span className="text-xs text-[var(--lo1-text-light)]/50 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[var(--lo1-celestial)]/30" />
              {t("notStarted")}
            </span>
            <span className="text-xs text-[var(--lo1-gold)] opacity-0 group-hover:opacity-100 transition-opacity">
              {t("startLearning")}
            </span>
          </div>
        )}

        {/* Completed indicator */}
        {isCompleted && (
          <div className="pt-3 border-t border-[var(--lo1-celestial)]/10 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--lo1-gold)]" />
            <span className="text-xs font-medium text-[var(--lo1-gold)]">
              {t("completed")}
            </span>
          </div>
        )}

        {/* Continue button for continue variant */}
        {isContinue && isStarted && !isCompleted && (
          <div className="mt-4 flex justify-end">
            <span className="px-5 py-2.5 rounded-lg text-sm font-medium bg-[var(--lo1-gold)] text-[var(--lo1-space)]">
              {t("continueButton")}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
});

export default PathCard;
