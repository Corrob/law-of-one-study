"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

const DISMISSED_KEY = "lo1-pwa-prompt-dismissed";
const INSTALLED_KEY = "lo1-pwa-installed";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function shouldShowPrompt(): boolean {
  if (typeof window === "undefined") return false;
  if (
    localStorage.getItem(DISMISSED_KEY) ||
    localStorage.getItem(INSTALLED_KEY)
  )
    return false;
  if (window.matchMedia("(display-mode: standalone)").matches) {
    localStorage.setItem(INSTALLED_KEY, "true");
    return false;
  }
  return true;
}

export function detectIosSafari(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const navPlatform =
    (navigator as Navigator & { userAgentData?: { platform: string } })
      .userAgentData?.platform ?? navigator.platform;
  const isIosPlatform =
    /iPad|iPhone|iPod/.test(ua) ||
    (navPlatform === "macOS" && navigator.maxTouchPoints > 1);
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|Chrome/.test(ua);
  return isIosPlatform && isSafari;
}

export default function PwaInstallPrompt() {
  const t = useTranslations("pwaPrompt");
  const [isIos, setIsIos] = useState(false);
  const [visible, setVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const promptRef = useRef<BeforeInstallPromptEvent | null>(null);

  // Detect iOS Safari on mount to avoid hydration mismatch
  useEffect(() => {
    if (!shouldShowPrompt()) return;
    const ios = detectIosSafari();
    setIsIos(ios);
    if (ios) setVisible(true);
  }, []);

  // Listen for Chrome/Android install prompt
  useEffect(() => {
    if (!shouldShowPrompt() || isIos) return;

    function handleBeforeInstall(e: Event) {
      e.preventDefault();
      if (!shouldShowPrompt()) return;
      promptRef.current = e as BeforeInstallPromptEvent;
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () =>
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
  }, [isIos]);

  const handleInstall = useCallback(async () => {
    const prompt = promptRef.current;
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") {
      localStorage.setItem(INSTALLED_KEY, "true");
    }
    promptRef.current = null;
    setDeferredPrompt(null);
    setVisible(false);
  }, []);

  const handleDismiss = useCallback(() => {
    localStorage.setItem(DISMISSED_KEY, "true");
    setVisible(false);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md sm:left-auto sm:right-6 sm:bottom-6">
      <div className="rounded-xl border border-[var(--lo1-celestial)]/30 bg-[var(--lo1-indigo)]/95 backdrop-blur-md p-5 shadow-lg">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <p className="text-base font-semibold text-[var(--lo1-starlight)]">
              {t("title")}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-[var(--lo1-stardust)]">
              {isIos ? t("iosDescription") : t("description")}
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="mt-0.5 flex-shrink-0 cursor-pointer text-[var(--lo1-stardust)]/40 transition-colors hover:text-[var(--lo1-stardust)]"
            aria-label={t("dismiss")}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mt-4 flex items-center gap-3">
          {!isIos && deferredPrompt && (
            <button
              onClick={handleInstall}
              className="cursor-pointer rounded-lg bg-[var(--lo1-gold)] px-4 py-2 text-sm font-medium text-[var(--lo1-indigo)] transition-colors hover:bg-[var(--lo1-gold)]/80"
            >
              {t("install")}
            </button>
          )}
          <Link
            href="/app"
            onClick={handleDismiss}
            className="cursor-pointer text-sm text-[var(--lo1-stardust)]/60 transition-colors hover:text-[var(--lo1-stardust)]"
          >
            {t("learnMore")}
          </Link>
        </div>
      </div>
    </div>
  );
}
