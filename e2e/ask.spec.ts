import { test, expect } from "@playwright/test";

/**
 * E2E tests for the Ask feature (LLM guide to the Ra Material).
 *
 * The /api/ask endpoint needs an OPENAI_API_KEY that CI does not have, so the
 * streaming response is mocked with a canned SSE stream. This keeps the test
 * deterministic while still exercising the real client: SSE parsing, message
 * rendering, and citation links to L/L Research (llresearch.org).
 */

const SSE_RESPONSE = [
  'event: meta\ndata: {"concepts":["harvest"]}\n\n',
  'event: related\ndata: {"items":[{"type":"path","id":"densities"}]}\n\n',
  'event: chunk\ndata: {"text":"The harvest is a transition between densities "}\n\n',
  'event: chunk\ndata: {"text":"based on polarity {{CITE:6.14}}."}\n\n',
  'event: suggestions\ndata: {"items":["Tell me about polarity","What are the densities?","How does one meditate?"]}\n\n',
  "event: done\ndata: {}\n\n",
].join("");

test.describe("Ask", () => {
  test("renders the welcome state with starter questions", async ({ page }) => {
    await page.goto("/ask");

    await expect(page.getByRole("heading", { name: "Ask the Law of One" })).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Your question" })).toBeVisible();

    // A random handful of starters is shown from the localized pool.
    const starters = page.getByTestId("ask-starter");
    await expect(starters.first()).toBeVisible();
    expect(await starters.count()).toBeGreaterThan(1);
  });

  test("streams an answer and renders a citation link to L/L Research", async ({ page }) => {
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
    await expect(page.getByText(/The harvest is a transition between densities/).first()).toBeVisible();

    // The citation marker becomes a link to the authorized source.
    const citation = page.getByRole("link", { name: "6.14" });
    await expect(citation).toBeVisible();
    await expect(citation).toHaveAttribute(
      "href",
      "https://www.llresearch.org/channeling/ra-contact/6#14"
    );

    // Follow-up suggestion chips appear after the answer.
    const suggestions = page.getByTestId("ask-suggestion");
    await expect(suggestions.first()).toBeVisible();
    expect(await suggestions.count()).toBe(3);

    // A completed answer offers copy-to-clipboard.
    await expect(page.getByTestId("ask-copy")).toBeVisible();

    // "Explore further" cards render with the answer.
    await expect(page.getByTestId("ask-related-card").first()).toBeVisible();

    // The cards stay with their answer when a follow-up is asked.
    const input2 = page.getByRole("textbox", { name: "Your question" });
    await input2.fill("And what about polarity?");
    await input2.press("Enter");
    await expect(page.getByText(/The harvest is a transition between densities/).nth(1)).toBeVisible();
    expect(await page.getByTestId("ask-related").count()).toBe(2);

    // The conversation survives a refresh (sessionStorage persistence),
    // including each answer's cards.
    await page.reload();
    await expect(page.getByText("What is the harvest?")).toBeVisible();
    await expect(page.getByText(/The harvest is a transition between densities/).first()).toBeVisible();
    expect(await page.getByTestId("ask-related").count()).toBe(2);

    // Export downloads the conversation as Markdown with citation links.
    const downloadPromise = page.waitForEvent("download");
    await page.getByTestId("ask-export").click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/^law-of-one-ask-.*\.md$/);
    const content = await (await import("node:fs/promises")).readFile(await download.path(), "utf-8");
    expect(content).toContain("## ");
    expect(content).toContain("https://www.llresearch.org/channeling/ra-contact/6#14");
    expect(content).not.toContain("{{CITE");
  });

  test("auto-submits a ?q= deep link question (weekly email)", async ({ page }) => {
    await page.route("**/api/ask", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "text/event-stream; charset=utf-8",
        body: SSE_RESPONSE,
      });
    });

    const question = 'Please help me understand Ra 6.14: "The harvest is now."';
    await page.goto(`/ask?q=${encodeURIComponent(question)}`);

    // The question is asked immediately — the reader lands in the answer,
    // not in front of a pre-filled composer.
    await expect(page.getByText(question)).toBeVisible();
    await expect(
      page.getByText(/The harvest is a transition between densities/).first()
    ).toBeVisible();
    await expect(
      page.getByRole("textbox", { name: "Your question" }).last()
    ).toHaveValue("");

    // The consumed ?q= is dropped so a refresh doesn't re-ask the question.
    expect(new URL(page.url()).searchParams.get("q")).toBeNull();
    await page.reload();
    // The conversation is restored once, with the composer still empty.
    await expect(page.getByText(question)).toBeVisible();
    expect(await page.getByTestId("ask-related").count()).toBe(1);
    await expect(
      page.getByRole("textbox", { name: "Your question" }).last()
    ).toHaveValue("");
  });

  test("shows an error with a retry button that re-sends the question", async ({ page }) => {
    // First request fails; the retry succeeds with the canned stream.
    let calls = 0;
    await page.route("**/api/ask", async (route) => {
      calls += 1;
      if (calls === 1) {
        await route.fulfill({
          status: 503,
          contentType: "application/json",
          body: JSON.stringify({ error: "The Ask feature is not configured." }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: "text/event-stream; charset=utf-8",
          body: SSE_RESPONSE,
        });
      }
    });

    await page.goto("/ask");

    const input = page.getByRole("textbox", { name: "Your question" });
    await input.fill("What is the harvest?");
    await input.press("Enter");

    await expect(page.getByText("The Ask feature is not configured.")).toBeVisible();

    // The question stays on screen and retry re-sends it without retyping.
    await expect(page.getByText("What is the harvest?")).toBeVisible();
    await page.getByTestId("ask-retry").click();

    await expect(page.getByText(/The harvest is a transition between densities/).first()).toBeVisible();
    expect(calls).toBe(2);
  });

  test("channeling source: switches copy, sends source, renders a Q'uo transcript link", async ({
    page,
  }) => {
    const channelingSSE = [
      'event: meta\ndata: {"concepts":["chan:meditation-and-silence"]}\n\n',
      'event: chunk\ndata: {"text":"Q’uo counsels consenting to silence "}\n\n',
      'event: chunk\ndata: {"text":"{{QCITE:2000-0220}}."}\n\n',
      'event: done\ndata: {}\n\n',
    ].join("");

    let sentSource: string | undefined;
    await page.route("**/api/ask", async (route) => {
      sentSource = (route.request().postDataJSON() as { source?: string })?.source;
      await route.fulfill({
        status: 200,
        contentType: "text/event-stream; charset=utf-8",
        body: channelingSSE,
      });
    });

    await page.goto("/ask");

    // Choosing the channeling library swaps the welcome copy.
    await page.getByRole("radio", { name: /Conscious channeling/ }).click();
    await expect(
      page.getByText(/Explore L\/L Research's conscious channeling in conversation/)
    ).toBeVisible();

    const input = page.getByRole("textbox", { name: "Your question" });
    await input.fill("How do I work with meditation and silence?");
    await input.press("Enter");

    // The request carried the channeling source.
    await expect.poll(() => sentSource).toBe("channeling");

    // The QCITE marker renders as a labeled transcript link (no locale prefix).
    const citation = page.getByRole("link", { name: "Q'uo · February 20, 2000" });
    await expect(citation).toBeVisible();
    await expect(citation).toHaveAttribute(
      "href",
      "https://www.llresearch.org/channeling/2000/0220"
    );
  });
});
