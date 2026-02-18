"use client";

import { useState, useCallback, useRef } from "react";
import { Message as MessageType, MessageSegment, AnimationChunk } from "@/lib/types";
import { parseSSE } from "@/lib/sse";
import { debug } from "@/lib/debug";
import { analytics } from "@/lib/analytics";
import {
  parseChunkData,
  parseSuggestionsEventData,
  parseErrorEventData,
  parseSessionEventData,
  parseMetaEventData,
} from "@/lib/schemas/sse-events";
import { Quote } from "@/lib/types";
import { DEFAULT_LOCALE } from "@/lib/language-config";
import { STREAM_RECOVERY_CONFIG } from "@/lib/config";
import { useStreamRecovery } from "./useStreamRecovery";

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
  /** Quotes from the meta event (includes passage text for modal display) */
  quotes: Quote[];
  /** Send a message and start streaming the response */
  sendMessage: (content: string, addChunk: (chunk: AnimationChunk) => void, thinkingMode?: boolean, targetLanguage?: string, includeConfederation?: boolean) => Promise<void>;
  /** Finalize the assistant message after animations complete */
  finalizeMessage: (allChunks: AnimationChunk[]) => void;
  /** Reset all state for a new conversation */
  reset: () => void;
  /** Update messages directly (for external state management) */
  setMessages: React.Dispatch<React.SetStateAction<MessageType[]>>;
}

/** Metadata about what was replayed during recovery */
interface ReplayResult {
  chunksReplayed: number;
  hadSuggestions: boolean;
  quotes: Quote[];
}

/**
 * Process cached events through the same pipeline as live SSE events.
 * Used during recovery to replay server-cached responses.
 * Returns metadata about what was replayed so callers can decide next steps.
 */
function replayCachedEvents(
  events: Array<{ event: string; data: object }>,
  addChunk: (chunk: AnimationChunk) => void,
  setSuggestions: (items: string[]) => void
): ReplayResult {
  let contentChunkCount = 0;
  let hadSuggestions = false;
  let quotes: Quote[] = [];

  for (const { event, data } of events) {
    if (event === "meta") {
      const metaData = parseMetaEventData(data);
      if (metaData?.quotes) {
        quotes = metaData.quotes;
      }
    } else if (event === "chunk") {
      const chunkData = parseChunkData(data);
      if (!chunkData) continue;
      contentChunkCount++;

      if (chunkData.type === "text") {
        addChunk({
          id: `recovery-chunk-${contentChunkCount}`,
          type: "text",
          content: chunkData.content,
        });
      } else if (chunkData.type === "quote") {
        addChunk({
          id: `recovery-chunk-${contentChunkCount}`,
          type: "quote",
          quote: {
            text: chunkData.text,
            reference: chunkData.reference,
            url: chunkData.url,
          },
        });
      }
    } else if (event === "suggestions") {
      const suggestionsData = parseSuggestionsEventData(data);
      if (suggestionsData) {
        setSuggestions(suggestionsData.items);
        hadSuggestions = true;
      }
    }
    // "meta", "session", "done" events are handled by caller or ignored during replay
  }

  return { chunksReplayed: contentChunkCount, hadSuggestions, quotes };
}

/** Result of a recovery attempt */
interface RecoveryResult {
  recovered: boolean;
  hadSuggestions: boolean;
  quotes: Quote[];
}

/**
 * Attempt to recover a response from the server cache.
 * Returns whether recovery succeeded and whether suggestions were included.
 * Recovery is only considered successful if actual content chunks were replayed —
 * a cache with only meta/session events would leave the UI stuck.
 */
