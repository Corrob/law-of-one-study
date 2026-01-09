/**
 * Tests for study paths schema validation and helper functions.
 */

import {
  ContentSectionSchema,
  QuoteSectionSchema,
  MultipleChoiceSectionSchema,
  ReflectionSectionSchema,
  LessonSectionSchema,
  LessonSchema,
  StudyPathSchema,
  PathProgressSchema,
  StudyProgressSchema,
  parseStudyPath,
  parseStudyProgress,
  createInitialPathProgress,
  extractPathMeta,
  getSectionKey,
} from "../study-paths";

describe("Section Schemas", () => {
  describe("ContentSectionSchema", () => {
    it("should validate valid content section", () => {
      const section = {
        type: "content",
        markdown: "This is some **markdown** content.",
      };
      expect(ContentSectionSchema.safeParse(section).success).toBe(true);
    });

    it("should reject content section without markdown", () => {
      const section = { type: "content" };
      expect(ContentSectionSchema.safeParse(section).success).toBe(false);
    });

    it("should reject wrong type", () => {
      const section = { type: "quote", markdown: "test" };
      expect(ContentSectionSchema.safeParse(section).success).toBe(false);
    });
  });

  describe("QuoteSectionSchema", () => {
    it("should validate valid quote section", () => {
      const section = {
        type: "quote",
        reference: "13.5",
        text: "Ra: I am Ra. The quote text here.",
      };
      expect(QuoteSectionSchema.safeParse(section).success).toBe(true);
    });

    it("should validate quote with optional fields", () => {
      const section = {
        type: "quote",
        reference: "13.5",
        text: "Ra: I am Ra. The quote text here.",
        context: "This explains the significance.",
        highlight: ["key phrase", "another phrase"],
      };
      const result = QuoteSectionSchema.safeParse(section);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.context).toBe("This explains the significance.");
        expect(result.data.highlight).toHaveLength(2);
      }
    });

    it("should reject quote without reference", () => {
      const section = {
        type: "quote",
        text: "Ra: I am Ra.",
      };
      expect(QuoteSectionSchema.safeParse(section).success).toBe(false);
    });
  });

  describe("MultipleChoiceSectionSchema", () => {
    it("should validate valid multiple choice section", () => {
      const section = {
        type: "multiple-choice",
        question: "What is the answer?",
        options: [
          { id: "a", text: "Option A", isCorrect: false, explanation: "Wrong" },
          { id: "b", text: "Option B", isCorrect: true, explanation: "Correct!" },
        ],
      };
      expect(MultipleChoiceSectionSchema.safeParse(section).success).toBe(true);
    });

    it("should validate with optional hint", () => {
      const section = {
        type: "multiple-choice",
        question: "What is the answer?",
        options: [
          { id: "a", text: "Option A", isCorrect: false, explanation: "Wrong" },
          { id: "b", text: "Option B", isCorrect: true, explanation: "Correct!" },
        ],
        hint: "Think about the musical analogy.",
      };
      const result = MultipleChoiceSectionSchema.safeParse(section);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.hint).toBe("Think about the musical analogy.");
      }
    });

    it("should reject with fewer than 2 options", () => {
      const section = {
        type: "multiple-choice",
        question: "What is the answer?",
        options: [
          { id: "a", text: "Only option", isCorrect: true, explanation: "Only" },
        ],
      };
      expect(MultipleChoiceSectionSchema.safeParse(section).success).toBe(false);
    });

    it("should reject with more than 4 options", () => {
      const section = {
        type: "multiple-choice",
        question: "What is the answer?",
        options: [
          { id: "a", text: "A", isCorrect: false, explanation: "No" },
          { id: "b", text: "B", isCorrect: false, explanation: "No" },
          { id: "c", text: "C", isCorrect: false, explanation: "No" },
          { id: "d", text: "D", isCorrect: true, explanation: "Yes" },
          { id: "e", text: "E", isCorrect: false, explanation: "No" },
        ],
      };
      expect(MultipleChoiceSectionSchema.safeParse(section).success).toBe(false);
    });

    it("should validate option with relatedPassage", () => {
      const section = {
        type: "multiple-choice",
        question: "What is the answer?",
        options: [
          {
            id: "a",
            text: "Option A",
            isCorrect: true,
            explanation: "Correct!",
            relatedPassage: "16.51",
          },
          { id: "b", text: "Option B", isCorrect: false, explanation: "Wrong" },
        ],
      };
      expect(MultipleChoiceSectionSchema.safeParse(section).success).toBe(true);
    });
  });

  describe("ReflectionSectionSchema", () => {
    it("should validate valid reflection section", () => {
      const section = {
        type: "reflection",
        prompt: "What does this mean to you?",
      };
      expect(ReflectionSectionSchema.safeParse(section).success).toBe(true);
    });

    it("should validate with all optional fields", () => {
      const section = {
        type: "reflection",
        prompt: "What does this mean to you?",
        guidingThoughts: ["Think about love", "Consider service"],
        placeholder: "Share your thoughts...",
        minLength: 50,
      };
      const result = ReflectionSectionSchema.safeParse(section);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.guidingThoughts).toHaveLength(2);
        expect(result.data.minLength).toBe(50);
      }
    });
  });

  describe("LessonSectionSchema (discriminated union)", () => {
    it("should correctly discriminate content sections", () => {
      const section = { type: "content", markdown: "Test" };
      const result = LessonSectionSchema.safeParse(section);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe("content");
      }
    });

    it("should correctly discriminate quote sections", () => {
      const section = { type: "quote", reference: "1.1", text: "Ra says..." };
      const result = LessonSectionSchema.safeParse(section);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe("quote");
      }
    });

    it("should reject unknown section types", () => {
      const section = { type: "unknown", data: "test" };
      expect(LessonSectionSchema.safeParse(section).success).toBe(false);
    });
  });
});

