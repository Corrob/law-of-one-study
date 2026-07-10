import { test, expect } from "@playwright/test";

/**
 * E2E tests for the Ask feature (LLM guide to the Ra Material).
 *
 * The /api/ask endpoint needs an ANTHROPIC_API_KEY that CI does not have, so the
 * streaming response is mocked with a canned SSE stream. This keeps the test
 * deterministic while still exercising the real client: SSE parsing, message
 * rendering, and citation links to lawofone.info.
 */

const SSE_RESPONSE = [
  'event: meta\ndata: {"concepts":["harvest"]}\n\n',
  'event: chunk\ndata: {"text":"The harvest is a transition between densities "}\n\n',
  'event: chunk\ndata: {"text":"based on polarity {{CITE:6.14}}."}\n\n',
  "event: done\ndata: {}\n\n",
].join("");

test.describe("Ask", () => {
  test("renders the welcome state with starter questions", async ({ page }) => {
    await page.goto("/ask");

    await expect(page.getByRole("heading", { name: "Ask the Law of One" })).toBeVisible();
    await expect(page.getByRole("button", { name: "What is the Law of One?" })).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Your question" })).toBeVisible();
  });

  test("streams an answer and renders a citation link to lawofone.info", async ({ page }) => {
    await page.route("**/api/ask", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "text/event-stream; charset=utf-8",
        body: SSE_RESPONSE,
      });
    });

    await page.goto("/ask");

    const input = page.getByRole("textbox", { name: "Your question" });
    await input.fill("What is the harvest?");
    await input.press("Enter");

    // The user's message echoes back.
    await expect(page.getByText("What is the harvest?")).toBeVisible();

    // The streamed answer renders (paraphrase, no verbatim Ra text).
    await expect(page.getByText(/The harvest is a transition between densities/)).toBeVisible();

    // The citation marker becomes a link to the authorized source.
    const citation = page.getByRole("link", { name: "6.14" });
    await expect(citation).toBeVisible();
    await expect(citation).toHaveAttribute("href", "https://www.lawofone.info/s/6#14");
  });

  test("shows an error message when the endpoint is unavailable", async ({ page }) => {
    await page.route("**/api/ask", async (route) => {
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ error: "The Ask feature is not configured." }),
      });
    });

    await page.goto("/ask");

    const input = page.getByRole("textbox", { name: "Your question" });
    await input.fill("What is the harvest?");
    await input.press("Enter");

    await expect(page.getByText("The Ask feature is not configured.")).toBeVisible();
  });
});
