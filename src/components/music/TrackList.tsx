"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import MotionFadeIn from "@/components/MotionFadeIn";
import { ALBUM, getCoverPath } from "@/data/music/album";
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
                className={`w-full text-left flex items-start gap-4 p-4 rounded-xl border transition-all duration-300 cursor-pointer ${
                  isCurrent
                    ? "border-[var(--lo1-gold)]/60 bg-[var(--lo1-indigo)]/90"
                    : "border-[var(--lo1-celestial)]/30 bg-[var(--lo1-indigo)]/60 hover:border-[var(--lo1-gold)]/40 hover:bg-[var(--lo1-indigo)]/80"
                }`}
              >
                {/* Cover art with track-number badge */}
                <span className="relative shrink-0" aria-hidden="true">
                  <Image
                    src={getCoverPath(song)}
                    alt=""
                    width={56}
                    height={56}
                    className="rounded-lg object-cover w-14 h-14"
                    style={{ boxShadow: `0 0 0 1px ${song.densityColor}66` }}
                  />
                  <span
                    className="absolute -bottom-1.5 -right-1.5 flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-semibold ring-2 ring-[var(--lo1-indigo)]"
                    style={{
                      color: "var(--lo1-deep-space)",
                      backgroundColor: song.densityColor,
                    }}
                  >
                    {song.trackNumber}
                  </span>
                </span>

                {/* Title, description, references */}
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="block text-base font-medium text-[var(--lo1-starlight)] truncate">
                      {t(song.titleKey)}
                    </span>
                    <span className="text-xs text-[var(--lo1-stardust)] whitespace-nowrap shrink-0">
                      {formatDuration(song.durationSeconds)}
                    </span>
                  </span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-[var(--lo1-stardust)] line-clamp-2">
                    {t(song.descriptionKey)}
                  </span>
                  {song.raPassages.length > 0 && (
                    <span className="mt-2 flex flex-wrap gap-1.5">
                      {song.raPassages.map((passage) => (
                        <span
                          key={passage}
                          className="inline-block rounded px-1.5 py-0.5 text-[10px] font-medium"
                          style={{
                            color: song.densityColor,
                            backgroundColor: `${song.densityColor}1f`,
                          }}
                        >
                          Ra {passage}
                        </span>
                      ))}
                    </span>
                  )}
                </span>
              </button>
            </li>
          </MotionFadeIn>
        );
      })}
    </ul>
  );
}
