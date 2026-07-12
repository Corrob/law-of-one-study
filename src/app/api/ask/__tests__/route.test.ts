/**
 * @jest-environment node
 *
 * Integration tests for POST /api/ask: response codes, SSE event assembly and
 * ordering, and the mid-stream error path. The OpenAI client, rate limiter and
 * analytics are mocked; prompt building and grounding run for real.
 */

import { createMockStreamFromText, DEFAULT_USAGE } from "@/test-utils/mock-stream";

const mockCreate = jest.fn();
jest.mock("@/lib/ask/openai", () => ({
  getOpenAIClient: () => ({ chat: { completions: { create: mockCreate } } }),
}));

const mockCheckRateLimit = jest.fn();
jest.mock("@/lib/ask/rate-limit", () => ({
  checkRateLimit: (...args: unknown[]) => mockCheckRateLimit(...args),
  getClientIp: () => "1.2.3.4",
}));

const mockTrackLLMGeneration = jest.fn();
const mockTrackEvent = jest.fn();
jest.mock("@/lib/ask/posthog-server", () => ({
  trackLLMGeneration: (...args: unknown[]) => mockTrackLLMGeneration(...args),
  trackEvent: (...args: unknown[]) => mockTrackEvent(...args),
  flushPostHog: () => Promise.resolve(),
}));

jest.mock("@/lib/ask/suggestions", () => ({
  generateSuggestions: () => Promise.resolve(["Follow-up one?", "Two?", "Three?"]),
}));

// Shrink the generation timeout so the timeout path is testable.
jest.mock("@/lib/ask/config", () => ({
  ...jest.requireActual("@/lib/ask/config"),
  ASK_TIMEOUT_MS: 50,
}));

import { POST } from "../route";

const RATE_LIMIT_OK = { success: true, limit: 12, remaining: 11, resetAt: Date.now() + 60_000 };

function askRequest(body: unknown): Request {
  return new Request("http://localhost/api/ask", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

/** Parse an SSE payload into ordered { event, data } pairs. */
function parseSSE(text: string): Array<{ event: string; data: Record<string, unknown> }> {
  return text
    .split("\n\n")
    .filter(Boolean)
    .map((block) => {
      const event = block.match(/^event: (\w+)$/m)?.[1] ?? "message";
      const data = JSON.parse(block.match(/^data: (.+)$/m)?.[1] ?? "{}");
      return { event, data };
    });
}

describe("POST /api/ask", () => {
  const originalKey = process.env.OPENAI_API_KEY;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.OPENAI_API_KEY = "test-key";
    mockCheckRateLimit.mockResolvedValue(RATE_LIMIT_OK);
  });

  afterAll(() => {
    process.env.OPENAI_API_KEY = originalKey;
  });

  it("returns 503 when the API key is not configured", async () => {
    delete process.env.OPENAI_API_KEY;
    const response = await POST(askRequest({ message: "What is harvest?" }));
    expect(response.status).toBe(503);
  });

  it("returns 429 with retryAfter body and Retry-After header when rate limited", async () => {
    mockCheckRateLimit.mockResolvedValue({
      success: false,
      limit: 12,
      remaining: 0,
      resetAt: Date.now() + 30_000,
    });

    const response = await POST(askRequest({ message: "What is harvest?" }));
    expect(response.status).toBe(429);

    const body = await response.json();
    expect(body.retryAfter).toBeGreaterThan(0);
    expect(Number(response.headers.get("Retry-After"))).toBe(body.retryAfter);
  });

  it("returns 400 on malformed JSON", async () => {
    const response = await POST(askRequest("{not json"));
    expect(response.status).toBe(400);
  });

  it("returns 400 on a schema-invalid body", async () => {
    const response = await POST(askRequest({ message: "" }));
    expect(response.status).toBe(400);
  });

  it("streams meta, chunks, suggestions and done in order", async () => {
    mockCreate.mockResolvedValue(
      createMockStreamFromText(
        ["The harvest is ", "a transition {{CITE:6.14}}."],
        DEFAULT_USAGE
      )
    );

    const response = await POST(askRequest({ message: "What is harvest?" }));
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("text/event-stream");

    const events = parseSSE(await response.text());
    expect(events.map((e) => e.event)).toEqual(["meta", "chunk", "chunk", "suggestions", "done"]);

    // Grounding ran for real: the harvest concept was matched and sent first.
    expect(events[0].data.concepts).toContain("harvest");
    const answer = events
      .filter((e) => e.event === "chunk")
      .map((e) => e.data.text)
      .join("");
    expect(answer).toBe("The harvest is a transition {{CITE:6.14}}.");
    expect(events.at(-2)?.data.items).toHaveLength(3);

    // Token usage from the final stream chunk reaches analytics.
    expect(mockTrackLLMGeneration).toHaveBeenCalledWith(
      expect.objectContaining({
        promptTokens: DEFAULT_USAGE?.prompt_tokens,
        completionTokens: DEFAULT_USAGE?.completion_tokens,
      })
    );
  });

  it("emits an SSE error event when the upstream call fails mid-stream", async () => {
    mockCreate.mockRejectedValue(new Error("upstream exploded"));

    const response = await POST(askRequest({ message: "What is harvest?" }));
    expect(response.status).toBe(200); // headers were already committed

    const events = parseSSE(await response.text());
    expect(events.map((e) => e.event)).toEqual(["meta", "error"]);
    expect(events[1].data.error).toMatch(/went wrong/i);
  });

  it("tracks a grounding miss when no concept matches the question", async () => {
    mockCreate.mockResolvedValue(createMockStreamFromText(["Could you say more?"]));

    await (await POST(askRequest({ message: "asdfghjkl" }))).text();
    expect(mockTrackEvent).toHaveBeenCalledWith(
      expect.any(String),
      "ask_no_focused_grounding",
      expect.objectContaining({ locale: "en", has_history: false })
    );

    // A grounded question does not fire the event.
    mockTrackEvent.mockClear();
    mockCreate.mockResolvedValue(createMockStreamFromText(["The harvest…"]));
    await (await POST(askRequest({ message: "What is harvest?" }))).text();
    expect(mockTrackEvent).not.toHaveBeenCalledWith(
      expect.any(String),
      "ask_no_focused_grounding",
      expect.anything()
    );
  });

  it("tells the still-connected client when generation times out", async () => {
    // Upstream never responds; it only honors the abort signal.
    mockCreate.mockImplementation(
      (_params: unknown, { signal }: { signal: AbortSignal }) =>
        new Promise((_resolve, reject) => {
          signal.addEventListener("abort", () => reject(signal.reason));
        })
    );
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    const response = await POST(askRequest({ message: "What is harvest?" }));
    const events = parseSSE(await response.text());

    expect(events.map((e) => e.event)).toEqual(["meta", "error"]);
    expect(events[1].data.error).toMatch(/took too long/i);
    consoleSpy.mockRestore();
  });

  it("passes an abort signal through to the OpenAI call", async () => {
    mockCreate.mockResolvedValue(createMockStreamFromText(["ok"]));
    await (await POST(askRequest({ message: "What is harvest?" }))).text();

    const options = mockCreate.mock.calls[0][1] as { signal?: AbortSignal };
    expect(options.signal).toBeInstanceOf(AbortSignal);
  });
});
