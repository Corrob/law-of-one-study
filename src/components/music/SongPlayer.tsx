"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { PlayIcon, PauseIcon, BackIcon } from "@/components/icons";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { useAudioClock } from "@/hooks/useAudioClock";
import { useLyricSync } from "@/hooks/useLyricSync";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { getAudioPath } from "@/data/music/album";
import { loadSongLyrics } from "@/data/music/loadLyrics";
import { type LyricCue, type Song } from "@/lib/schemas/music";
import LyricsDisplay from "./LyricsDisplay";
import DensityScene from "./DensityScene";

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

const ORDINAL = ["", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th"];

interface SongPlayerProps {
  song: Song;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onOpenList: () => void;
}

export default function SongPlayer({
  song,
  onClose,
  onPrev,
  onNext,
  onOpenList,
}: SongPlayerProps) {
  const t = useTranslations("music");
  const reducedMotion = useReducedMotion();
  const [cues, setCues] = useState<LyricCue[]>([]);

  const player = useAudioPlayer({
    durationFallback: song.durationSeconds,
    autoPlay: true,
    onEnded: onNext,
  });
  const { audioRef, isPlaying, currentTime, duration, audioError } = player;

  const clock = useAudioClock(audioRef, isPlaying, { smooth: !reducedMotion });
  const { activeIndex, activeHint } = useLyricSync(cues, clock);

  // Load this song's timed cues.
  useEffect(() => {
    let cancelled = false;
    loadSongLyrics(song).then((loaded) => {
      if (!cancelled) setCues(loaded);
    });
    return () => {
      cancelled = true;
    };
  }, [song]);

  // Live transport state/actions in a ref so the keyboard handler binds once
  // (instead of rebinding on every ~4Hz timeupdate).
  const transportRef = useRef({ seek: player.seek, toggle: player.togglePlay, currentTime, duration });
  useEffect(() => {
    transportRef.current = { seek: player.seek, toggle: player.togglePlay, currentTime, duration };
  });

  // Keyboard transport: space = play/pause, arrows = seek, shift+arrows = track.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      const { seek, toggle, currentTime, duration } = transportRef.current;
      if (e.key === " " || e.key === "Spacebar") {
        e.preventDefault();
        toggle();
      } else if (e.key === "ArrowRight") {
        if (e.shiftKey) onNext();
        else seek(Math.min(duration, currentTime + 5));
      } else if (e.key === "ArrowLeft") {
        if (e.shiftKey) onPrev();
        else seek(Math.max(0, currentTime - 5));
      } else if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onNext, onPrev, onClose]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <main className="h-dvh flex flex-col relative overflow-hidden bg-[var(--lo1-deep-space)]">
      {/* Animated density scene (decorative, behind the lyrics). */}
      <DensityScene
        density={song.density}
        clock={clock}
        activeHint={activeHint}
        reducedMotion={reducedMotion}
        color={song.densityColor}
        durationSeconds={duration || song.durationSeconds}
      />

      {/* Audio element */}
      <audio
        ref={audioRef}
        src={getAudioPath(song)}
        preload="metadata"
        {...player.audioEventProps}
      />

      {/* Top bar */}
      <div className="relative z-10 flex items-center gap-3 px-4 pt-4">
        <button
          onClick={onClose}
          aria-label={t("player.back")}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--lo1-indigo)]/60 text-[var(--lo1-starlight)] hover:bg-[var(--lo1-indigo)]/90 transition-colors cursor-pointer shrink-0"
        >
          <BackIcon className="w-5 h-5" />
        </button>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-[var(--lo1-starlight)] truncate">
            {t(song.titleKey)}
          </h2>
          <p className="text-xs" style={{ color: song.densityColor }}>
            {t("densityLabel", { ordinal: ORDINAL[song.density] })}
          </p>
        </div>
        <button
          onClick={onOpenList}
          aria-label={t("album.songList")}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--lo1-indigo)]/60 text-[var(--lo1-starlight)] hover:bg-[var(--lo1-indigo)]/90 transition-colors cursor-pointer shrink-0"
        >
          <ListIcon />
        </button>
      </div>

      {/* Lyrics (or empty/coming-soon state) */}
      {cues.length > 0 ? (
        <LyricsDisplay
          cues={cues}
          activeIndex={activeIndex}
          reducedMotion={reducedMotion}
          onSeekToLine={player.seek}
        />
      ) : (
        <div className="relative z-10 flex-1 flex items-center justify-center px-6 text-center">
          <p className="text-[var(--lo1-stardust)] text-sm">
            {t("player.lyricsComing")}
          </p>
        </div>
      )}

      {/* Audio-coming-soon notice (when the mp3 isn't present yet) */}
      {audioError && (
        <div className="relative z-10 text-center pb-2">
          <p className="text-[var(--lo1-gold)] text-xs">
            {t("player.audioComing")}
          </p>
        </div>
      )}

      {/* Transport */}
      <div className="relative z-10 px-5 pb-8 pt-2 space-y-3 max-w-xl mx-auto w-full">
        {/* Progress */}
        <div className="space-y-1">
          <div className="relative h-1.5 bg-[var(--lo1-celestial)]/30 rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-200"
              style={{ width: `${progress}%`, backgroundColor: song.densityColor }}
            />
            <input
              type="range"
              min={0}
              max={duration || song.durationSeconds}
              step={0.5}
              value={currentTime}
              onChange={(e) => player.seek(Number(e.target.value))}
              className="absolute inset-0 w-full opacity-0 cursor-pointer"
              aria-label={t("player.seek")}
            />
          </div>
          <div className="flex justify-between text-[11px] text-[var(--lo1-stardust)]">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration || song.durationSeconds)}</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-center gap-8">
          <button
            onClick={onPrev}
            aria-label={t("player.previous")}
            className="text-[var(--lo1-starlight)] hover:text-[var(--lo1-gold)] transition-colors cursor-pointer"
          >
            <SkipIcon direction="prev" />
          </button>
          <button
            onClick={player.togglePlay}
            aria-label={isPlaying ? t("player.pause") : t("player.play")}
            className="flex items-center justify-center w-16 h-16 rounded-full bg-[var(--lo1-gold)] text-[var(--lo1-deep-space)] hover:bg-[var(--lo1-gold-light)] transition-colors shadow-[0_0_24px_rgba(212,168,83,0.35)] cursor-pointer"
          >
            {isPlaying ? (
              <PauseIcon className="w-7 h-7" />
            ) : (
              <PlayIcon className="w-7 h-7 ml-0.5" />
            )}
          </button>
          <button
            onClick={onNext}
            aria-label={t("player.next")}
            className="text-[var(--lo1-starlight)] hover:text-[var(--lo1-gold)] transition-colors cursor-pointer"
          >
            <SkipIcon direction="next" />
          </button>
        </div>
      </div>
    </main>
  );
}

function ListIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <line x1="8" y1="6" x2="20" y2="6" />
      <line x1="8" y1="12" x2="20" y2="12" />
      <line x1="8" y1="18" x2="20" y2="18" />
      <circle cx="4" cy="6" r="1" fill="currentColor" stroke="none" />
      <circle cx="4" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="4" cy="18" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function SkipIcon({ direction }: { direction: "prev" | "next" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="w-7 h-7"
      fill="currentColor"
      style={direction === "prev" ? { transform: "scaleX(-1)" } : undefined}
      aria-hidden="true"
    >
      <path d="M6 5l8 7-8 7V5z" />
      <rect x="16" y="5" width="2.2" height="14" rx="1" />
    </svg>
  );
}
