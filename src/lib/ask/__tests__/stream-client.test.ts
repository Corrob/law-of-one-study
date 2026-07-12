import {
  STORAGE_KEY,
  dispatchAskEvent,
  parseRelatedItem,
  parseSSE,
  readStoredConversation,
  type AskEventHandlers,
} from "../stream-client";

function makeHandlers(): AskEventHandlers & { calls: Record<string, unknown[]> } {
  const calls: Record<string, unknown[]> = { chunk: [], suggestions: [], related: [], error: [] };
  return {
    calls,
    onChunk: (text) => calls.chunk.push(text),
    onSuggestions: (items) => calls.suggestions.push(items),
    onRelated: (items) => calls.related.push(items),
    onError: (message) => calls.error.push(message),
  };
}

describe("stream-client", () => {
  describe("parseSSE", () => {
    it("parses complete events and returns the partial remainder", () => {
      const buffer =
        'event: chunk\ndata: {"text":"Hello"}\n\nevent: done\ndata: {}\n\nevent: chu';
      const { events, remaining } = parseSSE(buffer);
      expect(events).toEqual([
        { event: "chunk", data: '{"text":"Hello"}' },
        { event: "done", data: "{}" },
      ]);
      expect(remaining).toBe("event: chu");
    });

    it("returns no events for an incomplete buffer", () => {
      const { events, remaining } = parseSSE("event: chunk\ndata: {");
      expect(events).toEqual([]);
      expect(remaining).toBe("event: chunk\ndata: {");
    });
  });

  describe("dispatchAskEvent", () => {
    it("routes chunk text", () => {
      const handlers = makeHandlers();
      dispatchAskEvent({ event: "chunk", data: '{"text":"Hi"}' }, "en", handlers);
      expect(handlers.calls.chunk).toEqual(["Hi"]);
    });

    it("routes suggestions, filtering non-strings", () => {
      const handlers = makeHandlers();
      dispatchAskEvent(
        { event: "suggestions", data: '{"items":["One", 2, "Three"]}' },
        "en",
        handlers
      );
      expect(handlers.calls.suggestions).toEqual([["One", "Three"]]);
    });

    it("routes related items, dropping unknown resources", () => {
      const handlers = makeHandlers();
      dispatchAskEvent(
        {
          event: "related",
          data: '{"items":[{"type":"path","id":"densities"},{"type":"path","id":"fake"},{"type":"nope","id":"densities"}]}',
        },
        "en",
        handlers
      );
      expect(handlers.calls.related).toHaveLength(1);
      const items = handlers.calls.related[0] as Array<{ type: string; id: string }>;
      expect(items).toHaveLength(1);
      expect(items[0]).toMatchObject({ type: "path", id: "densities", href: "/paths/densities" });
    });

    it("routes errors with a fallback message", () => {
      const handlers = makeHandlers();
      dispatchAskEvent({ event: "error", data: "{}" }, "en", handlers);
      dispatchAskEvent({ event: "error", data: '{"error":"boom"}' }, "en", handlers);
      expect(handlers.calls.error).toEqual(["Something went wrong.", "boom"]);
    });

    it("ignores malformed payloads and unknown events", () => {
      const handlers = makeHandlers();
      dispatchAskEvent({ event: "chunk", data: "not json" }, "en", handlers);
      dispatchAskEvent({ event: "meta", data: '{"concepts":[]}' }, "en", handlers);
      dispatchAskEvent({ event: "done", data: "{}" }, "en", handlers);
      expect(handlers.calls.chunk).toEqual([]);
      expect(handlers.calls.error).toEqual([]);
    });
  });

  describe("parseRelatedItem", () => {
    it("re-resolves title and href from the registry for the locale", () => {
      const item = parseRelatedItem({ type: "song", id: "gateway", title: "tampered" }, "en");
      expect(item).toMatchObject({ type: "song", id: "gateway", href: "/listen?song=gateway" });
      expect(item?.title).not.toBe("tampered");
    });

    it("rejects malformed and unknown items", () => {
      expect(parseRelatedItem(null)).toBeNull();
      expect(parseRelatedItem({ type: "song" })).toBeNull();
      expect(parseRelatedItem({ type: "video", id: "gateway" })).toBeNull();
      expect(parseRelatedItem({ type: "song", id: "unknown" })).toBeNull();
    });
  });

  describe("readStoredConversation", () => {
    afterEach(() => sessionStorage.clear());

    const message = { id: "1", role: "user", content: "What is harvest?" };

    it("restores messages, suggestions, and related", () => {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          messages: [message],
          suggestions: ["Tell me more"],
          related: [{ type: "path", id: "densities" }],
        })
      );
      const stored = readStoredConversation("en");
      expect(stored?.messages).toHaveLength(1);
      expect(stored?.suggestions).toEqual(["Tell me more"]);
      expect(stored?.related).toHaveLength(1);
      expect(stored?.related[0]).toMatchObject({ type: "path", id: "densities" });
    });

    it("defaults related to [] for conversations saved before the field existed", () => {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ messages: [message], suggestions: [] })
      );
      expect(readStoredConversation("en")?.related).toEqual([]);
    });

    it("returns null for empty or corrupt storage", () => {
      expect(readStoredConversation()).toBeNull();
      sessionStorage.setItem(STORAGE_KEY, "{corrupt");
      expect(readStoredConversation()).toBeNull();
    });
  });
});
