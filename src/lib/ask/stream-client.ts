/**
 * Client-side plumbing for the Ask stream, extracted from useAskStream so the
 * hook stays focused on state: SSE parsing, sessionStorage persistence, and
 * validation of server-sent recommendation payloads.
 */

import {
  getRelatedResource,
  isResourceType,
  type RelatedResource,
} from "@/lib/ask/resources";
import { type AvailableLanguage, DEFAULT_LOCALE } from "@/lib/language-config";

export interface AskMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  /** For assistant turns: a discernment note shown as the opening paragraph. */
  disclaimer?: string;
  /** For assistant turns: "Explore further" cards, kept with their answer. */
  related?: RelatedResource[];
}

/** Conversations survive a refresh (same tab only) but not a new visit. */
export const STORAGE_KEY = "lo1-ask-conversation";

export interface StoredConversation {
  messages: AskMessage[];
  suggestions: string[];
}

/**
 * Validate one item of a `related` SSE payload (or a stored conversation).
 * Re-resolves via the registry so title/href always match the current build
 * and locale — unknown or malformed items are dropped.
 */
export function parseRelatedItem(
  item: unknown,
  locale: AvailableLanguage = DEFAULT_LOCALE
): RelatedResource | null {
  if (typeof item !== "object" || item === null) return null;
  const { type, id } = item as { type?: unknown; id?: unknown };
  if (typeof type !== "string" || typeof id !== "string" || !isResourceType(type)) return null;
  return getRelatedResource(type, id, locale) ?? null;
}

/** Re-resolve a stored `related` array against the current build and locale. */
function parseRelatedList(items: unknown, locale: AvailableLanguage): RelatedResource[] {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => parseRelatedItem(item, locale))
    .filter((r): r is RelatedResource => r !== null);
}

/** Restore a saved conversation, dropping anything that doesn't look right. */
export function readStoredConversation(
  locale: AvailableLanguage = DEFAULT_LOCALE
): StoredConversation | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    // `related` at the top level only appears in legacy saves (it was
    // conversation-level before the cards moved onto each answer).
    const parsed = JSON.parse(raw) as Partial<StoredConversation> & { related?: unknown };
    const messages = Array.isArray(parsed.messages)
      ? parsed.messages
          .filter(
            (m): m is AskMessage =>
              typeof m === "object" &&
              m !== null &&
              typeof m.id === "string" &&
              (m.role === "user" || m.role === "assistant") &&
              typeof m.content === "string" &&
              m.content.length > 0
          )
          .map((m): AskMessage => {
            const related = parseRelatedList(m.related, locale);
            return related.length > 0 ? { ...m, related } : { ...m, related: undefined };
          })
      : [];
    if (messages.length === 0) return null;
    const suggestions = Array.isArray(parsed.suggestions)
      ? parsed.suggestions.filter((s): s is string => typeof s === "string")
      : [];
    // Legacy migration: attach conversation-level cards to the last answer.
    const legacyRelated = parseRelatedList(parsed.related, locale);
    const last = messages.at(-1);
    if (legacyRelated.length > 0 && last?.role === "assistant" && !last.related) {
      last.related = legacyRelated;
    }
    return { messages, suggestions };
  } catch {
    return null;
  }
}

export interface AskEventHandlers {
  onChunk: (text: string) => void;
  onSuggestions: (items: string[]) => void;
  onRelated: (items: RelatedResource[]) => void;
  onError: (message: string) => void;
}

/**
 * Decode and validate one parsed SSE event, invoking the matching handler.
 * Malformed payloads are ignored; "meta" and "done" need no client action.
 */
export function dispatchAskEvent(
  evt: { event: string; data: string },
  locale: AvailableLanguage,
  handlers: AskEventHandlers
): void {
  let parsed: unknown;
  try {
    parsed = JSON.parse(evt.data);
  } catch {
    return; // malformed payload — ignore
  }
  if (typeof parsed !== "object" || parsed === null) return;
  const payload = parsed as { text?: unknown; items?: unknown; error?: unknown };

  if (evt.event === "chunk") {
    if (typeof payload.text === "string") handlers.onChunk(payload.text);
  } else if (evt.event === "suggestions") {
    if (Array.isArray(payload.items)) {
      const items = payload.items.filter((s): s is string => typeof s === "string");
      if (items.length > 0) handlers.onSuggestions(items);
    }
  } else if (evt.event === "related") {
    if (Array.isArray(payload.items)) {
      const items = payload.items
        .map((item) => parseRelatedItem(item, locale))
        .filter((r): r is RelatedResource => r !== null);
      if (items.length > 0) handlers.onRelated(items);
    }
  } else if (evt.event === "error") {
    handlers.onError(typeof payload.error === "string" ? payload.error : "Something went wrong.");
  }
}

/** Parse complete SSE events out of a buffer; return leftover partial text. */
export function parseSSE(buffer: string): {
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
