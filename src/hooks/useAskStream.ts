"use client";

import { useState, useCallback, useRef } from "react";
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
  reset: () => void;
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
  const abortRef = useRef<AbortController | null>(null);
  const idRef = useRef(0);

  const nextId = () => `${Date.now()}-${idRef.current++}`;

  const sendMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      if (!trimmed || isStreaming) return;

      setError(null);
      setSuggestions([]); // clear the previous turn's follow-ups

      // History = the conversation so far (capped), before this new turn.
      const history = messages
        .slice(-ASK_MAX_HISTORY_MESSAGES)
        .map((m) => ({ role: m.role, content: m.content }));

      askAnalytics.questionSubmitted({
        messageLength: trimmed.length,
        isFollowUp: history.length > 0,
        conversationDepth: history.length,
      });

      const userMessage: AskMessage = {
        id: nextId(),
        role: "user",
        content: trimmed,
      };
      const isFirstTurn = messages.length === 0;
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

      setMessages((prev) => [...prev, userMessage, assistantMessage]);
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
              askAnalytics.error({ errorType: "streaming_error", errorMessage: msg });
            }
            // "meta" and "done" require no action here.
          }
        }

        askAnalytics.responseComplete({
          responseTimeMs: Date.now() - startedAt,
          messageLength: fullText.length,
          citationCount: extractCitedReferences(fullText).length,
        });
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          // User navigated away or started a new message — silent.
        } else {
          setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
        }
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [messages, isStreaming, locale, disclaimers]
  );

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    setError(null);
    setSuggestions([]);
    setIsStreaming(false);
  }, []);

  return { messages, isStreaming, error, suggestions, sendMessage, reset };
}
