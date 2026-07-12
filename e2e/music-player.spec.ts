import { test, expect } from "@playwright/test";

test.describe("Music album", () => {
  test("landing → open song list → play a track with synced lyrics", async ({
    page,
  }) => {
    await page.goto("/listen");

    // The play-first landing.
    await expect(page.getByText("The Wanderer's Return")).toBeVisible();

    // Open the left song-list drawer and pick the track that has lyrics.
    await page.getByRole("button", { name: "Song list" }).click();
    await page
      .getByRole("button", { name: /A Million Years Ahead/ })
      .click();

    // The immersive player shows the track and its lyrics.
    await expect(
      page.getByRole("heading", { name: "A Million Years Ahead" })
    ).toBeVisible();
    await expect(
      page.getByText("I have walked the whole long stair now")
    ).toBeVisible();
  });

  test("starts from the beginning when Play is pressed", async ({ page }) => {
    await page.goto("/listen");
    // The cover gently floats (album-cover-float), so it never settles for
    // Playwright's stability check — force the click; it's visible and enabled.
    await page
      .getByRole("button", { name: "Play the album" })
      .click({ force: true });
    // Song 1 opens (it has no cues yet → the lyrics-coming-soon state).
    await expect(
      page.getByRole("heading", { name: "First Breath" })
    ).toBeVisible();
  });

  test("deep link ?song=<id> opens the player on that track", async ({ page }) => {
    // e.g. an Ask "Explore further" card links here.
    await page.goto("/listen?song=gateway");
    await expect(page.getByRole("heading", { name: "Gateway" })).toBeVisible();
  });
});
