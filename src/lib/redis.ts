/**
 * Shared Upstash Redis client singleton.
 *
 * Used by rate limiting and response caching. Falls back gracefully
 * when Redis is not configured (local development).
 */

import { Redis } from "@upstash/redis";

export const isRedisConfigured = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
);

export const redis = isRedisConfigured
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;
