import { renderHook, act } from "@testing-library/react";
import { useWakeLock } from "../useWakeLock";

interface FakeSentinel {
  release: jest.Mock;
  addEventListener: jest.Mock;
}

function makeSentinel(): FakeSentinel {
  return {
    release: jest.fn(() => Promise.resolve()),
    addEventListener: jest.fn(),
  };
}

function setWakeLock(request: jest.Mock | undefined) {
  if (request) {
    Object.defineProperty(navigator, "wakeLock", {
      value: { request },
      configurable: true,
    });
  } else {
    // Remove support.
    Reflect.deleteProperty(navigator as unknown as Record<string, unknown>, "wakeLock");
  }
}

function setVisibility(state: DocumentVisibilityState) {
  Object.defineProperty(document, "visibilityState", {
    value: state,
    configurable: true,
  });
}

describe("useWakeLock", () => {
  afterEach(() => {
    setWakeLock(undefined);
    jest.clearAllMocks();
  });

  it("does nothing when the Wake Lock API is unavailable", () => {
    setWakeLock(undefined);
    // Should not throw.
    expect(() => renderHook(() => useWakeLock(true))).not.toThrow();
  });

  it("acquires a screen wake lock when active", async () => {
    const sentinel = makeSentinel();
    const request = jest.fn(() => Promise.resolve(sentinel));
    setWakeLock(request);

    await act(async () => {
      renderHook(() => useWakeLock(true));
    });

    expect(request).toHaveBeenCalledWith("screen");
  });

  it("does not acquire a lock when inactive", async () => {
    const request = jest.fn(() => Promise.resolve(makeSentinel()));
    setWakeLock(request);

    await act(async () => {
      renderHook(() => useWakeLock(false));
    });

    expect(request).not.toHaveBeenCalled();
  });

  it("releases the lock when it becomes inactive", async () => {
    const sentinel = makeSentinel();
    const request = jest.fn(() => Promise.resolve(sentinel));
    setWakeLock(request);

    const { rerender } = renderHook(({ active }) => useWakeLock(active), {
      initialProps: { active: true },
    });
    await act(async () => {});

    await act(async () => {
      rerender({ active: false });
    });

    expect(sentinel.release).toHaveBeenCalled();
  });

  it("re-acquires the lock when the page becomes visible again", async () => {
    const request = jest.fn(() => Promise.resolve(makeSentinel()));
    setWakeLock(request);
    setVisibility("visible");

    const sentinel = makeSentinel();
    request.mockImplementation(() => Promise.resolve(sentinel));

    await act(async () => {
      renderHook(() => useWakeLock(true));
    });
    // First acquisition on mount.
    expect(request).toHaveBeenCalledTimes(1);

    // The browser auto-releases the lock while the page is hidden, which fires
    // the sentinel's "release" event and clears our held reference.
    const releaseHandler = sentinel.addEventListener.mock.calls.find(
      ([type]) => type === "release"
    )?.[1] as (() => void) | undefined;
    act(() => {
      releaseHandler?.();
    });

    // Coming back to a visible page re-acquires it.
    await act(async () => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(request).toHaveBeenCalledTimes(2);
  });
});
