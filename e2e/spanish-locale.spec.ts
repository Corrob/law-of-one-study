import { test, expect } from "@playwright/test";

/**
 * E2E smoke tests for Spanish locale support.
 * Verifies basic functionality works correctly in Spanish.
 */

// Helper to create a mocked SSE response
function createMockSSE(events: Array<{ event: string; data: object }>): string {
  return events.map((e) => `event: ${e.event}\ndata: ${JSON.stringify(e.data)}\n\n`).join("");
}

// Spanish mock response events
const spanishMockEvents = [
  {
    event: "meta",
    data: {
      quotes: [
        {
          text: "Ra: Soy Ra. La Ley del Uno establece que todas las cosas son una.",
          reference: "1.1",
          url: "https://www.llresearch.org/es/channeling/ra-contact/1#1",
        },
      ],
      intent: "conceptual",
      confidence: "high",
    },
  },
  { event: "chunk", data: { type: "text", content: "La Ley del Uno enseña " } },
  { event: "chunk", data: { type: "text", content: "que todas las cosas están interconectadas. " } },
  {
    event: "chunk",
    data: {
      type: "quote",
      text: "Ra: Soy Ra. La Ley del Uno establece que todas las cosas son una.",
      reference: "1.1",
      url: "https://www.llresearch.org/es/channeling/ra-contact/1#1",
    },
  },
  { event: "suggestions", data: { items: ["Cuéntame más sobre la unidad", "¿Qué son las densidades?"] } },
  { event: "done", data: {} },
];

// Spanish mock search results
const spanishMockSearchResults = [
  {
    text: "Interrogador: ¿Qué es la Ley del Uno? Ra: Soy Ra. La Ley del Uno establece que todas las cosas son una.",
    reference: "Ra 1.7",
    session: 1,
    question: 7,
    url: "https://www.llresearch.org/es/channeling/ra-contact/1#7",
    score: 0,
  },
];

test.describe("Spanish Locale Smoke Tests", () => {
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
        body: createMockSSE(spanishMockEvents),
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
          results: spanishMockSearchResults,
          query: body?.query || "test",
          totalResults: spanishMockSearchResults.length,
          mode: body?.mode || "passage",
        }),
      });
    });
  });

  test("should display Spanish UI on homepage", async ({ page }) => {
    await page.goto("/es");

    // Check for Spanish navigation elements in header
    await expect(page.getByRole("link", { name: "Consultar" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Estudiar" })).toBeVisible();
    // Check that we're on the Spanish locale by looking at any Spanish text
    await expect(page.locator("body")).toContainText(/Sabiduría|Consultar|Estudiar/i);
  });

  test("should display Spanish chat interface", async ({ page }) => {
    await page.goto("/es/chat");

    // Check for Spanish placeholder or welcome text
    const input = page.getByRole("textbox");
    await expect(input).toBeVisible();

    // Welcome screen should have Spanish content (disclaimer mentions "Material de Ra")
    await expect(page.locator("body")).toContainText(/Material de Ra|propósito|encarnación/i);
  });

  test("should send message and receive Spanish response", async ({ page }) => {
    await page.goto("/es/chat");

    // Send a message
    const input = page.getByRole("textbox");
    await input.fill("¿Qué es la Ley del Uno?");
    await input.press("Enter");

    // Wait for Spanish response
    await expect(page.getByText("La Ley del Uno enseña")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("todas las cosas están interconectadas")).toBeVisible();
  });

  test("should display quote cards with Spanish content", async ({ page }) => {
    await page.goto("/es/chat");

    const input = page.getByRole("textbox");
    await input.fill("Muéstrame Ra 1.1");
    await input.press("Enter");

    // Wait for quote card with Spanish content
    await expect(page.getByText("1.1")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Soy Ra")).toBeVisible();
  });

  test("should display Spanish search interface", async ({ page }) => {
    await page.goto("/es/search");

    // Search input should be visible immediately
    await expect(page.getByRole("textbox")).toBeVisible();
    // Check for Spanish mode toggle labels
    await expect(page.getByRole("button", { name: "Frase" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Pasaje" })).toBeVisible();
  });

  test("should search and display Spanish results", async ({ page }) => {
    await page.goto("/es/search");

    // Search input should be visible immediately
    const input = page.getByRole("textbox");
    await expect(input).toBeVisible();

    // Perform search
    await input.fill("ley del uno");
    await input.press("Enter");

    // Check for Spanish results
    await expect(page.getByText("1.7")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/Soy Ra/)).toBeVisible();
  });

  test("should display Spanish labels in search results", async ({ page }) => {
    await page.goto("/es/search");

    const input = page.getByRole("textbox");
    await input.fill("amor");
    await input.press("Enter");

    // Check for Spanish UI labels (use first() as label appears multiple times)
    await expect(page.getByText("Interrogador").first()).toBeVisible({ timeout: 10000 });
  });

  test("should have Spanish study paths page", async ({ page }) => {
    await page.goto("/es/paths");

    // Check for Spanish content on study paths page
    await expect(page.getByText("Caminos de Estudio")).toBeVisible();
  });

  test("should have Spanish explore page", async ({ page }) => {
    await page.goto("/es/explore");

    // Page should load - check for zoom controls
    await expect(page.getByRole("button", { name: "Zoom in" })).toBeVisible({ timeout: 10000 });
  });

  test("should persist Spanish locale across navigation", async ({ page }) => {
    // Start on Spanish homepage
    await page.goto("/es");

    // Click on Consultar link to go to chat
    await page.getByRole("link", { name: "Consultar" }).click();

    // Should be on Spanish chat page
    await expect(page).toHaveURL(/\/es\/chat/);

    // Chat page should have Spanish content
    await expect(page.locator("body")).toContainText(/Material de Ra|propósito|encarnación/i);
  });
});
