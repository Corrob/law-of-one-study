import {
  createChatError,
  isChatError,
  toChatError,
  ChatError,
  ChatErrorCode,
} from "../errors";

describe("chat/errors", () => {
  describe("createChatError", () => {
    it("should create an error with correct code", () => {
      const error = createChatError("AUGMENTATION_FAILED");
      expect(error.code).toBe("AUGMENTATION_FAILED");
    });

    it("should include user-friendly message", () => {
      const error = createChatError("AUGMENTATION_FAILED");
      expect(error.userMessage).toBe(
        "I had trouble understanding your question. Please try rephrasing it."
      );
    });

    it("should set retryable flag correctly", () => {
      const retryableError = createChatError("AUGMENTATION_FAILED");
      expect(retryableError.retryable).toBe(true);

      const nonRetryableError = createChatError("VALIDATION_ERROR");
      expect(nonRetryableError.retryable).toBe(false);
    });

    it("should include cause when provided", () => {
      const cause = new Error("Original error");
      const error = createChatError("SEARCH_FAILED", cause);

      expect(error.cause).toBe(cause);
      expect(error.message).toContain("SEARCH_FAILED");
      expect(error.message).toContain("Original error");
    });

    it("should be an instance of Error", () => {
      const error = createChatError("UNKNOWN_ERROR");
      expect(error).toBeInstanceOf(Error);
    });

    describe("all error codes", () => {
      const errorCodes: ChatErrorCode[] = [
        "AUGMENTATION_FAILED",
        "EMBEDDING_FAILED",
        "SEARCH_FAILED",
        "STREAM_FAILED",
        "QUOTE_PROCESSING_FAILED",
        "SUGGESTIONS_FAILED",
        "RATE_LIMITED",
        "VALIDATION_ERROR",
        "UNKNOWN_ERROR",
      ];

      it.each(errorCodes)("should handle %s error code", (code) => {
        const error = createChatError(code);
        expect(error.code).toBe(code);
        expect(typeof error.userMessage).toBe("string");
        expect(typeof error.retryable).toBe("boolean");
      });

      it("should have unique user messages for user-facing errors", () => {
        const userFacingCodes = errorCodes.filter(
          (code) => code !== "SUGGESTIONS_FAILED"
        );
        const messages = userFacingCodes.map(
          (code) => createChatError(code).userMessage
        );
        const uniqueMessages = new Set(messages);
        expect(uniqueMessages.size).toBe(userFacingCodes.length);
      });
    });

    describe("specific error types", () => {
      it("SUGGESTIONS_FAILED should have empty user message (silent failure)", () => {
        const error = createChatError("SUGGESTIONS_FAILED");
        expect(error.userMessage).toBe("");
        expect(error.retryable).toBe(false);
      });

      it("RATE_LIMITED should be retryable", () => {
        const error = createChatError("RATE_LIMITED");
        expect(error.retryable).toBe(true);
        expect(error.userMessage).toContain("Too many requests");
      });

      it("VALIDATION_ERROR should not be retryable", () => {
        const error = createChatError("VALIDATION_ERROR");
        expect(error.retryable).toBe(false);
      });

      it("QUOTE_PROCESSING_FAILED should not be retryable", () => {
        const error = createChatError("QUOTE_PROCESSING_FAILED");
        expect(error.retryable).toBe(false);
        expect(error.userMessage).toContain("incomplete");
      });
    });
  });

  describe("isChatError", () => {
    it("should return true for ChatError", () => {
      const error = createChatError("UNKNOWN_ERROR");
      expect(isChatError(error)).toBe(true);
    });

    it("should return false for regular Error", () => {
      const error = new Error("Regular error");
      expect(isChatError(error)).toBe(false);
    });

    it("should return false for null", () => {
      expect(isChatError(null)).toBe(false);
    });

    it("should return false for undefined", () => {
      expect(isChatError(undefined)).toBe(false);
    });

    it("should return false for string", () => {
      expect(isChatError("error string")).toBe(false);
    });

    it("should return false for object without required properties", () => {
      expect(isChatError({ code: "TEST" })).toBe(false);
      expect(isChatError({ userMessage: "test" })).toBe(false);
      expect(isChatError({ retryable: true })).toBe(false);
    });

    it("should return false for Error-like object missing properties", () => {
      const errorLike = Object.assign(new Error("test"), { code: "TEST" });
      expect(isChatError(errorLike)).toBe(false);
    });

    it("should return true for manually constructed ChatError-like object", () => {
      const error = Object.assign(new Error("test"), {
        code: "UNKNOWN_ERROR" as ChatErrorCode,
        userMessage: "Test message",
        retryable: true,
      });
      expect(isChatError(error)).toBe(true);
    });
  });

  describe("toChatError", () => {
    it("should return same error if already a ChatError", () => {
      const original = createChatError("SEARCH_FAILED");
      const result = toChatError(original);

      expect(result).toBe(original);
      expect(result.code).toBe("SEARCH_FAILED");
    });

    it("should convert regular Error to ChatError", () => {
      const original = new Error("Something went wrong");
      const result = toChatError(original);

      expect(isChatError(result)).toBe(true);
      expect(result.code).toBe("UNKNOWN_ERROR");
      expect(result.cause).toBe(original);
    });

    it("should convert string to ChatError", () => {
      const result = toChatError("error message");

      expect(isChatError(result)).toBe(true);
      expect(result.code).toBe("UNKNOWN_ERROR");
      expect(result.cause?.message).toBe("error message");
    });

    it("should convert null to ChatError", () => {
      const result = toChatError(null);

      expect(isChatError(result)).toBe(true);
      expect(result.code).toBe("UNKNOWN_ERROR");
      expect(result.cause?.message).toBe("null");
    });

    it("should convert undefined to ChatError", () => {
      const result = toChatError(undefined);

      expect(isChatError(result)).toBe(true);
      expect(result.code).toBe("UNKNOWN_ERROR");
      expect(result.cause?.message).toBe("undefined");
    });

    it("should convert number to ChatError", () => {
      const result = toChatError(404);

      expect(isChatError(result)).toBe(true);
      expect(result.code).toBe("UNKNOWN_ERROR");
      expect(result.cause?.message).toBe("404");
    });

    it("should convert object to ChatError", () => {
      const result = toChatError({ status: 500, message: "Internal error" });

      expect(isChatError(result)).toBe(true);
      expect(result.code).toBe("UNKNOWN_ERROR");
    });

    it("should preserve original error as cause", () => {
      const original = new Error("Original");
      const result = toChatError(original);

      expect(result.cause).toBe(original);
      expect(result.message).toContain("Original");
    });
  });

  describe("error message formatting", () => {
    it("should include error code in message", () => {
      const error = createChatError("EMBEDDING_FAILED");
      expect(error.message).toBe("EMBEDDING_FAILED");
    });

    it("should include cause message in error message", () => {
      const cause = new Error("Connection timeout");
      const error = createChatError("SEARCH_FAILED", cause);
      expect(error.message).toBe("SEARCH_FAILED: Connection timeout");
    });
  });
});