async function tryRecover(
  recoveryPromise: Promise<{ events: Array<{ event: string; data: object }>; complete: boolean } | null> | null,
  addChunk: (chunk: AnimationChunk) => void,
  setSuggestions: (items: string[]) => void,
  setStreamDone: (done: boolean) => void
): Promise<RecoveryResult> {
  if (!recoveryPromise) return { recovered: false, hadSuggestions: false, quotes: [] };
  const cached = await recoveryPromise;
  if (!cached || cached.events.length === 0) return { recovered: false, hadSuggestions: false, quotes: [] };

  const { chunksReplayed, hadSuggestions, quotes } = replayCachedEvents(cached.events, addChunk, setSuggestions);

  if (chunksReplayed === 0) {
    debug.log("[useChatStream] Recovery cache had no content chunks, treating as failed");
    return { recovered: false, hadSuggestions: false, quotes: [] };
  }

  debug.log("[useChatStream] Recovered from cache:", {
    eventCount: cached.events.length,
    chunksReplayed,
    hadSuggestions,
    complete: cached.complete,
  });
  setStreamDone(true);
  return { recovered: true, hadSuggestions, quotes };
}

/**
 * Fire-and-forget: poll the recovery endpoint for suggestions after a delay.
 * The server may still be generating suggestions when the initial recovery fetch
 * happens, so we retry up to `suggestionsRetryMaxAttempts` times.
 */
