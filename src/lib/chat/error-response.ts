/**
 * Unified error response handling for SSE streams.
 *
 * Consolidates error event formatting to eliminate duplication
 * across the chat pipeline.
 */

import { createChatError, toChatError } from "./errors";
import type { SSESender } from "./sse-encoder";
import type { ChatErrorCode } from "@/lib/types";

/**
 * Error event data structure sent to clients.
 */
export interface ErrorEventData {
  code: ChatErrorCode;
  message: string;
  retryable: boolean;
}

/**
 * Convert any error to standardized error event data.
 *
 * @param error - Unknown error from catch block
 * @returns Structured error data for SSE event
 */
export function toErrorEventData(error: unknown): ErrorEventData {
  const chatError = toChatError(error);
  return {
    code: chatError.code,
    message: chatError.userMessage,
    retryable: chatError.retryable,
  };
}

/**
 * Send an error event through the SSE stream.
 *
 * Normalizes any error to a ChatError and sends it with
 * proper code, user message, and retryable flag.
 *
 * @param send - SSE sender function
 * @param error - Error to send (any type)
 *
 * @example
 * ```typescript
 * try {
 *   await performSearch(query);
 * } catch (error) {
 *   sendStreamError(send, error);
 * }
 * ```
 */
export function sendStreamError(send: SSESender, error: unknown): void {
  const eventData = toErrorEventData(error);
  send("error", eventData);
}

/**
 * Create and send a typed error in one call.
 *
 * @param send - SSE sender function
 * @param code - Error code
 * @param cause - Optional underlying error
 */
export function sendTypedError(
  send: SSESender,
  code: ChatErrorCode,
  cause?: Error
): void {
  const chatError = createChatError(code, cause);
  send("error", {
    code: chatError.code,
    message: chatError.userMessage,
    retryable: chatError.retryable,
  });
}

/**
 * Type guard to check if error data matches ErrorEventData structure.
 *
 * @param data - Unknown data to check
 * @returns True if data has error event structure
 */
export function isErrorEventData(data: unknown): data is ErrorEventData {
  return (
    typeof data === "object" &&
    data !== null &&
    "code" in data &&
    "message" in data &&
    "retryable" in data
  );
}
