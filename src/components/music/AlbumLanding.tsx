"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import MotionFadeIn from "@/components/MotionFadeIn";
import { PlayIcon } from "@/components/icons";
import { DENSITY_COLORS } from "@/data/music/album";

interface AlbumLandingProps {
  /** Start the album from the beginning (Song 1). */
  onPlay: () => void;
  /** Open the song-list drawer. */
  onOpenList: () => void;
}

// The seven density rays (red → violet), wrapped back to red for a seamless ring.
const RAY_STOPS = [1, 2, 3, 4, 5, 6, 7].map((d) => DENSITY_COLORS[d]);
const RAY_RING = `conic-gradient(from 0deg, ${[...RAY_STOPS, RAY_STOPS[0]].join(", ")})`;

export default function AlbumLanding({ onPlay, onOpenList }: AlbumLandingProps) {
  const t = useTranslations("music");
  const locale = useLocale();

  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-12">
      <MotionFadeIn variant="title">
        {/* Hero cover — the cover itself is the play affordance */}
        <div className="relative mx-auto mb-7 w-64 sm:w-72">
          {/* Seven-ray density ring, slowly turning behind the art */}
          <div
            aria-hidden="true"
            className="density-ring-spin absolute -inset-2 rounded-[1.9rem] opacity-40 blur-[3px]"
            style={{ background: RAY_RING }}
          />
          <button
            onClick={onPlay}
            aria-label={t("album.play")}
            className="group album-cover-float relative block w-full aspect-square overflow-hidden
                       rounded-3xl border border-[var(--lo1-gold)]/20 cursor-pointer
                       shadow-[0_0_60px_rgba(212,168,83,0.3)]
                       focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lo1-gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--lo1-deep-space)]"
          >
            <Image
              src="/album/album-cover.jpg"
              alt=""
              fill
              priority
              sizes="(max-width: 640px) 16rem, 18rem"
              className="object-cover"
            />
            {/* Play overlay — visible at rest, brightens on hover/focus */}
            <span className="absolute inset-0 flex items-center justify-center bg-[var(--lo1-deep-space)]/10 transition-colors duration-300 group-hover:bg-[var(--lo1-deep-space)]/30">
              <span
                className="flex items-center justify-center w-16 h-16 rounded-full
                           bg-[var(--lo1-gold)]/90 text-[var(--lo1-deep-space)]
                           shadow-[0_0_30px_rgba(212,168,83,0.5)]
                           transition-transform duration-300 group-hover:scale-105 group-active:scale-95"
              >
                <PlayIcon className="w-8 h-8 ml-1" />
              </span>
            </span>
          </button>
        </div>

        <h2>
          <button
            onClick={onPlay}
            className="cursor-pointer text-3xl font-semibold text-[var(--lo1-starlight)] transition-colors hover:text-[var(--lo1-gold-light)] focus:outline-none focus-visible:underline underline-offset-4"
          >
            {t("album.title")}
          </button>
        </h2>
        <p className="mt-2">
          <button
            onClick={onPlay}
            className="cursor-pointer text-sm italic text-[var(--lo1-gold)] transition-colors hover:text-[var(--lo1-gold-light)] focus:outline-none focus-visible:underline underline-offset-4"
          >
            {t("album.subtitle")}
          </button>
        </p>
      </MotionFadeIn>

      <MotionFadeIn delay={0.28}>
        <button
          onClick={onOpenList}
          className="mt-8 text-sm text-[var(--lo1-gold)] hover:text-[var(--lo1-gold-light)] transition-colors cursor-pointer underline-offset-4 hover:underline"
        >
          {t("album.songList")}
        </button>
      </MotionFadeIn>

      {locale !== "en" && (
        <MotionFadeIn delay={0.36}>
          <p className="mt-10 text-xs text-[var(--lo1-stardust)]/80 max-w-xs mx-auto">
            {t("album.englishOnly")}
          </p>
        </MotionFadeIn>
      )}
    </div>
  );
}
