import { test, expect } from "@playwright/test";

/**
 * E2E tests for the main chat interaction flow.
 * These tests mock the /api/chat endpoint to avoid hitting real APIs.
 */

// Helper to create a mocked SSE response
function createMockSSE(events: Array<{ event: string; data: object }>): string {
  return events.map((e) => `event: ${e.event}\ndata: ${JSON.stringify(e.data)}\n\n`).join("");
}

// Default mock response events
const defaultMockEvents = [
  {
    event: "meta",
    data: {
      quotes: [
        {
          text: "Ra: I am Ra. The Law of One states that all things are one.",
          reference: "1.1",
          url: "https://lawofone.info/s/1#1",
        },
      ],
      intent: "conceptual",
      confidence: "high",
    },
  },
  { event: "chunk", data: { type: "text", content: "The Law of One teaches " } },
  { event: "chunk", data: { type: "text", content: "that all things are interconnected. " } },
  {
    event: "chunk",
    data: {
      type: "quote",
      text: "Ra: I am Ra. The Law of One states that all things are one.",
      reference: "1.1",
      url: "https://lawofone.info/s/1#1",
    },
  },
  { event: "suggestions", data: { items: ["Tell me more about unity", "What are the densities?", "How do I meditate?"] } },
  { event: "done", data: {} },
];

test.describe("Chat Interaction Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Mock the chat API for all tests
    await page.route("**/api/chat", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "text/event-stream",
        headers: {
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
        body: createMockSSE(defaultMockEvents),
      });
    });
  });

  test("should display welcome screen initially", async ({ page }) => {
    await page.goto("/chat");

    // Check for key elements on the welcome screen
    await expect(page.locator("body")).toContainText(/Law of One|Ra Material/i);
    await expect(page.getByRole("textbox")).toBeVisible();
  });

  test("should send message and receive response", async ({ page }) => {
    await page.goto("/chat");

    // Find and fill the input
    const input = page.getByRole("textbox");
    await input.fill("What is the Law of One?");
    await input.press("Enter");

    // Wait for the response to appear
    await expect(page.getByText("The Law of One teaches")).toBeVisible({ timeout: 10000 });
  });

  test("should display quote cards in response", async ({ page }) => {
    await page.goto("/chat");

    const input = page.getByRole("textbox");
    await input.fill("Show me Ra 1.1");
    await input.press("Enter");

    // Wait for quote card to appear
    await expect(page.getByText("1.1")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("all things are one")).toBeVisible();
  });

  test("should display suggestion chips after response", async ({ page }) => {
    await page.goto("/chat");

    const input = page.getByRole("textbox");
    await input.fill("What are densities?");
    await input.press("Enter");

    // Wait for suggestions
    await expect(page.getByText("Tell me more about unity")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("What are the densities?")).toBeVisible();
  });

  test("should handle follow-up conversation", async ({ page }) => {
    await page.goto("/chat");

    // First message
    const input = page.getByRole("textbox");
    await input.fill("What is love?");
    await input.press("Enter");

    // Wait for response
    await expect(page.getByText("The Law of One teaches")).toBeVisible({ timeout: 10000 });

    // Second message
    await input.fill("Tell me more");
    await input.press("Enter");

    // Should still see the input working (response will be mocked)
    await expect(input).toHaveValue("");
  });
});
