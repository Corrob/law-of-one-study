import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Core HTMLAudioElement management, lifted from the pattern in
 * MeditationPlayer.tsx so the music player can reuse it without touching the
 * meditation feature. Handles play/pause, seek, duration, iOS autoplay-policy
 * rejection, and graceful "audio not available" degradation.
 *
 * The consumer renders the <audio> element and spreads `audioEventProps` onto
 * it, with `ref={audioRef}`.
 */
export interface UseAudioPlayerArgs {
  /** Shown as the duration until the real value loads from metadata. */
  durationFallback?: number;
  autoPlay?: boolean;
  /**
   * Identifier of the current source (e.g. song id). When it changes, autoplay
   * is re-armed so a *persistent* <audio> element keeps playing track-to-track —
   * the key to uninterrupted mobile/PWA background playback, where creating a
   * fresh element per track gets its play() blocked.
   */
  srcKey?: string;
  /** Called when the track finishes (e.g. to advance the album). */
  onEnded?: () => void;
}

export function useAudioPlayer({
  durationFallback = 0,
  autoPlay = false,
  srcKey,
  onEnded,
}: UseAudioPlayerArgs = {}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const shouldAutoPlay = useRef(autoPlay);
  const onEndedRef = useRef(onEnded);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(durationFallback);
  const [audioAvailable, setAudioAvailable] = useState(true);
  const [audioError, setAudioError] = useState(false);

  useEffect(() => {
    onEndedRef.current = onEnded;
  }, [onEnded]);
  useEffect(() => {
    shouldAutoPlay.current = autoPlay;
  }, [autoPlay]);

  // On track change, re-arm autoplay and reset the displayed clock so the
  // persistent element flows from one song into the next.
  useEffect(() => {
    if (srcKey === undefined) return;
    shouldAutoPlay.current = autoPlay;
    setCurrentTime(0);
    setDuration(durationFallback);
    setAudioError(false);
    setAudioAvailable(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [srcKey]);

  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    if (!audioRef.current) return;
    setDuration(audioRef.current.duration);
    setAudioAvailable(true);
    if (shouldAutoPlay.current) {
      shouldAutoPlay.current = false;
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {
          // Autoplay blocked (iOS/Safari) — wait for a user gesture.
          setIsPlaying(false);
        });
    }
  }, []);

  const handleError = useCallback(() => {
    setAudioError(true);
    setAudioAvailable(false);
    setIsPlaying(false);
  }, []);

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    onEndedRef.current?.();
  }, []);

  const togglePlay = useCallback(async () => {
    if (!audioRef.current || !audioAvailable) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch {
        setAudioError(true);
        setAudioAvailable(false);
      }
    }
  }, [isPlaying, audioAvailable]);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  return {
    audioRef,
    isPlaying,
    currentTime,
    duration,
    audioAvailable,
    audioError,
    togglePlay,
    seek,
    /** Spread onto the <audio> element (plus `ref={audioRef}` and `src`). */
    audioEventProps: {
      onTimeUpdate: handleTimeUpdate,
      onLoadedMetadata: handleLoadedMetadata,
      onError: handleError,
      onEnded: handleEnded,
    },
  };
}
