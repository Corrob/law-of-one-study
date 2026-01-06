/**
 * Rate limiter with Upstash Redis for production and in-memory fallback for local dev
 *
 * Uses Upstash Redis in production for distributed rate limiting across
 * serverless function instances. Falls back to in-memory Map for local development.
 */

import { Redis } from "@upstash/redis";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory fallback for local development (when Redis is not configured)
const localLimitMap = new Map<string, RateLimitEntry>();

// Check if Upstash Redis is configured
const isRedisConfigured = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
);

// Create Redis client only if configured
const redis = isRedisConfigured
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
}

/**
 * Check rate limit using in-memory Map (local development fallback)
 */
function checkRateLimitLocal(identifier: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const entry = localLimitMap.get(identifier);

  // No entry or expired - create new
  if (!entry || entry.resetAt < now) {
    const resetAt = now + config.windowMs;
    localLimitMap.set(identifier, { count: 1, resetAt });
    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - 1,
      resetAt,
    };
  }

  // Entry exists and not expired
  if (entry.count >= config.maxRequests) {
    return {
      success: false,
      limit: config.maxRequests,
      remaining: 0,
      resetAt: entry.resetAt,
    };
  }

  // Increment count
  entry.count++;
  localLimitMap.set(identifier, entry);

  return {
    success: true,
    limit: config.maxRequests,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * Check rate limit using Upstash Redis (production)
 */
async function checkRateLimitRedis(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  if (!redis) {
    return checkRateLimitLocal(identifier, config);
  }

  const key = `ratelimit:${identifier}`;
  const now = Date.now();

  try {
    const entry = await redis.get<RateLimitEntry>(key);

    // No entry or expired - create new
    if (!entry || entry.resetAt < now) {
      const resetAt = now + config.windowMs;
      const ttlSeconds = Math.ceil(config.windowMs / 1000);

      await redis.set(key, { count: 1, resetAt }, { ex: ttlSeconds });

      return {
        success: true,
        limit: config.maxRequests,
        remaining: config.maxRequests - 1,
        resetAt,
      };
    }

    // Entry exists and not expired
    if (entry.count >= config.maxRequests) {
      return {
        success: false,
        limit: config.maxRequests,
        remaining: 0,
        resetAt: entry.resetAt,
      };
    }

    // Increment count (keeping same TTL)
    const newCount = entry.count + 1;
    const remainingTtlSeconds = Math.ceil((entry.resetAt - now) / 1000);

    await redis.set(key, { count: newCount, resetAt: entry.resetAt }, { ex: remainingTtlSeconds });

    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - newCount,
      resetAt: entry.resetAt,
    };
  } catch (error) {
    // Log error but allow request through on Redis failure
    console.error("[RateLimit] Redis error, allowing request:", error);
    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - 1,
      resetAt: now + config.windowMs,
    };
  }
}

/**
 * Check if a request is within rate limits
 *
 * Uses Upstash Redis in production (when configured) for distributed rate limiting.
 * Falls back to in-memory Map for local development.
 *
 * @param identifier - Unique identifier (e.g., IP address)
 * @param config - Rate limit configuration
 * @returns Rate limit result with success status and headers info
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  if (isRedisConfigured) {
    return checkRateLimitRedis(identifier, config);
  }
  return checkRateLimitLocal(identifier, config);
}

/**
 * Get client IP from Next.js request
 * Handles X-Forwarded-For and X-Real-IP headers (Vercel, Cloudflare, etc.)
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");

  if (forwarded) {
    // X-Forwarded-For can contain multiple IPs, take the first
    return forwarded.split(",")[0].trim();
  }

  if (realIp) {
    return realIp;
  }

  // Fallback (shouldn't happen in production on Vercel)
  return "unknown";
}
