import { renderHook } from "@testing-library/react";
import { useMediaSession, type MediaSessionHandlers } from "../useMediaSession";

type ActionFn = (details: { seekTime?: number }) => void;

const track = {
  title: "First Breath",
  artist: "The Wanderer's Return",
  album: "The Wanderer's Return",
  artworkSrc: "/album/song-01-cover.webp",
};

function makeHandlers(): MediaSessionHandlers {
  return {
    play: jest.fn(),
    pause: jest.fn(),
    previousTrack: jest.fn(),
    nextTrack: jest.fn(),
    seekTo: jest.fn(),
  };
}

describe("useMediaSession", () => {
  let actionHandlers: Map<string, ActionFn | null>;
  let mediaSession: {
    metadata: { title?: string } | null;
    playbackState: string;
    setActionHandler: jest.Mock;
  };

  beforeEach(() => {
    actionHandlers = new Map();
    mediaSession = {
      metadata: null,
      playbackState: "none",
      setActionHandler: jest.fn((action: string, handler: ActionFn | null) => {
        actionHandlers.set(action, handler);
      }),
    };
    Object.defineProperty(navigator, "mediaSession", {
      value: mediaSession,
      configurable: true,
    });
    (global as unknown as { MediaMetadata: unknown }).MediaMetadata = class {
      constructor(init: Record<string, unknown>) {
        Object.assign(this, init);
      }
    };
  });

  it("publishes metadata and the playing state", () => {
    renderHook(() => useMediaSession(track, true, makeHandlers()));
    expect(mediaSession.metadata?.title).toBe("First Breath");
    expect(mediaSession.playbackState).toBe("playing");
  });

  it("registers transport action handlers and reflects the paused state", () => {
    renderHook(() => useMediaSession(track, false, makeHandlers()));
    expect(mediaSession.playbackState).toBe("paused");
    for (const action of ["play", "pause", "previoustrack", "nexttrack", "seekto"]) {
      expect(actionHandlers.get(action)).toBeInstanceOf(Function);
    }
  });

  it("routes actions to the provided handlers", () => {
    const handlers = makeHandlers();
    renderHook(() => useMediaSession(track, true, handlers));
    actionHandlers.get("nexttrack")?.({});
    expect(handlers.nextTrack).toHaveBeenCalledTimes(1);
    actionHandlers.get("previoustrack")?.({});
    expect(handlers.previousTrack).toHaveBeenCalledTimes(1);
    actionHandlers.get("seekto")?.({ seekTime: 42 });
    expect(handlers.seekTo).toHaveBeenCalledWith(42);
  });

  it("clears the session when there is no track", () => {
    renderHook(() => useMediaSession(null, false, makeHandlers()));
    expect(mediaSession.metadata).toBeNull();
    expect(mediaSession.playbackState).toBe("none");
  });
});
