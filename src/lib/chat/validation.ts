/**
 * Chat API input validation
 *
 * Validates incoming chat requests including message content and history.
 */

import { VALIDATION_LIMITS } from "@/lib/config";
import { ChatMessage } from "@/lib/types";

export interface ValidationResult {
  valid: boolean;
  error?: string;
  status?: number;
}

/**
 * Validates the incoming message
 */
export function validateMessage(message: unknown): ValidationResult {
  if (message === null || message === undefined || typeof message !== "string") {
    return {
      valid: false,
      error: "Message is required and must be a string",
      status: 400,
    };
  }

  if (message.length === 0) {
    return {
      valid: false,
      error: "Message cannot be empty",
      status: 400,
    };
  }

  if (message.length > VALIDATION_LIMITS.maxMessageLength) {
    return {
      valid: false,
      error: `Message too long. Maximum ${VALIDATION_LIMITS.maxMessageLength} characters.`,
      status: 400,
    };
  }

  return { valid: true };
}

/**
 * Validates the conversation history array
 */
export function validateHistory(history: unknown): ValidationResult {
  if (!Array.isArray(history)) {
    return {
      valid: false,
      error: "History must be an array",
      status: 400,
    };
  }

  if (history.length > VALIDATION_LIMITS.maxHistoryLength) {
    return {
      valid: false,
      error: `History too long. Maximum ${VALIDATION_LIMITS.maxHistoryLength} messages.`,
      status: 400,
    };
  }

  // Validate each message in history
  for (const msg of history) {
    if (!msg || typeof msg !== "object") {
      return {
        valid: false,
        error: "Invalid history format",
        status: 400,
      };
    }

    const chatMsg = msg as Partial<ChatMessage>;

    if (!chatMsg.role || (chatMsg.role !== "user" && chatMsg.role !== "assistant")) {
      return {
        valid: false,
        error: "Invalid message role in history",
        status: 400,
      };
    }

    if (!chatMsg.content || typeof chatMsg.content !== "string") {
      return {
        valid: false,
        error: "Invalid message content in history",
        status: 400,
      };
    }

    if (chatMsg.content.length > VALIDATION_LIMITS.maxHistoryMessageLength) {
      return {
        valid: false,
        error: "Message in history too long",
        status: 400,
      };
    }
  }

  return { valid: true };
}

/**
 * Validates the complete chat request
 */
export function validateChatRequest(
  message: unknown,
  history: unknown
): ValidationResult {
  const messageResult = validateMessage(message);
  if (!messageResult.valid) {
    return messageResult;
  }

  const historyResult = validateHistory(history);
  if (!historyResult.valid) {
    return historyResult;
  }

  return { valid: true };
}

/**
 * Creates a validation error Response
 */
export function validationErrorResponse(result: ValidationResult): Response {
  return new Response(
    JSON.stringify({ error: result.error }),
    {
      status: result.status || 400,
      headers: { "Content-Type": "application/json" },
    }
  );
}
