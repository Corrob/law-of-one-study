"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import NavigationWrapper from "@/components/NavigationWrapper";
import MotionFadeIn from "@/components/MotionFadeIn";
import MeditationPlayer from "@/components/MeditationPlayer";
import { MEDITATIONS, type Meditation } from "@/data/meditations";

function MeditationCard({
  meditation,
  isSelected,
  onSelect,
  index,
}: {
  meditation: Meditation;
  isSelected: boolean;
  onSelect: () => void;
  index: number;
}) {
  const t = useTranslations("meditate");
  const minutes = Math.ceil(meditation.durationSeconds / 60);

  return (
    <MotionFadeIn delay={0.1 + index * 0.08}>
      <button
        onClick={onSelect}
        className={`w-full text-left p-4 rounded-xl border transition-all duration-300 cursor-pointer ${
          isSelected
            ? "bg-[var(--lo1-gold)]/15 border-[var(--lo1-gold)]/50 shadow-[0_0_25px_rgba(212,168,83,0.15)]"
            : "bg-[var(--lo1-indigo)]/60 border-[var(--lo1-celestial)]/30 hover:border-[var(--lo1-gold)]/30 hover:bg-[var(--lo1-indigo)]/80"
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3
              className={`text-base font-semibold mb-1 transition-colors ${
                isSelected
                  ? "text-[var(--lo1-gold)]"
                  : "text-[var(--lo1-starlight)]"
              }`}
            >
              {t(`meditations.${meditation.titleKey}`)}
            </h3>
            <p className="text-sm text-[var(--lo1-stardust)] line-clamp-2">
              {t(`meditations.${meditation.descriptionKey}`)}
            </p>
          </div>
          <span className="text-xs text-[var(--lo1-stardust)] whitespace-nowrap mt-1">
            {t("duration", { minutes })}
          </span>
        </div>
      </button>
    </MotionFadeIn>
  );
}

export default function MeditateContent() {
  const t = useTranslations("meditate");
  const [selectedMeditation, setSelectedMeditation] = useState<Meditation>(
    MEDITATIONS[0]
  );

  return (
    <main className="h-dvh flex flex-col cosmic-bg relative">
      {/* Starfield background */}
      <div className="starfield" />

      <NavigationWrapper>
        <div className="flex-1 overflow-y-auto relative z-10">
          <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
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

            {/* Now Playing */}
            <MotionFadeIn delay={0.15}>
              <div className="p-5 rounded-2xl bg-[var(--lo1-indigo)]/60 backdrop-blur-sm border border-[var(--lo1-gold)]/30 shadow-[0_0_40px_rgba(212,168,83,0.1)]">
                <p className="text-xs uppercase tracking-widest text-[var(--lo1-gold)]/80 mb-3">
                  {t("nowPlaying")}
                </p>
                <h3 className="text-lg font-semibold text-[var(--lo1-starlight)] mb-1">
                  {t(`meditations.${selectedMeditation.titleKey}`)}
                </h3>
                <p className="text-sm text-[var(--lo1-stardust)] mb-4">
                  {t(`meditations.${selectedMeditation.descriptionKey}`)}
                </p>

                {/* Player */}
                <MeditationPlayer meditation={selectedMeditation} />

                {/* Quote */}
                <div className="mt-5 pt-4 border-t border-[var(--lo1-celestial)]/20">
                  <p className="font-[family-name:var(--font-cormorant)] italic text-base text-[var(--lo1-starlight)]/80 leading-relaxed">
                    &ldquo;{t(`meditations.${selectedMeditation.quoteKey}`)}&rdquo;
                  </p>
                </div>

                {/* References */}
                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-[var(--lo1-stardust)]">
                    {t("references")}:
                  </span>
                  {selectedMeditation.references.map((ref, i) => (
                    <a
                      key={ref}
                      href={selectedMeditation.referenceUrls[i]}
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

            {/* Meditation List */}
            <div className="space-y-3">
              <h3 className="text-sm uppercase tracking-widest text-[var(--lo1-gold)]/80">
                {t("selectMeditation")}
              </h3>
              {MEDITATIONS.map((meditation, index) => (
                <MeditationCard
                  key={meditation.id}
                  meditation={meditation}
                  isSelected={selectedMeditation.id === meditation.id}
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
