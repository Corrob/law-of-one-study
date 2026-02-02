import { parseSSE, SSEEvent } from "../sse";

describe("parseSSE", () => {
  describe("basic parsing", () => {
    it("should parse a single complete event", () => {
      const buffer = 'event: chunk\ndata: {"type": "text", "content": "Hello"}\n\n';
      const { events, remaining } = parseSSE(buffer);

      expect(events).toHaveLength(1);
      expect(events[0].type).toBe("chunk");
      expect(events[0].data).toEqual({ type: "text", content: "Hello" });
      expect(remaining).toBe("");
    });

    it("should parse multiple complete events", () => {
      const buffer =
        'event: chunk\ndata: {"content": "Hello"}\n\n' +
        'event: chunk\ndata: {"content": "World"}\n\n' +
        'event: done\ndata: {}\n\n';

      const { events, remaining } = parseSSE(buffer);

      expect(events).toHaveLength(3);
      expect(events[0].data).toEqual({ content: "Hello" });
      expect(events[1].data).toEqual({ content: "World" });
      expect(events[2].type).toBe("done");
      expect(remaining).toBe("");
    });

    it("should handle events with complex JSON data", () => {
      const buffer =
        'event: meta\ndata: {"quotes": [{"text": "Ra: I am Ra.", "reference": "1.1"}]}\n\n';
      const { events, remaining } = parseSSE(buffer);

      expect(events).toHaveLength(1);
      expect(events[0].type).toBe("meta");
      expect(events[0].data).toEqual({
        quotes: [{ text: "Ra: I am Ra.", reference: "1.1" }],
      });
      expect(remaining).toBe("");
    });
  });

  describe("incomplete data handling", () => {
    it("should return incomplete event as remaining", () => {
      const buffer = 'event: chunk\ndata: {"type": "text"';
      const { events, remaining } = parseSSE(buffer);

      expect(events).toHaveLength(0);
      expect(remaining).toBe('event: chunk\ndata: {"type": "text"');
    });

    it("should return partial event without trailing newlines as remaining", () => {
      const buffer = 'event: chunk\ndata: {"content": "Hello"}\n\nevent: done\ndata: {}';
      const { events, remaining } = parseSSE(buffer);

      expect(events).toHaveLength(1);
      expect(events[0].data).toEqual({ content: "Hello" });
      expect(remaining).toBe("event: done\ndata: {}");
    });

    it("should handle empty remaining when buffer ends with double newline", () => {
      const buffer = 'event: done\ndata: {}\n\n';
      const { events, remaining } = parseSSE(buffer);

      expect(events).toHaveLength(1);
      expect(remaining).toBe("");
    });
  });

  describe("malformed data handling", () => {
    it("should skip events with invalid JSON", () => {
      const buffer =
        'event: chunk\ndata: {invalid json}\n\n' +
        'event: chunk\ndata: {"valid": true}\n\n';
      const { events, remaining } = parseSSE(buffer);

      expect(events).toHaveLength(1);
      expect(events[0].data).toEqual({ valid: true });
    });

    it("should skip events without event type", () => {
      const buffer = 'data: {"content": "no event type"}\n\n';
      const { events, remaining } = parseSSE(buffer);

      expect(events).toHaveLength(0);
      expect(remaining).toBe("");
    });

    it("should skip events without data", () => {
      const buffer = "event: chunk\n\n";
      const { events, remaining } = parseSSE(buffer);

      expect(events).toHaveLength(0);
      expect(remaining).toBe("");
    });

    it("should skip empty parts", () => {
      const buffer = "\n\n\n\n";
      const { events, remaining } = parseSSE(buffer);

      expect(events).toHaveLength(0);
    });
  });

  describe("edge cases", () => {
    it("should handle empty buffer", () => {
      const { events, remaining } = parseSSE("");

      expect(events).toHaveLength(0);
      expect(remaining).toBe("");
    });

    it("should handle buffer with only whitespace", () => {
      const { events, remaining } = parseSSE("   \n   ");

      expect(events).toHaveLength(0);
    });

    it("should handle numeric values in JSON", () => {
      const buffer = 'event: chunk\ndata: {"index": 42, "score": 0.95}\n\n';
      const { events } = parseSSE(buffer);

      expect(events).toHaveLength(1);
      expect(events[0].data).toEqual({ index: 42, score: 0.95 });
    });

    it("should handle boolean values in JSON", () => {
      const buffer = 'event: chunk\ndata: {"retryable": true, "done": false}\n\n';
      const { events } = parseSSE(buffer);

      expect(events).toHaveLength(1);
      expect(events[0].data).toEqual({ retryable: true, done: false });
    });

    it("should handle null values in JSON", () => {
      const buffer = 'event: chunk\ndata: {"content": null}\n\n';
      const { events } = parseSSE(buffer);

      expect(events).toHaveLength(1);
      expect(events[0].data).toEqual({ content: null });
    });

    it("should handle arrays in JSON", () => {
      const buffer = 'event: meta\ndata: {"items": [1, 2, 3]}\n\n';
      const { events } = parseSSE(buffer);

      expect(events).toHaveLength(1);
      expect(events[0].data).toEqual({ items: [1, 2, 3] });
    });
  });

  describe("SSE comments (heartbeats)", () => {
    it("should ignore SSE comment lines", () => {
      const buffer = ': heartbeat\n\nevent: chunk\ndata: {"content": "Hello"}\n\n';
      const { events, remaining } = parseSSE(buffer);

      expect(events).toHaveLength(1);
      expect(events[0].type).toBe("chunk");
      expect(events[0].data).toEqual({ content: "Hello" });
      expect(remaining).toBe("");
    });

    it("should ignore multiple heartbeat comments between events", () => {
      const buffer =
        'event: chunk\ndata: {"content": "A"}\n\n' +
        ': heartbeat\n\n' +
        ': heartbeat\n\n' +
        'event: chunk\ndata: {"content": "B"}\n\n';
      const { events, remaining } = parseSSE(buffer);

      expect(events).toHaveLength(2);
      expect(events[0].data).toEqual({ content: "A" });
      expect(events[1].data).toEqual({ content: "B" });
      expect(remaining).toBe("");
    });

    it("should ignore heartbeat-only buffer", () => {
      const buffer = ': heartbeat\n\n';
      const { events, remaining } = parseSSE(buffer);

      expect(events).toHaveLength(0);
      expect(remaining).toBe("");
    });
  });

  describe("streaming simulation", () => {
    it("should handle chunked SSE data accumulation", () => {
      // Simulate receiving data in chunks
      let buffer = "";
      const allEvents: SSEEvent[] = [];

      // First chunk - partial
      buffer += 'event: chunk\ndata: {"part": ';
      let result = parseSSE(buffer);
      expect(result.events).toHaveLength(0);
      buffer = result.remaining;

      // Second chunk - completes first event, starts second
      buffer += '"one"}\n\nevent: chunk\ndata: {"pa';
      result = parseSSE(buffer);
      expect(result.events).toHaveLength(1);
      allEvents.push(...result.events);
      buffer = result.remaining;

      // Third chunk - completes second event
      buffer += 'rt": "two"}\n\n';
      result = parseSSE(buffer);
      expect(result.events).toHaveLength(1);
      allEvents.push(...result.events);

      expect(allEvents).toHaveLength(2);
      expect(allEvents[0].data).toEqual({ part: "one" });
      expect(allEvents[1].data).toEqual({ part: "two" });
    });
  });
});
