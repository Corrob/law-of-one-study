import { renderHook, act } from "@testing-library/react";
import { useFullscreen } from "../useFullscreen";

function setFullscreenElement(el: Element | null) {
  Object.defineProperty(document, "fullscreenElement", {
    value: el,
    configurable: true,
    writable: true,
  });
}

describe("useFullscreen", () => {
  beforeEach(() => {
    Object.defineProperty(document, "fullscreenEnabled", {
      value: true,
      configurable: true,
    });
    setFullscreenElement(null);
    document.exitFullscreen = jest.fn(() => Promise.resolve());
  });

  it("reports whether the browser supports fullscreen", () => {
    const { result } = renderHook(() => useFullscreen<HTMLElement>());
    expect(result.current.canFullscreen).toBe(true);
  });

  it("requests fullscreen on the ref element when not fullscreen", () => {
    const { result } = renderHook(() => useFullscreen<HTMLElement>());
    const el = document.createElement("main");
    el.requestFullscreen = jest.fn(() => Promise.resolve());
    result.current.ref.current = el;

    act(() => result.current.toggle());
    expect(el.requestFullscreen).toHaveBeenCalledTimes(1);
    expect(document.exitFullscreen).not.toHaveBeenCalled();
  });

  it("exits fullscreen when already in fullscreen", () => {
    setFullscreenElement(document.createElement("main"));
    const { result } = renderHook(() => useFullscreen<HTMLElement>());

    act(() => result.current.toggle());
    expect(document.exitFullscreen).toHaveBeenCalledTimes(1);
  });

  it("tracks the fullscreenchange event", () => {
    const { result } = renderHook(() => useFullscreen<HTMLElement>());
    expect(result.current.isFullscreen).toBe(false);

    act(() => {
      setFullscreenElement(document.createElement("main"));
      document.dispatchEvent(new Event("fullscreenchange"));
    });
    expect(result.current.isFullscreen).toBe(true);

    act(() => {
      setFullscreenElement(null);
      document.dispatchEvent(new Event("fullscreenchange"));
    });
    expect(result.current.isFullscreen).toBe(false);
  });
});
