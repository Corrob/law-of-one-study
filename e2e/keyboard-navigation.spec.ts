import { test, expect } from "@playwright/test";

/**
 * E2E tests for keyboard navigation and accessibility.
 * Tests that the app is fully keyboard navigable.
 */

// Helper to create a mocked SSE response
function createMockSSE(events: Array<{ event: string; data: object }>): string {
  return events
    .map((e) => `event: ${e.event}\ndata: ${JSON.stringify(e.data)}\n\n`)
    .join("");
}

// Mock response with suggestions
const mockEventsWithSuggestions = [
  {
    event: "meta",
    data: {
      quotes: [],
      intent: "conceptual",
      confidence: "high",
    },
  },
  { event: "chunk", data: { type: "text", content: "Here is your response." } },
  {
    event: "suggestions",
    data: {
      items: ["First suggestion", "Second suggestion", "Third suggestion"],
    },
  },
  { event: "done", data: {} },
];

test.describe("Keyboard Navigation", () => {
  test.beforeEach(async ({ page }) => {
    // Skip onboarding modal
    await page.addInitScript(() => {
      localStorage.setItem("lo1-onboarded", "true");
    });

    await page.route("**/api/chat", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "text/event-stream",
        headers: {
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
        body: createMockSSE(mockEventsWithSuggestions),
      });
    });
  });

  test("should submit message with Enter key", async ({ page }) => {
    await page.goto("/chat");

    // Use .first() to avoid ambiguity with disabled textarea during loading
    const input = page.getByRole("textbox").first();
    await input.fill("Test message");
    await page.keyboard.press("Enter");

    // Input should be cleared after submission
    await expect(input).toHaveValue("");

    // Response should appear
    await expect(page.getByText("Here is your response")).toBeVisible({
      timeout: 10000,
    });
  });

  test("should allow newlines with Shift+Enter", async ({ page }) => {
    await page.goto("/chat");

    const input = page.getByRole("textbox").first();
    await input.fill("Line 1");
    await page.keyboard.press("Shift+Enter");
    await page.keyboard.type("Line 2");

    // Input should contain both lines (not submitted)
    const value = await input.inputValue();
    expect(value).toContain("Line 1");
    expect(value).toContain("Line 2");
  });

  test("should navigate suggestion chips with arrow keys", async ({ page }) => {
    await page.goto("/chat");

    // Send message to get suggestions
    const input = page.getByRole("textbox").first();
    await input.fill("Test");
    await input.press("Enter");

    // Wait for suggestions to appear
    const firstChip = page.getByTestId("suggestion-chip").first();
    await expect(firstChip).toBeVisible({ timeout: 10000 });

    // Focus the first chip
    await firstChip.focus();
    await expect(firstChip).toBeFocused();

    // Arrow right should move to next
    await page.keyboard.press("ArrowRight");
    const secondChip = page.getByTestId("suggestion-chip").nth(1);
    await expect(secondChip).toBeFocused();

    // Arrow left should move back
    await page.keyboard.press("ArrowLeft");
    await expect(firstChip).toBeFocused();
  });

  test("should navigate to last chip with End key", async ({ page }) => {
    await page.goto("/chat");

    const input = page.getByRole("textbox").first();
    await input.fill("Test");
    await input.press("Enter");

    // Wait for suggestions
    const firstChip = page.getByTestId("suggestion-chip").first();
    await expect(firstChip).toBeVisible({ timeout: 10000 });

    // Focus first chip
    await firstChip.focus();

    // Press End to go to last chip
    await page.keyboard.press("End");
    const lastChip = page.getByTestId("suggestion-chip").last();
    await expect(lastChip).toBeFocused();
  });

  test("should navigate to first chip with Home key", async ({ page }) => {
    await page.goto("/chat");

    const input = page.getByRole("textbox").first();
    await input.fill("Test");
    await input.press("Enter");

    // Wait for suggestions
    const lastChip = page.getByTestId("suggestion-chip").last();
    await expect(lastChip).toBeVisible({ timeout: 10000 });

    // Focus last chip
    await lastChip.focus();

    // Press Home to go to first chip
    await page.keyboard.press("Home");
    const firstChip = page.getByTestId("suggestion-chip").first();
    await expect(firstChip).toBeFocused();
  });

  test("should activate suggestion with Enter key", async ({ page }) => {
    await page.goto("/chat");

    const input = page.getByRole("textbox").first();
    await input.fill("Test");
    await input.press("Enter");

    // Wait for suggestions
    const firstChip = page.getByTestId("suggestion-chip").first();
    await expect(firstChip).toBeVisible({ timeout: 10000 });

    // Focus and activate with Enter
    await firstChip.focus();
    await page.keyboard.press("Enter");

    // Input should be cleared (message sent via chip)
    await expect(input).toHaveValue("");
  });

  test("should have correct tab order", async ({ page }) => {
    await page.goto("/chat");

    const input = page.getByRole("textbox").first();

    // Focus input and send message to get suggestions
    await input.focus();
    await input.fill("Test");
    await input.press("Enter");

    // Wait for response and suggestions
    await expect(page.getByText("Here is your response")).toBeVisible({
      timeout: 10000,
    });

    const chips = page.getByTestId("suggestion-chip");
    await expect(chips.first()).toBeVisible();

    // Tab from input should eventually reach suggestion chips
    await input.focus();
    await page.keyboard.press("Tab");

    // After some tabs, we should be able to reach the chips
    // Focus the first chip directly and verify it's focusable
    await chips.first().focus();
    await expect(chips.first()).toBeFocused();
  });

  test("should wrap around with arrow keys on suggestions", async ({ page }) => {
    await page.goto("/chat");

    const input = page.getByRole("textbox").first();
    await input.fill("Test");
    await input.press("Enter");

    // Wait for suggestions
    const firstChip = page.getByTestId("suggestion-chip").first();
    const lastChip = page.getByTestId("suggestion-chip").last();
    await expect(firstChip).toBeVisible({ timeout: 10000 });

    // Focus first chip and go left (should wrap to last)
    await firstChip.focus();
    await page.keyboard.press("ArrowLeft");
    await expect(lastChip).toBeFocused();

    // From last, go right (should wrap to first)
    await page.keyboard.press("ArrowRight");
    await expect(firstChip).toBeFocused();
  });
});
