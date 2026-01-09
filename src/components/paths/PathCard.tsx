"use client";

import { memo } from "react";
import Link from "next/link";
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
 * Get difficulty badge color.
 */
function getDifficultyColor(difficulty: StudyPathMeta["difficulty"]): string {
  switch (difficulty) {
    case "beginner":
      return "bg-green-900/30 text-green-300 border-green-500/30";
    case "intermediate":
      return "bg-amber-900/30 text-amber-300 border-amber-500/30";
    case "advanced":
      return "bg-red-900/30 text-red-300 border-red-500/30";
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
 * Format last accessed date.
 */
function formatLastAccessed(isoDate: string): string {
  try {
    const date = new Date(isoDate);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return "";
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
  const progressPercent = getProgressPercent(progress, path.lessonCount);
  const isStarted = progress && progress.status !== "not_started";
  const isCompleted = progress?.status === "completed";
  const isContinue = variant === "continue";

  return (
    <Link
      href={`/paths/${path.id}`}
      className={`
        block rounded-lg transition-all overflow-hidden
        ${isContinue
          ? "bg-[var(--lo1-indigo)]/60 border border-[var(--lo1-gold)]/30 hover:border-[var(--lo1-gold)]/50"
          : "bg-gradient-to-br from-[var(--lo1-space)]/80 to-[var(--lo1-indigo)]/40 border border-[var(--lo1-celestial)]/20 hover:border-[var(--lo1-celestial)]/40"
        }
        hover:shadow-lg hover:shadow-[var(--lo1-indigo)]/20
      `}
    >
      {/* Subtle top accent bar */}
      <div className={`h-1 ${isCompleted ? "bg-[var(--lo1-gold)]" : "bg-gradient-to-r from-[var(--lo1-gold)]/60 via-[var(--lo1-celestial)]/40 to-transparent"}`} />

      <div className={`p-4 ${isContinue ? "p-5" : ""}`}>
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3
            className={`
              font-medium text-[var(--lo1-starlight)]
              ${isContinue ? "text-lg" : "text-base"}
            `}
          >
            {path.title}
          </h3>
          {isCompleted && (
            <span className="flex-shrink-0 text-[var(--lo1-gold)]">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </span>
          )}
        </div>

        {/* Description */}
        <p className="text-sm text-[var(--lo1-text-light)]/70 mb-3 line-clamp-2">
          {path.description}
        </p>

        {/* Meta info */}
        <div className="flex flex-wrap items-center gap-2 text-sm mb-3">
          <span
            className={`px-2 py-0.5 rounded-full text-xs border ${getDifficultyColor(path.difficulty)}`}
          >
            {path.difficulty.charAt(0).toUpperCase() + path.difficulty.slice(1)}
          </span>
          <span className="text-[var(--lo1-text-light)]/60">
            {path.estimatedMinutes} min
          </span>
          <span className="text-[var(--lo1-text-light)]/40">·</span>
          <span className="text-[var(--lo1-text-light)]/60">
            {path.lessonCount} lessons
          </span>
        </div>

        {/* Progress bar */}
        {isStarted && !isCompleted && (
          <div className="mb-3">
            <div className="h-1.5 bg-[var(--lo1-celestial)]/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--lo1-gold)] rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between items-center mt-1.5">
              <span className="text-xs text-[var(--lo1-text-light)]/60">
                {progress?.lessonsCompleted.length} of {path.lessonCount} lessons
              </span>
              {progress?.lastAccessed && (
                <span className="text-xs text-[var(--lo1-text-light)]/40">
                  {formatLastAccessed(progress.lastAccessed)}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Not started indicator */}
        {!isStarted && (
          <p className="text-xs text-[var(--lo1-text-light)]/40">
            Not started
          </p>
        )}

        {/* Completed indicator */}
        {isCompleted && (
          <p className="text-xs text-[var(--lo1-gold)]">
            Completed
          </p>
        )}

        {/* Continue button for continue variant */}
        {isContinue && isStarted && !isCompleted && (
          <div className="mt-4 flex justify-end">
            <span className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--lo1-gold)] text-[var(--lo1-space)]">
              Continue
            </span>
          </div>
        )}
      </div>
    </Link>
  );
});

export default PathCard;
