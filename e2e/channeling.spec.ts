import { test, expect } from "@playwright/test";

/**
 * E2E for the public Conscious Channeling browse page. Static content (no API),
 * so no mocking is needed. Verifies the index renders + filters, a theme detail
 * page shows source links to llresearch.org, and the English-only gate 404s
 * other locales.
 */

test.describe("Conscious Channeling browse", () => {
  test("index renders theme cards and filters by search", async ({ page }) => {
    await page.goto("/channeling");

    await expect(page.getByRole("heading", { name: "Conscious Channeling" })).toBeVisible();

    const cards = page.getByTestId("channeling-card");
    const initialCount = await cards.count();
    expect(initialCount).toBeGreaterThan(10);

    // Searching narrows the list.
    await page.getByRole("searchbox").fill("grief");
    await expect(cards).not.toHaveCount(initialCount);
    await expect(page.getByRole("link", { name: /Grief/i }).first()).toBeVisible();
  });

  test("a theme page shows a source link to llresearch.org", async ({ page }) => {
    await page.goto("/channeling/meditation-and-silence");

    await expect(
      page.getByRole("heading", { name: /Meditation/i }).first()
    ).toBeVisible();

    // At least one source link points at the L/L Research transcript archive.
    const source = page
      .getByRole("link")
      .filter({ hasText: /·/ })
      .first();
    await expect(source).toHaveAttribute(
      "href",
      /^https:\/\/www\.llresearch\.org\/channeling\//
    );
    await expect(source).toHaveAttribute("target", "_blank");
  });

  test("non-English locale 404s (channeling is English-only)", async ({ page }) => {
    const res = await page.goto("/es/channeling");
    expect(res?.status()).toBe(404);
  });
});
