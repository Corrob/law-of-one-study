import { test, expect } from "@playwright/test";

test.describe("Music album", () => {
  test("landing → open song list → play a track with synced lyrics", async ({
    page,
  }) => {
    await page.goto("/music");

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
    await page.goto("/music");
    await page.getByRole("button", { name: "Play the album" }).click();
    // Song 1 opens (it has no cues yet → the lyrics-coming-soon state).
    await expect(
      page.getByRole("heading", { name: "First Breath" })
    ).toBeVisible();
  });
});
