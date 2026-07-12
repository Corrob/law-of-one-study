"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { type AvailableLanguage, DEFAULT_LOCALE } from "@/lib/language-config";
import { ASK_MAX_HISTORY_MESSAGES } from "@/lib/ask/config";
import { askAnalytics, getDistinctId } from "@/lib/ask/analytics";
import { extractCitedReferences } from "@/lib/ask/citations";

export interface AskMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  /** For assistant turns: a discernment note shown as the opening paragraph. */
  disclaimer?: string;
}

interface UseAskStreamReturn {
  messages: AskMessage[];
  isStreaming: boolean;
  error: string | null;
  /** Follow-up questions for the latest answer (cleared on each new send). */
  suggestions: string[];
  sendMessage: (content: string) => Promise<void>;
  /** True when the last question failed with no answer and can be re-sent. */
  canRetry: boolean;
  /** Re-send the failed question (no-op when nothing failed). */
  retry: () => void;
  reset: () => void;
}

/** Conversations survive a refresh (same tab only) but not a new visit. */
const STORAGE_KEY = "lo1-ask-conversation";

interface StoredConversation {
  messages: AskMessage[];
  suggestions: string[];
}

/** Restore a saved conversation, dropping anything that doesn't look right. */
function readStoredConversation(): StoredConversation | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredConversation>;
    const messages = Array.isArray(parsed.messages)
      ? parsed.messages.filter(
          (m): m is AskMessage =>
            typeof m === "object" &&
            m !== null &&
            typeof m.id === "string" &&
            (m.role === "user" || m.role === "assistant") &&
            typeof m.content === "string" &&
            m.content.length > 0
        )
      : [];
    if (messages.length === 0) return null;
    const suggestions = Array.isArray(parsed.suggestions)
      ? parsed.suggestions.filter((s): s is string => typeof s === "string")
      : [];
    return { messages, suggestions };
  } catch {
    return null;
  }
}

/** Parse complete SSE events out of a buffer; return leftover partial text. */
function parseSSE(buffer: string): {
  events: Array<{ event: string; data: string }>;
  remaining: string;
} {
  const events: Array<{ event: string; data: string }> = [];
  const chunks = buffer.split("\n\n");
  const remaining = chunks.pop() ?? "";

  for (const chunk of chunks) {
    let event = "message";
    const dataLines: string[] = [];
    for (const line of chunk.split("\n")) {
      if (line.startsWith("event:")) event = line.slice(6).trim();
      else if (line.startsWith("data:")) dataLines.push(line.slice(5).trim());
    }
    if (dataLines.length > 0) {
      events.push({ event, data: dataLines.join("\n") });
    }
  }
  return { events, remaining };
}

/**
 * Streaming client for the Ask feature. Sends the conversation to /api/ask and
 * appends text deltas to the in-flight assistant message. Citation markers in
 * the streamed text are left intact — the message component renders them.
 */
