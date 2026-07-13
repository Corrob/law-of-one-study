import { checkRateLimit, resetRateLimit } from "../rate-limit";

describe("checkRateLimit", () => {
  beforeEach(() => {
    resetRateLimit();
  });

  it("allows requests under the limit", () => {
    for (let i = 0; i < 5; i++) {
      expect(checkRateLimit("1.2.3.4", 1000 + i)).toBe(true);
    }
  });

  it("blocks the sixth request within the window", () => {
    for (let i = 0; i < 5; i++) {
      checkRateLimit("1.2.3.4", 1000 + i);
    }
    expect(checkRateLimit("1.2.3.4", 1010)).toBe(false);
  });

  it("tracks keys independently", () => {
    for (let i = 0; i < 5; i++) {
      checkRateLimit("1.2.3.4", 1000 + i);
    }
    expect(checkRateLimit("5.6.7.8", 1010)).toBe(true);
  });

  it("allows requests again after the window expires", () => {
    for (let i = 0; i < 5; i++) {
      checkRateLimit("1.2.3.4", 1000 + i);
    }
    expect(checkRateLimit("1.2.3.4", 1000 + 61_000)).toBe(true);
  });

  it("sweeps expired keys so the log does not grow unbounded", () => {
    for (let i = 0; i < 1_000; i++) {
      checkRateLimit(`ip-${i}`, 1000);
    }
    // Well past the window: the sweep runs and drops all 1,000 stale keys,
    // so a repeat visitor is treated as fresh rather than accumulating.
    expect(checkRateLimit("ip-0", 1000 + 61_000)).toBe(true);
    for (let i = 0; i < 4; i++) {
      expect(checkRateLimit("ip-0", 1001 + 61_000 + i)).toBe(true);
    }
  });
});
