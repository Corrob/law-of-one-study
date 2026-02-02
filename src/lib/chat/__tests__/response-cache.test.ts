import { appendEvent, getCachedResponse } from "../response-cache";

// Mock redis module - no Redis configured (uses in-memory fallback)
jest.mock("@/lib/redis", () => ({
  redis: null,
  isRedisConfigured: false,
}));

// Mock config
jest.mock("@/lib/config", () => ({
  STREAM_RECOVERY_CONFIG: {
    cacheTtlSeconds: 300,
    staleTimeoutMs: 5_000,
    forceFinalizeDelayMs: 3_000,
    responseIdStorageKey: "lo1-response-id",
  },
}));

describe("response-cache (in-memory fallback)", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should return null for non-existent response", async () => {
    const result = await getCachedResponse("nonexistent");
    expect(result).toBeNull();
  });

  it("should append events and retrieve them", async () => {
    const id = "test-response-1";

    await appendEvent(id, "chunk", { type: "text", content: "Hello" });
    await appendEvent(id, "chunk", { type: "text", content: " world" });

    const cached = await getCachedResponse(id);
    expect(cached).not.toBeNull();
    expect(cached!.events).toHaveLength(2);
    expect(cached!.events[0]).toEqual({ event: "chunk", data: { type: "text", content: "Hello" } });
    expect(cached!.events[1]).toEqual({ event: "chunk", data: { type: "text", content: " world" } });
    expect(cached!.complete).toBe(false);
  });

  it("should derive complete from done event", async () => {
    const id = "test-response-2";

    await appendEvent(id, "chunk", { type: "text", content: "Done" });
    await appendEvent(id, "done", {});

    const cached = await getCachedResponse(id);
    expect(cached).not.toBeNull();
    expect(cached!.complete).toBe(true);
  });

  it("should be incomplete when no done event exists", async () => {
    const id = "test-response-3";

    await appendEvent(id, "chunk", { type: "text", content: "In progress" });

    const cached = await getCachedResponse(id);
    expect(cached).not.toBeNull();
    expect(cached!.complete).toBe(false);
  });

  it("should store different event types including suggestions", async () => {
    const id = "test-response-4";

    await appendEvent(id, "meta", { quotes: [], intent: "explanation" });
    await appendEvent(id, "chunk", { type: "text", content: "Ra says" });
    await appendEvent(id, "chunk", {
      type: "quote",
      text: "I am Ra.",
      reference: "1.1",
      url: "https://example.com",
    });
    await appendEvent(id, "suggestions", { items: ["Tell me more"] });
    await appendEvent(id, "done", {});

    const cached = await getCachedResponse(id);
    expect(cached!.events).toHaveLength(5);
    expect(cached!.events[0].event).toBe("meta");
    expect(cached!.events[3].event).toBe("suggestions");
    expect(cached!.events[3].data).toEqual({ items: ["Tell me more"] });
    expect(cached!.complete).toBe(true);
  });
});
