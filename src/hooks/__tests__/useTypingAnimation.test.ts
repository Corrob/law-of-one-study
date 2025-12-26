import { renderHook, act } from "@testing-library/react";
import { useTypingAnimation, useQuoteAnimation } from "../useTypingAnimation";

describe("useTypingAnimation", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  describe("basic functionality", () => {
    it("should initialize with empty text", () => {
      const { result } = renderHook(() => useTypingAnimation(""));

      expect(result.current.displayedText).toBe("");
      expect(result.current.isAnimating).toBe(false);
      expect(result.current.isComplete).toBe(true);
    });

    it("should animate text word by word", () => {
      const text = "Hello world test";
      const { result } = renderHook(() => useTypingAnimation(text, { speed: 40 }));

      expect(result.current.displayedText).toBe("");
      expect(result.current.isAnimating).toBe(true);

      // Advance by one word
      act(() => {
        jest.advanceTimersByTime(40);
      });
      expect(result.current.displayedText).toBe("Hello ");

      // Advance by another word
      act(() => {
        jest.advanceTimersByTime(40);
      });
      expect(result.current.displayedText).toBe("Hello world ");

      // Advance by final word
      act(() => {
        jest.advanceTimersByTime(40);
      });
      expect(result.current.displayedText).toBe("Hello world test");

      // Need one more tick to clear the interval and set isAnimating to false
      act(() => {
        jest.advanceTimersByTime(40);
      });
      expect(result.current.isAnimating).toBe(false);
      expect(result.current.isComplete).toBe(true);
    });

    it("should respect custom speed", () => {
      const text = "Hello world";
      const { result } = renderHook(() => useTypingAnimation(text, { speed: 100 }));

      act(() => {
        jest.advanceTimersByTime(99);
      });
      expect(result.current.displayedText).toBe("");

      act(() => {
        jest.advanceTimersByTime(1);
      });
      expect(result.current.displayedText).toBe("Hello ");
    });

    it("should split text into words preserving whitespace", () => {
      const text = "Word1   Word2";
      const { result } = renderHook(() => useTypingAnimation(text, { speed: 10 }));

      act(() => {
        jest.advanceTimersByTime(10);
      });
      expect(result.current.displayedText).toBe("Word1   ");

      act(() => {
        jest.advanceTimersByTime(10);
      });
      expect(result.current.displayedText).toBe("Word1   Word2");
    });
  });

  describe("state management", () => {
    it("should update isAnimating flag correctly", () => {
      const text = "Test text";
      const { result } = renderHook(() => useTypingAnimation(text));

      expect(result.current.isAnimating).toBe(true);

      act(() => {
        jest.runAllTimers();
      });

      expect(result.current.isAnimating).toBe(false);
    });

    it("should update isComplete flag correctly", () => {
      const text = "Test";
      const { result } = renderHook(() => useTypingAnimation(text));

      expect(result.current.isComplete).toBe(false);

      act(() => {
        jest.runAllTimers();
      });

      expect(result.current.isComplete).toBe(true);
    });

    it("should handle empty string updates", () => {
      const { result, rerender } = renderHook(({ text }) => useTypingAnimation(text), {
        initialProps: { text: "Hello" },
      });

      act(() => {
        jest.runAllTimers();
      });

      rerender({ text: "" });

      expect(result.current.displayedText).toBe("");
      expect(result.current.isComplete).toBe(true);
    });
  });

  describe("reset function", () => {
    it("should reset animation state", () => {
      const text = "Test text";
      const { result } = renderHook(() => useTypingAnimation(text));

      act(() => {
        jest.advanceTimersByTime(80);
      });

      expect(result.current.displayedText).not.toBe("");

      act(() => {
        result.current.reset();
      });

      expect(result.current.displayedText).toBe("");
      expect(result.current.isAnimating).toBe(false);
    });

    it("should clear intervals when reset", () => {
      const text = "Test text";
      const { result } = renderHook(() => useTypingAnimation(text));

      act(() => {
        result.current.reset();
        jest.runAllTimers();
      });

      expect(result.current.displayedText).toBe("");
    });
  });

  describe("complete function", () => {
    it("should instantly show all text", () => {
      const text = "This is a longer text";
      const { result } = renderHook(() => useTypingAnimation(text));

      act(() => {
        jest.advanceTimersByTime(40);
      });

      expect(result.current.displayedText).not.toBe(text);

      act(() => {
        result.current.complete();
      });

      expect(result.current.displayedText).toBe(text);
      expect(result.current.isAnimating).toBe(false);
      expect(result.current.isComplete).toBe(true);
    });

    it("should call onComplete callback", () => {
      const onComplete = jest.fn();
      const text = "Test";
      const { result } = renderHook(() => useTypingAnimation(text, { onComplete }));

      act(() => {
        result.current.complete();
      });

      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it("should clear intervals when completed", () => {
      const text = "Test text";
      const { result } = renderHook(() => useTypingAnimation(text));

      act(() => {
        result.current.complete();
        jest.runAllTimers();
      });

      // Should not continue animating
      expect(result.current.displayedText).toBe(text);
    });
  });

  describe("incremental updates", () => {
    it("should handle streaming text updates", () => {
      const { result, rerender } = renderHook(({ text }) => useTypingAnimation(text), {
        initialProps: { text: "Hello" },
      });

      act(() => {
        jest.runAllTimers();
      });

      expect(result.current.displayedText).toBe("Hello");

      rerender({ text: "Hello world" });

      act(() => {
        jest.runAllTimers();
      });

      expect(result.current.displayedText).toBe("Hello world");
    });

    it("should only animate new words when text is appended", () => {
      const { result, rerender } = renderHook(
        ({ text }) => useTypingAnimation(text, { speed: 40 }),
        { initialProps: { text: "Word1 Word2" } }
      );

      act(() => {
        jest.runAllTimers();
      });

      const firstComplete = result.current.displayedText;

      rerender({ text: "Word1 Word2 Word3" });

      act(() => {
        jest.advanceTimersByTime(40);
      });

      expect(result.current.displayedText).toBe("Word1 Word2 Word3");
    });
  });

  describe("cleanup", () => {
    it("should clear intervals on unmount", () => {
      const { unmount } = renderHook(() => useTypingAnimation("Test text"));

      unmount();

      // Should not throw or cause issues
      act(() => {
        jest.runAllTimers();
      });
    });
  });
});

describe("useQuoteAnimation", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  describe("basic functionality", () => {
    it("should initialize with empty text", () => {
      const { result } = renderHook(() => useQuoteAnimation(""));

      expect(result.current.displayedText).toBe("");
      expect(result.current.isComplete).toBe(false);
    });

    it("should animate text word by word", () => {
      const text = "Ra: I am Ra.";
      const { result } = renderHook(() => useQuoteAnimation(text, { speed: 50 }));

      expect(result.current.displayedText).toBe("");

      act(() => {
        jest.advanceTimersByTime(50);
      });
      expect(result.current.displayedText).toContain("Ra: ");

      act(() => {
        jest.advanceTimersByTime(50);
      });
      expect(result.current.displayedText).toContain("I ");
    });

    it("should set isComplete when animation finishes", () => {
      const text = "Short text";
      const { result } = renderHook(() => useQuoteAnimation(text, { speed: 10 }));

      expect(result.current.isComplete).toBe(false);

      act(() => {
        jest.runAllTimers();
      });

      expect(result.current.isComplete).toBe(true);
      expect(result.current.displayedText).toBe(text);
    });
  });

  describe("start delay", () => {
    it("should respect startDelay option", () => {
      const text = "Test";
      const { result } = renderHook(() => useQuoteAnimation(text, { speed: 50, startDelay: 200 }));

      // Before delay
      act(() => {
        jest.advanceTimersByTime(199);
      });
      expect(result.current.displayedText).toBe("");

      // After delay
      act(() => {
        jest.advanceTimersByTime(1);
      });

      // Now animation should start
      act(() => {
        jest.advanceTimersByTime(50);
      });
      expect(result.current.displayedText).not.toBe("");
    });

    it("should not animate until delay passes", () => {
      const text = "Delayed text";
      const { result } = renderHook(() => useQuoteAnimation(text, { speed: 50, startDelay: 1000 }));

      act(() => {
        jest.advanceTimersByTime(500);
      });
      expect(result.current.displayedText).toBe("");
    });
  });

  describe("onComplete callback", () => {
    it("should call onComplete when animation finishes", () => {
      const onComplete = jest.fn();
      const text = "Test";

      renderHook(() => useQuoteAnimation(text, { speed: 10, onComplete }));

      act(() => {
        jest.runAllTimers();
      });

      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it("should not call onComplete before animation finishes", () => {
      const onComplete = jest.fn();
      const text = "Test text here";

      renderHook(() => useQuoteAnimation(text, { speed: 100, onComplete }));

      act(() => {
        jest.advanceTimersByTime(200);
      });

      expect(onComplete).not.toHaveBeenCalled();
    });

    it("should call updated onComplete callback", () => {
      const onComplete1 = jest.fn();
      const onComplete2 = jest.fn();
      const text = "Test";

      const { rerender } = renderHook(
        ({ callback }) => useQuoteAnimation(text, { speed: 100, onComplete: callback }),
        { initialProps: { callback: onComplete1 } }
      );

      rerender({ callback: onComplete2 });

      act(() => {
        jest.runAllTimers();
      });

      expect(onComplete1).not.toHaveBeenCalled();
      expect(onComplete2).toHaveBeenCalledTimes(1);
    });
  });

  describe("text updates", () => {
    it("should restart animation when text changes", () => {
      const { result, rerender } = renderHook(
        ({ text }) => useQuoteAnimation(text, { speed: 50 }),
        { initialProps: { text: "First text" } }
      );

      act(() => {
        jest.runAllTimers();
      });

      expect(result.current.isComplete).toBe(true);

      rerender({ text: "Second text" });

      expect(result.current.displayedText).toBe("");
      expect(result.current.isComplete).toBe(false);
    });

    it("should handle empty text updates", () => {
      const { result, rerender } = renderHook(({ text }) => useQuoteAnimation(text), {
        initialProps: { text: "Some text" },
      });

      rerender({ text: "" });

      expect(result.current.displayedText).toBe("");
      expect(result.current.isComplete).toBe(false);
    });
  });

  describe("cleanup", () => {
    it("should clear timers on unmount", () => {
      const { unmount } = renderHook(() =>
        useQuoteAnimation("Test", { speed: 50, startDelay: 100 })
      );

      unmount();

      act(() => {
        jest.runAllTimers();
      });

      // Should not cause any issues
    });

    it("should clear interval when text changes", () => {
      const onComplete = jest.fn();
      const { rerender } = renderHook(
        ({ text }) => useQuoteAnimation(text, { speed: 50, onComplete }),
        { initialProps: { text: "First" } }
      );

      act(() => {
        jest.advanceTimersByTime(25);
      });

      rerender({ text: "Second" });

      act(() => {
        jest.runAllTimers();
      });

      // Should only be called once for the second text
      expect(onComplete).toHaveBeenCalledTimes(1);
    });
  });
});
