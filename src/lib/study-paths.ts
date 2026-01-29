/**
 * Utilities for loading and managing study paths.
 * Supports multiple languages with fallback to English.
 */

import type { StudyPath, StudyPathMeta } from "@/lib/schemas/study-paths";
import { parseStudyPath, extractPathMeta } from "@/lib/schemas/study-paths";
import { DEFAULT_LOCALE } from "@/lib/language-config";

// Import English study path data (default/fallback)
import densitiesDataEn from "@/data/study-paths/densities.json";
import polarityDataEn from "@/data/study-paths/polarity.json";
import energyCentersDataEn from "@/data/study-paths/energy-centers.json";
import catalystDataEn from "@/data/study-paths/catalyst.json";
import veilDataEn from "@/data/study-paths/veil.json";
import timeSpaceDataEn from "@/data/study-paths/time-space.json";
import archetypesDataEn from "@/data/study-paths/archetypes.json";

// Import Spanish study path data
import densitiesDataEs from "@/data/study-paths/es/densities.json";
import polarityDataEs from "@/data/study-paths/es/polarity.json";
import energyCentersDataEs from "@/data/study-paths/es/energy-centers.json";
import catalystDataEs from "@/data/study-paths/es/catalyst.json";
import veilDataEs from "@/data/study-paths/es/veil.json";
import timeSpaceDataEs from "@/data/study-paths/es/time-space.json";
import archetypesDataEs from "@/data/study-paths/es/archetypes.json";

// Import German study path data
import densitiesDataDe from "@/data/study-paths/de/densities.json";
import polarityDataDe from "@/data/study-paths/de/polarity.json";
import energyCentersDataDe from "@/data/study-paths/de/energy-centers.json";
import catalystDataDe from "@/data/study-paths/de/catalyst.json";
import veilDataDe from "@/data/study-paths/de/veil.json";
import timeSpaceDataDe from "@/data/study-paths/de/time-space.json";
import archetypesDataDe from "@/data/study-paths/de/archetypes.json";

// Import French study path data
import densitiesDataFr from "@/data/study-paths/fr/densities.json";
import polarityDataFr from "@/data/study-paths/fr/polarity.json";
import energyCentersDataFr from "@/data/study-paths/fr/energy-centers.json";
import catalystDataFr from "@/data/study-paths/fr/catalyst.json";
import veilDataFr from "@/data/study-paths/fr/veil.json";
import timeSpaceDataFr from "@/data/study-paths/fr/time-space.json";
import archetypesDataFr from "@/data/study-paths/fr/archetypes.json";

/**
 * Study paths data organized by language.
 */
const STUDY_PATHS_BY_LANGUAGE: Record<string, unknown[]> = {
  en: [densitiesDataEn, polarityDataEn, energyCentersDataEn, catalystDataEn, veilDataEn, timeSpaceDataEn, archetypesDataEn],
  es: [densitiesDataEs, polarityDataEs, energyCentersDataEs, catalystDataEs, veilDataEs, timeSpaceDataEs, archetypesDataEs],
  de: [densitiesDataDe, polarityDataDe, energyCentersDataDe, catalystDataDe, veilDataDe, timeSpaceDataDe, archetypesDataDe],
  fr: [densitiesDataFr, polarityDataFr, energyCentersDataFr, catalystDataFr, veilDataFr, timeSpaceDataFr, archetypesDataFr],
};

/**
 * Available languages for study paths.
 */
export const AVAILABLE_LANGUAGES = Object.keys(STUDY_PATHS_BY_LANGUAGE);

/**
 * Parsed and validated study paths cache by language.
 */
const cachedPathsByLanguage: Record<string, StudyPath[]> = {};

/**
 * Get all validated study paths for a specific language.
 * Falls back to English if the requested language is not available.
 */
export function getAllStudyPaths(language: string = DEFAULT_LOCALE): StudyPath[] {
  // Normalize language and fallback to English if not available
  const lang = STUDY_PATHS_BY_LANGUAGE[language] ? language : DEFAULT_LOCALE;

  // Return cached paths if available
  if (cachedPathsByLanguage[lang]) {
    return cachedPathsByLanguage[lang];
  }

  const paths: StudyPath[] = [];
  const pathsData = STUDY_PATHS_BY_LANGUAGE[lang];

  for (const data of pathsData) {
    const result = parseStudyPath(data);
    if (result.success) {
      paths.push(result.data);
    } else {
      console.error("Invalid study path data:", result.error);
    }
  }

  cachedPathsByLanguage[lang] = paths;
  return paths;
}

/**
 * Get metadata for all study paths (for list display).
 */
export function getAllPathMetas(language: string = DEFAULT_LOCALE): StudyPathMeta[] {
  return getAllStudyPaths(language).map(extractPathMeta);
}

/**
 * Get a specific study path by ID.
 */
export function getStudyPath(pathId: string, language: string = DEFAULT_LOCALE): StudyPath | null {
  const paths = getAllStudyPaths(language);
  return paths.find((p) => p.id === pathId) || null;
}

/**
 * Get a specific lesson from a study path.
 */
export function getLesson(
  pathId: string,
  lessonId: string,
  language: string = DEFAULT_LOCALE
): { path: StudyPath; lesson: StudyPath["lessons"][number]; lessonIndex: number } | null {
  const path = getStudyPath(pathId, language);
  if (!path) return null;

  const lessonIndex = path.lessons.findIndex((l) => l.id === lessonId);
  if (lessonIndex === -1) return null;

  return {
    path,
    lesson: path.lessons[lessonIndex],
    lessonIndex,
  };
}
