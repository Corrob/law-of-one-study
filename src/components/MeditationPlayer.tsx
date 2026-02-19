"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { PlayIcon, PauseIcon } from "./icons";
import type { Meditation } from "@/data/meditations";

interface MeditationPlayerProps {
  meditation: Meditation;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function MeditationPlayer({ meditation }: MeditationPlayerProps) {
  const t = useTranslations("meditate");
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(meditation.durationSeconds);
  const [audioAvailable, setAudioAvailable] = useState(true);
  const [audioError, setAudioError] = useState(false);

  const audioPath = `/meditations/${meditation.audioFile}`;

  // Reset state when meditation changes
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(meditation.durationSeconds);
    setAudioError(false);
    setAudioAvailable(true);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [meditation.id, meditation.durationSeconds]);

  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
      setAudioAvailable(true);
    }
  }, []);

  const handleAudioError = useCallback(() => {
    setAudioError(true);
    setAudioAvailable(false);
    setIsPlaying(false);
  }, []);

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    setCurrentTime(0);
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
          <div className="flex items-center gap-4">
            <button
              onClick={togglePlay}
              className="flex items-center justify-center w-14 h-14 rounded-full
                       bg-[var(--lo1-gold)] text-[var(--lo1-deep-space)]
                       hover:bg-[var(--lo1-gold-light)] transition-colors
                       shadow-[0_0_20px_rgba(212,168,83,0.3)]
                       cursor-pointer"
              aria-label={isPlaying ? t("pause") : t("play")}
            >
              {isPlaying ? (
                <PauseIcon className="w-6 h-6" />
              ) : (
                <PlayIcon className="w-6 h-6 ml-0.5" />
              )}
            </button>
            <div className="flex-1 space-y-1">
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
                  value={currentTime}
                  onChange={handleSeek}
                  className="absolute inset-0 w-full opacity-0 cursor-pointer"
                  aria-label="Seek"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
