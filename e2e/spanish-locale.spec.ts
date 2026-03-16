import { test, expect } from "@playwright/test";

/**
 * E2E smoke tests for Spanish locale support.
 * Verifies basic functionality works correctly in Spanish.
 */

test.describe("Spanish Locale Smoke Tests", () => {
  test("should display Spanish UI on homepage", async ({ page }) => {
    await page.goto("/es");

    // Check for Spanish navigation elements in header
    await expect(page.getByRole("link", { name: "Explorar" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Estudiar" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Meditar" })).toBeVisible();
    // Check that we're on the Spanish locale by looking at any Spanish text
    await expect(page.locator("body")).toContainText(/Sabiduría|Estudiar|Explorar/i);
  });

  test("should have Spanish study paths page", async ({ page }) => {
    await page.goto("/es/paths");

    // Check for Spanish content on study paths page
    await expect(page.getByText("Caminos de Estudio")).toBeVisible();
  });

  test("should have Spanish explore page", async ({ page }) => {
    await page.goto("/es/explore");

    // Page should load - check for zoom controls
    await expect(page.getByRole("button", { name: "Zoom in" })).toBeVisible({ timeout: 10000 });
  });

  test("should persist Spanish locale across navigation", async ({ page }) => {
    // Start on Spanish homepage
    await page.goto("/es");

    // Click on Explorar link to go to explore page
    await page.getByRole("link", { name: "Explorar" }).click();

    // Should be on Spanish explore page
    await expect(page).toHaveURL(/\/es\/explore/);
  });
});
