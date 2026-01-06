/**
 * Typed error handling for chat API
 * Provides specific error codes and user-friendly messages
 */

import { ChatErrorCode } from "@/lib/types";

export type { ChatErrorCode };

export interface ChatError extends Error {
  code: ChatErrorCode;
  userMessage: string;
  retryable: boolean;
  cause?: Error;
}

interface ErrorTemplate {
  userMessage: string;
  retryable: boolean;
}

const ERROR_TEMPLATES: Record<ChatErrorCode, ErrorTemplate> = {
  AUGMENTATION_FAILED: {
    userMessage: "I had trouble understanding your question. Please try rephrasing it.",
    retryable: true,
  },
  EMBEDDING_FAILED: {
    userMessage: "I couldn't process your message. Please try again.",
    retryable: true,
  },
  SEARCH_FAILED: {
    userMessage: "I couldn't search the Ra Material. Please try again in a moment.",
    retryable: true,
  },
  STREAM_FAILED: {
    userMessage: "I encountered an error generating my response. Please try again.",
    retryable: true,
  },
  QUOTE_PROCESSING_FAILED: {
    userMessage: "I had trouble formatting a quote. The response may be incomplete.",
    retryable: false,
  },
  SUGGESTIONS_FAILED: {
    userMessage: "", // Silent failure - suggestions are optional
    retryable: false,
  },
  RATE_LIMITED: {
    userMessage: "Too many requests. Please wait before trying again.",
    retryable: true,
  },
  VALIDATION_ERROR: {
    userMessage: "Invalid request. Please check your message and try again.",
    retryable: false,
  },
  UNKNOWN_ERROR: {
    userMessage: "Something went wrong. Please try again.",
    retryable: true,
  },
};

/**
 * Create a typed ChatError with consistent structure
 */
export function createChatError(code: ChatErrorCode, cause?: Error): ChatError {
  const template = ERROR_TEMPLATES[code];
  const message = cause ? `${code}: ${cause.message}` : code;

  const error = new Error(message) as ChatError;
  error.code = code;
  error.userMessage = template.userMessage;
  error.retryable = template.retryable;
  error.cause = cause;

  return error;
}

/**
 * Type guard to check if an error is a ChatError
 */
export function isChatError(error: unknown): error is ChatError {
  return (
    error instanceof Error &&
    "code" in error &&
    "userMessage" in error &&
    "retryable" in error
  );
}

/**
 * Convert any error to a ChatError for consistent handling
 */
export function toChatError(error: unknown): ChatError {
  if (isChatError(error)) {
    return error;
  }

  if (error instanceof Error) {
    return createChatError("UNKNOWN_ERROR", error);
  }

  return createChatError("UNKNOWN_ERROR", new Error(String(error)));
}
