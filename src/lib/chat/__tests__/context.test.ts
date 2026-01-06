import { buildConversationContext, ConversationMeta } from "../context";
import { ChatMessage } from "@/lib/types";

describe("chat/context", () => {
  describe("buildConversationContext", () => {
    describe("turn counting", () => {
      it("should return turnCount of 1 for empty history", () => {
        const history: ChatMessage[] = [];
        const result = buildConversationContext(history);

        expect(result.turnCount).toBe(1); // Current message is turn 1
      });

      it("should count user messages for turn count", () => {
        const history: ChatMessage[] = [
          { role: "user", content: "Hello" },
          { role: "assistant", content: "Hi there" },
        ];
        const result = buildConversationContext(history);

        expect(result.turnCount).toBe(2); // 1 previous user message + 1 for current
      });

      it("should count multiple user turns correctly", () => {
        const history: ChatMessage[] = [
          { role: "user", content: "First question" },
          { role: "assistant", content: "First answer" },
          { role: "user", content: "Second question" },
          { role: "assistant", content: "Second answer" },
          { role: "user", content: "Third question" },
          { role: "assistant", content: "Third answer" },
        ];
        const result = buildConversationContext(history);

        expect(result.turnCount).toBe(4); // 3 previous user messages + 1 for current
      });

      it("should only count user messages, not assistant messages", () => {
        const history: ChatMessage[] = [
          { role: "assistant", content: "Welcome!" },
          { role: "assistant", content: "How can I help?" },
        ];
        const result = buildConversationContext(history);

        expect(result.turnCount).toBe(1); // No user messages, so just current turn
      });
    });

    describe("quotes collection", () => {
      it("should return empty quotesUsed for history without quotes", () => {
        const history: ChatMessage[] = [
          { role: "user", content: "Hello" },
          { role: "assistant", content: "Hi" },
        ];
        const result = buildConversationContext(history);

        expect(result.quotesUsed).toEqual([]);
      });

      it("should collect quotes from assistant messages", () => {
        const history: ChatMessage[] = [
          { role: "user", content: "Tell me about the Law of One" },
          {
            role: "assistant",
            content: "Here is what Ra says...",
            quotesUsed: ["1.1", "1.2"],
          },
        ];
        const result = buildConversationContext(history);

        expect(result.quotesUsed).toEqual(["1.1", "1.2"]);
      });

      it("should collect quotes from multiple messages", () => {
        const history: ChatMessage[] = [
          { role: "user", content: "Question 1" },
          { role: "assistant", content: "Answer 1", quotesUsed: ["50.7"] },
          { role: "user", content: "Question 2" },
          {
            role: "assistant",
            content: "Answer 2",
            quotesUsed: ["51.1", "51.2"],
          },
        ];
        const result = buildConversationContext(history);

        expect(result.quotesUsed).toEqual(["50.7", "51.1", "51.2"]);
      });

      it("should handle messages with empty quotesUsed array", () => {
        const history: ChatMessage[] = [
          { role: "user", content: "Hello" },
          { role: "assistant", content: "Hi", quotesUsed: [] },
        ];
        const result = buildConversationContext(history);

        expect(result.quotesUsed).toEqual([]);
      });

      it("should handle user messages with quotesUsed (edge case)", () => {
        const history: ChatMessage[] = [
          { role: "user", content: "About 50.7...", quotesUsed: ["50.7"] },
        ];
        const result = buildConversationContext(history);

        expect(result.quotesUsed).toEqual(["50.7"]);
      });

      it("should filter out falsy values from quotesUsed", () => {
        const history: ChatMessage[] = [
          {
            role: "assistant",
            content: "Answer",
            quotesUsed: ["1.1", "", "1.2"],
          },
        ];
        const result = buildConversationContext(history);

        // Filter should remove empty strings
        expect(result.quotesUsed).not.toContain("");
      });
    });

    describe("combined behavior", () => {
      it("should return correct metadata for typical conversation", () => {
        const history: ChatMessage[] = [
          { role: "user", content: "What is the Law of One?" },
          {
            role: "assistant",
            content: "The Law of One is...",
            quotesUsed: ["1.1"],
          },
          { role: "user", content: "Tell me more about unity" },
          {
            role: "assistant",
            content: "Unity is a key concept...",
            quotesUsed: ["4.20", "6.14"],
          },
          { role: "user", content: "How does this relate to meditation?" },
          { role: "assistant", content: "Meditation is discussed...", quotesUsed: ["5.2"] },
        ];
        const result = buildConversationContext(history);

        expect(result.turnCount).toBe(4); // 3 user messages + 1 current
        expect(result.quotesUsed).toEqual(["1.1", "4.20", "6.14", "5.2"]);
      });

      it("should handle long conversation history", () => {
        const history: ChatMessage[] = [];
        for (let i = 0; i < 20; i++) {
          history.push({ role: "user", content: `Question ${i}` });
          history.push({
            role: "assistant",
            content: `Answer ${i}`,
            quotesUsed: [`${i}.1`],
          });
        }

        const result = buildConversationContext(history);

        expect(result.turnCount).toBe(21); // 20 user messages + 1 current
        expect(result.quotesUsed).toHaveLength(20);
      });
    });

    describe("return type", () => {
      it("should return ConversationMeta type", () => {
        const result = buildConversationContext([]);

        expect(result).toHaveProperty("turnCount");
        expect(result).toHaveProperty("quotesUsed");
        expect(typeof result.turnCount).toBe("number");
        expect(Array.isArray(result.quotesUsed)).toBe(true);
      });
    });
  });
});
