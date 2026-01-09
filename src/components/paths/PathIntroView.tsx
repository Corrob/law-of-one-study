"use client";

import { memo } from "react";
import type { StudyPath } from "@/lib/schemas/study-paths";

interface PathIntroViewProps {
  /** The study path to display */
  path: StudyPath;
  /** Callback when user clicks Start Path */
  onStart: () => void;
}

/**
 * Get difficulty badge styling.
 */
function getDifficultyStyle(difficulty: StudyPath["difficulty"]): string {
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
 * Intro/overview page for a study path.
 * Shows path metadata, table of contents, and start button.
 */
const PathIntroView = memo(function PathIntroView({
  path,
  onStart,
}: PathIntroViewProps) {
  return (
    <div className="max-w-2xl mx-auto py-8">
      {/* Header */}
      <header className="text-center mb-8">
        <h1 className="text-3xl font-semibold text-[var(--lo1-starlight)] mb-4">
          {path.title}
        </h1>
        <p className="text-[var(--lo1-text-light)]/80 leading-relaxed">
          {path.description}
        </p>
      </header>

      {/* Meta info */}
      <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
        <span
          className={`px-3 py-1 rounded-full text-sm border ${getDifficultyStyle(path.difficulty)}`}
        >
          {path.difficulty.charAt(0).toUpperCase() + path.difficulty.slice(1)}
        </span>
        <span className="text-[var(--lo1-text-light)]/60 text-sm">
          ~{path.estimatedMinutes} minutes
        </span>
        <span className="text-[var(--lo1-text-light)]/40">·</span>
        <span className="text-[var(--lo1-text-light)]/60 text-sm">
          {path.lessons.length} lessons
        </span>
      </div>

      {/* Table of Contents */}
      <div className="bg-[var(--lo1-space)]/50 border border-[var(--lo1-celestial)]/20 rounded-lg p-6 mb-8">
        <h2 className="text-sm uppercase tracking-wider text-[var(--lo1-text-light)]/50 mb-4">
          What You&apos;ll Learn
        </h2>
        <ol className="space-y-3">
          {path.lessons.map((lesson, index) => (
            <li key={lesson.id} className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[var(--lo1-celestial)]/20 text-[var(--lo1-celestial)] text-sm flex items-center justify-center">
                {index + 1}
              </span>
              <span className="text-[var(--lo1-text-light)] pt-0.5">
                {lesson.title}
              </span>
            </li>
          ))}
        </ol>
      </div>

      {/* Concepts (if any) */}
      {path.concepts && path.concepts.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm uppercase tracking-wider text-[var(--lo1-text-light)]/50 mb-3 text-center">
            Key Concepts
          </h2>
          <div className="flex flex-wrap justify-center gap-2">
            {path.concepts.map((concept) => (
              <span
                key={concept}
                className="px-3 py-1 rounded-full text-sm bg-[var(--lo1-indigo)]/40 text-[var(--lo1-stardust)] border border-[var(--lo1-celestial)]/10"
              >
                {concept}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Start button */}
      <div className="text-center">
        <button
          onClick={onStart}
          className="px-8 py-3 rounded-lg font-medium text-lg bg-[var(--lo1-gold)] text-[var(--lo1-space)] hover:bg-[var(--lo1-gold-light)] transition-colors cursor-pointer"
        >
          Start Path
        </button>
      </div>
    </div>
  );
});

export default PathIntroView;
