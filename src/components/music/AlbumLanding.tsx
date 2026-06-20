"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import MotionFadeIn from "@/components/MotionFadeIn";
import { PlayIcon } from "@/components/icons";

interface AlbumLandingProps {
  /** Start the album from the beginning (Song 1). */
  onPlay: () => void;
  /** Open the song-list drawer. */
  onOpenList: () => void;
}

export default function AlbumLanding({ onPlay, onOpenList }: AlbumLandingProps) {
  const t = useTranslations("music");
  const locale = useLocale();

  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-12">
      <MotionFadeIn variant="title">
        <Image
          src="/album/album-cover.jpg"
          alt=""
          width={224}
          height={224}
          priority
          className="mx-auto mb-6 rounded-2xl shadow-[0_0_40px_rgba(212,168,83,0.25)] border border-[var(--lo1-gold)]/20"
        />
        <h2 className="text-3xl font-semibold text-[var(--lo1-starlight)]">
          {t("album.title")}
        </h2>
        <p className="mt-2 text-sm text-[var(--lo1-gold)] italic">
          {t("album.subtitle")}
        </p>
        <p className="mt-3 text-sm text-[var(--lo1-stardust)] max-w-md mx-auto">
          {t("album.description")}
        </p>
      </MotionFadeIn>

      <MotionFadeIn delay={0.18}>
        <div className="mt-10 flex flex-col items-center gap-3">
          <button
            onClick={onPlay}
            aria-label={t("album.play")}
            className="flex items-center justify-center w-20 h-20 rounded-full
                       bg-[var(--lo1-gold)] text-[var(--lo1-deep-space)]
                       hover:bg-[var(--lo1-gold-light)] transition-colors
                       shadow-[0_0_30px_rgba(212,168,83,0.4)] cursor-pointer"
          >
            <PlayIcon className="w-9 h-9 ml-1" />
          </button>
          <span className="text-sm text-[var(--lo1-starlight)]">
            {t("album.play")}
          </span>
        </div>
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
