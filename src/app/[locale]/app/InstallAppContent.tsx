"use client";

import { useState, useEffect } from "react";
import NavigationWrapper from "@/components/NavigationWrapper";
import MotionFadeIn from "@/components/MotionFadeIn";
import { MotionStaggerGroup, MotionStaggerItem } from "@/components/MotionStaggerGroup";
import { useTranslations } from "next-intl";
import { DownloadIcon } from "@/components/icons";

type Platform = "ios" | "android" | "desktop";

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "desktop";

  const ua = navigator.userAgent;

  if (/iPad|iPhone|iPod/.test(ua)) return "ios";
  if (/Android/.test(ua)) return "android";
  return "desktop";
}

function AppleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  );
}

function AndroidIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M17.6 9.48l1.84-3.18c.16-.31.04-.69-.27-.86-.31-.16-.69-.04-.86.27l-1.86 3.22c-1.39-.66-2.94-1.04-4.6-1.04-1.66 0-3.21.38-4.6 1.04L5.39 5.71c-.16-.31-.55-.43-.86-.27-.31.16-.43.55-.27.86L6.1 9.48C2.79 11.37.47 14.86.47 18.87h22.76c0-4.01-2.32-7.5-5.63-9.39zM7 15.25c-.69 0-1.25-.56-1.25-1.25s.56-1.25 1.25-1.25 1.25.56 1.25 1.25-.56 1.25-1.25 1.25zm10 0c-.69 0-1.25-.56-1.25-1.25s.56-1.25 1.25-1.25 1.25.56 1.25 1.25-.56 1.25-1.25 1.25z" />
    </svg>
  );
}

function DesktopIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
    >
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path strokeLinecap="round" d="M8 21h8M12 17v4" />
    </svg>
  );
}

function ShareIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}

interface PlatformCardProps {
  platform: Platform;
  isDetected: boolean;
  t: ReturnType<typeof useTranslations<"installApp">>;
}

function PlatformCard({ platform, isDetected, t }: PlatformCardProps) {
  const icons: Record<Platform, React.ComponentType<{ className?: string }>> = {
    ios: AppleIcon,
    android: AndroidIcon,
    desktop: DesktopIcon,
  };

  const Icon = icons[platform];
  const steps = [1, 2, 3] as const;

  return (
    <MotionStaggerItem
      className={`bg-[var(--lo1-indigo)]/30 backdrop-blur-sm border rounded-2xl p-6 ${
        isDetected
          ? "border-[var(--lo1-gold)]/40 shadow-[0_0_20px_rgba(212,168,83,0.1)]"
          : "border-[var(--lo1-celestial)]/30"
      }`}
    >
      <div className="flex items-center gap-3 mb-5">
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center ${
            isDetected
              ? "bg-[var(--lo1-gold)]/20"
              : "bg-[var(--lo1-celestial)]/15"
          }`}
        >
          <Icon
            className={`w-6 h-6 ${
              isDetected
                ? "text-[var(--lo1-gold)]"
                : "text-[var(--lo1-celestial)]"
            }`}
          />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-[var(--lo1-starlight)]">
            {t(`platforms.${platform}.name`)}
          </h3>
          {isDetected && (
            <span className="text-xs text-[var(--lo1-gold)]">
              {t("detectedPlatform")}
            </span>
          )}
        </div>
      </div>

      <ol className="space-y-4">
        {steps.map((step) => (
          <li key={step} className="flex gap-3">
            <span className="flex-shrink-0 w-7 h-7 rounded-full bg-[var(--lo1-gold)]/15 flex items-center justify-center text-sm font-medium text-[var(--lo1-gold)]">
              {step}
            </span>
            <div className="pt-0.5">
              <p className="text-[var(--lo1-stardust)] text-sm leading-relaxed">
                {t(`platforms.${platform}.step${step}`)}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </MotionStaggerItem>
  );
}

export default function InstallAppContent() {
  const t = useTranslations("installApp");
  const [detectedPlatform, setDetectedPlatform] =
    useState<Platform>("desktop");

  useEffect(() => {
    setDetectedPlatform(detectPlatform());
  }, []);

  const allPlatforms: Platform[] = ["ios", "android", "desktop"];
  const otherPlatforms = allPlatforms.filter((p) => p !== detectedPlatform);

  return (
    <NavigationWrapper>
      <main className="min-h-dvh flex flex-col cosmic-bg relative">
        <div className="flex-1 overflow-auto relative z-10 py-8 px-6">
          <article className="max-w-3xl mx-auto">
            {/* Page Title */}
            <MotionFadeIn className="text-center mb-12" variant="title">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-[var(--lo1-gold)]/20 flex items-center justify-center">
                  <DownloadIcon className="w-8 h-8 text-[var(--lo1-gold)]" />
                </div>
              </div>
              <h1 className="text-4xl md:text-5xl font-[family-name:var(--font-cormorant)] text-[var(--lo1-starlight)] mb-4">
                {t("title")}
              </h1>
              <p className="text-[var(--lo1-stardust)] text-lg max-w-xl mx-auto">
                {t("subtitle")}
              </p>
            </MotionFadeIn>

            {/* Detected Platform */}
            <MotionStaggerGroup className="mb-8" staggerDelay={0.1}>
              <PlatformCard
                platform={detectedPlatform}
                isDetected={true}
                t={t}
              />
            </MotionStaggerGroup>

            {/* Other Platforms */}
            <MotionStaggerGroup staggerDelay={0.15}>
              <h2 className="text-xl font-[family-name:var(--font-cormorant)] text-[var(--lo1-gold)] mb-4">
                {t("otherPlatforms")}
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                {otherPlatforms.map((platform) => (
                  <PlatformCard
                    key={platform}
                    platform={platform}
                    isDetected={false}
                    t={t}
                  />
                ))}
              </div>
            </MotionStaggerGroup>

            {/* Tip */}
            <MotionFadeIn className="mt-12 text-center" delay={0.3}>
              <div className="inline-flex items-center gap-2 text-sm text-[var(--lo1-stardust)]/60">
                <ShareIcon className="w-4 h-4" />
                <span>{t("tip")}</span>
              </div>
            </MotionFadeIn>
          </article>
        </div>
      </main>
    </NavigationWrapper>
  );
}
