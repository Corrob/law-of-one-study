import { renderHook, act } from "@testing-library/react";
import { useAudioClock } from "../useAudioClock";

type Listener = () => void;

/** Minimal stand-in for an <audio> element with a fireable event registry. */
function makeAudio(currentTime = 0) {
  const listeners: Record<string, Listener[]> = {};
  return {
    currentTime,
    addEventListener: jest.fn((ev: string, fn: Listener) => {
      (listeners[ev] ||= []).push(fn);
    }),
    removeEventListener: jest.fn((ev: string, fn: Listener) => {
      listeners[ev] = (listeners[ev] || []).filter((f) => f !== fn);
    }),
    _fire(ev: string) {
      (listeners[ev] || []).forEach((f) => f());
    },
  };
}

function clockFor(audio: ReturnType<typeof makeAudio>) {
  const ref = { current: audio as unknown as HTMLAudioElement };
  // smooth:false keeps the rAF loop off; the timeupdate path is what we test.
  return renderHook(() => useAudioClock(ref, false, { smooth: false }));
}

describe("useAudioClock", () => {
  it("getTime reads the audio element's currentTime", () => {
    const audio = makeAudio(5);
    const { result } = clockFor(audio);
    expect(result.current.getTime()).toBe(5);
  });

  it("pushes the current time to a new subscriber immediately", () => {
    const audio = makeAudio(3);
    const { result } = clockFor(audio);
    const cb = jest.fn();
    act(() => {
      result.current.subscribe(cb);
    });
    expect(cb).toHaveBeenCalledWith(3);
  });

  it("notifies subscribers on timeupdate, and stops after unsubscribe", () => {
    const audio = makeAudio(0);
    const { result } = clockFor(audio);
    const cb = jest.fn();
    let unsubscribe: () => void = () => {};
    act(() => {
      unsubscribe = result.current.subscribe(cb);
    });

    cb.mockClear();
    audio.currentTime = 10;
    act(() => audio._fire("timeupdate"));
    expect(cb).toHaveBeenCalledWith(10);

    cb.mockClear();
    act(() => unsubscribe());
    audio.currentTime = 20;
    act(() => audio._fire("timeupdate"));
    expect(cb).not.toHaveBeenCalled();
  });

  it("removes its event listener on unmount", () => {
    const audio = makeAudio(0);
    const ref = { current: audio as unknown as HTMLAudioElement };
    const { unmount } = renderHook(() =>
      useAudioClock(ref, false, { smooth: false })
    );
    expect(audio.addEventListener).toHaveBeenCalledWith(
      "timeupdate",
      expect.any(Function)
    );
    unmount();
    expect(audio.removeEventListener).toHaveBeenCalledWith(
      "timeupdate",
      expect.any(Function)
    );
  });
});
