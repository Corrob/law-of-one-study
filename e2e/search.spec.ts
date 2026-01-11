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
    score: 0,
  },
  {
    text: "Ra: I am Ra. Consider the nature of love. Love is the great healer.",
    reference: "Ra 10.14",
    session: 10,
    question: 14,
    url: "https://lawofone.info/s/10#14",
    score: 0,
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
          body: JSON.stringify({
            results: [],
            query: body.query,
            totalResults: 0,
            mode: body.mode || "passage",
          }),
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
          mode: body?.mode || "passage",
        }),
      });
    });
  });

  test("should display mode selection on initial load", async ({ page }) => {
    await page.goto("/search");

    // Check for mode selection cards
    await expect(page.getByText("Sentence Search")).toBeVisible();
    await expect(page.getByText("Passage Search")).toBeVisible();
    await expect(page.getByText("Find quotes you already know")).toBeVisible();
    await expect(page.getByText("Discover quotes by concept")).toBeVisible();

    // Search input should not be visible until mode is selected
    await expect(page.getByRole("textbox")).not.toBeVisible();
  });

  test("should show search input after selecting mode", async ({ page }) => {
    await page.goto("/search");

    // Select Passage Search mode
    await page.getByText("Passage Search").click();

    // Now search input should be visible
    await expect(page.getByRole("textbox")).toBeVisible();
    await expect(page.getByText(/Try these/i)).toBeVisible();

    // URL should reflect mode
    await expect(page).toHaveURL(/\/search\?mode=passage/);
  });

  test("should search and display results", async ({ page }) => {
    await page.goto("/search?mode=passage");

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
    await page.goto("/search?mode=passage");

    const input = page.getByRole("textbox");
    await input.fill("Law");
    await input.press("Enter");

    // Wait for results
    await expect(page.getByText("Closest 2 matches by meaning")).toBeVisible({ timeout: 10000 });

    // Check for highlighted terms (mark elements)
    const highlights = page.locator("mark");
    await expect(highlights.first()).toBeVisible();
  });

  test("should update URL with search query and mode", async ({ page }) => {
    await page.goto("/search?mode=passage");

    const input = page.getByRole("textbox");
    await input.fill("test query");
    await input.press("Enter");

    // Wait for navigation - URL should include both mode and query
    await expect(page).toHaveURL(/\/search\?mode=passage&q=test%20query/);
  });

  test("should load search from URL query param", async ({ page }) => {
    await page.goto("/search?mode=passage&q=Law%20of%20One");

    // Should automatically search and show results
    await expect(page.getByText("Closest 2 matches by meaning")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("1.7")).toBeVisible();
  });

  test("should show no results message", async ({ page }) => {
    await page.goto("/search?mode=passage");

    const input = page.getByRole("textbox");
    await input.fill("xyznonexistent");
    await input.press("Enter");

    // Wait for no results message
    await expect(page.getByText(/No passages found/i)).toBeVisible({ timeout: 10000 });
  });

  test("should navigate to chat with Ask about this", async ({ page }) => {
    await page.goto("/search?mode=passage");

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
    await page.goto("/search?mode=passage");

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
    await page.goto("/search?mode=passage");

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

  test("should handle back navigation to search", async ({ page }) => {
    await page.goto("/search?mode=passage");

    // Perform a search
    const input = page.getByRole("textbox");
    await input.fill("Law of One");
    await input.press("Enter");

    // Wait for results
    await expect(page.getByText("Closest 2 matches by meaning")).toBeVisible({ timeout: 10000 });

    // Navigate to a result's chat
    await page.getByText("Ask about this").first().click();
    await expect(page).toHaveURL(/\/chat\?q=/);

    // Go back - should return to search page with mode preserved
    await page.goBack();

    // Should be back on search page (mode should be preserved via popstate)
    await expect(page).toHaveURL(/\/search\?mode=passage/);
    await expect(page.getByRole("textbox")).toBeVisible();
  });

  test("should toggle between modes and re-search", async ({ page }) => {
    await page.goto("/search?mode=passage");

    // Perform a search in passage mode
    const input = page.getByRole("textbox");
    await input.fill("Law of One");
    await input.press("Enter");

    // Wait for results
    await expect(page.getByText("Closest 2 matches by meaning")).toBeVisible({ timeout: 10000 });

    // Toggle to sentence mode
    await page.getByRole("button", { name: "Sentence" }).click();

    // URL should update to sentence mode
    await expect(page).toHaveURL(/\/search\?mode=sentence&q=Law/);
  });
});
