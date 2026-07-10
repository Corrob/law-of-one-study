"use client";

import { useState, useCallback, useRef } from "react";
import { type AvailableLanguage, DEFAULT_LOCALE } from "@/lib/language-config";
import { ASK_MAX_HISTORY_MESSAGES } from "@/lib/ask/config";

export interface AskMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface UseAskStreamReturn {
  messages: AskMessage[];
  isStreaming: boolean;
  error: string | null;
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
export function useAskStream(locale: AvailableLanguage = DEFAULT_LOCALE): UseAskStreamReturn {
  const [messages, setMessages] = useState<AskMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const idRef = useRef(0);

  const nextId = () => `${Date.now()}-${idRef.current++}`;

  const sendMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      if (!trimmed || isStreaming) return;

      setError(null);

      // History = the conversation so far (capped), before this new turn.
      const history = messages
        .slice(-ASK_MAX_HISTORY_MESSAGES)
        .map((m) => ({ role: m.role, content: m.content }));

      const userMessage: AskMessage = {
        id: nextId(),
        role: "user",
        content: trimmed,
      };
      const assistantId = nextId();
      const assistantMessage: AskMessage = {
        id: assistantId,
        role: "assistant",
        content: "",
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

      try {
        const response = await fetch("/api/ask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({ message: trimmed, history, locale }),
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
                  appendToAssistant(parsed.text);
                }
              } catch {
                /* ignore malformed chunk */
              }
            } else if (evt.event === "error") {
              try {
                const parsed = JSON.parse(evt.data);
                setError(parsed.error ?? "Something went wrong.");
              } catch {
                setError("Something went wrong.");
              }
            }
            // "meta" and "done" require no action here.
          }
        }
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
    [messages, isStreaming, locale]
  );

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    setError(null);
    setIsStreaming(false);
  }, []);

  return { messages, isStreaming, error, sendMessage, reset };
}
