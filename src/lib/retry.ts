/**
 * Retry utility with exponential backoff for transient API failures.
 *
 * Handles common transient errors:
 * - 429 (Rate Limit): Wait and retry with backoff
 * - 5xx (Server Error): Retry with backoff
 * - Network errors: Retry with backoff
 *
 * Does NOT retry:
 * - 4xx errors (except 429): Client errors that won't resolve with retry
 * - Validation errors: Request itself is malformed
 */

import { debug } from "@/lib/debug";

/** Configuration for retry behavior */
export interface RetryConfig {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;
  /** Initial delay in milliseconds (default: 1000) */
  initialDelayMs?: number;
  /** Maximum delay in milliseconds (default: 30000) */
  maxDelayMs?: number;
  /** Multiplier for exponential backoff (default: 2) */
  backoffMultiplier?: number;
  /** Jitter factor 0-1 to randomize delays (default: 0.1) */
  jitter?: number;
  /** Request timeout in milliseconds (default: 30000) */
  timeoutMs?: number;
}

/** Default retry configuration */
export const DEFAULT_RETRY_CONFIG: Required<RetryConfig> = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  jitter: 0.1,
  timeoutMs: 30000,
};

/** Error class for retryable failures that exhausted all attempts */
export class RetryExhaustedError extends Error {
  constructor(
    message: string,
    public readonly lastError: Error,
    public readonly attempts: number
  ) {
    super(message);
    this.name = "RetryExhaustedError";
  }
}

/** Error class for timeout failures */
export class TimeoutError extends Error {
  constructor(
    message: string,
    public readonly timeoutMs: number
  ) {
    super(message);
    this.name = "TimeoutError";
  }
}

/**
 * Wrap a promise with a timeout.
 *
 * @param promise - The promise to wrap
 * @param timeoutMs - Timeout in milliseconds
 * @param operationName - Name for error message context
 * @returns Promise that rejects with TimeoutError if timeout exceeded
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  operationName = "Operation"
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(
        () =>
          reject(
            new TimeoutError(
              `${operationName} timed out after ${timeoutMs}ms`,
              timeoutMs
            )
          ),
        timeoutMs
      )
    ),
  ]);
}

/**
 * Check if an error is retryable based on status code or error type.
 *
 * @param error - The error to check
 * @returns true if the error is transient and worth retrying
 */
export function isRetryableError(error: unknown): boolean {
  // Timeout errors are retryable
  if (error instanceof TimeoutError) {
    return true;
  }

  // Network errors (fetch failed)
  if (error instanceof TypeError && error.message.includes("fetch")) {
    return true;
  }

  // OpenAI API errors with status codes
  if (error && typeof error === "object" && "status" in error) {
    const status = (error as { status: number }).status;
    // 429: Rate limit - retry with backoff
    if (status === 429) return true;
    // 5xx: Server errors - transient, retry
    if (status >= 500 && status < 600) return true;
    // 4xx (except 429): Client errors - don't retry
    return false;
  }

  // OpenAI SDK error format (check message patterns)
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (message.includes("rate limit") || message.includes("429")) return true;
    if (message.includes("server error") || message.includes("500")) return true;
    if (message.includes("timeout") || message.includes("timed out")) return true;
    if (message.includes("econnreset") || message.includes("socket hang up")) return true;
  }

  return false;
}

/**
 * Calculate delay for a given attempt with exponential backoff and jitter.
 *
 * Formula: min(initialDelay * (multiplier ^ attempt), maxDelay) +/- jitter
 *
 * @param attempt - Zero-indexed attempt number
 * @param config - Retry configuration
 * @returns Delay in milliseconds
 */
export function calculateDelay(
  attempt: number,
  config: Required<RetryConfig>
): number {
  // Exponential backoff: initialDelay * (multiplier ^ attempt)
  const exponentialDelay =
    config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt);

  // Cap at maximum delay
  const cappedDelay = Math.min(exponentialDelay, config.maxDelayMs);

  // Add jitter: randomize within jitter percentage
  const jitterRange = cappedDelay * config.jitter;
  const jitter = Math.random() * jitterRange * 2 - jitterRange; // +/- jitter

  return Math.round(cappedDelay + jitter);
}

