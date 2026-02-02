/**
 * Response cache for SSE event replay.
 *
 * Caches SSE events in Redis (or in-memory fallback) so that clients
 * can recover responses after mobile backgrounding kills the connection.
 *
 * Redis path uses RPUSH (atomic list append) to avoid the read-modify-write
 * race that occurs when multiple fire-and-forget appendEvent calls overlap.
 */

import { z } from "zod";
import { redis } from "@/lib/redis";
import { STREAM_RECOVERY_CONFIG } from "@/lib/config";

/** Schema for validating cached event entries from Redis */
const CachedEventSchema = z.object({
  event: z.string(),
  data: z.object({}).passthrough(),
});

export interface CachedEvent {
  event: string;
  data: object;
}

export interface CachedResponse {
  events: CachedEvent[];
  complete: boolean;
}

// In-memory fallback when Redis is not configured.
// NOTE: On serverless platforms (Vercel), each cold start gets a fresh Map, so
// the recovery GET request may hit a different instance than the POST that cached
// the events. This fallback is only reliable for local development; production
// should always use Redis.
const localCache = new Map<string, CachedEvent[]>();
const localCacheTimers = new Map<string, ReturnType<typeof setTimeout>>();

/** Maximum entries in the in-memory fallback cache to prevent unbounded growth */
const MAX_LOCAL_CACHE_SIZE = 100;

/** Tracks responseIds that have already logged a Redis error (avoids log spam) */
const redisErrorLogged = new Set<string>();

function cacheKey(responseId: string): string {
  return `chat:${responseId}`;
}

/**
 * Append an SSE event to the cached response.
 * Fire-and-forget — errors are logged but don't propagate.
 *
 * Uses Redis RPUSH (atomic list append) so concurrent calls don't
 * clobber each other.
 */
export async function appendEvent(
  responseId: string,
  event: string,
  data: object
): Promise<void> {
  const entry: CachedEvent = { event, data };

  if (redis) {
    try {
      const key = cacheKey(responseId);
      // Pipeline RPUSH + EXPIRE into a single HTTP request
      await redis.pipeline()
        .rpush(key, JSON.stringify(entry))
        .expire(key, STREAM_RECOVERY_CONFIG.cacheTtlSeconds)
        .exec();
    } catch (error) {
      if (!redisErrorLogged.has(responseId)) {
        redisErrorLogged.add(responseId);
        console.error("[ResponseCache] Redis append error:", error);
      }
    }
  } else {
    // Evict oldest entry if cache is at capacity
    if (!localCache.has(responseId) && localCache.size >= MAX_LOCAL_CACHE_SIZE) {
      const oldestKey = localCache.keys().next().value as string;
      localCache.delete(oldestKey);
      const timer = localCacheTimers.get(oldestKey);
      if (timer) {
        clearTimeout(timer);
        localCacheTimers.delete(oldestKey);
      }
    }

    let events = localCache.get(responseId);
    if (!events) {
      events = [];
      localCache.set(responseId, events);
    }
    events.push(entry);

    // Reset TTL timer
    const existingTimer = localCacheTimers.get(responseId);
    if (existingTimer) clearTimeout(existingTimer);
    localCacheTimers.set(
      responseId,
      setTimeout(() => {
        localCache.delete(responseId);
        localCacheTimers.delete(responseId);
        redisErrorLogged.delete(responseId);
      }, STREAM_RECOVERY_CONFIG.cacheTtlSeconds * 1000)
    );
  }
}

/**
 * Retrieve a cached response for replay.
 * Returns null if the response is not found or expired.
 *
 * Completeness is determined by checking if a "done" event exists
 * in the event list (no separate flag needed).
 */
export async function getCachedResponse(
  responseId: string
): Promise<CachedResponse | null> {
  if (redis) {
    try {
      const key = cacheKey(responseId);
      const raw = await redis.lrange(key, 0, -1);
      if (!raw || raw.length === 0) return null;

      const events: CachedEvent[] = raw
        .map((item) => {
          // Upstash Redis may return pre-parsed objects instead of raw strings
          const parsed = typeof item === "string" ? JSON.parse(item) : item;
          const result = CachedEventSchema.safeParse(parsed);
          return result.success ? (result.data as CachedEvent) : null;
        })
        .filter((e): e is CachedEvent => e !== null);
      const complete = events.some((e) => e.event === "done");
      return { events, complete };
    } catch (error) {
      console.error("[ResponseCache] Redis get error:", error);
      return null;
    }
  }

  const events = localCache.get(responseId);
  if (!events || events.length === 0) return null;
  const complete = events.some((e) => e.event === "done");
  return { events, complete };
}
