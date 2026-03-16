import { test, expect } from "@playwright/test";

/**
 * E2E smoke tests for French locale support.
 * Verifies basic functionality works correctly in French.
 */

test.describe("French Locale Smoke Tests", () => {
  test("should display French UI on homepage", async ({ page }) => {
    await page.goto("/fr");

    // Check for French navigation elements in header
    await expect(page.getByRole("link", { name: "Explorer" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Étudier" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Méditer" })).toBeVisible();
    // Check that we're on the French locale by looking at any French text
    await expect(page.locator("body")).toContainText(/Sagesse|Étudier|Explorer/i);
  });

  test("should have French study paths page", async ({ page }) => {
    await page.goto("/fr/paths");

    // Check for French content on study paths page
    await expect(page.getByText("Parcours d'Étude")).toBeVisible();
  });

  test("should have French explore page", async ({ page }) => {
    await page.goto("/fr/explore");

    // Page should load - check for zoom controls
    await expect(page.getByRole("button", { name: "Zoom in" })).toBeVisible({ timeout: 10000 });
  });

  test("should persist French locale across navigation", async ({ page }) => {
    // Start on French homepage
    await page.goto("/fr");

    // Click on Explorer link to go to explore page
    await page.getByRole("link", { name: "Explorer" }).click();

    // Should be on French explore page
    await expect(page).toHaveURL(/\/fr\/explore/);
  });
});
