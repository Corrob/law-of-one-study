/**
 * Redis-backed branch of the rate limiter (rate-limit.test.ts covers the
 * in-memory fallback). The Upstash client is replaced with an in-test fake.
 */

const store = new Map<string, unknown>();
const mockGet = jest.fn(async (key: string) => store.get(key) ?? null);
const mockSet = jest.fn(async (key: string, value: unknown) => {
  store.set(key, value);
  return "OK";
});

// Lazy indirection: jest.mock factories are hoisted above the const mocks.
jest.mock("../redis", () => ({
  isRedisConfigured: true,
  redis: {
    get: (key: string) => mockGet(key),
    set: (key: string, value: unknown, opts: unknown) => mockSet(key, value, opts),
  },
}));

import { checkRateLimit } from "../rate-limit";

describe("checkRateLimit (Redis branch)", () => {
  beforeEach(() => {
    store.clear();
    jest.clearAllMocks();
  });

  it("counts requests across the shared store and blocks over the limit", async () => {
    const id = "redis-test";
    const config = { maxRequests: 2, windowMs: 60_000 };

    const r1 = await checkRateLimit(id, config);
    expect(r1).toMatchObject({ success: true, remaining: 1 });

    const r2 = await checkRateLimit(id, config);
    expect(r2).toMatchObject({ success: true, remaining: 0 });

    const r3 = await checkRateLimit(id, config);
    expect(r3).toMatchObject({ success: false, remaining: 0 });
    expect(r3.resetAt).toBe(r2.resetAt);

    // Keys are namespaced and written with a TTL.
    expect(mockSet).toHaveBeenCalledWith(
      "ratelimit:redis-test",
      expect.objectContaining({ count: 1 }),
      { ex: 60 }
    );
  });

  it("starts a fresh window after the stored one expires", async () => {
    const id = "redis-expiry";
    const config = { maxRequests: 1, windowMs: 60_000 };
    store.set("ratelimit:redis-expiry", { count: 5, resetAt: Date.now() - 1000 });

    const result = await checkRateLimit(id, config);
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(0);
  });

  it("falls back to the in-memory limiter when Redis errors (never fails open)", async () => {
    mockGet.mockRejectedValueOnce(new Error("redis down"));
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    const config = { maxRequests: 1, windowMs: 60_000 };
    const r1 = await checkRateLimit("redis-outage", config);
    expect(r1.success).toBe(true);

    // Second call also errors — the in-memory fallback still enforces the limit.
    mockGet.mockRejectedValueOnce(new Error("redis down"));
    const r2 = await checkRateLimit("redis-outage", config);
    expect(r2.success).toBe(false);

    consoleSpy.mockRestore();
  });
});
