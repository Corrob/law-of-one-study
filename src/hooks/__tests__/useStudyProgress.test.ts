import { renderHook, act } from "@testing-library/react";
import { useStudyProgress } from "../useStudyProgress";

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    get store() {
      return store;
    },
  };
})();

Object.defineProperty(window, "localStorage", { value: mockLocalStorage });

describe("useStudyProgress", () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    jest.clearAllMocks();
  });

  describe("initialization", () => {
    it("should start with empty progress", () => {
      const { result } = renderHook(() => useStudyProgress());

      expect(result.current.progress).toEqual({});
      expect(result.current.isLoaded).toBe(true);
    });

    it("should load existing progress from localStorage", () => {
      const existingProgress = {
        densities: {
          status: "in_progress",
          currentLesson: "lesson-1",
          currentSectionIndex: 2,
          lastAccessed: "2024-01-01T00:00:00.000Z",
          lessonsCompleted: [],
          reflections: {},
          quizResponses: {},
          sectionProgress: {},
        },
      };
      mockLocalStorage.setItem(
        "law-of-one-study-progress",
        JSON.stringify(existingProgress)
      );

      const { result } = renderHook(() => useStudyProgress());

      expect(result.current.progress.densities).toBeDefined();
      expect(result.current.progress.densities?.status).toBe("in_progress");
      expect(result.current.progress.densities?.currentLesson).toBe("lesson-1");
    });

    it("should handle invalid localStorage data gracefully", () => {
      mockLocalStorage.setItem("law-of-one-study-progress", "invalid json{{{");

      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();
      const { result } = renderHook(() => useStudyProgress());

      expect(result.current.progress).toEqual({});
      expect(result.current.isLoaded).toBe(true);
      consoleSpy.mockRestore();
    });

    it("should handle malformed progress data gracefully", () => {
      mockLocalStorage.setItem(
        "law-of-one-study-progress",
        JSON.stringify({ densities: { invalid: "structure" } })
      );

      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();
      const { result } = renderHook(() => useStudyProgress());

      expect(result.current.isLoaded).toBe(true);
      consoleSpy.mockRestore();
    });
  });

  describe("initializePath", () => {
    it("should create new path progress", () => {
      const { result } = renderHook(() => useStudyProgress());

      act(() => {
        result.current.initializePath("densities", "what-are-densities");
      });

      expect(result.current.progress.densities).toBeDefined();
      // Initial status is "not_started" until updatePosition is called
      expect(result.current.progress.densities?.status).toBe("not_started");
      expect(result.current.progress.densities?.currentLesson).toBe(
        "what-are-densities"
      );
      expect(result.current.progress.densities?.lessonsCompleted).toEqual([]);
    });

    it("should not reinitialize existing path but update lastAccessed", () => {
      const { result } = renderHook(() => useStudyProgress());

      act(() => {
        result.current.initializePath("densities", "lesson-1");
      });

      // Reinitialize with different lesson
      act(() => {
        result.current.initializePath("densities", "lesson-99");
      });

      // Should not change currentLesson (keeps original)
      expect(result.current.progress.densities?.currentLesson).toBe("lesson-1");
      // lastAccessed should still be defined (gets updated)
      expect(result.current.progress.densities?.lastAccessed).toBeDefined();
    });

    it("should persist to localStorage", () => {
      const { result } = renderHook(() => useStudyProgress());

      act(() => {
        result.current.initializePath("densities", "lesson-1");
      });

      const stored = JSON.parse(
        mockLocalStorage.store["law-of-one-study-progress"]
      );
      expect(stored.densities).toBeDefined();
    });
  });

  describe("updatePosition", () => {
    it("should update current lesson and section", () => {
      const { result } = renderHook(() => useStudyProgress());

      act(() => {
        result.current.initializePath("densities", "lesson-1");
      });

      act(() => {
        result.current.updatePosition("densities", "lesson-2", 3);
      });

      expect(result.current.progress.densities?.currentLesson).toBe("lesson-2");
      expect(result.current.progress.densities?.currentSectionIndex).toBe(3);
    });

    it("should change status from not_started to in_progress", () => {
      const { result } = renderHook(() => useStudyProgress());

      // Manually set a not_started status
      const existingProgress = {
        densities: {
          status: "not_started" as const,
          currentLesson: "lesson-1",
          currentSectionIndex: 0,
          lastAccessed: "2024-01-01T00:00:00.000Z",
          lessonsCompleted: [],
          reflections: {},
          quizResponses: {},
          sectionProgress: {},
        },
      };
      mockLocalStorage.setItem(
        "law-of-one-study-progress",
        JSON.stringify(existingProgress)
      );

      const { result: result2 } = renderHook(() => useStudyProgress());

      act(() => {
        result2.current.updatePosition("densities", "lesson-1", 1);
      });

      expect(result2.current.progress.densities?.status).toBe("in_progress");
    });

    it("should not update non-existent path", () => {
      const { result } = renderHook(() => useStudyProgress());

      act(() => {
        result.current.updatePosition("non-existent", "lesson-1", 0);
      });

      expect(result.current.progress["non-existent"]).toBeUndefined();
    });
  });

  describe("completeLesson", () => {
    it("should add lesson to completedLessons", () => {
      const { result } = renderHook(() => useStudyProgress());

      act(() => {
        result.current.initializePath("densities", "lesson-1");
      });

      act(() => {
        result.current.completeLesson("densities", "lesson-1");
      });

      expect(result.current.progress.densities?.lessonsCompleted).toContain(
        "lesson-1"
      );
    });

    it("should not duplicate completed lessons", () => {
      const { result } = renderHook(() => useStudyProgress());

      act(() => {
        result.current.initializePath("densities", "lesson-1");
      });

      act(() => {
        result.current.completeLesson("densities", "lesson-1");
        result.current.completeLesson("densities", "lesson-1");
      });

      const completedCount = result.current.progress.densities?.lessonsCompleted.filter(
        (l) => l === "lesson-1"
      ).length;
      expect(completedCount).toBe(1);
    });
  });

  describe("saveReflection", () => {
    it("should save reflection text", () => {
      const { result } = renderHook(() => useStudyProgress());

      act(() => {
        result.current.initializePath("densities", "lesson-1");
      });

      act(() => {
        result.current.saveReflection(
          "densities",
          "lesson-1",
          2,
          "My deep thoughts"
        );
      });

      const reflection = result.current.getReflection("densities", "lesson-1", 2);
      expect(reflection?.text).toBe("My deep thoughts");
      expect(reflection?.savedAt).toBeDefined();
    });

    it("should update existing reflection with updatedAt timestamp", () => {
      const { result } = renderHook(() => useStudyProgress());

      act(() => {
        result.current.initializePath("densities", "lesson-1");
      });

      act(() => {
        result.current.saveReflection("densities", "lesson-1", 2, "First draft");
      });

      const firstReflection = result.current.getReflection(
        "densities",
        "lesson-1",
        2
      );
      const originalSavedAt = firstReflection?.savedAt;

      act(() => {
        result.current.saveReflection("densities", "lesson-1", 2, "Revised");
      });

      const updatedReflection = result.current.getReflection(
        "densities",
        "lesson-1",
        2
      );
      expect(updatedReflection?.text).toBe("Revised");
      expect(updatedReflection?.savedAt).toBe(originalSavedAt); // Original savedAt preserved
      expect(updatedReflection?.updatedAt).toBeDefined();
    });
  });

  describe("saveQuizResponse", () => {
    it("should save quiz response", () => {
      const { result } = renderHook(() => useStudyProgress());

      act(() => {
        result.current.initializePath("densities", "lesson-1");
      });

      act(() => {
        result.current.saveQuizResponse("densities", "lesson-1", 3, {
          selectedOption: "b",
          isCorrect: true,
        });
      });

      const response = result.current.getQuizResponse("densities", "lesson-1", 3);
      expect(response?.selectedOption).toBe("b");
      expect(response?.isCorrect).toBe(true);
      expect(response?.timestamp).toBeDefined();
    });

    it("should overwrite previous quiz response", () => {
      const { result } = renderHook(() => useStudyProgress());

      act(() => {
        result.current.initializePath("densities", "lesson-1");
      });

      act(() => {
        result.current.saveQuizResponse("densities", "lesson-1", 3, {
          selectedOption: "a",
          isCorrect: false,
        });
      });

      act(() => {
        result.current.saveQuizResponse("densities", "lesson-1", 3, {
          selectedOption: "b",
          isCorrect: true,
        });
      });

      const response = result.current.getQuizResponse("densities", "lesson-1", 3);
      expect(response?.selectedOption).toBe("b");
      expect(response?.isCorrect).toBe(true);
    });
  });

  describe("completePath", () => {
    it("should set path status to completed", () => {
      const { result } = renderHook(() => useStudyProgress());

      act(() => {
        result.current.initializePath("densities", "lesson-1");
      });

      act(() => {
        result.current.completePath("densities");
      });

      expect(result.current.progress.densities?.status).toBe("completed");
    });
  });

  describe("getPathProgress", () => {
    it("should return null for non-existent path", () => {
      const { result } = renderHook(() => useStudyProgress());

      expect(result.current.getPathProgress("non-existent")).toBeNull();
    });

    it("should return progress for existing path", () => {
      const { result } = renderHook(() => useStudyProgress());

      act(() => {
        result.current.initializePath("densities", "lesson-1");
      });

      const progress = result.current.getPathProgress("densities");
      expect(progress).not.toBeNull();
      expect(progress?.currentLesson).toBe("lesson-1");
    });
  });

  describe("resetPathProgress", () => {
    it("should remove progress for specific path", () => {
      const { result } = renderHook(() => useStudyProgress());

      act(() => {
        result.current.initializePath("densities", "lesson-1");
        result.current.initializePath("harvest", "lesson-1");
      });

      act(() => {
        result.current.resetPathProgress("densities");
      });

      expect(result.current.progress.densities).toBeUndefined();
      expect(result.current.progress.harvest).toBeDefined();
    });
  });

  describe("resetAllProgress", () => {
    it("should clear all progress", () => {
      const { result } = renderHook(() => useStudyProgress());

      act(() => {
        result.current.initializePath("densities", "lesson-1");
        result.current.initializePath("harvest", "lesson-1");
      });

      act(() => {
        result.current.resetAllProgress();
      });

      expect(result.current.progress).toEqual({});
    });
  });

  describe("updateSectionProgress", () => {
    it("should update section progress state", () => {
      const { result } = renderHook(() => useStudyProgress());

      act(() => {
        result.current.initializePath("densities", "lesson-1");
      });

      act(() => {
        result.current.updateSectionProgress(
          "densities",
          "lesson-1",
          0,
          "completed"
        );
      });

      expect(
        result.current.progress.densities?.sectionProgress["lesson-1"]?.["0"]
      ).toBe("completed");
    });
  });

  describe("localStorage persistence", () => {
    it("should save to localStorage after each update", () => {
      const { result } = renderHook(() => useStudyProgress());

      act(() => {
        result.current.initializePath("densities", "lesson-1");
      });

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        "law-of-one-study-progress",
        expect.any(String)
      );

      act(() => {
        result.current.saveReflection("densities", "lesson-1", 0, "Test");
      });

      // Should be called again after reflection save
      expect(mockLocalStorage.setItem.mock.calls.length).toBeGreaterThan(1);
    });
  });
});
