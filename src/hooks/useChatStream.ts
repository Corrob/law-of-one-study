"use client";

import { useState, useCallback } from "react";
import { Message as MessageType, MessageSegment, AnimationChunk } from "@/lib/types";
import { parseSSE } from "@/lib/sse";
import { debug } from "@/lib/debug";
import { analytics } from "@/lib/analytics";
import {
  parseChunkData,
  parseSuggestionsEventData,
  parseErrorEventData,
} from "@/lib/schemas/sse-events";

/** Maximum number of messages to keep in memory (prevents unbounded growth) */
const MAX_CONVERSATION_HISTORY = 30;

/**
 * Return type for the useChatStream hook
 */
interface UseChatStreamReturn {
  /** All messages in the conversation */
  messages: MessageType[];
  /** Whether a stream is currently in progress */
  isStreaming: boolean;
  /** Whether the stream has completed sending data */
  streamDone: boolean;
  /** Follow-up suggestions from the AI */
  suggestions: string[];
  /** Send a message and start streaming the response */
  sendMessage: (content: string, addChunk: (chunk: AnimationChunk) => void, thinkingMode?: boolean) => Promise<void>;
  /** Finalize the assistant message after animations complete */
  finalizeMessage: (allChunks: AnimationChunk[]) => void;
  /** Reset all state for a new conversation */
  reset: () => void;
  /** Update messages directly (for external state management) */
  setMessages: React.Dispatch<React.SetStateAction<MessageType[]>>;
}

/**
 * Custom hook for managing chat streaming with SSE.
 *
 * Handles:
 * - Sending messages to the chat API
 * - Parsing SSE stream responses
 * - Managing message state and history
 * - Tracking analytics events
 * - Error handling and rate limiting
 *
 * @param onPlaceholderChange - Callback when placeholder should update based on conversation depth
 * @returns Chat stream state and controls
 *
 * @example
 * ```tsx
 * const { messages, isStreaming, sendMessage, reset } = useChatStream({
 *   onPlaceholderChange: (depth) => setPlaceholder(getPlaceholder(depth))
 * });
 *
 * // Send a message
 * await sendMessage("What is the Law of One?", addChunk);
 * ```
 */
