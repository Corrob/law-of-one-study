import { useEffect, useRef } from "react";

export interface MediaSessionTrack {
  title: string;
  artist: string;
  album: string;
  /** URL of the cover artwork. */
  artworkSrc: string;
}

export interface MediaSessionHandlers {
  play: () => void;
  pause: () => void;
  previousTrack: () => void;
  nextTrack: () => void;
  seekTo?: (time: number) => void;
}

const SESSION_ACTIONS: MediaSessionAction[] = [
  "play",
  "pause",
  "previoustrack",
  "nexttrack",
  "seekto",
];

/**
 * Publishes the current track to the OS Media Session (lock screen / media keys
 * / notification controls) and wires the transport actions back to the player.
 *
 * Beyond the visible controls, an active media session is what lets a PWA keep
 * audio playing in the background on mobile and advance track-to-track from the
 * lock screen. No-ops where the API is unavailable (e.g. iOS in-browser, SSR).
 */
export function useMediaSession(
  track: MediaSessionTrack | null,
  isPlaying: boolean,
  handlers: MediaSessionHandlers
) {
  // Keep the latest handlers in a ref so action handlers register once.
  const handlersRef = useRef(handlers);
  useEffect(() => {
    handlersRef.current = handlers;
  });

  const supported =
    typeof navigator !== "undefined" && "mediaSession" in navigator;
  const active = track != null;

  // Track metadata. Keyed on the primitive fields so a fresh object literal from
  // the caller each render doesn't rebuild metadata needlessly.
  useEffect(() => {
    if (!supported) return;
    if (!track) {
      navigator.mediaSession.metadata = null;
      return;
    }
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: track.artist,
      album: track.album,
      artwork: [
        { src: track.artworkSrc, sizes: "768x768", type: "image/webp" },
      ],
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supported, track?.title, track?.artist, track?.album, track?.artworkSrc]);

  // Playback state (drives the lock-screen play/pause icon).
  useEffect(() => {
    if (!supported) return;
    navigator.mediaSession.playbackState = !active
      ? "none"
      : isPlaying
        ? "playing"
        : "paused";
  }, [supported, active, isPlaying]);

  // Action handlers — registered once; always invoke the latest callbacks.
  useEffect(() => {
    if (!supported) return;
    const ms = navigator.mediaSession;
    const safeSet = (
      action: MediaSessionAction,
      handler: MediaSessionActionHandler | null
    ) => {
      try {
        ms.setActionHandler(action, handler);
      } catch {
        // Action unsupported in this browser — ignore.
      }
    };

    safeSet("play", () => handlersRef.current.play());
    safeSet("pause", () => handlersRef.current.pause());
    safeSet("previoustrack", () => handlersRef.current.previousTrack());
    safeSet("nexttrack", () => handlersRef.current.nextTrack());
    safeSet("seekto", (details) => {
      if (details.seekTime != null) handlersRef.current.seekTo?.(details.seekTime);
    });

    return () => {
      SESSION_ACTIONS.forEach((action) => safeSet(action, null));
    };
  }, [supported]);
}
