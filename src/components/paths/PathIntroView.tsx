"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { titleVariants, fadeWithDelay, staggerContainer, staggerChild } from "@/lib/animations";
import type { StudyPath } from "@/lib/schemas/study-paths";

interface PathIntroViewProps {
  /** The study path to display */
  path: StudyPath;
  /** Callback when user clicks Start Path */
  onStart: () => void;
}

/**
 * Get difficulty badge styling (theme-aware).
 */
function getDifficultyStyle(difficulty: StudyPath["difficulty"]): string {
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
      <motion.header
        className="text-center mb-8"
        variants={titleVariants}
        initial="hidden"
        animate="visible"
      >
        <h1 className="text-3xl font-semibold text-[var(--lo1-starlight)] mb-4">
          {path.title}
        </h1>
        <p className="text-[var(--lo1-text-light)]/80 leading-relaxed">
          {path.description}
        </p>
      </motion.header>

      {/* Meta info */}
      <motion.div
        className="flex flex-wrap items-center justify-center gap-3 mb-8"
        variants={fadeWithDelay(0.1)}
        initial="hidden"
        animate="visible"
      >
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
      </motion.div>

      {/* Table of Contents */}
      <motion.div
        className="bg-[var(--lo1-space)]/50 border border-[var(--lo1-celestial)]/20 rounded-xl p-6 mb-8"
        variants={fadeWithDelay(0.15)}
        initial="hidden"
        animate="visible"
      >
        <h2 className="text-sm uppercase tracking-wider text-[var(--lo1-text-light)]/50 mb-5">
          What You&apos;ll Learn
        </h2>
        <motion.ol
          className="space-y-1"
          variants={staggerContainer(0.04)}
          initial="hidden"
          animate="visible"
        >
          {path.lessons.map((lesson, index) => (
            <motion.li
              key={lesson.id}
              className="relative flex items-center gap-4 group"
              variants={staggerChild}
            >
              {/* Connecting line */}
              {index < path.lessons.length - 1 && (
                <div className="absolute left-[18px] top-[36px] w-0.5 h-[calc(100%)] bg-gradient-to-b from-[var(--lo1-celestial)]/30 to-transparent" />
              )}
              {/* Step number */}
              <div className="relative flex-shrink-0 w-9 h-9 rounded-full bg-gradient-to-br from-[var(--lo1-celestial)]/20 to-[var(--lo1-indigo)]/30 border border-[var(--lo1-celestial)]/20 flex items-center justify-center group-hover:border-[var(--lo1-gold)]/40 transition-colors">
                <span className="text-sm font-semibold text-[var(--lo1-celestial)] group-hover:text-[var(--lo1-gold)] transition-colors">
                  {index + 1}
                </span>
              </div>
              {/* Lesson title */}
              <div className="flex-1 py-3">
                <span className="text-[var(--lo1-text-light)] group-hover:text-[var(--lo1-starlight)] transition-colors">
                  {lesson.title}
                </span>
                {lesson.estimatedMinutes && (
                  <span className="ml-2 text-xs text-[var(--lo1-text-light)]/40">
                    ~{lesson.estimatedMinutes} min
                  </span>
                )}
              </div>
            </motion.li>
          ))}
        </motion.ol>
      </motion.div>

      {/* Concepts (if any) */}
      {path.concepts && path.concepts.length > 0 && (
        <motion.div
          className="mb-8"
          variants={fadeWithDelay(0.25)}
          initial="hidden"
          animate="visible"
        >
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
        </motion.div>
      )}

      {/* Start button */}
      <motion.div
        className="text-center"
        variants={fadeWithDelay(0.3)}
        initial="hidden"
        animate="visible"
      >
        <button
          onClick={onStart}
          className="px-8 py-3 rounded-lg font-medium text-lg bg-[var(--lo1-gold)] text-[var(--lo1-space)] hover:bg-[var(--lo1-gold-light)] transition-colors cursor-pointer"
        >
          Start Path
        </button>
      </motion.div>
    </div>
  );
});

export default PathIntroView;
