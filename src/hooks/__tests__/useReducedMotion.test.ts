import { renderHook, act, waitFor } from "@testing-library/react";
import { useReducedMotion } from "../useReducedMotion";

describe("useReducedMotion", () => {
  let listeners: Map<string, (e: MediaQueryListEvent) => void>;
  let matchesMock: boolean;

  const mockMatchMedia = (matches = false) => {
    listeners = new Map();
    matchesMock = matches;

    Object.defineProperty(window, "matchMedia", {
      writable: true,
      configurable: true,
      value: jest.fn().mockImplementation((query: string) => ({
        matches: matchesMock,
        media: query,
        addEventListener: jest.fn(
          (event: string, handler: (e: MediaQueryListEvent) => void) => {
            listeners.set(event, handler);
          }
        ),
        removeEventListener: jest.fn(
          (event: string, _handler: (e: MediaQueryListEvent) => void) => {
            listeners.delete(event);
          }
        ),
      })),
    });
  };

  beforeEach(() => {
    mockMatchMedia();
  });

  it("returns false by default (no reduced motion)", () => {
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
  });

  it("returns true when matchMedia matches", async () => {
    mockMatchMedia(true);

    const { result } = renderHook(() => useReducedMotion());
    await waitFor(() => {
      expect(result.current).toBe(true);
    });
  });

  it("responds to change event", () => {
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);

    const changeHandler = listeners.get("change");
    expect(changeHandler).toBeDefined();

    act(() => {
      changeHandler!({ matches: true } as MediaQueryListEvent);
    });

    expect(result.current).toBe(true);

    act(() => {
      changeHandler!({ matches: false } as MediaQueryListEvent);
    });

    expect(result.current).toBe(false);
  });

  it("cleans up the same listener on unmount", () => {
    const { unmount } = renderHook(() => useReducedMotion());

    const mq = (window.matchMedia as jest.Mock).mock.results[0].value;
    const addedHandler = mq.addEventListener.mock.calls[0][1];
    expect(addedHandler).toBeInstanceOf(Function);

    unmount();

    const removedHandler = mq.removeEventListener.mock.calls[0][1];
    expect(removedHandler).toBe(addedHandler);
  });
});
