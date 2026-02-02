/**
 * @jest-environment jsdom
 */

import { renderHook, act } from "@testing-library/react";
import { useStreamRecovery } from "../useStreamRecovery";

// Mock config
jest.mock("@/lib/config", () => ({
  STREAM_RECOVERY_CONFIG: {
    cacheTtlSeconds: 300,
    staleTimeoutMs: 5_000,
    forceFinalizeDelayMs: 3_000,
    minHiddenForRecoveryMs: 10_000,
    responseIdStorageKey: "lo1-response-id",
  },
}));

jest.mock("@/lib/debug", () => ({
  debug: { log: jest.fn() },
}));

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("useStreamRecovery", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    sessionStorage.clear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("responseId management", () => {
    it("should start with null responseId", () => {
      const { result } = renderHook(() => useStreamRecovery());
      expect(result.current.responseId).toBeNull();
    });

    it("should store responseId in state and sessionStorage", () => {
      const { result } = renderHook(() => useStreamRecovery());

      act(() => {
        result.current.setResponseId("test-id-123");
      });

      expect(result.current.responseId).toBe("test-id-123");
      expect(sessionStorage.getItem("lo1-response-id")).toBe("test-id-123");
    });
  });

  describe("visibility tracking", () => {
    it("should start with wasBackgrounded = false", () => {
      const { result } = renderHook(() => useStreamRecovery());
      expect(result.current.wasBackgrounded).toBe(false);
    });

    it("should set wasBackgrounded when page becomes visible after being hidden", () => {
      const { result } = renderHook(() => useStreamRecovery());

      // Simulate going hidden
      act(() => {
        Object.defineProperty(document, "hidden", { value: true, configurable: true });
        document.dispatchEvent(new Event("visibilitychange"));
      });

      // Simulate coming back
      act(() => {
        Object.defineProperty(document, "hidden", { value: false, configurable: true });
        document.dispatchEvent(new Event("visibilitychange"));
      });

      expect(result.current.wasBackgrounded).toBe(true);
    });

    it("should clear wasBackgrounded flag", () => {
      const { result } = renderHook(() => useStreamRecovery());

      // Set backgrounded
      act(() => {
        Object.defineProperty(document, "hidden", { value: true, configurable: true });
        document.dispatchEvent(new Event("visibilitychange"));
      });
      act(() => {
        Object.defineProperty(document, "hidden", { value: false, configurable: true });
        document.dispatchEvent(new Event("visibilitychange"));
      });

      expect(result.current.wasBackgrounded).toBe(true);

      act(() => {
        result.current.clearBackgrounded();
      });

      expect(result.current.wasBackgrounded).toBe(false);
    });
  });

  describe("registerStreamAbort", () => {
    it("should abort the registered controller after stale timeout on mobile resume", () => {
      const { result } = renderHook(() => useStreamRecovery());
      const abortController = new AbortController();

      act(() => {
        result.current.registerStreamAbort(abortController);
      });

      // Simulate mobile backgrounding: hidden for longer than minHiddenForRecoveryMs
      act(() => {
        Object.defineProperty(document, "hidden", { value: true, configurable: true });
        document.dispatchEvent(new Event("visibilitychange"));
      });

      // Advance time to simulate mobile OS suspending the app (>10s)
      act(() => {
        jest.advanceTimersByTime(15_000);
      });

      act(() => {
        Object.defineProperty(document, "hidden", { value: false, configurable: true });
        document.dispatchEvent(new Event("visibilitychange"));
      });

      expect(abortController.signal.aborted).toBe(false);

      // Advance past stale timeout (5000ms)
      act(() => {
        jest.advanceTimersByTime(5_000);
      });

      expect(abortController.signal.aborted).toBe(true);
    });

    it("should NOT abort on short desktop tab switch", () => {
      const { result } = renderHook(() => useStreamRecovery());
      const abortController = new AbortController();

      act(() => {
        result.current.registerStreamAbort(abortController);
      });

      // Simulate desktop tab switch: hidden for only 2 seconds
      act(() => {
        Object.defineProperty(document, "hidden", { value: true, configurable: true });
        document.dispatchEvent(new Event("visibilitychange"));
      });

      act(() => {
        jest.advanceTimersByTime(2_000);
      });

      act(() => {
        Object.defineProperty(document, "hidden", { value: false, configurable: true });
        document.dispatchEvent(new Event("visibilitychange"));
      });

      // Advance well past stale timeout — should still not abort
      act(() => {
        jest.advanceTimersByTime(30_000);
      });

      expect(abortController.signal.aborted).toBe(false);
    });

    it("should not abort if registerStreamAbort(null) is called before timeout", () => {
      const { result } = renderHook(() => useStreamRecovery());
      const abortController = new AbortController();

      act(() => {
        result.current.registerStreamAbort(abortController);
      });

      // Simulate mobile backgrounding (long hidden duration)
      act(() => {
        Object.defineProperty(document, "hidden", { value: true, configurable: true });
        document.dispatchEvent(new Event("visibilitychange"));
      });
      act(() => {
        jest.advanceTimersByTime(15_000);
      });
      act(() => {
        Object.defineProperty(document, "hidden", { value: false, configurable: true });
        document.dispatchEvent(new Event("visibilitychange"));
      });

      // Unregister before stale timeout fires (stream completed normally)
      act(() => {
        result.current.registerStreamAbort(null);
      });

      act(() => {
        jest.advanceTimersByTime(10_000);
      });

      expect(abortController.signal.aborted).toBe(false);
    });
  });

  describe("recoverFromServer", () => {
    it("should return cached events on success", async () => {
      const mockResponse = {
        events: [
          { event: "chunk", data: { type: "text", content: "Hello" } },
          { event: "done", data: {} },
        ],
        complete: true,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useStreamRecovery());

      let recovered: Awaited<ReturnType<typeof result.current.recoverFromServer>>;
      await act(async () => {
        recovered = await result.current.recoverFromServer("test-id");
      });

      expect(mockFetch).toHaveBeenCalledWith("/api/chat/recover?id=test-id");
      expect(recovered!).toEqual(mockResponse);
    });

    it("should return null on 404", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const { result } = renderHook(() => useStreamRecovery());

      let recovered: Awaited<ReturnType<typeof result.current.recoverFromServer>>;
      await act(async () => {
        recovered = await result.current.recoverFromServer("nonexistent");
      });

      expect(recovered!).toBeNull();
    });

    it("should return null on network error", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const { result } = renderHook(() => useStreamRecovery());

      let recovered: Awaited<ReturnType<typeof result.current.recoverFromServer>>;
      await act(async () => {
        recovered = await result.current.recoverFromServer("test-id");
      });

      expect(recovered!).toBeNull();
    });

    it("should return null when response fails Zod validation", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ unexpected: "shape" }),
      });

      const { result } = renderHook(() => useStreamRecovery());

      let recovered: Awaited<ReturnType<typeof result.current.recoverFromServer>>;
      await act(async () => {
        recovered = await result.current.recoverFromServer("test-id");
      });

      expect(recovered!).toBeNull();
    });
  });
});