export function useChatStream(
  onPlaceholderChange?: (conversationDepth: number) => void
): UseChatStreamReturn {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamDone, setStreamDone] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const sendMessage = useCallback(
    async (content: string, addChunk: (chunk: AnimationChunk) => void, thinkingMode: boolean = false) => {
      const requestStartTime = Date.now();

      // Add user message
      const userMessage: MessageType = {
        id: Date.now().toString(),
        role: "user",
        content,
        timestamp: new Date(),
      };

      // Track question submission
      const containsQuotedText =
        /["'].*["']/.test(content) || content.toLowerCase().includes("quote");
      const isFollowUp = messages.length > 0;
      analytics.questionSubmitted({
        messageLength: content.length,
        containsQuotedText,
        isFollowUp,
        conversationDepth: messages.length,
      });

      setMessages((prev) => {
        const updated = [...prev, userMessage];
        if (updated.length > MAX_CONVERSATION_HISTORY) {
          return updated.slice(-MAX_CONVERSATION_HISTORY);
        }
        return updated;
      });
      setIsStreaming(true);
      setStreamDone(false);
      setSuggestions([]);

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: content,
            history: messages.map((m) => ({
              role: m.role,
              content: m.content,
              quotesUsed: m.segments
                ?.filter((s) => s.type === "quote")
                .map((s) => (s.type === "quote" ? s.quote.reference : null))
                .filter(Boolean),
            })),
            thinkingMode,
          }),
        });

        if (!response.ok) {
          let errorMessage = "Failed to get response";
          let errorType: "rate_limit" | "validation" | "api_error" = "api_error";
          try {
            const errorData = await response.json();
            if (errorData.error) {
              errorMessage = errorData.error;
            }
            if (response.status === 429 && errorData.retryAfter) {
              errorMessage = `${errorData.error} Please wait ${errorData.retryAfter} seconds.`;
              errorType = "rate_limit";
            } else if (response.status === 400) {
              errorType = "validation";
            }
          } catch {
            // If JSON parsing fails, use generic message
          }

          analytics.error({
            errorType,
            errorMessage,
            context: { status: response.status },
          });

          throw new Error(errorMessage);
        }

        analytics.streamingStarted({ isQuoteSearch: containsQuotedText });

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No reader available");

        const decoder = new TextDecoder();
        let buffer = "";
        let chunkIdCounter = 0;
        let quoteCount = 0;
        let responseLength = 0;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const { events, remaining } = parseSSE(buffer);
          buffer = remaining;

          for (const event of events) {
            debug.log("[useChatStream] SSE event:", { type: event.type });

            if (event.type === "chunk") {
              const chunkData = parseChunkData(event.data);
              if (!chunkData) {
                debug.log("[useChatStream] Invalid chunk data:", event.data);
                continue;
              }
              chunkIdCounter++;

              if (chunkData.type === "text") {
                responseLength += chunkData.content.length;
                addChunk({
                  id: `chunk-${chunkIdCounter}`,
                  type: "text",
                  content: chunkData.content,
                });
              } else if (chunkData.type === "quote") {
                quoteCount++;
                addChunk({
                  id: `chunk-${chunkIdCounter}`,
                  type: "quote",
                  quote: {
                    text: chunkData.text,
                    reference: chunkData.reference,
                    url: chunkData.url,
                  },
                });
              }
            } else if (event.type === "suggestions") {
              const suggestionsData = parseSuggestionsEventData(event.data);
              if (suggestionsData) {
                setSuggestions(suggestionsData.items);
              }
            } else if (event.type === "done") {
              setStreamDone(true);

              const responseTimeMs = Date.now() - requestStartTime;
              analytics.responseComplete({
                responseTimeMs,
                quoteCount,
                messageLength: responseLength,
                isQuoteSearch: containsQuotedText,
              });
            } else if (event.type === "error") {
              const errorData = parseErrorEventData(event.data);
              debug.log("[useChatStream] SSE error:", errorData);

              // Create error with structured data for analytics
              const error = new Error(errorData?.message || "An error occurred");
              Object.assign(error, {
                code: errorData?.code,
                retryable: errorData?.retryable,
              });
              throw error;
            }
          }
        }
      } catch (error) {
        console.error("Chat error:", error);

        // Extract error code if present (from SSE error events)
        // Use type guard pattern to safely access extended error properties
        const hasErrorCode = (e: unknown): e is Error & { code?: string; retryable?: boolean } =>
          e instanceof Error && "code" in e;

        const errorCode = hasErrorCode(error) ? error.code : undefined;
        const isRetryable = hasErrorCode(error) ? (error.retryable ?? true) : true;

        // Map error codes to display text and analytics type
        let errorText = "I apologize, but I encountered an error. Please try again.";
        let errorType: "rate_limit" | "validation" | "api_error" | "streaming_error" =
          "streaming_error";

        if (errorCode && error instanceof Error) {
          // Use the user-friendly message from the server
          errorText = error.message;

          // Map error codes to analytics types
          if (errorCode === "RATE_LIMITED") {
            errorType = "rate_limit";
          } else if (errorCode === "VALIDATION_ERROR") {
            errorType = "validation";
          } else if (["EMBEDDING_FAILED", "SEARCH_FAILED", "STREAM_FAILED"].includes(errorCode)) {
            errorType = "api_error";
          }
        } else if (error instanceof Error && error.message) {
          // Fallback for non-coded errors (e.g., from HTTP response)
          if (
            error.message.includes("Maximum") ||
            error.message.includes("too long") ||
            error.message.includes("Too many requests") ||
            error.message.includes("required")
          ) {
            errorText = error.message;
            if (error.message.includes("Too many requests")) {
              errorType = "rate_limit";
            } else {
              errorType = "validation";
            }
          }
        }

        analytics.error({
          errorType,
          errorMessage: error instanceof Error ? error.message : "Unknown error",
          context: { errorCode, isRetryable },
        });

        const errorMessage: MessageType = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: errorText,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
        setIsStreaming(false);
      }
    },
    [messages]
  );

  const finalizeMessage = useCallback(
    (allChunks: AnimationChunk[]) => {
      const segments: MessageSegment[] = allChunks.map((chunk) => {
        if (chunk.type === "text") {
          return { type: "text" as const, content: chunk.content };
        } else {
          return { type: "quote" as const, quote: chunk.quote };
        }
      });

      const assistantMessage: MessageType = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: segments
          .filter((s): s is { type: "text"; content: string } => s.type === "text")
          .map((s) => s.content)
          .join(""),
        segments,
        timestamp: new Date(),
      };

      setMessages((prev) => {
        const updated = [...prev, assistantMessage];
        const limited =
          updated.length > MAX_CONVERSATION_HISTORY
            ? updated.slice(-MAX_CONVERSATION_HISTORY)
            : updated;

        if (onPlaceholderChange) {
          onPlaceholderChange(limited.length);
        }

        return limited;
      });

      setStreamDone(false);
      setIsStreaming(false);
    },
    [onPlaceholderChange]
  );

  const reset = useCallback(() => {
    setMessages([]);
    setStreamDone(false);
    setIsStreaming(false);
    setSuggestions([]);
  }, []);

  return {
    messages,
    isStreaming,
    streamDone,
    suggestions,
    sendMessage,
    finalizeMessage,
    reset,
    setMessages,
  };
}
