import {
  validateMessage,
  validateHistory,
  validateChatRequest,
  validationErrorResponse,
} from "../validation";
import { VALIDATION_LIMITS } from "@/lib/config";

describe("validation", () => {
  describe("validateMessage", () => {
    it("should reject null message", () => {
      const result = validateMessage(null);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("required");
      expect(result.status).toBe(400);
    });

    it("should reject undefined message", () => {
      const result = validateMessage(undefined);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("required");
    });

    it("should reject non-string message", () => {
      const result = validateMessage(123);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("string");
    });

    it("should reject empty message", () => {
      const result = validateMessage("");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("empty");
    });

    it("should reject message exceeding max length", () => {
      const longMessage = "a".repeat(VALIDATION_LIMITS.maxMessageLength + 1);
      const result = validateMessage(longMessage);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("too long");
    });

    it("should accept valid message", () => {
      const result = validateMessage("What is the Law of One?");
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should accept message at max length", () => {
      const maxMessage = "a".repeat(VALIDATION_LIMITS.maxMessageLength);
      const result = validateMessage(maxMessage);
      expect(result.valid).toBe(true);
    });
  });

  describe("validateHistory", () => {
    it("should reject non-array history", () => {
      const result = validateHistory("not an array");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("array");
    });

    it("should reject history exceeding max length", () => {
      const longHistory = Array(VALIDATION_LIMITS.maxHistoryLength + 1).fill({
        role: "user",
        content: "test",
      });
      const result = validateHistory(longHistory);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("too long");
    });

    it("should reject invalid message object in history", () => {
      const result = validateHistory([null]);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("Invalid history format");
    });

    it("should reject invalid role in history", () => {
      const result = validateHistory([{ role: "system", content: "test" }]);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("Invalid message role");
    });

    it("should reject missing role in history", () => {
      const result = validateHistory([{ content: "test" }]);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("Invalid message role");
    });

    it("should reject invalid content in history", () => {
      const result = validateHistory([{ role: "user", content: 123 }]);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("Invalid message content");
    });

    it("should reject missing content in history", () => {
      const result = validateHistory([{ role: "user" }]);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("Invalid message content");
    });

    it("should reject history message exceeding max length", () => {
      const longContent = "a".repeat(VALIDATION_LIMITS.maxHistoryMessageLength + 1);
      const result = validateHistory([{ role: "user", content: longContent }]);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("too long");
    });

    it("should accept valid history", () => {
      const result = validateHistory([
        { role: "user", content: "Hello" },
        { role: "assistant", content: "Hi there" },
      ]);
      expect(result.valid).toBe(true);
    });

    it("should accept empty history", () => {
      const result = validateHistory([]);
      expect(result.valid).toBe(true);
    });
  });

  describe("validateChatRequest", () => {
    it("should validate both message and history", () => {
      const result = validateChatRequest("Hello", [
        { role: "user", content: "Previous" },
      ]);
      expect(result.valid).toBe(true);
    });

    it("should fail on invalid message", () => {
      const result = validateChatRequest("", []);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("empty");
    });

    it("should fail on invalid history", () => {
      const result = validateChatRequest("Hello", "not an array");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("array");
    });
  });

  describe("validationErrorResponse", () => {
    // Mock Response for Node.js test environment
    const originalResponse = global.Response;

    beforeAll(() => {
      global.Response = class MockResponse {
        status: number;
        headers: Map<string, string>;
        private body: string;

        constructor(body: string, init?: { status?: number; headers?: Record<string, string> }) {
          this.body = body;
          this.status = init?.status || 200;
          this.headers = new Map(Object.entries(init?.headers || {}));
        }

        async json() {
          return JSON.parse(this.body);
        }
      } as unknown as typeof Response;
    });

    afterAll(() => {
      global.Response = originalResponse;
    });

    it("should create a Response with error message", async () => {
      const result = { valid: false, error: "Test error", status: 400 };
      const response = validationErrorResponse(result);

      expect(response.status).toBe(400);
      expect(response.headers.get("Content-Type")).toBe("application/json");

      const body = await response.json();
      expect(body.error).toBe("Test error");
    });

    it("should default to 400 status if not provided", async () => {
      const result = { valid: false, error: "Test error" };
      const response = validationErrorResponse(result);

      expect(response.status).toBe(400);
    });
  });
});
