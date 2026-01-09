/**
 * Utilities for loading and managing study paths.
 */

import type { StudyPath, StudyPathMeta } from "@/lib/schemas/study-paths";
import { parseStudyPath, extractPathMeta } from "@/lib/schemas/study-paths";

// Import study path data directly
// In a larger app, this might be fetched from an API
import densitiesData from "@/data/study-paths/densities.json";

/**
 * All available study paths.
 * Add new paths here as they are created.
 */
const STUDY_PATHS_DATA: unknown[] = [densitiesData];

/**
 * Parsed and validated study paths.
 */
let cachedPaths: StudyPath[] | null = null;

/**
 * Get all validated study paths.
 */
export function getAllStudyPaths(): StudyPath[] {
  if (cachedPaths) return cachedPaths;

  const paths: StudyPath[] = [];

  for (const data of STUDY_PATHS_DATA) {
    const result = parseStudyPath(data);
    if (result.success) {
      paths.push(result.data);
    } else {
      console.error("Invalid study path data:", result.error);
    }
  }

  cachedPaths = paths;
  return paths;
}

/**
 * Get metadata for all study paths (for list display).
 */
export function getAllPathMetas(): StudyPathMeta[] {
  return getAllStudyPaths().map(extractPathMeta);
}

/**
 * Get a specific study path by ID.
 */
export function getStudyPath(pathId: string): StudyPath | null {
  const paths = getAllStudyPaths();
  return paths.find((p) => p.id === pathId) || null;
}

/**
 * Get a specific lesson from a study path.
 */
export function getLesson(
  pathId: string,
  lessonId: string
): { path: StudyPath; lesson: StudyPath["lessons"][number]; lessonIndex: number } | null {
  const path = getStudyPath(pathId);
  if (!path) return null;

  const lessonIndex = path.lessons.findIndex((l) => l.id === lessonId);
  if (lessonIndex === -1) return null;

  return {
    path,
    lesson: path.lessons[lessonIndex],
    lessonIndex,
  };
}
