import { encodeSSEEvent, encodeSSEComment, startHeartbeat, createSSESender, SSE_HEADERS } from "../sse-encoder";

describe("sse-encoder", () => {
  describe("encodeSSEEvent", () => {
    it("should encode event with type and JSON data", () => {
      const result = encodeSSEEvent("chunk", { type: "text", content: "Hello" });
      const decoded = new TextDecoder().decode(result);

      expect(decoded).toBe('event: chunk\ndata: {"type":"text","content":"Hello"}\n\n');
    });

    it("should encode empty data object", () => {
      const result = encodeSSEEvent("done", {});
      const decoded = new TextDecoder().decode(result);

      expect(decoded).toBe("event: done\ndata: {}\n\n");
    });
  });

  describe("encodeSSEComment", () => {
    it("should encode default heartbeat comment", () => {
      const result = encodeSSEComment();
      const decoded = new TextDecoder().decode(result);

      expect(decoded).toBe(": heartbeat\n\n");
    });

    it("should encode custom comment text", () => {
      const result = encodeSSEComment("keepalive");
      const decoded = new TextDecoder().decode(result);

      expect(decoded).toBe(": keepalive\n\n");
    });

    it("should start with colon (SSE comment format)", () => {
      const decoded = new TextDecoder().decode(encodeSSEComment());
      expect(decoded.startsWith(":")).toBe(true);
    });

    it("should end with double newline", () => {
      const decoded = new TextDecoder().decode(encodeSSEComment());
      expect(decoded.endsWith("\n\n")).toBe(true);
    });
  });

  describe("startHeartbeat", () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("should send heartbeat comments at the specified interval", () => {
      const enqueue = jest.fn();
      const controller = { enqueue } as unknown as ReadableStreamDefaultController<Uint8Array>;

      const stop = startHeartbeat(controller, 1000);

      expect(enqueue).not.toHaveBeenCalled();

      jest.advanceTimersByTime(1000);
      expect(enqueue).toHaveBeenCalledTimes(1);

      jest.advanceTimersByTime(1000);
      expect(enqueue).toHaveBeenCalledTimes(2);

      // Verify the content is a heartbeat comment
      const decoded = new TextDecoder().decode(enqueue.mock.calls[0][0]);
      expect(decoded).toBe(": heartbeat\n\n");

      stop();
    });

    it("should stop sending when cleanup function is called", () => {
      const enqueue = jest.fn();
      const controller = { enqueue } as unknown as ReadableStreamDefaultController<Uint8Array>;

      const stop = startHeartbeat(controller, 1000);

      jest.advanceTimersByTime(1000);
      expect(enqueue).toHaveBeenCalledTimes(1);

      stop();

      jest.advanceTimersByTime(5000);
      expect(enqueue).toHaveBeenCalledTimes(1);
    });

    it("should handle controller errors gracefully", () => {
      const enqueue = jest.fn().mockImplementation(() => {
        throw new Error("Controller closed");
      });
      const controller = { enqueue } as unknown as ReadableStreamDefaultController<Uint8Array>;

      const stop = startHeartbeat(controller, 1000);

      // Should not throw
      jest.advanceTimersByTime(1000);
      expect(enqueue).toHaveBeenCalledTimes(1);

      // After error, interval should be cleared - no more calls
      jest.advanceTimersByTime(5000);
      expect(enqueue).toHaveBeenCalledTimes(1);

      stop();
    });
  });

  describe("createSSESender", () => {
    it("should create a sender that enqueues encoded events", () => {
      const enqueue = jest.fn();
      const controller = { enqueue } as unknown as ReadableStreamDefaultController<Uint8Array>;

      const send = createSSESender(controller);
      send("chunk", { type: "text", content: "Hi" });

      expect(enqueue).toHaveBeenCalledTimes(1);
      const decoded = new TextDecoder().decode(enqueue.mock.calls[0][0]);
      expect(decoded).toContain("event: chunk");
      expect(decoded).toContain('"content":"Hi"');
    });

    it("should silently ignore errors from closed controller", () => {
      const enqueue = jest.fn().mockImplementation(() => {
        throw new TypeError("Invalid state: Controller is already closed");
      });
      const controller = { enqueue } as unknown as ReadableStreamDefaultController<Uint8Array>;

      const send = createSSESender(controller);

      // Should not throw
      expect(() => send("chunk", { type: "text", content: "Hi" })).not.toThrow();
    });
  });

  describe("SSE_HEADERS", () => {
    it("should include correct content type", () => {
      expect(SSE_HEADERS["Content-Type"]).toBe("text/event-stream");
    });

    it("should disable caching", () => {
      expect(SSE_HEADERS["Cache-Control"]).toBe("no-cache");
    });

    it("should keep connection alive", () => {
      expect(SSE_HEADERS.Connection).toBe("keep-alive");
    });
  });

  // Note: createSSEResponse is not tested here because Response is not available
  // in the Node test environment. It's a thin wrapper tested via E2E tests.
});
