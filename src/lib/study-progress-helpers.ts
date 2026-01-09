/**
 * Helper functions for study progress state updates.
 * Extracted from useStudyProgress hook to keep files under 300 lines.
 */

import type {
  StudyProgress,
  SavedReflection,
  QuizResponse,
  SectionProgressState,
} from "@/lib/schemas/study-paths";
import { createInitialPathProgress, getSectionKey } from "@/lib/schemas/study-paths";

/**
 * Initialize or update access time for a path.
 */
export function initializePathProgress(
  prev: StudyProgress,
  pathId: string,
  firstLessonId: string
): StudyProgress {
  // Don't reinitialize if already started
  if (prev[pathId]) {
    return {
      ...prev,
      [pathId]: {
        ...prev[pathId],
        lastAccessed: new Date().toISOString(),
      },
    };
  }
  return {
    ...prev,
    [pathId]: createInitialPathProgress(pathId, firstLessonId),
  };
}

/**
 * Update current position within a path.
 */
export function updatePathPosition(
  prev: StudyProgress,
  pathId: string,
  lessonId: string,
  sectionIndex: number
): StudyProgress {
  const pathProgress = prev[pathId];
  if (!pathProgress) return prev;

  return {
    ...prev,
    [pathId]: {
      ...pathProgress,
      currentLesson: lessonId,
      currentSectionIndex: sectionIndex,
      lastAccessed: new Date().toISOString(),
      status: pathProgress.status === "not_started" ? "in_progress" : pathProgress.status,
    },
  };
}

/**
 * Update section progress state.
 */
export function updateSectionState(
  prev: StudyProgress,
  pathId: string,
  lessonId: string,
  sectionIndex: number,
  state: SectionProgressState
): StudyProgress {
  const pathProgress = prev[pathId];
  if (!pathProgress) return prev;

  return {
    ...prev,
    [pathId]: {
      ...pathProgress,
      lastAccessed: new Date().toISOString(),
      sectionProgress: {
        ...pathProgress.sectionProgress,
        [lessonId]: {
          ...pathProgress.sectionProgress[lessonId],
          [sectionIndex.toString()]: state,
        },
      },
    },
  };
}

/**
 * Mark a lesson as completed.
 */
export function completeLessonProgress(
  prev: StudyProgress,
  pathId: string,
  lessonId: string
): StudyProgress {
  const pathProgress = prev[pathId];
  if (!pathProgress) return prev;

  const lessonsCompleted = pathProgress.lessonsCompleted.includes(lessonId)
    ? pathProgress.lessonsCompleted
    : [...pathProgress.lessonsCompleted, lessonId];

  return {
    ...prev,
    [pathId]: {
      ...pathProgress,
      lessonsCompleted,
      lastAccessed: new Date().toISOString(),
    },
  };
}

/**
 * Save a reflection response.
 */
export function saveReflectionProgress(
  prev: StudyProgress,
  pathId: string,
  lessonId: string,
  sectionIndex: number,
  text: string
): StudyProgress {
  const pathProgress = prev[pathId];
  if (!pathProgress) return prev;

  const key = getSectionKey(lessonId, sectionIndex);
  const existingReflection = pathProgress.reflections[key];
  const now = new Date().toISOString();

  return {
    ...prev,
    [pathId]: {
      ...pathProgress,
      lastAccessed: now,
      reflections: {
        ...pathProgress.reflections,
        [key]: {
          text,
          savedAt: existingReflection?.savedAt || now,
          updatedAt: existingReflection ? now : undefined,
        },
      },
    },
  };
}

/**
 * Save a quiz response.
 */
export function saveQuizResponseProgress(
  prev: StudyProgress,
  pathId: string,
  lessonId: string,
  sectionIndex: number,
  response: Omit<QuizResponse, "timestamp">
): StudyProgress {
  const pathProgress = prev[pathId];
  if (!pathProgress) return prev;

  const key = getSectionKey(lessonId, sectionIndex);

  return {
    ...prev,
    [pathId]: {
      ...pathProgress,
      lastAccessed: new Date().toISOString(),
      quizResponses: {
        ...pathProgress.quizResponses,
        [key]: {
          ...response,
          timestamp: new Date().toISOString(),
        },
      },
    },
  };
}

/**
 * Mark a path as completed.
 */
export function completePathProgress(prev: StudyProgress, pathId: string): StudyProgress {
  const pathProgress = prev[pathId];
  if (!pathProgress) return prev;

  return {
    ...prev,
    [pathId]: {
      ...pathProgress,
      status: "completed",
      lastAccessed: new Date().toISOString(),
    },
  };
}

/**
 * Remove progress for a specific path.
 */
export function removePathProgress(prev: StudyProgress, pathId: string): StudyProgress {
  const newProgress = { ...prev };
  delete newProgress[pathId];
  return newProgress;
}

/**
 * Get a saved reflection from progress.
 */
export function getReflectionFromProgress(
  progress: StudyProgress,
  pathId: string,
  lessonId: string,
  sectionIndex: number
): SavedReflection | null {
  const pathProgress = progress[pathId];
  if (!pathProgress) return null;

  const key = getSectionKey(lessonId, sectionIndex);
  return pathProgress.reflections[key] || null;
}

/**
 * Get a quiz response from progress.
 */
export function getQuizResponseFromProgress(
  progress: StudyProgress,
  pathId: string,
  lessonId: string,
  sectionIndex: number
): QuizResponse | null {
  const pathProgress = progress[pathId];
  if (!pathProgress) return null;

  const key = getSectionKey(lessonId, sectionIndex);
  return pathProgress.quizResponses[key] || null;
}
