/**
 * Zod schemas for study paths, lessons, and progress tracking.
 */

import { z } from "zod";

// =============================================================================
// Section Schemas
// =============================================================================

/**
 * Content section - plain language explanation.
 */
export const ContentSectionSchema = z.object({
  type: z.literal("content"),
  markdown: z.string(),
});

export type ContentSection = z.infer<typeof ContentSectionSchema>;

/**
 * Quote section - Ra material passage.
 */
export const QuoteSectionSchema = z.object({
  type: z.literal("quote"),
  reference: z.string(), // e.g., "13.5"
  text: z.string(),
  context: z.string().optional(), // Why this quote matters here
  highlight: z.array(z.string()).optional(), // Key phrases to emphasize
});

export type QuoteSection = z.infer<typeof QuoteSectionSchema>;

/**
 * Multiple choice option.
 */
export const MCOptionSchema = z.object({
  id: z.string(),
  text: z.string(),
  isCorrect: z.boolean(),
  explanation: z.string(), // Shown after answer
  relatedPassage: z.string().optional(), // Reference for "learn more"
});

export type MCOption = z.infer<typeof MCOptionSchema>;

/**
 * Multiple choice section - understanding check.
 */
export const MultipleChoiceSectionSchema = z.object({
  type: z.literal("multiple-choice"),
  question: z.string(),
  options: z.array(MCOptionSchema).min(2).max(4),
  hint: z.string().optional(), // Optional hint if they want help
});

export type MultipleChoiceSection = z.infer<typeof MultipleChoiceSectionSchema>;

/**
 * Reflection section - personal application prompt.
 */
export const ReflectionSectionSchema = z.object({
  type: z.literal("reflection"),
  prompt: z.string(), // Open-ended question
  guidingThoughts: z.array(z.string()).optional(), // Optional bullet points
  placeholder: z.string().optional(), // Input placeholder text
  minLength: z.number().optional(), // Soft minimum (encouraging, not enforcing)
});

export type ReflectionSection = z.infer<typeof ReflectionSectionSchema>;

/**
 * Union of all section types.
 */
export const LessonSectionSchema = z.discriminatedUnion("type", [
  ContentSectionSchema,
  QuoteSectionSchema,
  MultipleChoiceSectionSchema,
  ReflectionSectionSchema,
]);

export type LessonSection = z.infer<typeof LessonSectionSchema>;

// =============================================================================
// Lesson & Path Schemas
// =============================================================================

/**
 * Individual lesson within a study path.
 */
export const LessonSchema = z.object({
  id: z.string(),
  title: z.string(),
  estimatedMinutes: z.number().optional(),
  sections: z.array(LessonSectionSchema).min(1),
});

export type Lesson = z.infer<typeof LessonSchema>;

/**
 * Difficulty level for study paths.
 */
export const DifficultySchema = z.enum(["beginner", "intermediate", "advanced"]);

export type Difficulty = z.infer<typeof DifficultySchema>;

/**
 * Complete study path with all lessons.
 */
export const StudyPathSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  difficulty: DifficultySchema,
  estimatedMinutes: z.number(),
  concepts: z.array(z.string()), // Links to concept-graph.json
  recommendedPaths: z.array(z.string()).optional(), // Soft prerequisites
  lessons: z.array(LessonSchema).min(1),
  completionReflection: z.string().optional(), // Final reflection prompt
});

export type StudyPath = z.infer<typeof StudyPathSchema>;

/**
 * Metadata for path list display (without full lesson content).
 */
export const StudyPathMetaSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  difficulty: DifficultySchema,
  estimatedMinutes: z.number(),
  lessonCount: z.number(),
  concepts: z.array(z.string()),
  recommendedPaths: z.array(z.string()).optional(),
});

export type StudyPathMeta = z.infer<typeof StudyPathMetaSchema>;

// =============================================================================
// Progress Schemas
// =============================================================================

/**
 * Progress state for individual sections.
 */
export const SectionProgressStateSchema = z.enum(["not_seen", "viewed", "completed"]);

export type SectionProgressState = z.infer<typeof SectionProgressStateSchema>;

/**
 * Saved reflection response.
 */
export const SavedReflectionSchema = z.object({
  text: z.string(),
  savedAt: z.string(), // ISO date
  updatedAt: z.string().optional(), // ISO date if edited
});

export type SavedReflection = z.infer<typeof SavedReflectionSchema>;

/**
 * Quiz response record.
 */
export const QuizResponseSchema = z.object({
  selectedOptionId: z.string(),
  wasCorrect: z.boolean(),
  attempts: z.number(),
  timestamp: z.string(), // ISO date
});

export type QuizResponse = z.infer<typeof QuizResponseSchema>;

/**
 * Progress status for a path.
 */
export const PathStatusSchema = z.enum(["not_started", "in_progress", "completed"]);

export type PathStatus = z.infer<typeof PathStatusSchema>;

/**
 * Progress data for a single study path.
 */
export const PathProgressSchema = z.object({
  status: PathStatusSchema,
  lessonsCompleted: z.array(z.string()),
  currentLesson: z.string().nullable(),
  currentSectionIndex: z.number(),
  lastAccessed: z.string(), // ISO date
  sectionProgress: z.record(
    z.string(), // lessonId
    z.record(z.string(), SectionProgressStateSchema) // sectionIndex -> state
  ),
  reflections: z.record(z.string(), SavedReflectionSchema), // "lessonId_sectionIndex" -> response
  quizResponses: z.record(z.string(), QuizResponseSchema), // "lessonId_sectionIndex" -> response
});

export type PathProgress = z.infer<typeof PathProgressSchema>;

/**
 * Complete study progress across all paths.
 */
export const StudyProgressSchema = z.record(z.string(), PathProgressSchema);

export type StudyProgress = z.infer<typeof StudyProgressSchema>;

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Parse and validate study path data.
 */
export function parseStudyPath(
  data: unknown
): { success: true; data: StudyPath } | { success: false; error: string } {
  const result = StudyPathSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return {
    success: false,
    error: result.error.issues[0]?.message || "Invalid study path data",
  };
}

/**
 * Parse and validate study progress data from localStorage.
 */
export function parseStudyProgress(
  data: unknown
): { success: true; data: StudyProgress } | { success: false; error: string } {
  const result = StudyProgressSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return {
    success: false,
    error: result.error.issues[0]?.message || "Invalid progress data",
  };
}

/**
 * Create initial progress state for a path.
 */
export function createInitialPathProgress(pathId: string, firstLessonId: string): PathProgress {
  return {
    status: "not_started",
    lessonsCompleted: [],
    currentLesson: firstLessonId,
    currentSectionIndex: 0,
    lastAccessed: new Date().toISOString(),
    sectionProgress: {},
    reflections: {},
    quizResponses: {},
  };
}

/**
 * Extract metadata from a full study path (for list display).
 */
export function extractPathMeta(path: StudyPath): StudyPathMeta {
  return {
    id: path.id,
    title: path.title,
    description: path.description,
    difficulty: path.difficulty,
    estimatedMinutes: path.estimatedMinutes,
    lessonCount: path.lessons.length,
    concepts: path.concepts,
    recommendedPaths: path.recommendedPaths,
  };
}

/**
 * Generate a key for storing section-specific data (reflections, quiz responses).
 */
export function getSectionKey(lessonId: string, sectionIndex: number): string {
  return `${lessonId}_${sectionIndex}`;
}
