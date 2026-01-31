import { test, expect } from "@playwright/test";

/**
 * E2E smoke tests for German locale support.
 * Verifies basic functionality works correctly in German.
 */

// Helper to create a mocked SSE response
function createMockSSE(events: Array<{ event: string; data: object }>): string {
  return events.map((e) => `event: ${e.event}\ndata: ${JSON.stringify(e.data)}\n\n`).join("");
}

// German mock response events
const germanMockEvents = [
  {
    event: "meta",
    data: {
      quotes: [
        {
          text: "Ra: Ich bin Ra. Das Gesetz des Einen besagt, dass alle Dinge eins sind.",
          reference: "1.1",
          url: "https://www.llresearch.org/de/channeling/ra-contact/1#1",
        },
      ],
      intent: "conceptual",
      confidence: "high",
    },
  },
  { event: "chunk", data: { type: "text", content: "Das Gesetz des Einen lehrt " } },
  { event: "chunk", data: { type: "text", content: "dass alle Dinge miteinander verbunden sind. " } },
  {
    event: "chunk",
    data: {
      type: "quote",
      text: "Ra: Ich bin Ra. Das Gesetz des Einen besagt, dass alle Dinge eins sind.",
      reference: "1.1",
      url: "https://www.llresearch.org/de/channeling/ra-contact/1#1",
    },
  },
  { event: "suggestions", data: { items: ["Erzähle mir mehr über die Einheit", "Was sind die Dichtestufen?"] } },
  { event: "done", data: {} },
];

// German mock search results
const germanMockSearchResults = [
  {
    text: "Fragesteller: Was ist das Gesetz des Einen? Ra: Ich bin Ra. Das Gesetz des Einen besagt, dass alle Dinge eins sind.",
    reference: "Ra 1.7",
    session: 1,
    question: 7,
    url: "https://www.llresearch.org/de/channeling/ra-contact/1#7",
    score: 0,
  },
];

test.describe("German Locale Smoke Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Mock the chat API
    await page.route("**/api/chat", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "text/event-stream",
        headers: {
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
        body: createMockSSE(germanMockEvents),
      });
    });

    // Mock the search API
    await page.route("**/api/search", async (route) => {
      const request = route.request();
      const body = request.postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          results: germanMockSearchResults,
          query: body?.query || "test",
          totalResults: germanMockSearchResults.length,
          mode: body?.mode || "passage",
        }),
      });
    });
  });

  test("should display German UI on homepage", async ({ page }) => {
    await page.goto("/de");

    // Check for German navigation elements in header (Suchen = Seek/Chat)
    await expect(page.getByRole("link", { name: "Suchen" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Studieren" })).toBeVisible();
    // Check that we're on the German locale by looking at any German text
    await expect(page.locator("body")).toContainText(/Weisheit|Studieren|Erkunden/i);
  });

  test("should display German chat interface", async ({ page }) => {
    await page.goto("/de/chat");

    // Check for German placeholder or welcome text
    const input = page.getByRole("textbox");
    await expect(input).toBeVisible();

    // Welcome screen should have German content (disclaimer mentions "Ra-Material")
    await expect(page.locator("body")).toContainText(/Ra-Material|Zweck|Inkarnation/i);
  });

  test("should send message and receive German response", async ({ page }) => {
    await page.goto("/de/chat");

    // Send a message
    const input = page.getByRole("textbox");
    await input.fill("Was ist das Gesetz des Einen?");
    await input.press("Enter");

    // Wait for German response
    await expect(page.getByText("Das Gesetz des Einen lehrt")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("alle Dinge miteinander verbunden sind")).toBeVisible();
  });

  test("should display quote cards with German content", async ({ page }) => {
    await page.goto("/de/chat");

    const input = page.getByRole("textbox");
    await input.fill("Zeige mir Ra 1.1");
    await input.press("Enter");

    // Wait for quote card with German content - reference should be visible
    await expect(page.getByText("1.1")).toBeVisible({ timeout: 10000 });
    // Check that quote card is rendered (mock has German Ra response)
    await expect(page.getByText("Das Gesetz des Einen")).toBeVisible({ timeout: 10000 });
  });

  test("should display German search interface", async ({ page }) => {
    await page.goto("/de/search");

    // Search input should be visible immediately
    await expect(page.getByRole("textbox")).toBeVisible();
    // Check for German mode toggle labels
    await expect(page.getByRole("button", { name: "Satz" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Passage" })).toBeVisible();
  });

  test("should search and display German results", async ({ page }) => {
    await page.goto("/de/search");

    // Search input should be visible immediately
    const input = page.getByRole("textbox");
    await expect(input).toBeVisible();

    // Perform search
    await input.fill("gesetz des einen");
    await input.press("Enter");

    // Check for German results - reference should be visible
    await expect(page.getByText("1.7")).toBeVisible({ timeout: 10000 });
    // Check for German content in results (Fragesteller = Questioner)
    await expect(page.getByText("Fragesteller").first()).toBeVisible({ timeout: 10000 });
  });

  test("should display German labels in search results", async ({ page }) => {
    await page.goto("/de/search");

    const input = page.getByRole("textbox");
    await input.fill("liebe");
    await input.press("Enter");

    // Check for German UI labels (use first() as label appears multiple times)
    await expect(page.getByText("Fragesteller").first()).toBeVisible({ timeout: 10000 });
  });

  test("should have German study paths page", async ({ page }) => {
    await page.goto("/de/paths");

    // Check for German content on study paths page
    await expect(page.getByText("Studienpfade")).toBeVisible();
  });

  test("should have German explore page", async ({ page }) => {
    await page.goto("/de/explore");

    // Page should load - check for zoom controls
    await expect(page.getByRole("button", { name: "Zoom in" })).toBeVisible({ timeout: 10000 });
  });

  test("should persist German locale across navigation", async ({ page }) => {
    // Start on German homepage
    await page.goto("/de");

    // Click on Suchen link to go to chat (use first() as there might be multiple)
    await page.getByRole("link", { name: "Suchen" }).first().click();

    // Should be on German chat page
    await expect(page).toHaveURL(/\/de\/chat/);

    // Chat page should have German content
    await expect(page.locator("body")).toContainText(/Ra-Material|Zweck|Inkarnation/i);
  });
});

