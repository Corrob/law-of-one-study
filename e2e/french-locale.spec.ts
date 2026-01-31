import { test, expect } from "@playwright/test";

/**
 * E2E smoke tests for French locale support.
 * Verifies basic functionality works correctly in French.
 */

// Helper to create a mocked SSE response
function createMockSSE(events: Array<{ event: string; data: object }>): string {
  return events.map((e) => `event: ${e.event}\ndata: ${JSON.stringify(e.data)}\n\n`).join("");
}

// French mock response events
const frenchMockEvents = [
  {
    event: "meta",
    data: {
      quotes: [
        {
          text: "Ra: Je suis Ra. La Loi Une affirme que toutes choses sont une.",
          reference: "1.1",
          url: "https://www.llresearch.org/fr/channeling/ra-contact/1#1",
        },
      ],
      intent: "conceptual",
      confidence: "high",
    },
  },
  { event: "chunk", data: { type: "text", content: "La Loi Une enseigne " } },
  { event: "chunk", data: { type: "text", content: "que toutes choses sont interconnectées. " } },
  {
    event: "chunk",
    data: {
      type: "quote",
      text: "Ra: Je suis Ra. La Loi Une affirme que toutes choses sont une.",
      reference: "1.1",
      url: "https://www.llresearch.org/fr/channeling/ra-contact/1#1",
    },
  },
  { event: "suggestions", data: { items: ["Parlez-moi plus de l'unité", "Que sont les densités ?"] } },
  { event: "done", data: {} },
];

// French mock search results
const frenchMockSearchResults = [
  {
    text: "Questionneur: Qu'est-ce que la Loi Une ? Ra: Je suis Ra. La Loi Une affirme que toutes choses sont une.",
    reference: "Ra 1.7",
    session: 1,
    question: 7,
    url: "https://www.llresearch.org/fr/channeling/ra-contact/1#7",
    score: 0,
  },
];

test.describe("French Locale Smoke Tests", () => {
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
        body: createMockSSE(frenchMockEvents),
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
          results: frenchMockSearchResults,
          query: body?.query || "test",
          totalResults: frenchMockSearchResults.length,
          mode: body?.mode || "passage",
        }),
      });
    });
  });

  test("should display French UI on homepage", async ({ page }) => {
    await page.goto("/fr");

    // Check for French navigation elements in header (Chercher = Seek/Chat)
    await expect(page.getByRole("link", { name: "Chercher" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Étudier" })).toBeVisible();
    // Check that we're on the French locale by looking at any French text
    await expect(page.locator("body")).toContainText(/Sagesse|Étudier|Explorer/i);
  });

  test("should display French chat interface", async ({ page }) => {
    await page.goto("/fr/chat");

    // Check for French placeholder or welcome text
    const input = page.getByRole("textbox");
    await expect(input).toBeVisible();

    // Welcome screen should have French content (disclaimer mentions "Matériel Ra")
    await expect(page.locator("body")).toContainText(/Matériel Ra|but|incarnation/i);
  });

  test("should send message and receive French response", async ({ page }) => {
    await page.goto("/fr/chat");

    // Send a message
    const input = page.getByRole("textbox");
    await input.fill("Qu'est-ce que la Loi Une ?");
    await input.press("Enter");

    // Wait for French response
    await expect(page.getByText("La Loi Une enseigne")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("toutes choses sont interconnectées")).toBeVisible();
  });

  test("should display quote cards with French content", async ({ page }) => {
    await page.goto("/fr/chat");

    const input = page.getByRole("textbox");
    await input.fill("Montrez-moi Ra 1.1");
    await input.press("Enter");

    // Wait for quote card with French content - reference should be visible
    await expect(page.getByText("1.1")).toBeVisible({ timeout: 10000 });
    // Check that quote card is rendered (mock has French Ra response)
    await expect(page.getByText("La Loi Une")).toBeVisible({ timeout: 10000 });
  });

  test("should display French search interface", async ({ page }) => {
    await page.goto("/fr/search");

    // Search input should be visible immediately
    await expect(page.getByRole("textbox")).toBeVisible();
    // Check for French mode toggle labels
    await expect(page.getByRole("button", { name: "Phrase" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Passage" })).toBeVisible();
  });

  test("should search and display French results", async ({ page }) => {
    await page.goto("/fr/search");

    // Search input should be visible immediately
    const input = page.getByRole("textbox");
    await expect(input).toBeVisible();

    // Perform search
    await input.fill("loi une");
    await input.press("Enter");

    // Check for French results - reference should be visible
    await expect(page.getByText("1.7")).toBeVisible({ timeout: 10000 });
    // Check for French content in results (Questionneur = Questioner)
    await expect(page.getByText("Questionneur").first()).toBeVisible({ timeout: 10000 });
  });

  test("should display French labels in search results", async ({ page }) => {
    await page.goto("/fr/search");

    const input = page.getByRole("textbox");
    await input.fill("amour");
    await input.press("Enter");

    // Check for French UI labels (use first() as label appears multiple times)
    await expect(page.getByText("Questionneur").first()).toBeVisible({ timeout: 10000 });
  });

  test("should have French study paths page", async ({ page }) => {
    await page.goto("/fr/paths");

    // Check for French content on study paths page
    await expect(page.getByText("Parcours d'Étude")).toBeVisible();
  });

  test("should have French explore page", async ({ page }) => {
    await page.goto("/fr/explore");

    // Page should load - check for zoom controls
    await expect(page.getByRole("button", { name: "Zoom in" })).toBeVisible({ timeout: 10000 });
  });

  test("should persist French locale across navigation", async ({ page }) => {
    // Start on French homepage
    await page.goto("/fr");

    // Click on Chercher link to go to chat (use first() as there might be multiple)
    await page.getByRole("link", { name: "Chercher" }).first().click();

    // Should be on French chat page
    await expect(page).toHaveURL(/\/fr\/chat/);

    // Chat page should have French content
    await expect(page.locator("body")).toContainText(/Matériel Ra|but|incarnation/i);
  });
});
