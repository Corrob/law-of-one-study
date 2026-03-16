import { test, expect } from "@playwright/test";

/**
 * E2E smoke tests for German locale support.
 * Verifies basic functionality works correctly in German.
 */

test.describe("German Locale Smoke Tests", () => {
  test("should display German UI on homepage", async ({ page }) => {
    await page.goto("/de");

    // Check for German navigation elements in header
    await expect(page.getByRole("link", { name: "Erkunden" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Studieren" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Meditieren" })).toBeVisible();
    // Check that we're on the German locale by looking at any German text
    await expect(page.locator("body")).toContainText(/Weisheit|Studieren|Erkunden/i);
  });

  test("should have German study paths page", async ({ page }) => {
    await page.goto("/de/paths");

    // Check for German content on study paths page
    await expect(page.getByText("Studienpfade")).toBeVisible();
  });

  test("should have German explore page", async ({ page }) => {
    await page.goto("/de/explore");

    // Page should load - check for zoom controls
    await expect(page.getByRole("button", { name: "Zoom in" })).toBeVisible({ timeout: 10000 });
  });

  test("should persist German locale across navigation", async ({ page }) => {
    // Start on German homepage
    await page.goto("/de");

    // Click on Erkunden link to go to explore page
    await page.getByRole("link", { name: "Erkunden" }).click();

    // Should be on German explore page
    await expect(page).toHaveURL(/\/de\/explore/);
  });
});
