"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import NavigationWrapper from "@/components/NavigationWrapper";
import MotionFadeIn from "@/components/MotionFadeIn";
import MeditationPlayer from "@/components/MeditationPlayer";
import { PlayIcon } from "@/components/icons";
import { MEDITATIONS, type Meditation } from "@/data/meditations";

function MeditationCard({
  meditation,
  isSelected,
  isCompact,
  onSelect,
  index,
}: {
  meditation: Meditation;
  isSelected: boolean;
  isCompact: boolean;
  onSelect: () => void;
  index: number;
}) {
  const t = useTranslations("meditate");
  const minutes = Math.ceil(meditation.durationSeconds / 60);

  if (isCompact) {
    return (
      <MotionFadeIn delay={0.1 + index * 0.08}>
        <button
          onClick={onSelect}
          className="w-full text-left p-4 rounded-xl border transition-all duration-300 cursor-pointer
                     bg-[var(--lo1-indigo)]/60 border-[var(--lo1-celestial)]/30
                     hover:border-[var(--lo1-gold)]/30 hover:bg-[var(--lo1-indigo)]/80"
        >
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-base font-semibold text-[var(--lo1-starlight)]">
              {t(`meditations.${meditation.titleKey}`)}
            </h3>
            <span className="text-xs text-[var(--lo1-stardust)] whitespace-nowrap">
              {t("duration", { minutes })}
            </span>
          </div>
        </button>
      </MotionFadeIn>
    );
  }

  return (
    <MotionFadeIn delay={0.1 + index * 0.08}>
      <div
        className={`p-5 rounded-2xl border transition-all duration-300 ${
          isSelected
            ? "bg-[var(--lo1-indigo)]/60 backdrop-blur-sm border-[var(--lo1-gold)]/30 shadow-[0_0_40px_rgba(212,168,83,0.1)]"
            : "bg-[var(--lo1-indigo)]/60 backdrop-blur-sm border-[var(--lo1-celestial)]/30"
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-semibold text-[var(--lo1-gold)]">
            {t(`meditations.${meditation.titleKey}`)}
          </h3>
          <span className="text-xs text-[var(--lo1-stardust)] whitespace-nowrap mt-1">
            {t("duration", { minutes })}
          </span>
        </div>

        <p className="text-sm text-[var(--lo1-stardust)] mt-2">
          {t(`meditations.${meditation.descriptionKey}`)}
        </p>

        {/* If selected: show player, else show play button */}
        {isSelected ? (
          <div className="mt-4">
            <MeditationPlayer meditation={meditation} autoPlay />
          </div>
        ) : (
          <div className="mt-4 flex justify-center">
            <button
              onClick={onSelect}
              className="flex items-center justify-center w-14 h-14 rounded-full
                         bg-[var(--lo1-gold)] text-[var(--lo1-deep-space)]
                         hover:bg-[var(--lo1-gold-light)] transition-colors
                         shadow-[0_0_20px_rgba(212,168,83,0.3)]
                         cursor-pointer"
              aria-label={t("play")}
            >
              <PlayIcon className="w-6 h-6 ml-0.5" />
            </button>
          </div>
        )}

        {/* Quote */}
        <div className="mt-5 pt-4 border-t border-[var(--lo1-celestial)]/20">
          <p className="font-[family-name:var(--font-cormorant)] italic text-base text-[var(--lo1-starlight)]/80 leading-relaxed">
            &ldquo;{t(`meditations.${meditation.quoteKey}`)}&rdquo;
          </p>
        </div>

        {/* References */}
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          <span className="text-xs text-[var(--lo1-stardust)]">
            {t("references")}:
          </span>
          {meditation.references.map((ref, i) => (
            <a
              key={`${meditation.id}-${ref}`}
              href={meditation.referenceUrls[i]}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[var(--lo1-gold)] hover:text-[var(--lo1-gold-light)] transition-colors"
            >
              {ref}
            </a>
          ))}
        </div>
      </div>
    </MotionFadeIn>
  );
}

export default function MeditateContent() {
  const t = useTranslations("meditate");
  const [selectedMeditation, setSelectedMeditation] =
    useState<Meditation | null>(null);

  return (
    <main className="h-dvh flex flex-col cosmic-bg relative">
      {/* Starfield background */}
      <div className="starfield" />

      <NavigationWrapper>
        <div className="flex-1 overflow-y-auto relative z-10">
          <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
            {/* Header */}
            <MotionFadeIn variant="title">
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-semibold text-[var(--lo1-starlight)]">
                  {t("title")}
                </h2>
                <p className="text-sm text-[var(--lo1-stardust)]">
                  {t("subtitle")}
                </p>
              </div>
            </MotionFadeIn>

            {/* Meditation Cards */}
            <div className="space-y-4">
              {MEDITATIONS.map((meditation, index) => (
                <MeditationCard
                  key={meditation.id}
                  meditation={meditation}
                  isSelected={selectedMeditation?.id === meditation.id}
                  isCompact={
                    selectedMeditation !== null &&
                    selectedMeditation.id !== meditation.id
                  }
                  onSelect={() => setSelectedMeditation(meditation)}
                  index={index}
                />
              ))}
            </div>
          </div>
        </div>
      </NavigationWrapper>
    </main>
  );
}
