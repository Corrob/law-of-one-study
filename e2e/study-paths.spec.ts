import { test, expect, Page } from "@playwright/test";

/**
 * E2E tests for the Study Paths feature.
 * Tests the complete user journey through guided study paths including:
 * - Path listing and navigation
 * - Path intro and starting a path
 * - Lesson navigation and progress
 * - Multiple choice quiz interactions
 * - Reflection saving
 * - Path completion and celebration
 * - localStorage persistence
 */

const STORAGE_KEY = "law-of-one-study-progress";

// Helper to clear study progress from localStorage
async function clearStudyProgress(page: Page) {
  await page.evaluate((key) => {
    localStorage.removeItem(key);
  }, STORAGE_KEY);
}

// Helper to get study progress from localStorage
async function getStudyProgress(page: Page) {
  return await page.evaluate((key) => {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  }, STORAGE_KEY);
}

test.describe("Study Paths", () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing progress before each test
    await page.goto("/paths");
    await clearStudyProgress(page);
    await page.reload();
  });

  test.describe("Paths List Page", () => {
    test("should display available study paths", async ({ page }) => {
      await page.goto("/paths");

      // Check page header
      await expect(page.getByRole("heading", { name: "Study Paths" })).toBeVisible();
      await expect(page.getByText("Guided journeys through the Ra Material")).toBeVisible();

      // Check for the densities path
      await expect(page.getByText("Understanding Densities")).toBeVisible();
      await expect(page.getByText("beginner").first()).toBeVisible();

      // Check for the polarity path
      await expect(page.getByText("The Choice: Service to Others vs Self")).toBeVisible();

      // Check for the energy centers path
      await expect(page.getByText("Energy Centers Exploration")).toBeVisible();
    });

    test("should navigate to path detail when clicking a path card", async ({ page }) => {
      await page.goto("/paths");

      // Click on the densities path
      await page.getByText("Understanding Densities").click();

      // Should navigate to path detail page
      await expect(page).toHaveURL(/\/paths\/densities/);
    });
  });

  test.describe("Path Intro", () => {
    test("should show intro for new users", async ({ page }) => {
      await page.goto("/paths/densities");

      // Should see the path intro content
      await expect(page.getByText("Understanding Densities")).toBeVisible();
      await expect(page.getByRole("button", { name: /Begin Journey/i })).toBeVisible();

      // Should see lesson overview
      await expect(page.getByText("What Are Densities?")).toBeVisible();
    });

    test("should start path and show first lesson", async ({ page }) => {
      await page.goto("/paths/densities");

      // Click begin button
      await page.getByRole("button", { name: /Begin Journey/i }).click();

      // Should now see lesson content
      await expect(page.getByText("What Are Densities?")).toBeVisible();
      await expect(page.getByText(/density.*describes levels of consciousness/i)).toBeVisible();

      // Progress should be saved
      const progress = await getStudyProgress(page);
      expect(progress).toBeTruthy();
      expect(progress.densities).toBeTruthy();
      // Initial status is "not_started" until position is updated
      expect(progress.densities.currentLesson).toBe("what-are-densities");
    });
  });

  test.describe("Lesson Navigation", () => {
    test("should navigate between lessons", async ({ page }) => {
      await page.goto("/paths/densities");

      // Start the path
      await page.getByRole("button", { name: /Begin Journey/i }).click();

      // Should be on first lesson
      await expect(page.getByText("Lesson 1 of")).toBeVisible();

      // Complete and go to next lesson - use exact match to avoid Next.js dev tools
      await page.getByRole("button", { name: "Complete & Continue" }).click();

      // Should be on second lesson
      await expect(page.getByText("Lesson 2 of")).toBeVisible();
      await expect(page.getByText("First & Second Density")).toBeVisible();
    });

    test("should persist position across page reload", async ({ page }) => {
      await page.goto("/paths/densities");

      // Start path and go to second lesson
      await page.getByRole("button", { name: /Begin Journey/i }).click();
      await page.getByRole("button", { name: "Complete & Continue" }).click();

      // Verify we're on lesson 2
      await expect(page.getByText("Lesson 2 of")).toBeVisible();

      // Reload the page
      await page.reload();

      // Should still be on lesson 2
      await expect(page.getByText("Lesson 2 of")).toBeVisible();
      await expect(page.getByText("First & Second Density")).toBeVisible();
    });

    test("should navigate back to previous lesson", async ({ page }) => {
      await page.goto("/paths/densities");

      // Start and advance
      await page.getByRole("button", { name: /Begin Journey/i }).click();
      await page.getByRole("button", { name: "Complete & Continue" }).click();

      // Verify on lesson 2
      await expect(page.getByText("Lesson 2 of")).toBeVisible();

      // Go back using the Previous button in the top nav
      await page.getByRole("button", { name: /Previous/i }).first().click();

      // Should be back on lesson 1
      await expect(page.getByText("Lesson 1 of")).toBeVisible();
    });
  });

  test.describe("Multiple Choice Quiz", () => {
    test("should allow selecting and submitting quiz answer", async ({ page }) => {
      await page.goto("/paths/densities");
      await page.getByRole("button", { name: /Begin Journey/i }).click();

      // Find the quiz question
      await expect(page.getByText("According to Ra, what is the best analogy")).toBeVisible();

      // Select the correct answer (Musical octaves)
      await page.getByText("Musical octaves").click();

      // Submit the answer
      await page.getByRole("button", { name: /Submit Answer/i }).click();

      // Should show correct feedback
      await expect(page.getByText(/That's right/i)).toBeVisible();

      // Should show explanation
      await expect(page.getByText(/Ra uses music as the primary analogy/i)).toBeVisible();
    });

    test("should show feedback for incorrect answer", async ({ page }) => {
      await page.goto("/paths/densities");
      await page.getByRole("button", { name: /Begin Journey/i }).click();

      // Select wrong answer
      await page.getByText("Layers of an onion").click();
      await page.getByRole("button", { name: /Submit Answer/i }).click();

      // Should show incorrect feedback
      await expect(page.getByText(/Not quite/i)).toBeVisible();
    });

    test("should persist quiz response", async ({ page }) => {
      await page.goto("/paths/densities");
      await page.getByRole("button", { name: /Begin Journey/i }).click();

      // Answer quiz
      await page.getByText("Musical octaves").click();
      await page.getByRole("button", { name: /Submit Answer/i }).click();

      // Reload page
      await page.reload();

      // Should still show the answered state
      await expect(page.getByText(/That's right/i)).toBeVisible();
    });
  });

  test.describe("Reflection Section", () => {
    test("should save reflection text", async ({ page }) => {
      await page.goto("/paths/densities");
      await page.getByRole("button", { name: /Begin Journey/i }).click();

      // Find reflection textarea
      const textarea = page.getByPlaceholder(/What brings you/i);
      await expect(textarea).toBeVisible();

      // Type a reflection
      await textarea.fill("I am drawn to explore consciousness and unity.");

      // Save the reflection
      await page.getByRole("button", { name: /Save/i }).click();

      // Verify it's saved in progress
      const progress = await getStudyProgress(page);
      expect(progress.densities.reflections).toBeTruthy();
      const reflectionKeys = Object.keys(progress.densities.reflections);
      expect(reflectionKeys.length).toBeGreaterThan(0);
    });

    test("should persist reflection across reload", async ({ page }) => {
      await page.goto("/paths/densities");
      await page.getByRole("button", { name: /Begin Journey/i }).click();

      // Save a reflection
      const textarea = page.getByPlaceholder(/What brings you/i);
      await textarea.fill("Testing persistence of reflections.");
      await page.getByRole("button", { name: /Save/i }).click();

      // Reload
      await page.reload();

      // Reflection should still be there
      await expect(page.getByText("Testing persistence of reflections.")).toBeVisible();
    });
  });

  test.describe("Path Completion", () => {
    // These tests need serial execution to avoid localStorage race conditions
    test.describe.configure({ mode: "serial" });

    test("should show celebration when completing path", async ({ page, context }) => {
      const progressData = {
        densities: {
          status: "in_progress",
          currentLesson: "the-octave",
          currentSectionIndex: 0,
          lastAccessed: new Date().toISOString(),
          lessonsCompleted: [
            "what-are-densities",
            "first-second-density",
            "third-density",
            "fourth-density",
            "fifth-density",
            "sixth-density",
            "seventh-density",
          ],
          sectionProgress: {},
          reflections: {},
          quizResponses: {},
        },
      };

      // Use addInitScript to set localStorage before page scripts run
      await context.addInitScript(
        ({ key, data }) => {
          localStorage.setItem(key, JSON.stringify(data));
        },
        { key: STORAGE_KEY, data: progressData }
      );

      // Navigate to the path page - localStorage is already set via initScript
      await page.goto("/paths/densities", { waitUntil: "networkidle" });

      // Wait for the page to load and show lesson content (not intro)
      // The "Complete Path" button only appears on the last lesson
      const completeButton = page.getByRole("button", { name: "Complete Path" });
      await expect(completeButton).toBeVisible({ timeout: 15000 });
      await completeButton.click();

      // Should show celebration overlay
      await expect(page.getByText("Path Complete!")).toBeVisible({ timeout: 5000 });
      // The celebration shows the path title in a paragraph
      await expect(page.getByRole("paragraph").filter({ hasText: "Understanding Densities" })).toBeVisible();
      await expect(page.getByRole("link", { name: /Explore More Paths/i })).toBeVisible();
    });

    test("should move completed path to completed section", async ({ page, context }) => {
      const progressData = {
        densities: {
          status: "completed",
          currentLesson: "the-octave",
          currentSectionIndex: 0,
          lastAccessed: new Date().toISOString(),
          lessonsCompleted: [
            "what-are-densities",
            "first-second-density",
            "third-density",
            "fourth-density",
            "fifth-density",
            "sixth-density",
            "seventh-density",
            "the-octave",
          ],
          sectionProgress: {},
          reflections: {},
          quizResponses: {},
        },
      };

      // Use addInitScript to set localStorage before page scripts run
      await context.addInitScript(
        ({ key, data }) => {
          localStorage.setItem(key, JSON.stringify(data));
        },
        { key: STORAGE_KEY, data: progressData }
      );

      // Navigate to paths page - localStorage is already set via initScript
      await page.goto("/paths", { waitUntil: "networkidle" });

      // Should see "Completed Paths" section
      await expect(page.getByText("Completed Paths")).toBeVisible({ timeout: 5000 });

      // The densities path should be in completed section
      const completedSection = page.locator("section", { has: page.getByText("Completed Paths") });
      await expect(completedSection.getByText("Understanding Densities")).toBeVisible();
    });
  });

  test.describe("Progress Indicator", () => {
    test("should show reading progress bar container", async ({ page }) => {
      await page.goto("/paths/densities");
      await page.getByRole("button", { name: /Begin Journey/i }).click();

      // Progress bar should exist in the DOM (it starts at 0% width so may not be "visible")
      const progressBar = page.getByRole("progressbar", { name: /Reading progress/i });
      await expect(progressBar).toBeAttached();
    });
  });
});
