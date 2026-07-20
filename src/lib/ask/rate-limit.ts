/**
 * Rate limiter for the Ask endpoint.
 *
 * Uses Upstash Redis in production for distributed limiting across serverless
 * instances (each Vercel instance otherwise keeps its own counters, so an
 * in-memory-only limit is easily bypassed under scale-out). Falls back to an
 * in-memory Map for local development when Redis is not configured.
 */

import { redis, isRedisConfigured } from "./redis";

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

interface Entry {
  count: number;
  resetAt: number;
}

// In-memory fallback for local development (Redis not configured).
const localBuckets = new Map<string, Entry>();

function checkLocal(identifier: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const entry = localBuckets.get(identifier);

  if (!entry || entry.resetAt < now) {
    const resetAt = now + config.windowMs;
    localBuckets.set(identifier, { count: 1, resetAt });
    return { success: true, limit: config.maxRequests, remaining: config.maxRequests - 1, resetAt };
  }

  if (entry.count >= config.maxRequests) {
    return { success: false, limit: config.maxRequests, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count += 1;
  return {
    success: true,
    limit: config.maxRequests,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.resetAt,
  };
}

async function checkRedis(identifier: string, config: RateLimitConfig): Promise<RateLimitResult> {
  if (!redis) return checkLocal(identifier, config);

  const key = `ratelimit:${identifier}`;
  const now = Date.now();

  try {
    const entry = await redis.get<Entry>(key);

    if (!entry || entry.resetAt < now) {
      const resetAt = now + config.windowMs;
      const ttl = Math.ceil(config.windowMs / 1000);
      await redis.set(key, { count: 1, resetAt }, { ex: ttl });
      return { success: true, limit: config.maxRequests, remaining: config.maxRequests - 1, resetAt };
    }

    if (entry.count >= config.maxRequests) {
      return { success: false, limit: config.maxRequests, remaining: 0, resetAt: entry.resetAt };
    }

    const newCount = entry.count + 1;
    const remainingTtl = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
    await redis.set(key, { count: newCount, resetAt: entry.resetAt }, { ex: remainingTtl });
    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - newCount,
      resetAt: entry.resetAt,
    };
  } catch (error) {
    // On a Redis error, fall back to the in-memory limiter rather than
    // allowing unconditionally — still best-effort limiting during an outage.
    console.error("[api/ask] rate-limit Redis error, using in-memory fallback:", error);
    return checkLocal(identifier, config);
  }
}

/**
 * Record a request from `identifier` and report whether it is within limits.
 * Distributed via Redis when configured, in-memory otherwise.
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  return isRedisConfigured ? checkRedis(identifier, config) : checkLocal(identifier, config);
}

/**
 * Best-effort client IP from proxy headers (Vercel/Cloudflare set these).
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}
