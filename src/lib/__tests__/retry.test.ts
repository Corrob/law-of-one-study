import {
  withRetry,
  withCircuitBreaker,
  isRetryableError,
  calculateDelay,
  RetryExhaustedError,
  DEFAULT_RETRY_CONFIG,
  resetCircuitBreaker,
  resetAllCircuitBreakers,
} from "../retry";

// Mock the debug module
jest.mock("@/lib/debug", () => ({
  debug: {
    log: jest.fn(),
  },
}));

describe("retry", () => {
  describe("isRetryableError", () => {
    it("should identify 429 status as retryable", () => {
      expect(isRetryableError({ status: 429 })).toBe(true);
    });

    it("should identify 5xx status as retryable", () => {
      expect(isRetryableError({ status: 500 })).toBe(true);
      expect(isRetryableError({ status: 502 })).toBe(true);
      expect(isRetryableError({ status: 503 })).toBe(true);
      expect(isRetryableError({ status: 599 })).toBe(true);
    });

    it("should not retry 4xx errors (except 429)", () => {
      expect(isRetryableError({ status: 400 })).toBe(false);
      expect(isRetryableError({ status: 401 })).toBe(false);
      expect(isRetryableError({ status: 403 })).toBe(false);
      expect(isRetryableError({ status: 404 })).toBe(false);
      expect(isRetryableError({ status: 422 })).toBe(false);
    });

    it("should identify rate limit error messages", () => {
      expect(isRetryableError(new Error("Rate limit exceeded"))).toBe(true);
      expect(isRetryableError(new Error("429 Too Many Requests"))).toBe(true);
      expect(isRetryableError(new Error("rate limit hit"))).toBe(true);
    });

    it("should identify timeout errors", () => {
      expect(isRetryableError(new Error("Request timed out"))).toBe(true);
      expect(isRetryableError(new Error("Operation timeout"))).toBe(true);
    });

    it("should identify server error messages", () => {
      expect(isRetryableError(new Error("Internal server error"))).toBe(true);
      expect(isRetryableError(new Error("500 Internal Server Error"))).toBe(
        true
      );
    });

    it("should identify connection errors", () => {
      expect(isRetryableError(new Error("ECONNRESET"))).toBe(true);
      expect(isRetryableError(new Error("socket hang up"))).toBe(true);
    });

    it("should identify fetch network errors", () => {
      const fetchError = new TypeError("Failed to fetch");
      expect(isRetryableError(fetchError)).toBe(true);
    });

    it("should not retry generic errors", () => {
      expect(isRetryableError(new Error("Something went wrong"))).toBe(false);
      expect(isRetryableError(new Error("Invalid input"))).toBe(false);
    });

    it("should not retry null or undefined", () => {
      expect(isRetryableError(null)).toBe(false);
      expect(isRetryableError(undefined)).toBe(false);
    });
  });

  describe("calculateDelay", () => {
    const configNoJitter = { ...DEFAULT_RETRY_CONFIG, jitter: 0 };

    it("should calculate exponential backoff", () => {
      expect(calculateDelay(0, configNoJitter)).toBe(1000); // 1000 * 2^0
      expect(calculateDelay(1, configNoJitter)).toBe(2000); // 1000 * 2^1
      expect(calculateDelay(2, configNoJitter)).toBe(4000); // 1000 * 2^2
      expect(calculateDelay(3, configNoJitter)).toBe(8000); // 1000 * 2^3
      expect(calculateDelay(4, configNoJitter)).toBe(16000); // 1000 * 2^4
    });

    it("should cap at maxDelayMs", () => {
      expect(calculateDelay(10, configNoJitter)).toBe(30000); // Would be 1024000, capped at 30000
      expect(calculateDelay(20, configNoJitter)).toBe(30000);
    });

    it("should add jitter within expected range", () => {
      const configWithJitter = { ...DEFAULT_RETRY_CONFIG, jitter: 0.5 };
      const delays: number[] = [];

      // Run multiple times to get range
      for (let i = 0; i < 100; i++) {
        delays.push(calculateDelay(0, configWithJitter));
      }

      const min = Math.min(...delays);
      const max = Math.max(...delays);

      // With 50% jitter on 1000ms, range should be 500-1500
      expect(min).toBeGreaterThanOrEqual(500);
      expect(max).toBeLessThanOrEqual(1500);
      // Should have some variation
      expect(max - min).toBeGreaterThan(100);
    });

    it("should handle custom backoff multiplier", () => {
      const config = { ...configNoJitter, backoffMultiplier: 3 };
      expect(calculateDelay(0, config)).toBe(1000); // 1000 * 3^0
      expect(calculateDelay(1, config)).toBe(3000); // 1000 * 3^1
      expect(calculateDelay(2, config)).toBe(9000); // 1000 * 3^2
    });

    it("should handle custom initial delay", () => {
      const config = { ...configNoJitter, initialDelayMs: 500 };
      expect(calculateDelay(0, config)).toBe(500);
      expect(calculateDelay(1, config)).toBe(1000);
      expect(calculateDelay(2, config)).toBe(2000);
    });
  });

  describe("withRetry", () => {
    it("should return result on first success", async () => {
      const fn = jest.fn().mockResolvedValue("success");
      const result = await withRetry(fn);

      expect(result).toBe("success");
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("should retry on retryable error and succeed", async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce({ status: 500 })
        .mockRejectedValueOnce({ status: 503 })
        .mockResolvedValue("success");

      const result = await withRetry(fn, { initialDelayMs: 1 });

      expect(result).toBe("success");
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it("should throw immediately on non-retryable error", async () => {
      const error = { status: 400, message: "Bad Request" };
      const fn = jest.fn().mockRejectedValue(error);

      await expect(withRetry(fn)).rejects.toEqual(error);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("should throw RetryExhaustedError after max retries", async () => {
      const fn = jest.fn().mockRejectedValue({ status: 500 });

      await expect(
        withRetry(fn, { maxRetries: 2, initialDelayMs: 1 })
      ).rejects.toThrow(RetryExhaustedError);

      expect(fn).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it("should include attempt count in RetryExhaustedError", async () => {
      const fn = jest.fn().mockRejectedValue({ status: 500 });

      try {
        await withRetry(fn, { maxRetries: 2, initialDelayMs: 1 });
        fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(RetryExhaustedError);
        expect((error as RetryExhaustedError).attempts).toBe(3);
      }
    });

    it("should preserve original error in RetryExhaustedError", async () => {
      const originalError = new Error("Server Error");
      originalError.message = "500 Internal Server Error";
      const fn = jest.fn().mockRejectedValue(originalError);

      try {
        await withRetry(fn, { maxRetries: 1, initialDelayMs: 1 });
        fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(RetryExhaustedError);
        expect((error as RetryExhaustedError).lastError).toBe(originalError);
      }
    });

    it("should wait between retries", async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce({ status: 500 })
        .mockResolvedValue("success");

      const start = Date.now();
      await withRetry(fn, { initialDelayMs: 50, maxRetries: 1 });
      const duration = Date.now() - start;

      // Should have waited at least 40ms (accounting for timing variance)
      expect(duration).toBeGreaterThanOrEqual(40);
    });

    it("should handle maxRetries of 0", async () => {
      const fn = jest.fn().mockRejectedValue({ status: 500 });

      await expect(
        withRetry(fn, { maxRetries: 0, initialDelayMs: 1 })
      ).rejects.toThrow(RetryExhaustedError);

      expect(fn).toHaveBeenCalledTimes(1); // Only initial attempt
    });

    it("should use default config when none provided", async () => {
      const fn = jest.fn().mockResolvedValue("success");
      await withRetry(fn);

      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe("withCircuitBreaker", () => {
    beforeEach(() => {
      resetAllCircuitBreakers();
    });

    it("should allow calls when circuit is closed", async () => {
      const fn = jest.fn().mockResolvedValue("success");
      const result = await withCircuitBreaker("test-closed", fn);

      expect(result).toBe("success");
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("should open circuit after threshold failures", async () => {
      const fn = jest.fn().mockRejectedValue(new Error("fail"));

      // Fail 5 times to open circuit (default threshold)
      for (let i = 0; i < 5; i++) {
        await expect(
          withCircuitBreaker("test-open", fn, { failureThreshold: 5 })
        ).rejects.toThrow("fail");
      }

      // Next call should fail immediately with circuit breaker error
      await expect(withCircuitBreaker("test-open", fn)).rejects.toThrow(
        /Circuit breaker open/
      );

      // Function should not have been called on the 6th attempt
      expect(fn).toHaveBeenCalledTimes(5);
    });

    it("should reset circuit on success", async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new Error("fail"))
        .mockRejectedValueOnce(new Error("fail"))
        .mockResolvedValue("success");

      // Two failures
      await expect(
        withCircuitBreaker("test-reset", fn, { failureThreshold: 5 })
      ).rejects.toThrow();
      await expect(
        withCircuitBreaker("test-reset", fn, { failureThreshold: 5 })
      ).rejects.toThrow();

      // Success resets the counter
      const result = await withCircuitBreaker("test-reset", fn, {
        failureThreshold: 5,
      });
      expect(result).toBe("success");

      // Now we need 5 more failures to open circuit
      for (let i = 0; i < 4; i++) {
        fn.mockRejectedValueOnce(new Error("fail"));
        await expect(
          withCircuitBreaker("test-reset", fn, { failureThreshold: 5 })
        ).rejects.toThrow("fail");
      }

      // Circuit should still be closed
      fn.mockResolvedValueOnce("still working");
      const result2 = await withCircuitBreaker("test-reset", fn, {
        failureThreshold: 5,
      });
      expect(result2).toBe("still working");
    });

    it("should track circuits independently by key", async () => {
      const fn = jest.fn().mockRejectedValue(new Error("fail"));

      // Open circuit for key1
      for (let i = 0; i < 5; i++) {
        await expect(
          withCircuitBreaker("key1", fn, { failureThreshold: 5 })
        ).rejects.toThrow("fail");
      }

      // key1 should be open
      await expect(withCircuitBreaker("key1", fn)).rejects.toThrow(
        /Circuit breaker open/
      );

      // key2 should still work
      fn.mockResolvedValueOnce("success");
      const result = await withCircuitBreaker("key2", fn);
      expect(result).toBe("success");
    });

    it("should attempt to close circuit after reset time", async () => {
      jest.useFakeTimers();
      const fn = jest.fn().mockRejectedValue(new Error("fail"));

      // Open circuit
      for (let i = 0; i < 5; i++) {
        await expect(
          withCircuitBreaker("test-time", fn, {
            failureThreshold: 5,
            resetTimeMs: 1000,
          })
        ).rejects.toThrow("fail");
      }

      // Circuit should be open
      await expect(
        withCircuitBreaker("test-time", fn, { resetTimeMs: 1000 })
      ).rejects.toThrow(/Circuit breaker open/);

      // Advance time past reset
      jest.advanceTimersByTime(1001);

      // Should attempt to call function again (half-open state)
      fn.mockResolvedValueOnce("recovered");
      const result = await withCircuitBreaker("test-time", fn, {
        resetTimeMs: 1000,
      });
      expect(result).toBe("recovered");

      jest.useRealTimers();
    });

    it("should include remaining time in error message", async () => {
      jest.useFakeTimers();
      const fn = jest.fn().mockRejectedValue(new Error("fail"));

      // Open circuit
      for (let i = 0; i < 5; i++) {
        await expect(
          withCircuitBreaker("test-msg", fn, {
            failureThreshold: 5,
            resetTimeMs: 60000,
          })
        ).rejects.toThrow("fail");
      }

      // Advance time by 30 seconds
      jest.advanceTimersByTime(30000);

      // Error should mention ~30 seconds remaining
      await expect(
        withCircuitBreaker("test-msg", fn, { resetTimeMs: 60000 })
      ).rejects.toThrow(/Try again in 30s/);

      jest.useRealTimers();
    });
  });

  describe("resetCircuitBreaker", () => {
    beforeEach(() => {
      resetAllCircuitBreakers();
    });

    it("should reset a specific circuit breaker", async () => {
      const fn = jest.fn().mockRejectedValue(new Error("fail"));

      // Open circuit
      for (let i = 0; i < 5; i++) {
        await expect(
          withCircuitBreaker("test-specific-reset", fn, { failureThreshold: 5 })
        ).rejects.toThrow("fail");
      }

      // Circuit should be open
      await expect(
        withCircuitBreaker("test-specific-reset", fn)
      ).rejects.toThrow(/Circuit breaker open/);

      // Reset it
      resetCircuitBreaker("test-specific-reset");

      // Should work again
      fn.mockResolvedValueOnce("success");
      const result = await withCircuitBreaker("test-specific-reset", fn);
      expect(result).toBe("success");
    });
  });
});
