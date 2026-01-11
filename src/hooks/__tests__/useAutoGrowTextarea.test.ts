/**
 * Tests for useAutoGrowTextarea hook
 */

import { renderHook, act } from "@testing-library/react";
import { useAutoGrowTextarea } from "../useAutoGrowTextarea";

describe("useAutoGrowTextarea", () => {
  const originalInnerWidth = window.innerWidth;

  beforeEach(() => {
    // Reset window width
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1024,
    });
  });

  afterEach(() => {
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
  });

  it("returns a textarea ref", () => {
    const { result } = renderHook(() =>
      useAutoGrowTextarea({ value: "" })
    );

    expect(result.current.textareaRef).toBeDefined();
    expect(result.current.textareaRef.current).toBeNull();
  });

  it("returns desktop max height by default on wide screens", () => {
    Object.defineProperty(window, "innerWidth", { value: 1024 });

    const { result } = renderHook(() =>
      useAutoGrowTextarea({ value: "" })
    );

    expect(result.current.maxHeight).toBe(300);
  });

  it("returns mobile max height on narrow screens", () => {
    Object.defineProperty(window, "innerWidth", { value: 400 });

    const { result } = renderHook(() =>
      useAutoGrowTextarea({ value: "" })
    );

    expect(result.current.maxHeight).toBe(220);
  });

  it("uses custom max heights when provided", () => {
    Object.defineProperty(window, "innerWidth", { value: 400 });

    const { result } = renderHook(() =>
      useAutoGrowTextarea({
        value: "",
        maxHeightMobile: 150,
        maxHeightDesktop: 400,
      })
    );

    expect(result.current.maxHeight).toBe(150);
  });

  it("updates max height on window resize", () => {
    Object.defineProperty(window, "innerWidth", { value: 1024 });

    const { result } = renderHook(() =>
      useAutoGrowTextarea({ value: "" })
    );

    expect(result.current.maxHeight).toBe(300);

    // Simulate resize to mobile
    act(() => {
      Object.defineProperty(window, "innerWidth", { value: 400 });
      window.dispatchEvent(new Event("resize"));
    });

    expect(result.current.maxHeight).toBe(220);
  });

  it("cleans up resize listener on unmount", () => {
    const removeEventListenerSpy = jest.spyOn(window, "removeEventListener");

    const { unmount } = renderHook(() =>
      useAutoGrowTextarea({ value: "" })
    );

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "resize",
      expect.any(Function)
    );

    removeEventListenerSpy.mockRestore();
  });
});
