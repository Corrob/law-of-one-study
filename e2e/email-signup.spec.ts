import { test, expect } from "@playwright/test";

/**
 * E2E test for the weekly quote email signup card on the home page.
 * The network call is mocked — this exercises the user-visible flow only
 * (card visible → enter email → submit → success state). Localization and
 * error paths are covered by unit tests.
 */

test.describe("Email Signup", () => {
  test("subscribes from the home page signup card", async ({ page }) => {
    // Mock the subscribe API so no real MailerLite call is made
    await page.route("**/api/subscribe", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ status: "ok" }),
      });
    });

    await page.goto("/");

    const emailInput = page.getByLabel("Email address");
    await expect(emailInput).toBeVisible();

    await emailInput.fill("seeker@example.com");
    await page.getByRole("button", { name: "Subscribe" }).click();

    await expect(
      page.getByText("You are subscribed 🙏 Check your inbox to confirm.")
    ).toBeVisible();
  });

  test("dismissing the signup card hides it across reloads", async ({ page }) => {
    await page.goto("/");

    const dismissButton = page.getByRole("button", { name: "Dismiss email signup" });
    await expect(dismissButton).toBeVisible();
    await dismissButton.click();

    await expect(page.getByLabel("Email address")).toBeHidden();

    await page.reload();
    await expect(page.getByLabel("Email address")).toBeHidden();
  });
});
