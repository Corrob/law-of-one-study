import { test, expect } from "@playwright/test";

/**
 * E2E tests for the semantic search feature.
 * These tests mock the /api/search endpoint to avoid hitting real APIs.
 */

const mockSearchResults = [
  {
    text: "Questioner: What is the Law of One? Ra: I am Ra. The Law of One states that all things are one, that there is no polarity.",
    reference: "Ra 1.7",
    session: 1,
    question: 7,
    url: "https://lawofone.info/s/1#7",
  },
  {
    text: "Ra: I am Ra. Consider the nature of love. Love is the great healer.",
    reference: "Ra 10.14",
    session: 10,
    question: 14,
    url: "https://lawofone.info/s/10#14",
  },
];

test.describe("Search Feature", () => {
  test.beforeEach(async ({ page }) => {
    // Mock the search API for all tests
    await page.route("**/api/search", async (route) => {
      const request = route.request();
      const body = request.postDataJSON();

      // Simulate no results for specific query
      if (body?.query?.includes("xyznonexistent")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ results: [], query: body.query, totalResults: 0 }),
        });
        return;
      }

      // Default: return mock results
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          results: mockSearchResults,
          query: body?.query || "test",
          totalResults: mockSearchResults.length,
        }),
      });
    });
  });

  test("should display search welcome screen", async ({ page }) => {
    await page.goto("/search");

    // Check for greeting and search input
    await expect(page.getByRole("textbox")).toBeVisible();
    await expect(page.getByText(/Try these/i)).toBeVisible();

    // Check for suggestion chips (at least one button with text > 10 chars should be visible)
    await expect(page.locator("button").filter({ hasText: /.{10,}/ }).first()).toBeVisible();
  });

  test("should search and display results", async ({ page }) => {
    await page.goto("/search");

    // Enter search query
    const input = page.getByRole("textbox");
    await input.fill("Law of One");
    await input.press("Enter");

    // Wait for results
    await expect(page.getByText("Closest 2 matches by meaning")).toBeVisible({ timeout: 10000 });

    // Check that results are displayed
    await expect(page.getByText("1.7")).toBeVisible();
    await expect(page.getByText("10.14")).toBeVisible();
  });

  test("should highlight search terms in results", async ({ page }) => {
    await page.goto("/search");

    const input = page.getByRole("textbox");
    await input.fill("Law");
    await input.press("Enter");

    // Wait for results
    await expect(page.getByText("Closest 2 matches by meaning")).toBeVisible({ timeout: 10000 });

    // Check for highlighted terms (mark elements)
    const highlights = page.locator("mark");
    await expect(highlights.first()).toBeVisible();
  });

  test("should update URL with search query", async ({ page }) => {
    await page.goto("/search");

    const input = page.getByRole("textbox");
    await input.fill("test query");
    await input.press("Enter");

    // Wait for navigation
    await expect(page).toHaveURL(/\/search\?q=test%20query/);
  });

  test("should load search from URL query param", async ({ page }) => {
    await page.goto("/search?q=Law%20of%20One");

    // Should automatically search and show results
    await expect(page.getByText("Closest 2 matches by meaning")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("1.7")).toBeVisible();
  });

  test("should show no results message", async ({ page }) => {
    await page.goto("/search");

    const input = page.getByRole("textbox");
    await input.fill("xyznonexistent");
    await input.press("Enter");

    // Wait for no results message
    await expect(page.getByText(/No passages found/i)).toBeVisible({ timeout: 10000 });
  });

  test("should navigate to chat with Ask about this", async ({ page }) => {
    await page.goto("/search");

    const input = page.getByRole("textbox");
    await input.fill("Law of One");
    await input.press("Enter");

    // Wait for results
    await expect(page.getByText("1.7")).toBeVisible({ timeout: 10000 });

    // Click "Ask about this" on first result
    await page.getByText("Ask about this").first().click();

    // Should navigate to chat with query
    await expect(page).toHaveURL(/\/chat\?q=/);
  });

  test("should open external link in new tab", async ({ page }) => {
    await page.goto("/search");

    const input = page.getByRole("textbox");
    await input.fill("Law of One");
    await input.press("Enter");

    // Wait for results
    await expect(page.getByText("1.7")).toBeVisible({ timeout: 10000 });

    // Check that lawofone.info links have target="_blank"
    const externalLink = page.getByRole("link", { name: "Read full passage" }).first();
    await expect(externalLink).toHaveAttribute("target", "_blank");
  });

  test("should handle suggestion chip click", async ({ page }) => {
    await page.goto("/search");

    // Click a suggestion chip (they're dynamically generated, so find any button in the suggestions area)
    const suggestionButton = page.locator("button").filter({ hasText: /.{10,}/ }).first();
    const suggestionText = await suggestionButton.textContent();
    await suggestionButton.click();

    // Should search with that suggestion
    await expect(page.getByText("Closest 2 matches by meaning")).toBeVisible({ timeout: 10000 });

    // Input should have the suggestion text
    const input = page.getByRole("textbox");
    await expect(input).toHaveValue(suggestionText || "");
  });

  test("should preserve search on back navigation", async ({ page }) => {
    await page.goto("/search");

    // Perform a search
    const input = page.getByRole("textbox");
    await input.fill("Law of One");
    await input.press("Enter");

    // Wait for results
    await expect(page.getByText("Closest 2 matches by meaning")).toBeVisible({ timeout: 10000 });

    // Navigate to a result's chat
    await page.getByText("Ask about this").first().click();
    await expect(page).toHaveURL(/\/chat\?q=/);

    // Go back
    await page.goBack();

    // Should be back on search with results (URL-based restore)
    await expect(page).toHaveURL(/\/search\?q=Law/);
  });
});
