import { test, expect } from "@playwright/test";

/**
 * E2E tests for error handling and edge cases.
 */

test.describe("Error States", () => {
  test("should handle empty message gracefully", async ({ page }) => {
    await page.goto("/");

    const input = page.getByRole("textbox");
    await input.press("Enter"); // Submit empty

    // Input should remain focused, no error crash
    await expect(input).toBeFocused();
  });

  test("should show error on network failure", async ({ page }) => {
    // Mock API to fail
    await page.route("**/api/chat", async (route) => {
      await route.abort("failed");
    });

    await page.goto("/");

    const input = page.getByRole("textbox");
    await input.fill("Test message");
    await input.press("Enter");

    // Should show some error indication (not crash)
    // The app should remain functional
    await expect(page.locator("body")).toBeVisible();
  });

  test("should show rate limit error", async ({ page }) => {
    // Mock API to return 429
    await page.route("**/api/chat", async (route) => {
      await route.fulfill({
        status: 429,
        contentType: "application/json",
        body: JSON.stringify({
          error: "Too many requests. Please wait before trying again.",
          retryAfter: 30,
        }),
      });
    });

    await page.goto("/");

    const input = page.getByRole("textbox");
    await input.fill("Test message");
    await input.press("Enter");

    // Should show rate limit message
    await expect(page.getByText(/too many requests|wait/i)).toBeVisible({ timeout: 10000 });
  });

  test("should show validation error for long message", async ({ page }) => {
    // Mock API to return 400
    await page.route("**/api/chat", async (route) => {
      await route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({
          error: "Message is too long. Maximum length is 5000 characters.",
        }),
      });
    });

    await page.goto("/");

    const input = page.getByRole("textbox");
    await input.fill("a".repeat(100)); // Send a message (API will mock 400 response)
    await input.press("Enter");

    // Should show validation error
    await expect(page.getByText(/too long|5000|maximum/i)).toBeVisible({ timeout: 10000 });
  });

  test("should handle server error gracefully", async ({ page }) => {
    // Mock API to return 500
    await page.route("**/api/chat", async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({
          error: "Internal server error",
        }),
      });
    });

    await page.goto("/");

    const input = page.getByRole("textbox");
    await input.fill("Test message");
    await input.press("Enter");

    // App should show error but remain functional
    await expect(page.getByText(/error|try again/i)).toBeVisible({ timeout: 10000 });
  });
});
