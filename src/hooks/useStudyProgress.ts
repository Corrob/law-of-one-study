"use client";

import { useState, useCallback, useEffect } from "react";
import {
  StudyProgress,
  PathProgress,
  SavedReflection,
  QuizResponse,
  SectionProgressState,
  parseStudyProgress,
} from "@/lib/schemas/study-paths";
import {
  initializePathProgress,
  updatePathPosition,
  updateSectionState,
  completeLessonProgress,
  saveReflectionProgress,
  saveQuizResponseProgress,
  completePathProgress,
  removePathProgress,
  getReflectionFromProgress,
  getQuizResponseFromProgress,
} from "@/lib/study-progress-helpers";

const STORAGE_KEY = "law-of-one-study-progress";

/**
 * Return type for the useStudyProgress hook.
 */
interface UseStudyProgressReturn {
  /** All progress data across paths */
  progress: StudyProgress;
  /** Whether progress has been loaded from storage */
  isLoaded: boolean;
  /** Get progress for a specific path */
  getPathProgress: (pathId: string) => PathProgress | null;
  /** Initialize progress for a path (called when user starts a path) */
  initializePath: (pathId: string, firstLessonId: string) => void;
  /** Update current lesson and section position */
  updatePosition: (pathId: string, lessonId: string, sectionIndex: number) => void;
  /** Mark a section as viewed or completed */
  updateSectionProgress: (
    pathId: string,
    lessonId: string,
    sectionIndex: number,
    state: SectionProgressState
  ) => void;
  /** Mark a lesson as completed */
  completeLesson: (pathId: string, lessonId: string) => void;
  /** Save a reflection response */
  saveReflection: (pathId: string, lessonId: string, sectionIndex: number, text: string) => void;
  /** Save a quiz response */
  saveQuizResponse: (
    pathId: string,
    lessonId: string,
    sectionIndex: number,
    response: Omit<QuizResponse, "timestamp">
  ) => void;
  /** Get a saved reflection */
  getReflection: (pathId: string, lessonId: string, sectionIndex: number) => SavedReflection | null;
  /** Get a quiz response */
  getQuizResponse: (
    pathId: string,
    lessonId: string,
    sectionIndex: number
  ) => QuizResponse | null;
  /** Mark entire path as completed */
  completePath: (pathId: string) => void;
  /** Reset progress for a specific path */
  resetPathProgress: (pathId: string) => void;
  /** Reset all progress */
  resetAllProgress: () => void;
}

/**
 * Custom hook for managing study progress with localStorage persistence.
 *
 * Handles:
 * - Path initialization and position tracking
 * - Section-level progress (not_seen, viewed, completed)
 * - Lesson completion tracking
 * - Reflection storage and retrieval
 * - Quiz response storage and retrieval
 *
 * @returns Study progress state and controls
 *
 * @example
 * ```tsx
 * const { progress, updatePosition, saveReflection } = useStudyProgress();
 *
 * // Update position as user navigates
 * updatePosition("densities", "lesson-1", 2);
 *
 * // Save a reflection
 * saveReflection("densities", "lesson-1", 3, "My thoughts...");
 * ```
 */
export function useStudyProgress(): UseStudyProgressReturn {
  const [progress, setProgress] = useState<StudyProgress>({});
  const [isLoaded, setIsLoaded] = useState(false);

  // Load progress from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const result = parseStudyProgress(parsed);
        if (result.success) {
          setProgress(result.data);
        } else {
          console.warn("Invalid progress data in localStorage:", result.error);
        }
      }
    } catch (error) {
      console.warn("Failed to load progress from localStorage:", error);
    }
    setIsLoaded(true);
  }, []);

  // Save progress to localStorage whenever it changes
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
      } catch (error) {
        console.warn("Failed to save progress to localStorage:", error);
      }
    }
  }, [progress, isLoaded]);

  const getPathProgress = useCallback(
    (pathId: string): PathProgress | null => {
      return progress[pathId] || null;
    },
    [progress]
  );

  const initializePath = useCallback((pathId: string, firstLessonId: string) => {
    setProgress((prev) => initializePathProgress(prev, pathId, firstLessonId));
  }, []);

  const updatePosition = useCallback(
    (pathId: string, lessonId: string, sectionIndex: number) => {
      setProgress((prev) => updatePathPosition(prev, pathId, lessonId, sectionIndex));
    },
    []
  );

  const updateSectionProgress = useCallback(
    (pathId: string, lessonId: string, sectionIndex: number, state: SectionProgressState) => {
      setProgress((prev) => updateSectionState(prev, pathId, lessonId, sectionIndex, state));
    },
    []
  );

  const completeLesson = useCallback((pathId: string, lessonId: string) => {
    setProgress((prev) => completeLessonProgress(prev, pathId, lessonId));
  }, []);

  const saveReflection = useCallback(
    (pathId: string, lessonId: string, sectionIndex: number, text: string) => {
      setProgress((prev) => saveReflectionProgress(prev, pathId, lessonId, sectionIndex, text));
    },
    []
  );

  const saveQuizResponse = useCallback(
    (pathId: string, lessonId: string, sectionIndex: number, response: Omit<QuizResponse, "timestamp">) => {
      setProgress((prev) => saveQuizResponseProgress(prev, pathId, lessonId, sectionIndex, response));
    },
    []
  );

  const getReflection = useCallback(
    (pathId: string, lessonId: string, sectionIndex: number): SavedReflection | null => {
      return getReflectionFromProgress(progress, pathId, lessonId, sectionIndex);
    },
    [progress]
  );

  const getQuizResponse = useCallback(
    (pathId: string, lessonId: string, sectionIndex: number): QuizResponse | null => {
      return getQuizResponseFromProgress(progress, pathId, lessonId, sectionIndex);
    },
    [progress]
  );

  const completePath = useCallback((pathId: string) => {
    setProgress((prev) => completePathProgress(prev, pathId));
  }, []);

  const resetPathProgress = useCallback((pathId: string) => {
    setProgress((prev) => removePathProgress(prev, pathId));
  }, []);

  const resetAllProgress = useCallback(() => {
    setProgress({});
  }, []);

  return {
    progress,
    isLoaded,
    getPathProgress,
    initializePath,
    updatePosition,
    updateSectionProgress,
    completeLesson,
    saveReflection,
    saveQuizResponse,
    getReflection,
    getQuizResponse,
    completePath,
    resetPathProgress,
    resetAllProgress,
  };
}
