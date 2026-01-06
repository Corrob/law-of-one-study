import { test, expect } from "@playwright/test";

/**
 * E2E tests for multi-turn conversation flows.
 * Tests that conversation context is maintained across multiple messages.
 */

// Helper to create a mocked SSE response
function createMockSSE(events: Array<{ event: string; data: object }>): string {
  return events
    .map((e) => `event: ${e.event}\ndata: ${JSON.stringify(e.data)}\n\n`)
    .join("");
}

// First turn response
const firstTurnEvents = [
  {
    event: "meta",
    data: {
      quotes: [
        {
          text: "Ra: I am Ra. Love is the great activator and primary co-Creator.",
          reference: "13.6",
          url: "https://lawofone.info/s/13#6",
        },
      ],
      intent: "conceptual",
      confidence: "high",
    },
  },
  { event: "chunk", data: { type: "text", content: "Love is the great activator " } },
  { event: "chunk", data: { type: "text", content: "in the Law of One." } },
  {
    event: "suggestions",
    data: { items: ["Tell me more about love", "What is wisdom?", "How do they relate?"] },
  },
  { event: "done", data: {} },
];

// Follow-up response
const followUpEvents = [
  {
    event: "meta",
    data: {
      quotes: [
        {
          text: "Ra: I am Ra. Love without wisdom leads to over-compassion.",
          reference: "42.2",
          url: "https://lawofone.info/s/42#2",
        },
      ],
      intent: "conceptual",
      confidence: "high",
    },
  },
  { event: "chunk", data: { type: "text", content: "Wisdom balances love " } },
  { event: "chunk", data: { type: "text", content: "by providing understanding." } },
  {
    event: "suggestions",
    data: { items: ["What about compassion?", "Tell me about balance", "How to develop wisdom?"] },
  },
  { event: "done", data: {} },
];

test.describe("Multi-turn Conversations", () => {
  test.beforeEach(async ({ page }) => {
    // Skip onboarding modal
    await page.addInitScript(() => {
      localStorage.setItem("lo1-onboarded", "true");
    });
  });

  test("should maintain conversation context across turns", async ({ page }) => {
    let callCount = 0;

    await page.route("**/api/chat", async (route) => {
      callCount++;
      const response = callCount === 1 ? firstTurnEvents : followUpEvents;

      await route.fulfill({
        status: 200,
        contentType: "text/event-stream",
        headers: {
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
        body: createMockSSE(response),
      });
    });

    await page.goto("/");

    // First turn
    const input = page.getByRole("textbox").first();
    await input.fill("What is love?");
    await input.press("Enter");

    // Wait for first response
    await expect(page.getByText("Love is the great activator")).toBeVisible({
      timeout: 10000,
    });

    // Verify first message is visible
    await expect(page.getByText("What is love?")).toBeVisible();

    // Second turn
    await input.fill("Tell me more about wisdom");
    await input.press("Enter");

    // Wait for follow-up response
    await expect(page.getByText("Wisdom balances love")).toBeVisible({
      timeout: 10000,
    });

    // Verify both user messages are visible (conversation history)
    await expect(page.getByText("What is love?")).toBeVisible();
    await expect(page.getByText("Tell me more about wisdom")).toBeVisible();

    // Verify API was called twice
    expect(callCount).toBe(2);
  });

  test("should handle suggestion chip click as follow-up", async ({ page }) => {
    let callCount = 0;

    await page.route("**/api/chat", async (route) => {
      callCount++;
      const response = callCount === 1 ? firstTurnEvents : followUpEvents;

      await route.fulfill({
        status: 200,
        contentType: "text/event-stream",
        headers: {
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
        body: createMockSSE(response),
      });
    });

    await page.goto("/");

    // First message
    const input = page.getByRole("textbox").first();
    await input.fill("What is love?");
    await input.press("Enter");

    // Wait for suggestions to appear
    await expect(page.getByText("Tell me more about love")).toBeVisible({
      timeout: 10000,
    });

    // Click suggestion chip
    await page.getByText("Tell me more about love").click();

    // Input should be cleared (message sent)
    await expect(input).toHaveValue("");

    // Wait for follow-up response
    await expect(page.getByText("Wisdom balances love")).toBeVisible({
      timeout: 10000,
    });

    // Verify both messages are in the conversation
    expect(callCount).toBe(2);
  });

  test("should show correct message history", async ({ page }) => {
    let callCount = 0;

    await page.route("**/api/chat", async (route) => {
      callCount++;
      const response = callCount === 1 ? firstTurnEvents : followUpEvents;

      await route.fulfill({
        status: 200,
        contentType: "text/event-stream",
        headers: {
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
        body: createMockSSE(response),
      });
    });

    await page.goto("/");

    // Send first message
    const input = page.getByRole("textbox").first();
    await input.fill("First question");
    await input.press("Enter");

    await expect(page.getByText("Love is the great activator")).toBeVisible({
      timeout: 10000,
    });

    // Send second message
    await input.fill("Second question");
    await input.press("Enter");

    await expect(page.getByText("Wisdom balances love")).toBeVisible({
      timeout: 10000,
    });

    // Both user messages should be visible in order
    const messages = page.locator('[data-testid="user-message"], [data-testid="message-user"]');
    const count = await messages.count();

    // Should have at least 2 user messages
    expect(count).toBeGreaterThanOrEqual(2);
  });
});
