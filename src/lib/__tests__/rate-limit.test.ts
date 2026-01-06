/**
 * @jest-environment node
 */

// Mock @upstash/redis before importing rate-limit
jest.mock("@upstash/redis", () => ({
  Redis: jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    set: jest.fn(),
  })),
}));

import { checkRateLimit, getClientIp } from "../rate-limit";

describe("rate-limit", () => {
  // Mock Date.now() for consistent testing
  const mockNow = 1000000;
  let dateNowSpy: jest.SpyInstance;

  beforeEach(() => {
    // Reset Date.now mock
    dateNowSpy = jest.spyOn(Date, "now").mockReturnValue(mockNow);
  });

  afterEach(() => {
    dateNowSpy.mockRestore();
  });

  describe("checkRateLimit (local fallback mode)", () => {
    // Tests run without KV_REST_API_URL set, so they use the local fallback
    const config = {
      maxRequests: 3,
      windowMs: 60000, // 1 minute
    };

    it("should allow first request", async () => {
      const result = await checkRateLimit("test-ip", config);

      expect(result.success).toBe(true);
      expect(result.limit).toBe(3);
      expect(result.remaining).toBe(2);
      expect(result.resetAt).toBe(mockNow + config.windowMs);
    });

    it("should allow multiple requests within limit", async () => {
      const ip = "test-ip-2";

      const result1 = await checkRateLimit(ip, config);
      expect(result1.success).toBe(true);
      expect(result1.remaining).toBe(2);

      const result2 = await checkRateLimit(ip, config);
      expect(result2.success).toBe(true);
      expect(result2.remaining).toBe(1);

      const result3 = await checkRateLimit(ip, config);
      expect(result3.success).toBe(true);
      expect(result3.remaining).toBe(0);
    });

    it("should block requests exceeding limit", async () => {
      const ip = "test-ip-3";

      // Use up the limit
      await checkRateLimit(ip, config);
      await checkRateLimit(ip, config);
      await checkRateLimit(ip, config);

      // This one should fail
      const result = await checkRateLimit(ip, config);
      expect(result.success).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.resetAt).toBe(mockNow + config.windowMs);
    });

    it("should track different IPs independently", async () => {
      const config = { maxRequests: 2, windowMs: 60000 };

      const result1 = await checkRateLimit("ip-1", config);
      const result2 = await checkRateLimit("ip-2", config);

      expect(result1.success).toBe(true);
      expect(result1.remaining).toBe(1);
      expect(result2.success).toBe(true);
      expect(result2.remaining).toBe(1);
    });

    it("should reset limit after window expires", async () => {
      const ip = "test-ip-4";
      const config = { maxRequests: 2, windowMs: 60000 };

      // Use up the limit
      await checkRateLimit(ip, config);
      await checkRateLimit(ip, config);

      // This should fail
      let result = await checkRateLimit(ip, config);
      expect(result.success).toBe(false);

      // Advance time past the window
      dateNowSpy.mockReturnValue(mockNow + config.windowMs + 1000);

      // Should work again
      result = await checkRateLimit(ip, config);
      expect(result.success).toBe(true);
      expect(result.remaining).toBe(1);
    });

    it("should use correct reset time for all requests in same window", async () => {
      const ip = "test-ip-5";
      const config = { maxRequests: 3, windowMs: 60000 };

      const result1 = await checkRateLimit(ip, config);
      const expectedResetAt = mockNow + config.windowMs;

      // Advance time within window
      dateNowSpy.mockReturnValue(mockNow + 10000);

      const result2 = await checkRateLimit(ip, config);

      // Both should have the same reset time (from first request)
      expect(result1.resetAt).toBe(expectedResetAt);
      expect(result2.resetAt).toBe(expectedResetAt);
    });

    it("should handle zero max requests", async () => {
      const config = { maxRequests: 0, windowMs: 60000 };
      const result = await checkRateLimit("test-ip-6", config);

      expect(result.success).toBe(true);
      expect(result.remaining).toBe(-1);
    });

    it("should handle very short time windows", async () => {
      const config = { maxRequests: 1, windowMs: 1 };
      const ip = "test-ip-7";

      const result1 = await checkRateLimit(ip, config);
      expect(result1.success).toBe(true);

      // Advance time past window
      dateNowSpy.mockReturnValue(mockNow + 2);

      const result2 = await checkRateLimit(ip, config);
      expect(result2.success).toBe(true);
    });

    it("should return consistent results when checking limit multiple times without incrementing", async () => {
      const ip = "test-ip-8";
      const config = { maxRequests: 1, windowMs: 60000 };

      await checkRateLimit(ip, config); // Use the one allowed request

      const result1 = await checkRateLimit(ip, config);
      const result2 = await checkRateLimit(ip, config);

      expect(result1.success).toBe(false);
      expect(result2.success).toBe(false);
      expect(result1.resetAt).toBe(result2.resetAt);
    });
  });

  describe("getClientIp", () => {
    it("should extract IP from X-Forwarded-For header", () => {
      const request = new Request("http://test.com", {
        headers: {
          "x-forwarded-for": "192.168.1.1",
        },
      });

      const ip = getClientIp(request);
      expect(ip).toBe("192.168.1.1");
    });

    it("should take first IP from X-Forwarded-For with multiple IPs", () => {
      const request = new Request("http://test.com", {
        headers: {
          "x-forwarded-for": "192.168.1.1, 10.0.0.1, 172.16.0.1",
        },
      });

      const ip = getClientIp(request);
      expect(ip).toBe("192.168.1.1");
    });

    it("should trim whitespace from X-Forwarded-For IP", () => {
      const request = new Request("http://test.com", {
        headers: {
          "x-forwarded-for": "  192.168.1.1  ",
        },
      });

      const ip = getClientIp(request);
      expect(ip).toBe("192.168.1.1");
    });

    it("should extract IP from X-Real-IP header when X-Forwarded-For is not present", () => {
      const request = new Request("http://test.com", {
        headers: {
          "x-real-ip": "10.0.0.5",
        },
      });

      const ip = getClientIp(request);
      expect(ip).toBe("10.0.0.5");
    });

    it("should prefer X-Forwarded-For over X-Real-IP", () => {
      const request = new Request("http://test.com", {
        headers: {
          "x-forwarded-for": "192.168.1.1",
          "x-real-ip": "10.0.0.5",
        },
      });

      const ip = getClientIp(request);
      expect(ip).toBe("192.168.1.1");
    });

    it('should return "unknown" when no IP headers are present', () => {
      const request = new Request("http://test.com");

      const ip = getClientIp(request);
      expect(ip).toBe("unknown");
    });

    it("should handle IPv6 addresses", () => {
      const request = new Request("http://test.com", {
        headers: {
          "x-forwarded-for": "2001:0db8:85a3:0000:0000:8a2e:0370:7334",
        },
      });

      const ip = getClientIp(request);
      expect(ip).toBe("2001:0db8:85a3:0000:0000:8a2e:0370:7334");
    });

    it("should handle mixed IPv4 and IPv6 in X-Forwarded-For", () => {
      const request = new Request("http://test.com", {
        headers: {
          "x-forwarded-for": "2001:0db8::1, 192.168.1.1",
        },
      });

      const ip = getClientIp(request);
      expect(ip).toBe("2001:0db8::1");
    });
  });

  describe("checkRateLimit (Redis mode)", () => {
    const mockNow = 1000000;
    const config = { maxRequests: 10, windowMs: 60000 };
    let dateNowSpy: jest.SpyInstance;
    let mockGet: jest.Mock;
    let mockSet: jest.Mock;

    beforeEach(() => {
      dateNowSpy = jest.spyOn(Date, "now").mockReturnValue(mockNow);
      // Reset mocks
      mockGet = jest.fn();
      mockSet = jest.fn();
    });

    afterEach(() => {
      dateNowSpy.mockRestore();
      jest.resetModules();
    });

    const setupRedisTest = async () => {
      // Set env vars before importing module
      process.env.UPSTASH_REDIS_REST_URL = "https://test.upstash.io";
      process.env.UPSTASH_REDIS_REST_TOKEN = "test-token";

      // Reset modules so rate-limit re-evaluates isRedisConfigured
      jest.resetModules();

      // Re-mock with our controlled mock functions
      jest.doMock("@upstash/redis", () => ({
        Redis: jest.fn().mockImplementation(() => ({
          get: mockGet,
          set: mockSet,
        })),
      }));

      // Import fresh module
      const rateLimitModule = await import("../rate-limit");
      return rateLimitModule;
    };

    const cleanupRedisTest = () => {
      delete process.env.UPSTASH_REDIS_REST_URL;
      delete process.env.UPSTASH_REDIS_REST_TOKEN;
      jest.resetModules();
    };

    it("should create new entry when none exists in Redis", async () => {
      const { checkRateLimit: checkRateLimitRedis } = await setupRedisTest();

      mockGet.mockResolvedValueOnce(null);
      mockSet.mockResolvedValueOnce("OK");

      const result = await checkRateLimitRedis("redis-ip-1", config);

      expect(result.success).toBe(true);
      expect(result.remaining).toBe(9);
      expect(result.resetAt).toBe(mockNow + config.windowMs);
      expect(mockGet).toHaveBeenCalledWith("ratelimit:redis-ip-1");
      expect(mockSet).toHaveBeenCalledWith(
        "ratelimit:redis-ip-1",
        { count: 1, resetAt: mockNow + config.windowMs },
        { ex: 60 }
      );

      cleanupRedisTest();
    });

    it("should increment existing entry in Redis", async () => {
      const { checkRateLimit: checkRateLimitRedis } = await setupRedisTest();

      const existingEntry = { count: 5, resetAt: mockNow + 30000 };
      mockGet.mockResolvedValueOnce(existingEntry);
      mockSet.mockResolvedValueOnce("OK");

      const result = await checkRateLimitRedis("redis-ip-2", config);

      expect(result.success).toBe(true);
      expect(result.remaining).toBe(4); // 10 - 6
      expect(mockSet).toHaveBeenCalledWith(
        "ratelimit:redis-ip-2",
        { count: 6, resetAt: existingEntry.resetAt },
        { ex: 30 } // remaining TTL
      );

      cleanupRedisTest();
    });

    it("should block when Redis limit exceeded", async () => {
      const { checkRateLimit: checkRateLimitRedis } = await setupRedisTest();

      const existingEntry = { count: 10, resetAt: mockNow + 30000 };
      mockGet.mockResolvedValueOnce(existingEntry);

      const result = await checkRateLimitRedis("redis-ip-3", config);

      expect(result.success).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.resetAt).toBe(existingEntry.resetAt);
      expect(mockSet).not.toHaveBeenCalled(); // Should not update when blocked

      cleanupRedisTest();
    });

    it("should reset expired entry in Redis", async () => {
      const { checkRateLimit: checkRateLimitRedis } = await setupRedisTest();

      // Expired entry (resetAt in the past)
      const expiredEntry = { count: 10, resetAt: mockNow - 1000 };
      mockGet.mockResolvedValueOnce(expiredEntry);
      mockSet.mockResolvedValueOnce("OK");

      const result = await checkRateLimitRedis("redis-ip-4", config);

      expect(result.success).toBe(true);
      expect(result.remaining).toBe(9); // Fresh window
      expect(mockSet).toHaveBeenCalledWith(
        "ratelimit:redis-ip-4",
        { count: 1, resetAt: mockNow + config.windowMs },
        { ex: 60 }
      );

      cleanupRedisTest();
    });

    it("should allow request on Redis error (fail-open)", async () => {
      const { checkRateLimit: checkRateLimitRedis } = await setupRedisTest();

      mockGet.mockRejectedValueOnce(new Error("Redis connection failed"));

      const result = await checkRateLimitRedis("redis-ip-5", config);

      expect(result.success).toBe(true); // Fail-open behavior
      expect(result.remaining).toBe(9);

      cleanupRedisTest();
    });

    it("should calculate correct remaining count near limit", async () => {
      const { checkRateLimit: checkRateLimitRedis } = await setupRedisTest();

      const existingEntry = { count: 9, resetAt: mockNow + 30000 };
      mockGet.mockResolvedValueOnce(existingEntry);
      mockSet.mockResolvedValueOnce("OK");

      const result = await checkRateLimitRedis("redis-ip-6", config);

      expect(result.success).toBe(true);
      expect(result.remaining).toBe(0); // 10 - 10
      expect(mockSet).toHaveBeenCalledWith(
        "ratelimit:redis-ip-6",
        { count: 10, resetAt: existingEntry.resetAt },
        { ex: 30 }
      );

      cleanupRedisTest();
    });
  });
});