export function useAskStream(
  locale: AvailableLanguage = DEFAULT_LOCALE,
  disclaimers: string[] = []
): UseAskStreamReturn {
  const [messages, setMessages] = useState<AskMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  /** The question of a failed turn, kept so the user can retry without retyping. */
  const [failed, setFailed] = useState<{ userMessageId: string; content: string } | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const idRef = useRef(0);

  const nextId = () => `${Date.now()}-${idRef.current++}`;

  // Restore after mount (not in the state initializer) to avoid a hydration
  // mismatch — the server render has no sessionStorage.
  useEffect(() => {
    const stored = readStoredConversation();
    if (stored) {
      setMessages(stored.messages);
      setSuggestions(stored.suggestions);
    }
  }, []);

  // Persist the conversation; an emptied thread (reset) clears the store.
  // Skipped while streaming: writing on every token is wasteful, and a
  // mid-stream snapshot would restore a silently truncated answer.
  useEffect(() => {
    if (isStreaming) return;
    try {
      // A trailing unanswered question (failed turn) isn't saved — its retry
      // state lives only in memory, so restoring it would strand it.
      const settled =
        messages.at(-1)?.role === "user" ? messages.slice(0, -1) : messages;
      if (settled.length > 0) {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ messages: settled, suggestions }));
      } else {
        sessionStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // Storage full or unavailable — persistence is best-effort.
    }
  }, [messages, suggestions, isStreaming]);

  const sendMessage = useCallback(
    async (content: string, retryOfId?: string) => {
      const trimmed = content.trim();
      if (!trimmed || isStreaming) return;

      setError(null);
      setSuggestions([]); // clear the previous turn's follow-ups
      setFailed(null);

      // History = the conversation so far (capped), before this new turn. On a
      // retry the question is already the last message — keep it out of history.
      const history = messages
        .filter((m) => m.id !== retryOfId)
        .slice(-ASK_MAX_HISTORY_MESSAGES)
        .map((m) => ({ role: m.role, content: m.content }));

      askAnalytics.questionSubmitted({
        messageLength: trimmed.length,
        isFollowUp: history.length > 0,
        conversationDepth: history.length,
      });

      const userMessageId = retryOfId ?? nextId();
      const userMessage: AskMessage = {
        id: userMessageId,
        role: "user",
        content: trimmed,
      };
      const isFirstTurn = history.length === 0;
      const assistantId = nextId();
      const assistantMessage: AskMessage = {
        id: assistantId,
        role: "assistant",
        content: "",
        // Show a discernment note only on the first answer of a thread (one of
        // the saved variations, chosen locally so it loads instantly).
        disclaimer:
          isFirstTurn && disclaimers.length > 0
            ? disclaimers[Math.floor(Math.random() * disclaimers.length)]
            : undefined,
      };

      // On a retry the failed question is still on screen — only add the answer.
      setMessages((prev) =>
        retryOfId ? [...prev, assistantMessage] : [...prev, userMessage, assistantMessage]
      );
      setIsStreaming(true);

      const appendToAssistant = (text: string) => {
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + text } : m))
        );
      };

      const controller = new AbortController();
      abortRef.current = controller;

      const startedAt = Date.now();
      let firstChunkAt: number | null = null;
      let fullText = "";
      let turnFailed = false;

      try {
        askAnalytics.streamingStarted();

        const response = await fetch("/api/ask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({ message: trimmed, history, locale, distinctId: getDistinctId() }),
        });

        if (!response.ok) {
          let msg = "Something went wrong. Please try again.";
          try {
            const data = await response.json();
            if (data.error) msg = data.error;
            if (response.status === 429 && data.retryAfter) {
              msg = `${data.error} Try again in ${data.retryAfter}s.`;
            }
          } catch {
            /* keep generic message */
          }
          askAnalytics.error({
            errorType: response.status === 429 ? "rate_limit" : "api_error",
            errorMessage: msg,
          });
          throw new Error(msg);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response stream available.");

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const { events, remaining } = parseSSE(buffer);
          buffer = remaining;

          for (const evt of events) {
            if (evt.event === "chunk") {
              try {
                const parsed = JSON.parse(evt.data);
                if (typeof parsed.text === "string") {
                  if (firstChunkAt === null) {
                    firstChunkAt = Date.now();
                    askAnalytics.timeToFirstChunk(firstChunkAt - startedAt);
                  }
                  fullText += parsed.text;
                  appendToAssistant(parsed.text);
                }
              } catch {
                /* ignore malformed chunk */
              }
            } else if (evt.event === "suggestions") {
              try {
                const parsed = JSON.parse(evt.data);
                if (Array.isArray(parsed.items) && parsed.items.length > 0) {
                  const items = parsed.items.filter((s: unknown): s is string => typeof s === "string");
                  setSuggestions(items);
                  askAnalytics.suggestionsDisplayed({ count: items.length });
                }
              } catch {
                /* ignore malformed suggestions */
              }
            } else if (evt.event === "error") {
              let msg = "Something went wrong.";
              try {
                const parsed = JSON.parse(evt.data);
                msg = parsed.error ?? msg;
              } catch {
                /* keep generic message */
              }
              setError(msg);
              turnFailed = true;
              askAnalytics.error({ errorType: "streaming_error", errorMessage: msg });
            }
            // "meta" and "done" require no action here.
          }
        }

        // Failsafe: a stream that ended cleanly but produced no text (e.g. a
        // proxy dropped the connection before any event) is a failed turn, not
        // a completed one — otherwise the empty bubble shimmers forever.
        if (fullText === "" && !turnFailed) {
          setError("Something went wrong. Please try again.");
          turnFailed = true;
          askAnalytics.error({ errorType: "empty_stream", errorMessage: "stream ended empty" });
        } else if (!turnFailed) {
          askAnalytics.responseComplete({
            responseTimeMs: Date.now() - startedAt,
            messageLength: fullText.length,
            citationCount: extractCitedReferences(fullText).length,
          });
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          // User navigated away or started a new message — silent.
        } else {
          setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
          turnFailed = true;
        }
      } finally {
        // A failed turn with no answer: drop the empty assistant bubble (it
        // would show the thinking shimmer forever) and offer a retry of the
        // question, which stays on screen.
        if (turnFailed && fullText === "") {
          setMessages((prev) => prev.filter((m) => m.id !== assistantId));
          setFailed({ userMessageId, content: trimmed });
        }
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [messages, isStreaming, locale, disclaimers]
  );

  const retry = useCallback(() => {
    if (failed) void sendMessage(failed.content, failed.userMessageId);
  }, [failed, sendMessage]);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    setError(null);
    setSuggestions([]);
    setFailed(null);
    setIsStreaming(false);
  }, []);

  return {
    messages,
    isStreaming,
    error,
    suggestions,
    sendMessage,
    canRetry: failed !== null,
    retry,
    reset,
  };
}
