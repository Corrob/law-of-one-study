/**
 * Shared Upstash Redis client singleton for the Ask feature.
 *
 * Used for distributed rate limiting across serverless instances. Falls back
 * gracefully (null) when Redis is not configured, e.g. local development.
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
