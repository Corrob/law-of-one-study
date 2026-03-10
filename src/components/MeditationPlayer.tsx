"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { PlayIcon, PauseIcon, LoopIcon } from "./icons";
import { getAudioPath, type Meditation } from "@/data/meditations";

interface MeditationPlayerProps {
  meditation: Meditation;
  autoPlay?: boolean;
}

const LOOP_STORAGE_KEY = "meditation-loop-enabled";

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function MeditationPlayer({ meditation, autoPlay = false }: MeditationPlayerProps) {
  const t = useTranslations("meditate");
  const locale = useLocale();
  const audioRef = useRef<HTMLAudioElement>(null);
  const shouldAutoPlay = useRef(autoPlay);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(meditation.durationSeconds);
  const [audioAvailable, setAudioAvailable] = useState(true);
  const [audioError, setAudioError] = useState(false);
  const [isLooping, setIsLooping] = useState(true);
  const hasHydrated = useRef(false);

  const audioPath = getAudioPath(meditation, locale);

  // Hydrate loop preference from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(LOOP_STORAGE_KEY);
    if (stored !== null) {
      setIsLooping(stored === "true");
    }
    hasHydrated.current = true;
  }, []);

  // Sync loop state to audio element and localStorage (skip until hydrated)
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.loop = isLooping;
    }
    if (hasHydrated.current) {
      localStorage.setItem(LOOP_STORAGE_KEY, String(isLooping));
    }
  }, [isLooping]);

  const toggleLoop = useCallback(() => {
    setIsLooping((prev) => !prev);
  }, []);

  // Track autoPlay intent for when audio becomes ready
  useEffect(() => {
    shouldAutoPlay.current = autoPlay;
  }, [autoPlay]);

  // Reset state when meditation changes
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(meditation.durationSeconds);
    setAudioError(false);
    setAudioAvailable(true);
    shouldAutoPlay.current = autoPlay;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [meditation.id, meditation.durationSeconds, autoPlay]);

  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
      setAudioAvailable(true);
      if (shouldAutoPlay.current) {
        shouldAutoPlay.current = false;
        audioRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch(() => {
          setAudioError(true);
          setAudioAvailable(false);
        });
      }
    }
  }, []);

  const handleAudioError = useCallback(() => {
    setAudioError(true);
    setAudioAvailable(false);
    setIsPlaying(false);
  }, []);

  const handleEnded = useCallback(() => {
    // When loop is on, the browser handles replay — no state reset needed
    if (!isLooping) {
      setIsPlaying(false);
      setCurrentTime(0);
    }
  }, [isLooping]);

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

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = Number(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  }, []);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Audio element */}
      <audio
        ref={audioRef}
        src={audioPath}
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onError={handleAudioError}
        onEnded={handleEnded}
      />

      {/* Player controls */}
      {audioError ? (
        <div className="text-center py-6 space-y-2">
          <p className="text-[var(--lo1-gold)] text-sm font-medium">
            {t("audioNotAvailable")}
          </p>
          <p className="text-[var(--lo1-stardust)] text-xs">
            {t("audioNotAvailableDesc")}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Play/Pause button + time */}
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              className="flex items-center justify-center w-14 h-14 rounded-full
                       bg-[var(--lo1-gold)] text-[var(--lo1-deep-space)]
                       hover:bg-[var(--lo1-gold-light)] transition-colors
                       shadow-[0_0_20px_rgba(212,168,83,0.3)]
                       cursor-pointer shrink-0"
              aria-label={isPlaying ? t("pause") : t("play")}
            >
              {isPlaying ? (
                <PauseIcon className="w-6 h-6" />
              ) : (
                <PlayIcon className="w-6 h-6 ml-0.5" />
              )}
            </button>
            <div className="flex-1 space-y-1 min-w-0">
              <div className="flex justify-between text-xs text-[var(--lo1-stardust)]">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
              {/* Progress bar */}
              <div className="relative h-2 bg-[var(--lo1-celestial)]/30 rounded-full overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-[var(--lo1-gold)] rounded-full transition-[width] duration-200"
                  style={{ width: `${progress}%` }}
                />
                <input
                  type="range"
                  min={0}
                  max={duration}
                  step={1}
                  value={currentTime}
                  onChange={handleSeek}
                  className="absolute inset-0 w-full opacity-0 cursor-pointer"
                  aria-label="Seek"
                />
              </div>
            </div>
            <button
              onClick={toggleLoop}
              className={`flex items-center justify-center w-9 h-9 rounded-full
                         transition-colors cursor-pointer shrink-0 ${
                           isLooping
                             ? "text-[var(--lo1-gold)] bg-[var(--lo1-gold)]/15"
                             : "text-[var(--lo1-stardust)] hover:text-[var(--lo1-starlight)]"
                         }`}
              aria-label={isLooping ? t("loopOn") : t("loopOff")}
              aria-pressed={isLooping}
            >
              <LoopIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