describe("LessonSchema", () => {
  it("should validate valid lesson", () => {
    const lesson = {
      id: "lesson-1",
      title: "Introduction",
      sections: [{ type: "content", markdown: "Welcome to the lesson." }],
    };
    expect(LessonSchema.safeParse(lesson).success).toBe(true);
  });

  it("should validate lesson with estimatedMinutes", () => {
    const lesson = {
      id: "lesson-1",
      title: "Introduction",
      estimatedMinutes: 5,
      sections: [{ type: "content", markdown: "Welcome." }],
    };
    const result = LessonSchema.safeParse(lesson);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.estimatedMinutes).toBe(5);
    }
  });

  it("should reject lesson without sections", () => {
    const lesson = {
      id: "lesson-1",
      title: "Introduction",
      sections: [],
    };
    expect(LessonSchema.safeParse(lesson).success).toBe(false);
  });
});

describe("StudyPathSchema", () => {
  const validPath = {
    id: "test-path",
    title: "Test Path",
    description: "A test study path.",
    difficulty: "beginner",
    estimatedMinutes: 30,
    concepts: ["concept1", "concept2"],
    lessons: [
      {
        id: "lesson-1",
        title: "Lesson 1",
        sections: [{ type: "content", markdown: "Content here." }],
      },
    ],
  };

  it("should validate valid study path", () => {
    expect(StudyPathSchema.safeParse(validPath).success).toBe(true);
  });

  it("should validate all difficulty levels", () => {
    for (const difficulty of ["beginner", "intermediate", "advanced"]) {
      const path = { ...validPath, difficulty };
      expect(StudyPathSchema.safeParse(path).success).toBe(true);
    }
  });

  it("should reject invalid difficulty", () => {
    const path = { ...validPath, difficulty: "expert" };
    expect(StudyPathSchema.safeParse(path).success).toBe(false);
  });

  it("should validate path with optional fields", () => {
    const path = {
      ...validPath,
      recommendedPaths: ["other-path"],
      completionReflection: "Take a moment to reflect on your journey.",
    };
    const result = StudyPathSchema.safeParse(path);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.recommendedPaths).toContain("other-path");
      expect(result.data.completionReflection).toBeDefined();
    }
  });

  it("should reject path without lessons", () => {
    const path = { ...validPath, lessons: [] };
    expect(StudyPathSchema.safeParse(path).success).toBe(false);
  });
});

