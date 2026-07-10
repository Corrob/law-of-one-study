import { checkRateLimit, getClientIp } from "../rate-limit";

describe("rate-limit", () => {
  describe("checkRateLimit", () => {
    it("allows requests up to the limit, then blocks", () => {
      const id = `test-${Math.random()}`;
      const config = { maxRequests: 3, windowMs: 60_000 };

      const r1 = checkRateLimit(id, config);
      expect(r1.success).toBe(true);
      expect(r1.remaining).toBe(2);

      checkRateLimit(id, config); // 2nd
      const r3 = checkRateLimit(id, config); // 3rd
      expect(r3.success).toBe(true);
      expect(r3.remaining).toBe(0);

      const r4 = checkRateLimit(id, config); // 4th — over
      expect(r4.success).toBe(false);
      expect(r4.remaining).toBe(0);
    });

    it("resets after the window elapses", () => {
      const id = `test-${Math.random()}`;
      const past = { maxRequests: 1, windowMs: -1 }; // already expired window
      expect(checkRateLimit(id, past).success).toBe(true);
      // Window is in the past, so the next call starts fresh and succeeds.
      expect(checkRateLimit(id, past).success).toBe(true);
    });
  });

  describe("getClientIp", () => {
    // Minimal Request-like stub (jsdom's Request is unreliable in tests).
    const fakeRequest = (headers: Record<string, string>): Request =>
      ({
        headers: {
          get: (key: string) => headers[key.toLowerCase()] ?? null,
        },
      }) as unknown as Request;

    it("reads the first IP from x-forwarded-for", () => {
      expect(getClientIp(fakeRequest({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" }))).toBe("1.2.3.4");
    });

    it("falls back to x-real-ip then unknown", () => {
      expect(getClientIp(fakeRequest({ "x-real-ip": "9.9.9.9" }))).toBe("9.9.9.9");
      expect(getClientIp(fakeRequest({}))).toBe("unknown");
    });
  });
});
