/**
 * Minimal in-memory rate limiter for the subscribe endpoint.
 *
 * Serverless caveat (per the feature plan): each Vercel instance keeps its
 * own map, so this is a best-effort bot/abuse dampener rather than a hard
 * global limit. Revisit with a shared store if abuse appears.
 */

const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 5;

// Sweep expired entries once the map grows past this, so one-off IPs
// don't accumulate for the lifetime of the serverless instance.
const SWEEP_THRESHOLD = 1_000;

const requestLog = new Map<string, number[]>();

function sweepExpired(windowStart: number): void {
  for (const [key, timestamps] of requestLog) {
    if (!timestamps.some((t) => t > windowStart)) {
      requestLog.delete(key);
    }
  }
}

/**
 * Record a request for `key` (typically the client IP) and report whether
 * it is still within the allowed rate.
 */
export function checkRateLimit(key: string, now: number = Date.now()): boolean {
  const windowStart = now - WINDOW_MS;
  if (requestLog.size >= SWEEP_THRESHOLD) {
    sweepExpired(windowStart);
  }
  const recent = (requestLog.get(key) ?? []).filter((t) => t > windowStart);

  if (recent.length >= MAX_REQUESTS_PER_WINDOW) {
    requestLog.set(key, recent);
    return false;
  }

  recent.push(now);
  requestLog.set(key, recent);
  return true;
}

/** Clear all recorded requests (for tests). */
export function resetRateLimit(): void {
  requestLog.clear();
}
