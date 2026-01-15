import { renderHook, act } from "@testing-library/react";
import { useAnimationQueue } from "../useAnimationQueue";
import { AnimationChunk, TextChunk, QuoteChunk } from "@/lib/types";

// Mock debug
jest.mock("@/lib/debug", () => ({
  debug: { log: jest.fn() },
}));

describe("useAnimationQueue", () => {
  const createTextChunk = (id: string, content: string): TextChunk => ({
    id,
    type: "text",
    content,
  });

  const createQuoteChunk = (id: string, reference: string): QuoteChunk => ({
    id,
    type: "quote",
    quote: {
      text: `Quote text for ${reference}`,
      reference,
      url: `https://www.llresearch.org/channeling/ra-contact/${reference}`,
    },
  });

  describe("initial state", () => {
    it("should have empty initial state", () => {
      const { result } = renderHook(() => useAnimationQueue());

      expect(result.current.allChunks).toEqual([]);
      expect(result.current.completedChunks).toEqual([]);
      expect(result.current.currentChunk).toBeNull();
      expect(result.current.isAnimating).toBe(false);
      expect(result.current.isFullyComplete).toBe(false);
      expect(result.current.queueLength).toBe(0);
    });
  });

  describe("addChunk", () => {
    it("should add chunk to queue", () => {
      const { result } = renderHook(() => useAnimationQueue());

      act(() => {
        result.current.addChunk(createTextChunk("1", "Hello"));
      });

      // After adding, chunk should become current (pulled from queue)
      expect(result.current.currentChunk).not.toBeNull();
      expect(result.current.isAnimating).toBe(true);
    });

    it("should queue multiple chunks", () => {
      const { result } = renderHook(() => useAnimationQueue());

      act(() => {
        result.current.addChunk(createTextChunk("1", "First"));
        result.current.addChunk(createTextChunk("2", "Second"));
        result.current.addChunk(createTextChunk("3", "Third"));
      });

      // First chunk becomes current, rest in queue
      expect(result.current.currentChunk?.id).toBe("1");
      expect(result.current.queueLength).toBe(2);
    });

    it("should handle text and quote chunks", () => {
      const { result } = renderHook(() => useAnimationQueue());

      act(() => {
        result.current.addChunk(createTextChunk("1", "Text"));
        result.current.addChunk(createQuoteChunk("2", "50.7"));
        result.current.addChunk(createTextChunk("3", "More text"));
      });

      expect(result.current.allChunks).toHaveLength(3);
      expect(result.current.allChunks[0].type).toBe("text");
      expect(result.current.allChunks[1].type).toBe("quote");
    });
  });

  describe("onChunkComplete", () => {
    it("should move current chunk to completed", () => {
      const { result } = renderHook(() => useAnimationQueue());

      act(() => {
        result.current.addChunk(createTextChunk("1", "Hello"));
      });

      expect(result.current.currentChunk?.id).toBe("1");

      act(() => {
        result.current.onChunkComplete();
      });

      expect(result.current.completedChunks).toHaveLength(1);
      expect(result.current.completedChunks[0].id).toBe("1");
    });

    it("should pull next chunk from queue after completion", () => {
      const { result } = renderHook(() => useAnimationQueue());

      act(() => {
        result.current.addChunk(createTextChunk("1", "First"));
        result.current.addChunk(createTextChunk("2", "Second"));
      });

      act(() => {
        result.current.onChunkComplete();
      });

      expect(result.current.currentChunk?.id).toBe("2");
      expect(result.current.completedChunks).toHaveLength(1);
    });

    it("should do nothing if no current chunk", () => {
      const { result } = renderHook(() => useAnimationQueue());

      act(() => {
        result.current.onChunkComplete();
      });

      expect(result.current.completedChunks).toEqual([]);
    });

    it("should process entire queue in sequence", () => {
      const { result } = renderHook(() => useAnimationQueue());

      act(() => {
        result.current.addChunk(createTextChunk("1", "First"));
        result.current.addChunk(createTextChunk("2", "Second"));
        result.current.addChunk(createTextChunk("3", "Third"));
      });

      // Complete all chunks
      act(() => {
        result.current.onChunkComplete(); // Complete "1", pull "2"
      });
      act(() => {
        result.current.onChunkComplete(); // Complete "2", pull "3"
      });
      act(() => {
        result.current.onChunkComplete(); // Complete "3"
      });

      expect(result.current.completedChunks).toHaveLength(3);
      expect(result.current.currentChunk).toBeNull();
      expect(result.current.queueLength).toBe(0);
    });
  });

  describe("isAnimating", () => {
    it("should be true when there is a current chunk", () => {
      const { result } = renderHook(() => useAnimationQueue());

      act(() => {
        result.current.addChunk(createTextChunk("1", "Hello"));
      });

      expect(result.current.isAnimating).toBe(true);
    });

    it("should be false when no current chunk", () => {
      const { result } = renderHook(() => useAnimationQueue());

      expect(result.current.isAnimating).toBe(false);
    });
  });

  describe("isFullyComplete", () => {
    it("should be false initially", () => {
      const { result } = renderHook(() => useAnimationQueue());

      expect(result.current.isFullyComplete).toBe(false);
    });

    it("should be false while animating", () => {
      const { result } = renderHook(() => useAnimationQueue());

      act(() => {
        result.current.addChunk(createTextChunk("1", "Hello"));
      });

      expect(result.current.isFullyComplete).toBe(false);
    });

    it("should be true when all chunks completed", () => {
      const { result } = renderHook(() => useAnimationQueue());

      act(() => {
        result.current.addChunk(createTextChunk("1", "Hello"));
      });

      act(() => {
        result.current.onChunkComplete();
      });

      expect(result.current.isFullyComplete).toBe(true);
    });

    it("should be false if queue still has items", () => {
      const { result } = renderHook(() => useAnimationQueue());

      act(() => {
        result.current.addChunk(createTextChunk("1", "First"));
        result.current.addChunk(createTextChunk("2", "Second"));
      });

      act(() => {
        result.current.onChunkComplete();
      });

      expect(result.current.isFullyComplete).toBe(false);
    });
  });

  describe("allChunks", () => {
    it("should include completed, current, and queued chunks", () => {
      const { result } = renderHook(() => useAnimationQueue());

      act(() => {
        result.current.addChunk(createTextChunk("1", "First"));
        result.current.addChunk(createTextChunk("2", "Second"));
        result.current.addChunk(createTextChunk("3", "Third"));
      });

      act(() => {
        result.current.onChunkComplete(); // 1 completed, 2 current, 3 queued
      });

      expect(result.current.allChunks).toHaveLength(3);
      expect(result.current.allChunks[0].id).toBe("1"); // completed
      expect(result.current.allChunks[1].id).toBe("2"); // current
      expect(result.current.allChunks[2].id).toBe("3"); // queued
    });
  });

  describe("reset", () => {
    it("should clear all state", () => {
      const { result } = renderHook(() => useAnimationQueue());

      act(() => {
        result.current.addChunk(createTextChunk("1", "First"));
        result.current.addChunk(createTextChunk("2", "Second"));
        result.current.onChunkComplete();
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.allChunks).toEqual([]);
      expect(result.current.completedChunks).toEqual([]);
      expect(result.current.currentChunk).toBeNull();
      expect(result.current.queueLength).toBe(0);
      expect(result.current.isAnimating).toBe(false);
      expect(result.current.isFullyComplete).toBe(false);
    });
  });

  describe("queue behavior", () => {
    it("should maintain FIFO order", () => {
      const { result } = renderHook(() => useAnimationQueue());
      const completionOrder: string[] = [];

      act(() => {
        result.current.addChunk(createTextChunk("A", "Alpha"));
        result.current.addChunk(createTextChunk("B", "Beta"));
        result.current.addChunk(createTextChunk("C", "Charlie"));
      });

      // Complete all and track order
      while (result.current.currentChunk) {
        completionOrder.push(result.current.currentChunk.id);
        act(() => {
          result.current.onChunkComplete();
        });
      }

      expect(completionOrder).toEqual(["A", "B", "C"]);
    });

    it("should handle rapid additions during animation", () => {
      const { result } = renderHook(() => useAnimationQueue());

      act(() => {
        result.current.addChunk(createTextChunk("1", "First"));
      });

      // Add more while first is current
      act(() => {
        result.current.addChunk(createTextChunk("2", "Second"));
        result.current.addChunk(createTextChunk("3", "Third"));
      });

      expect(result.current.currentChunk?.id).toBe("1");
      expect(result.current.queueLength).toBe(2);
    });
  });
});