function retrySuggestionsFromCache(
  responseId: string,
  recoverFromServer: (id: string) => Promise<{ events: Array<{ event: string; data: object }>; complete: boolean } | null>,
  setSuggestions: (items: string[]) => void
): void {
  const { suggestionsRetryDelayMs, suggestionsRetryMaxAttempts } = STREAM_RECOVERY_CONFIG;
  let attempts = 0;

  function attempt() {
    attempts++;
    setTimeout(async () => {
      try {
        const cached = await recoverFromServer(responseId);
        if (!cached) return;

        for (const { event, data } of cached.events) {
          if (event === "suggestions") {
            const suggestionsData = parseSuggestionsEventData(data);
            if (suggestionsData) {
              debug.log("[useChatStream] Suggestions retry succeeded on attempt", attempts);
              setSuggestions(suggestionsData.items);
              return;
            }
          }
        }

        // No suggestions found — retry if under limit
        if (attempts < suggestionsRetryMaxAttempts) {
          attempt();
        } else {
          debug.log("[useChatStream] Suggestions retry exhausted, giving up");
        }
      } catch {
        debug.log("[useChatStream] Suggestions retry failed on attempt", attempts);
        if (attempts < suggestionsRetryMaxAttempts) {
          attempt();
        }
      }
    }, suggestionsRetryDelayMs);
  }

  attempt();
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
 * - Recovery from mobile backgrounding via server-side response cache
 *
 * @param onPlaceholderChange - Callback when placeholder should update based on conversation depth
 * @returns Chat stream state and controls
 */
export function useChatStream(
  onPlaceholderChange?: (conversationDepth: number) => void
): UseChatStreamReturn {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamDone, setStreamDone] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);
  const userAbortedRef = useRef(false);

  const { setResponseId, recoverFromServer, registerStreamAbort } = useStreamRecovery();

  // Keep a stable ref so the sendMessage callback doesn't depend on recoverFromServer identity
  const recoverRef = useRef(recoverFromServer);
  recoverRef.current = recoverFromServer;

  const sendMessage = useCallback(
    async (content: string, addChunk: (chunk: AnimationChunk) => void, thinkingMode: boolean = false, targetLanguage: string = DEFAULT_LOCALE, includeConfederation: boolean = false) => {
      userAbortedRef.current = false;
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

      // Cancel any in-flight request
      abortControllerRef.current?.abort();

      const requestBody = JSON.stringify({
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
        targetLanguage,
        includeConfederation,
      });

      let contentChunksReceived = false;
      let currentResponseId: string | null = null;

      const abortController = new AbortController();
      abortControllerRef.current = abortController;
      registerStreamAbort(abortController);

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: abortController.signal,
          body: requestBody,
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

            if (event.type === "session") {
              // Store response ID for recovery
              const sessionData = parseSessionEventData(event.data);
              if (sessionData) {
                currentResponseId = sessionData.responseId;
                setResponseId(sessionData.responseId);
              }
            } else if (event.type === "meta") {
              const metaData = parseMetaEventData(event.data);
              if (metaData?.quotes.length) {
                setQuotes(metaData.quotes);
              }
            } else if (event.type === "chunk") {
              const chunkData = parseChunkData(event.data);
              if (!chunkData) {
                debug.log("[useChatStream] Invalid chunk data:", event.data);
                continue;
              }
              chunkIdCounter++;

              if (chunkData.type === "text") {
                contentChunksReceived = true;
                responseLength += chunkData.content.length;
                addChunk({
                  id: `chunk-${chunkIdCounter}`,
                  type: "text",
                  content: chunkData.content,
                });
              } else if (chunkData.type === "quote") {
                contentChunksReceived = true;
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

              const error = new Error(errorData?.message || "An error occurred");
              Object.assign(error, {
                code: errorData?.code,
                retryable: errorData?.retryable,
              });
              throw error;
            }
          }
        }

        // Success
        return;
      } catch (error) {
        // Try to recover from server cache — one fetch, reused across paths.
        // The server keeps running even after the client disconnects, so the
        // response may be fully (or partially) cached.
        const recoveryId = currentResponseId;
        const recoveryPromise = recoveryId ? recoverRef.current(recoveryId) : null;

        /** Attempt cache recovery; schedule suggestions retry if needed. */
        async function attemptRecoveryWithSuggestions(): Promise<boolean> {
          const result = await tryRecover(recoveryPromise, addChunk, setSuggestions, setStreamDone);
          if (result.recovered) {
            if (result.quotes.length > 0) {
              setQuotes(result.quotes);
            }
            if (!result.hadSuggestions && recoveryId) {
              retrySuggestionsFromCache(recoveryId, recoverRef.current, setSuggestions);
            }
            return true;
          }
          return false;
        }

        if (error instanceof DOMException && error.name === "AbortError") {
          if (userAbortedRef.current) {
            return;
          }
          if (await attemptRecoveryWithSuggestions()) {
            return;
          }
          // Recovery failed after stale-connection abort (e.g., desktop tab switch
          // where the server hasn't finished yet) — fall through to graceful degradation
        } else {
          console.error("Chat error:", error);

          if (await attemptRecoveryWithSuggestions()) {
            return;
          }
        }

        // Recovery failed or no responseId — fall back to graceful degradation
        if (contentChunksReceived) {
          addChunk({
            id: "chunk-incomplete",
            type: "text",
            content: "\n\n_(Response may be incomplete due to a connection issue.)_",
          });
          setStreamDone(true);
          return;
        }

        // No chunks and no recovery — show error message
        // Extract error code if present (from SSE error events)
        const hasErrorCode = (e: unknown): e is Error & { code?: string; retryable?: boolean } =>
          e instanceof Error && "code" in e;

        const errorCode = hasErrorCode(error) ? error.code : undefined;
        const isRetryable = hasErrorCode(error) ? (error.retryable ?? true) : true;

        // Map error codes to display text and analytics type
        let errorText = "I apologize, but I encountered an error. Please try again.";
        let errorType: "rate_limit" | "validation" | "api_error" | "streaming_error" =
          "streaming_error";

        if (errorCode && error instanceof Error) {
          errorText = error.message;

          if (errorCode === "RATE_LIMITED") {
            errorType = "rate_limit";
          } else if (errorCode === "VALIDATION_ERROR") {
            errorType = "validation";
          } else if (["EMBEDDING_FAILED", "SEARCH_FAILED", "STREAM_FAILED"].includes(errorCode)) {
            errorType = "api_error";
          }
        } else if (error instanceof Error && error.message) {
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
        return;
      } finally {
        registerStreamAbort(null);
      }
    },
    [messages, setResponseId, registerStreamAbort]
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
    userAbortedRef.current = true;
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setMessages([]);
    setStreamDone(false);
    setIsStreaming(false);
    setSuggestions([]);
    setQuotes([]);
  }, []);

  return {
    messages,
    isStreaming,
    streamDone,
    suggestions,
    quotes,
    sendMessage,
    finalizeMessage,
    reset,
    setMessages,
  };
}