/**
 * Execute a function with automatic retry on transient failures.
 *
 * @param fn - Async function to execute
 * @param config - Optional retry configuration
 * @returns Promise resolving to the function result
 * @throws RetryExhaustedError if all retries fail
 * @throws Original error if not retryable
 *
 * @example
 * ```ts
 * const result = await withRetry(
 *   () => openai.chat.completions.create({ ... }),
 *   { maxRetries: 3 }
 * );
 * ```
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig = {}
): Promise<T> {
  const fullConfig: Required<RetryConfig> = {
    ...DEFAULT_RETRY_CONFIG,
    ...config,
  };
  let lastError: Error = new Error("No attempts made");

  for (let attempt = 0; attempt <= fullConfig.maxRetries; attempt++) {
    try {
      // Wrap each attempt with timeout
      return await withTimeout(fn(), fullConfig.timeoutMs, "Retry operation");
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if error is retryable
      if (!isRetryableError(error)) {
        debug.log(
          "[retry] Non-retryable error, throwing immediately:",
          lastError.message
        );
        throw error;
      }

      // Check if we have retries left
      if (attempt >= fullConfig.maxRetries) {
        debug.log(
          "[retry] All retries exhausted after",
          attempt + 1,
          "attempts"
        );
        break;
      }

      // Calculate and apply delay
      const delayMs = calculateDelay(attempt, fullConfig);
      debug.log(
        `[retry] Attempt ${attempt + 1}/${fullConfig.maxRetries + 1} failed:`,
        lastError.message,
        `Retrying in ${delayMs}ms`
      );

      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw new RetryExhaustedError(
    `Operation failed after ${fullConfig.maxRetries + 1} attempts: ${lastError.message}`,
    lastError,
    fullConfig.maxRetries + 1
  );
}

/**
 * Circuit breaker state for tracking repeated failures.
 * Prevents hammering a failing service.
 */
interface CircuitBreakerState {
  failures: number;
  lastFailure: number;
  isOpen: boolean;
}

const circuitBreakers = new Map<string, CircuitBreakerState>();

/** Circuit breaker configuration */
export interface CircuitBreakerConfig {
  /** Number of failures before opening circuit (default: 5) */
  failureThreshold?: number;
  /** Time in ms before attempting to close circuit (default: 60000) */
  resetTimeMs?: number;
}

/**
 * Execute with circuit breaker pattern.
 * Fails fast when a service is repeatedly failing.
 *
 * @param key - Unique identifier for this circuit (e.g., "openai-chat")
 * @param fn - Async function to execute
 * @param config - Circuit breaker configuration
 * @returns Promise resolving to the function result
 * @throws Error if circuit is open
 *
 * @example
 * ```ts
 * const result = await withCircuitBreaker(
 *   "openai-embeddings",
 *   () => createEmbedding(text),
 *   { failureThreshold: 5 }
 * );
 * ```
 */
export async function withCircuitBreaker<T>(
  key: string,
  fn: () => Promise<T>,
  config: CircuitBreakerConfig = {}
): Promise<T> {
  const { failureThreshold = 5, resetTimeMs = 60000 } = config;

  let state = circuitBreakers.get(key);
  if (!state) {
    state = { failures: 0, lastFailure: 0, isOpen: false };
    circuitBreakers.set(key, state);
  }

  // Check if circuit is open
  if (state.isOpen) {
    const timeSinceLastFailure = Date.now() - state.lastFailure;
    if (timeSinceLastFailure < resetTimeMs) {
      throw new Error(
        `Circuit breaker open for ${key}. Try again in ${Math.ceil((resetTimeMs - timeSinceLastFailure) / 1000)}s`
      );
    }
    // Try to close circuit (half-open state)
    debug.log(`[circuit-breaker] Attempting to close circuit for ${key}`);
  }

  try {
    const result = await fn();
    // Success - reset circuit
    state.failures = 0;
    state.isOpen = false;
    return result;
  } catch (error) {
    state.failures++;
    state.lastFailure = Date.now();

    if (state.failures >= failureThreshold) {
      state.isOpen = true;
      debug.log(
        `[circuit-breaker] Circuit opened for ${key} after ${state.failures} failures`
      );
    }

    throw error;
  }
}

/**
 * Reset a circuit breaker (useful for testing).
 * @param key - The circuit breaker key to reset
 */
export function resetCircuitBreaker(key: string): void {
  circuitBreakers.delete(key);
}

/**
 * Reset all circuit breakers (useful for testing).
 */
export function resetAllCircuitBreakers(): void {
  circuitBreakers.clear();
}