describe("Progress Schemas", () => {
  describe("PathProgressSchema", () => {
    const validProgress = {
      status: "in_progress",
      lessonsCompleted: ["lesson-1"],
      currentLesson: "lesson-2",
      currentSectionIndex: 3,
      lastAccessed: "2024-01-15T10:30:00.000Z",
      sectionProgress: {
        "lesson-1": { "0": "completed", "1": "completed" },
      },
      reflections: {
        "lesson-1_2": {
          text: "My reflection",
          savedAt: "2024-01-15T10:00:00.000Z",
        },
      },
      quizResponses: {
        "lesson-1_3": {
          selectedOptionId: "b",
          wasCorrect: true,
          attempts: 1,
          timestamp: "2024-01-15T10:15:00.000Z",
        },
      },
    };

    it("should validate valid progress", () => {
      expect(PathProgressSchema.safeParse(validProgress).success).toBe(true);
    });

    it("should validate all status values", () => {
      for (const status of ["not_started", "in_progress", "completed"]) {
        const progress = { ...validProgress, status };
        expect(PathProgressSchema.safeParse(progress).success).toBe(true);
      }
    });

    it("should allow null currentLesson", () => {
      const progress = { ...validProgress, currentLesson: null };
      expect(PathProgressSchema.safeParse(progress).success).toBe(true);
    });

    it("should validate reflection with updatedAt", () => {
      const progress = {
        ...validProgress,
        reflections: {
          "lesson-1_2": {
            text: "Updated reflection",
            savedAt: "2024-01-15T10:00:00.000Z",
            updatedAt: "2024-01-15T11:00:00.000Z",
          },
        },
      };
      expect(PathProgressSchema.safeParse(progress).success).toBe(true);
    });
  });

  describe("StudyProgressSchema", () => {
    it("should validate empty progress", () => {
      expect(StudyProgressSchema.safeParse({}).success).toBe(true);
    });

    it("should validate progress with multiple paths", () => {
      const progress = {
        densities: {
          status: "in_progress",
          lessonsCompleted: [],
          currentLesson: "lesson-1",
          currentSectionIndex: 0,
          lastAccessed: "2024-01-15T10:00:00.000Z",
          sectionProgress: {},
          reflections: {},
          quizResponses: {},
        },
        harvest: {
          status: "completed",
          lessonsCompleted: ["lesson-1", "lesson-2"],
          currentLesson: "lesson-2",
          currentSectionIndex: 5,
          lastAccessed: "2024-01-14T10:00:00.000Z",
          sectionProgress: {},
          reflections: {},
          quizResponses: {},
        },
      };
      expect(StudyProgressSchema.safeParse(progress).success).toBe(true);
    });
  });
});

describe("Helper Functions", () => {
  describe("parseStudyPath", () => {
    it("should return success for valid path", () => {
      const path = {
        id: "test",
        title: "Test",
        description: "Desc",
        difficulty: "beginner",
        estimatedMinutes: 10,
        concepts: [],
        lessons: [
          { id: "l1", title: "L1", sections: [{ type: "content", markdown: "x" }] },
        ],
      };
      const result = parseStudyPath(path);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe("test");
      }
    });

    it("should return error for invalid path", () => {
      const result = parseStudyPath({ invalid: "data" });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeDefined();
      }
    });
  });

  describe("parseStudyProgress", () => {
    it("should return success for valid progress", () => {
      const progress = {
        test: {
          status: "in_progress",
          lessonsCompleted: [],
          currentLesson: "l1",
          currentSectionIndex: 0,
          lastAccessed: "2024-01-01T00:00:00.000Z",
          sectionProgress: {},
          reflections: {},
          quizResponses: {},
        },
      };
      const result = parseStudyProgress(progress);
      expect(result.success).toBe(true);
    });

    it("should return error for invalid progress", () => {
      const result = parseStudyProgress({ test: { invalid: "structure" } });
      expect(result.success).toBe(false);
    });
  });

  describe("createInitialPathProgress", () => {
    it("should create progress with correct initial values", () => {
      const progress = createInitialPathProgress("densities", "lesson-1");

      expect(progress.status).toBe("not_started");
      expect(progress.currentLesson).toBe("lesson-1");
      expect(progress.currentSectionIndex).toBe(0);
      expect(progress.lessonsCompleted).toEqual([]);
      expect(progress.reflections).toEqual({});
      expect(progress.quizResponses).toEqual({});
      expect(progress.lastAccessed).toBeDefined();
    });

    it("should create valid ISO date for lastAccessed", () => {
      const progress = createInitialPathProgress("test", "l1");
      const date = new Date(progress.lastAccessed);
      expect(date.toISOString()).toBe(progress.lastAccessed);
    });
  });

  describe("extractPathMeta", () => {
    it("should extract metadata from full path", () => {
      const fullPath = {
        id: "test",
        title: "Test Path",
        description: "Description",
        difficulty: "intermediate" as const,
        estimatedMinutes: 45,
        concepts: ["c1", "c2"],
        recommendedPaths: ["other"],
        lessons: [
          { id: "l1", title: "L1", sections: [{ type: "content" as const, markdown: "x" }] },
          { id: "l2", title: "L2", sections: [{ type: "content" as const, markdown: "y" }] },
        ],
        completionReflection: "Reflect on your journey.",
      };

      const meta = extractPathMeta(fullPath);

      expect(meta.id).toBe("test");
      expect(meta.title).toBe("Test Path");
      expect(meta.lessonCount).toBe(2);
      expect(meta.concepts).toEqual(["c1", "c2"]);
      expect(meta.recommendedPaths).toEqual(["other"]);
      // Should not include lessons or completionReflection
      expect((meta as Record<string, unknown>).lessons).toBeUndefined();
      expect((meta as Record<string, unknown>).completionReflection).toBeUndefined();
    });
  });

  describe("getSectionKey", () => {
    it("should generate correct key format", () => {
      expect(getSectionKey("lesson-1", 3)).toBe("lesson-1_3");
      expect(getSectionKey("intro", 0)).toBe("intro_0");
    });
  });
});
