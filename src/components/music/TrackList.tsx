"use client";

import { useTranslations } from "next-intl";
import MotionFadeIn from "@/components/MotionFadeIn";
import { ALBUM } from "@/data/music/album";
import { type Song } from "@/lib/schemas/music";

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

interface TrackListProps {
  onSelect: (song: Song) => void;
  currentSongId?: string;
}

export default function TrackList({ onSelect, currentSongId }: TrackListProps) {
  const t = useTranslations("music");

  return (
    <ul className="space-y-2">
      {ALBUM.songs.map((song, index) => {
        const isCurrent = song.id === currentSongId;
        return (
        <MotionFadeIn key={song.id} delay={0.1 + index * 0.06}>
          <li>
            <button
              onClick={() => onSelect(song)}
              aria-current={isCurrent ? "true" : undefined}
              className={`w-full text-left flex items-center gap-4 p-4 rounded-xl border transition-all duration-300 cursor-pointer ${
                isCurrent
                  ? "border-[var(--lo1-gold)]/60 bg-[var(--lo1-indigo)]/90"
                  : "border-[var(--lo1-celestial)]/30 bg-[var(--lo1-indigo)]/60 hover:border-[var(--lo1-gold)]/40 hover:bg-[var(--lo1-indigo)]/80"
              }`}
            >
              <span
                className="flex items-center justify-center w-9 h-9 rounded-full text-sm font-semibold shrink-0"
                style={{
                  color: song.densityColor,
                  backgroundColor: `${song.densityColor}1f`,
                }}
                aria-hidden="true"
              >
                {song.trackNumber}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-base font-medium text-[var(--lo1-starlight)] truncate">
                  {t(song.titleKey)}
                </span>
                <span className="block text-xs text-[var(--lo1-stardust)] truncate">
                  {t(song.descriptionKey)}
                </span>
              </span>
              <span className="text-xs text-[var(--lo1-stardust)] whitespace-nowrap shrink-0">
                {formatDuration(song.durationSeconds)}
              </span>
            </button>
          </li>
        </MotionFadeIn>
        );
      })}
    </ul>
  );
}
