import { test, expect } from "@playwright/test";

/**
 * E2E tests for the Concept Explorer feature.
 * Tests the interactive graph visualization with category clusters.
 */

test.describe("Concept Explorer", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/explore");
  });

  test("should render the explore page with graph", async ({ page }) => {
    // Should have zoom controls (proves graph container is rendered)
    await expect(page.getByRole("button", { name: "Zoom in" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Zoom out" })).toBeVisible();
  });

  test("should display category cluster nodes on initial load", async ({
    page,
  }) => {
    // Wait for the graph to render
    await page.waitForSelector("svg");

    // Should have cluster nodes (8 categories)
    const clusterNodes = page.locator('[data-testid^="node-cluster-"]');
    await expect(clusterNodes).toHaveCount(8);
  });

  test("should show stats overlay", async ({ page }) => {
    // Should show initial instruction text
    await expect(
      page.getByText("Click a category to explore")
    ).toBeVisible();
  });

  test("should expand cluster when clicked", async ({ page }) => {
    // Wait for graph to render
    await page.waitForSelector('[data-testid^="node-cluster-"]');

    // Click on a cluster node (cosmology has ~16 concepts)
    await page.click('[data-testid="node-cluster-cosmology"]');

    // Wait a bit for the graph to update
    await page.waitForTimeout(500);

    // Should now show concept nodes instead of cluster
    const conceptNodes = page.locator('[data-testid^="node-"]:not([data-testid^="node-cluster-"])');
    const count = await conceptNodes.count();
    expect(count).toBeGreaterThan(0);

    // Stats should update to show visible concepts
    await expect(page.getByText(/\d+ concepts/)).toBeVisible();
  });

  test("should show concept panel when concept node is clicked", async ({
    page,
  }) => {
    // First expand a cluster
    await page.waitForSelector('[data-testid^="node-cluster-"]');
    await page.click('[data-testid="node-cluster-polarity"]');
    await page.waitForTimeout(500);

    // Now click on a concept node - polarity concepts include things like "service-to-others"
    // We'll click on any concept node that appears
    const conceptNodes = page.locator('[data-testid^="node-"]:not([data-testid^="node-cluster-"])');
    await conceptNodes.first().click();

    // Panel should appear with concept details (use first() since desktop+mobile both render)
    await expect(page.getByText("Definition").first()).toBeVisible();
    await expect(page.getByText("Explore this concept").first()).toBeVisible();
  });

  test("should navigate to chat when 'Explore this concept' is clicked", async ({
    page,
  }) => {
    // Expand a cluster
    await page.waitForSelector('[data-testid^="node-cluster-"]');
    await page.click('[data-testid="node-cluster-polarity"]');
    await page.waitForTimeout(500);

    // Click on a concept node
    const conceptNodes = page.locator('[data-testid^="node-"]:not([data-testid^="node-cluster-"])');
    await conceptNodes.first().click();

    // Wait for panel (use first() since desktop+mobile both render)
    await expect(page.getByText("Explore this concept").first()).toBeVisible();

    // Click the explore button (first one is the desktop panel)
    await page.getByText("Explore this concept").first().click();

    // Should navigate to chat with query parameter
    await expect(page).toHaveURL(/\/chat\?q=/);
  });

  test("should close panel when close button is clicked", async ({ page }) => {
    // Expand and select a concept - wait longer for simulation to settle
    await page.waitForSelector('[data-testid^="node-cluster-"]');
    await page.waitForTimeout(1000); // Wait for initial simulation to settle
    await page.click('[data-testid="node-cluster-polarity"]');
    await page.waitForTimeout(1000); // Wait for expansion animation

    const conceptNodes = page.locator('[data-testid^="node-"]:not([data-testid^="node-cluster-"])');
    await conceptNodes.first().click();

    // Panel should be visible (use first() since desktop+mobile both render)
    await expect(page.getByText("Definition").first()).toBeVisible();

    // Click close button (first one is the desktop panel)
    await page.locator('[aria-label="Close panel"]').first().click();

    // Wait for panel to close by checking that Definition header disappears
    await expect(page.getByText("Definition").first()).not.toBeVisible({ timeout: 2000 });
  });

  test("should have zoom controls", async ({ page }) => {
    // Should have zoom in and zoom out buttons
    await expect(page.getByRole("button", { name: "Zoom in" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Zoom out" })).toBeVisible();
  });
});
