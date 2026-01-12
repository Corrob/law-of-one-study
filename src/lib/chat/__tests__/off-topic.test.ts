import {
  OFF_TOPIC_MESSAGE,
  OFF_TOPIC_SUGGESTIONS,
  getOffTopicResponse,
  streamOffTopicResponse,
} from "../off-topic";

describe("off-topic", () => {
  describe("constants", () => {
    it("should have a redirect message", () => {
      expect(OFF_TOPIC_MESSAGE).toContain("outside my focus");
      expect(OFF_TOPIC_MESSAGE).toContain("Ra Material");
    });

    it("should have welcoming suggestions", () => {
      expect(OFF_TOPIC_SUGGESTIONS).toHaveLength(3);
      expect(OFF_TOPIC_SUGGESTIONS).toContain("What is the Law of One?");
      expect(OFF_TOPIC_SUGGESTIONS).toContain("Tell me about densities");
    });
  });

  describe("getOffTopicResponse", () => {
    it("should return message and suggestions", () => {
      const result = getOffTopicResponse();

      expect(result.message).toBe(OFF_TOPIC_MESSAGE);
      expect(result.suggestions).toBe(OFF_TOPIC_SUGGESTIONS);
    });
  });

  describe("streamOffTopicResponse", () => {
    it("should stream the off-topic response via SSE", async () => {
      const events: Array<{ event: string; data: object }> = [];
      const send = jest.fn((event: string, data: object) => {
        events.push({ event, data });
      });

      await streamOffTopicResponse(send);

      // Should send meta event first
      expect(events[0]).toEqual({
        event: "meta",
        data: { quotes: [], intent: "off-topic", confidence: "high" },
      });

      // Should send the message as a single chunk
      const chunks = events.filter((e) => e.event === "chunk");
      expect(chunks).toHaveLength(1);
      expect(chunks[0]).toEqual({
        event: "chunk",
        data: { type: "text", content: OFF_TOPIC_MESSAGE },
      });

      // Should send suggestions
      const suggestionsEvent = events.find((e) => e.event === "suggestions");
      expect(suggestionsEvent).toEqual({
        event: "suggestions",
        data: { items: OFF_TOPIC_SUGGESTIONS },
      });

      // Should send done event
      const doneEvent = events.find((e) => e.event === "done");
      expect(doneEvent).toEqual({
        event: "done",
        data: {},
      });
    });
  });
});
