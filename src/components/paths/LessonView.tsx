"use client";

import { memo, useCallback } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import type {
  StudyPath,
  PathProgress,
  QuizResponse,
} from "@/lib/schemas/study-paths";
import ContentSection from "./ContentSection";
import QuoteSection from "./QuoteSection";
import MultipleChoiceSection from "./MultipleChoiceSection";
import ReflectionSection from "./ReflectionSection";
import { getSectionKey } from "@/lib/schemas/study-paths";
import { titleVariants, staggerContainer, staggerChild } from "@/lib/animations";

interface LessonViewProps {
  /** The current study path */
  path: StudyPath;
  /** The current lesson */
  lesson: StudyPath["lessons"][number];
  /** Index of current lesson in path */
  lessonIndex: number;
  /** Progress data for this path */
  progress: PathProgress | null;
  /** Callback to update section position */
  onPositionChange?: (sectionIndex: number) => void;
  /** Callback to save a reflection */
  onSaveReflection?: (lessonId: string, sectionIndex: number, text: string) => void;
  /** Callback to save a quiz response */
  onSaveQuizResponse?: (
    lessonId: string,
    sectionIndex: number,
    response: Omit<QuizResponse, "timestamp">
  ) => void;
  /** Callback when lesson is completed */
  onCompleteLesson?: () => void;
  /** Callback to navigate to next lesson */
  onNextLesson?: () => void;
  /** Callback to navigate to previous lesson */
  onPreviousLesson?: () => void;
}

/**
 * Renders a section based on its type.
 */
function renderSection(
  section: StudyPath["lessons"][number]["sections"][number],
  index: number,
  lessonId: string,
  progress: PathProgress | null,
  onSaveReflection?: (text: string) => void,
  onSaveQuizResponse?: (response: Omit<QuizResponse, "timestamp">) => void
) {
  const key = getSectionKey(lessonId, index);

  switch (section.type) {
    case "content":
      return <ContentSection key={index} section={section} />;

    case "quote":
      return <QuoteSection key={index} section={section} />;

    case "multiple-choice": {
      const savedResponse = progress?.quizResponses[key] || null;
      return (
        <MultipleChoiceSection
          key={index}
          section={section}
          savedResponse={savedResponse}
          onAnswer={onSaveQuizResponse}
        />
      );
    }

    case "reflection": {
      const savedReflection = progress?.reflections[key] || null;
      return (
        <ReflectionSection
          key={index}
          section={section}
          savedReflection={savedReflection}
          onSave={onSaveReflection}
        />
      );
    }

    default:
      return null;
  }
}

/**
 * Main lesson view component that:
 * - Displays all sections in order
 * - Shows a minimal reading progress bar
 * - Tracks current position
 * - Handles lesson completion
 * - Provides navigation between lessons
 */
const LessonView = memo(function LessonView({
  path,
  lesson,
  lessonIndex,
  progress,
  onPositionChange,
  onSaveReflection,
  onSaveQuizResponse,
  onCompleteLesson,
  onNextLesson,
  onPreviousLesson,
}: LessonViewProps) {
  const t = useTranslations("studyPaths");
  const isFirstLesson = lessonIndex === 0;
  const isLastLesson = lessonIndex === path.lessons.length - 1;
  const isLessonComplete = progress?.lessonsCompleted.includes(lesson.id) ?? false;

  const handleReflectionSave = useCallback(
    (sectionIndex: number) => (text: string) => {
      onSaveReflection?.(lesson.id, sectionIndex, text);
    },
    [lesson.id, onSaveReflection]
  );

  const handleQuizResponse = useCallback(
    (sectionIndex: number) => (response: Omit<QuizResponse, "timestamp">) => {
      onSaveQuizResponse?.(lesson.id, sectionIndex, response);
    },
    [lesson.id, onSaveQuizResponse]
  );

  const handleCompleteAndContinue = useCallback(() => {
    onCompleteLesson?.();
    onNextLesson?.();
  }, [onCompleteLesson, onNextLesson]);

  return (
    <div className="max-w-3xl mx-auto">
      {/* Lesson Title - key ensures re-animation on lesson change */}
      <motion.header
        key={`header-${lesson.id}`}
        className="mt-6 mb-4"
        variants={titleVariants}
        initial="hidden"
        animate="visible"
      >
        <h1 className="text-2xl font-semibold text-[var(--lo1-starlight)]">
          {lesson.title}
        </h1>
        {lesson.estimatedMinutes && (
          <p className="text-sm text-[var(--lo1-text-light)]/50 mt-1">
            {t("minRead", { count: lesson.estimatedMinutes })}
          </p>
        )}
      </motion.header>

      {/* Top Navigation */}
      <nav className="flex items-center justify-between mb-8 py-2 border-y border-[var(--lo1-celestial)]/10">
        <button
          onClick={onPreviousLesson}
          disabled={isFirstLesson}
          className={`flex items-center gap-1 text-sm transition-colors min-w-[90px] ${
            isFirstLesson
              ? "text-[var(--lo1-text-light)]/30 cursor-not-allowed"
              : "text-[var(--lo1-text-light)]/70 hover:text-[var(--lo1-starlight)] cursor-pointer"
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {isFirstLesson ? t("first") : t("previous")}
        </button>

        <span className="text-sm text-[var(--lo1-gold)]">
          {t("lessonOf", { current: lessonIndex + 1, total: path.lessons.length })}
        </span>

        <button
          onClick={onNextLesson}
          disabled={isLastLesson}
          className={`flex items-center gap-1 text-sm transition-colors min-w-[90px] justify-end ${
            isLastLesson
              ? "text-[var(--lo1-text-light)]/30 cursor-not-allowed"
              : "text-[var(--lo1-text-light)]/70 hover:text-[var(--lo1-starlight)] cursor-pointer"
          }`}
        >
          {isLastLesson ? t("last") : t("next")}
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </nav>

      {/* Sections - key ensures re-animation on lesson change */}
      <motion.div
        key={`sections-${lesson.id}`}
        className="space-y-8"
        variants={staggerContainer(0.03)}
        initial="hidden"
        animate="visible"
      >
        {lesson.sections.map((section, index) => (
          <motion.div
            key={`${lesson.id}_${index}`}
            variants={staggerChild}
            onClick={() => onPositionChange?.(index)}
          >
            {renderSection(
              section,
              index,
              lesson.id,
              progress,
              handleReflectionSave(index),
              handleQuizResponse(index)
            )}
          </motion.div>
        ))}
      </motion.div>

      {/* Lesson Completion CTA */}
      <footer className="mt-12 pt-8 border-t border-[var(--lo1-celestial)]/20 text-center">
        {!isLessonComplete ? (
          <button
            onClick={handleCompleteAndContinue}
            className="px-8 py-3 rounded-lg font-medium bg-[var(--lo1-gold)] text-[var(--lo1-space)] hover:bg-[var(--lo1-gold-light)] transition-colors cursor-pointer inline-flex items-center gap-2"
          >
            {isLastLesson ? t("completePath") : t("completeAndContinue")}
            {!isLastLesson && (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
          </button>
        ) : !isLastLesson ? (
          <button
            onClick={onNextLesson}
            className="px-8 py-3 rounded-lg font-medium bg-[var(--lo1-gold)] text-[var(--lo1-space)] hover:bg-[var(--lo1-gold-light)] transition-colors cursor-pointer inline-flex items-center gap-2"
          >
            {t("nextLesson")}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ) : (
          <span className="inline-flex items-center gap-2 text-[var(--lo1-gold)]">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {t("pathComplete")}
          </span>
        )}
      </footer>
    </div>
  );
});

export default LessonView;
