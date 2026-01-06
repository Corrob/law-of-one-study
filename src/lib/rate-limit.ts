/**
 * Simple in-memory rate limiter for API routes
 * For production scale, consider Vercel KV or Upstash Redis
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// Store rate limit data per IP
const limitMap = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
// Using .unref() so this timer doesn't prevent Node.js from exiting (e.g., in tests)
const cleanupInterval = setInterval(
  () => {
    const now = Date.now();
    for (const [key, value] of limitMap.entries()) {
      if (value.resetAt < now) {
        limitMap.delete(key);
      }
    }
  },
  5 * 60 * 1000
);
cleanupInterval.unref();

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
 * Check if a request is within rate limits
 * @param identifier - Unique identifier (e.g., IP address)
 * @param config - Rate limit configuration
 * @returns Rate limit result with success status and headers info
 */
export function checkRateLimit(identifier: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const entry = limitMap.get(identifier);

  // No entry or expired - create new
  if (!entry || entry.resetAt < now) {
    const resetAt = now + config.windowMs;
    limitMap.set(identifier, {
      count: 1,
      resetAt,
    });
    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - 1,
      resetAt,
    };
  }

  // Entry exists and not expired
  if (entry.count >= config.maxRequests) {
    // Rate limit exceeded
    return {
      success: false,
      limit: config.maxRequests,
      remaining: 0,
      resetAt: entry.resetAt,
    };
  }

  // Increment count
  entry.count++;
  limitMap.set(identifier, entry);

  return {
    success: true,
    limit: config.maxRequests,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.resetAt,
  };
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
