import { test, expect } from "@playwright/test";

/**
 * E2E tests for rate limit handling and recovery.
 * Tests that the app gracefully handles 429 responses and recovers.
 */

// Helper to create a mocked SSE response
function createMockSSE(events: Array<{ event: string; data: object }>): string {
  return events
    .map((e) => `event: ${e.event}\ndata: ${JSON.stringify(e.data)}\n\n`)
    .join("");
}

// Successful response after rate limit clears
const successEvents = [
  {
    event: "meta",
    data: {
      quotes: [],
      intent: "conceptual",
      confidence: "high",
    },
  },
  { event: "chunk", data: { type: "text", content: "Here is your response after rate limit cleared." } },
  { event: "suggestions", data: { items: ["Follow-up question"] } },
  { event: "done", data: {} },
];

test.describe("Rate Limit Handling", () => {
  test.beforeEach(async ({ page }) => {
    // Skip onboarding modal
    await page.addInitScript(() => {
      localStorage.setItem("lo1-onboarded", "true");
    });
  });

  test("should show user-friendly error on 429 response", async ({ page }) => {
    await page.route("**/api/chat", async (route) => {
      await route.fulfill({
        status: 429,
        contentType: "application/json",
        headers: {
          "Retry-After": "60",
          "X-RateLimit-Limit": "10",
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.floor(Date.now() / 1000) + 60),
        },
        body: JSON.stringify({
          error: "Rate limit exceeded",
          message: "Too many requests. Please try again later.",
          retryAfter: 60,
        }),
      });
    });

    await page.goto("/chat");

    const input = page.getByRole("textbox").first();
    await input.fill("Test message");
    await input.press("Enter");

    // Should show error message to user
    await expect(
      page.getByText(/rate limit|too many requests|try again/i)
    ).toBeVisible({ timeout: 10000 });
  });

  test("should recover after rate limit clears", async ({ page }) => {
    let callCount = 0;

    await page.route("**/api/chat", async (route) => {
      callCount++;

      if (callCount === 1) {
        // First call returns 429
        await route.fulfill({
          status: 429,
          contentType: "application/json",
          headers: {
            "Retry-After": "1",
          },
          body: JSON.stringify({
            error: "Rate limit exceeded",
            retryAfter: 1,
          }),
        });
      } else {
        // Subsequent calls succeed
        await route.fulfill({
          status: 200,
          contentType: "text/event-stream",
          headers: {
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
          },
          body: createMockSSE(successEvents),
        });
      }
    });

    await page.goto("/chat");

    const input = page.getByRole("textbox").first();

    // First attempt - should hit rate limit
    await input.fill("First attempt");
    await input.press("Enter");

    // Wait for rate limit error
    await expect(
      page.getByText(/rate limit|too many requests|try again/i)
    ).toBeVisible({ timeout: 10000 });

    // Second attempt - should succeed
    await input.fill("Second attempt");
    await input.press("Enter");

    // Should show successful response
    await expect(
      page.getByText("Here is your response after rate limit cleared")
    ).toBeVisible({ timeout: 10000 });

    // Verify both API calls were made
    expect(callCount).toBe(2);
  });

  test("should handle 500 server error gracefully", async ({ page }) => {
    await page.route("**/api/chat", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({
          error: "Internal server error",
          message: "Something went wrong on our end.",
        }),
      });
    });

    await page.goto("/chat");

    const input = page.getByRole("textbox").first();
    await input.fill("Test message");
    await input.press("Enter");

    // Should show error message
    await expect(
      page.getByText(/error|something went wrong|try again/i)
    ).toBeVisible({ timeout: 10000 });
  });

  test("should handle network errors gracefully", async ({ page }) => {
    await page.route("**/api/chat", async (route) => {
      await route.abort("failed");
    });

    await page.goto("/chat");

    const input = page.getByRole("textbox").first();
    await input.fill("Test message");
    await input.press("Enter");

    // Should show error message for network failure
    await expect(
      page.getByText(/error|failed|network|try again/i)
    ).toBeVisible({ timeout: 10000 });
  });

  test("should allow retry after error", async ({ page }) => {
    let callCount = 0;

    await page.route("**/api/chat", async (route) => {
      callCount++;

      if (callCount === 1) {
        // First call fails
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ error: "Server error" }),
        });
      } else {
        // Retry succeeds
        await route.fulfill({
          status: 200,
          contentType: "text/event-stream",
          headers: {
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
          },
          body: createMockSSE(successEvents),
        });
      }
    });

    await page.goto("/chat");

    const input = page.getByRole("textbox").first();

    // First attempt fails
    await input.fill("My question");
    await input.press("Enter");

    // Wait for error
    await expect(
      page.getByText(/error|something went wrong|try again/i)
    ).toBeVisible({ timeout: 10000 });

    // Retry the same message
    await input.fill("My question");
    await input.press("Enter");

    // Should succeed this time
    await expect(
      page.getByText("Here is your response after rate limit cleared")
    ).toBeVisible({ timeout: 10000 });
  });
});
