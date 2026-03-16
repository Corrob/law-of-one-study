"use client";

import { useEffect, useState, useMemo } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations, useLocale } from "next-intl";
import FeatureCard from "./FeatureCard";
import CopyButton from "./CopyButton";
import { ExploreIcon, BookIcon, MeditateIcon, InfoIcon, HeartIcon, DownloadIcon } from "./icons";
import { getDailyQuote, getRawQuoteForDay, formatQuoteForShare, type LocalizedDailyQuote } from "@/lib/daily-quote";
import { type DailyQuote } from "@/data/daily-quotes";
import { type AvailableLanguage } from "@/lib/language-config";

const FEATURES = [
  {
    href: "/explore",
    icon: ExploreIcon,
    titleKey: "explore",
  },
  {
    href: "/meditate",
    icon: MeditateIcon,
    titleKey: "meditate",
  },
];

const DASHBOARD_SEEN_KEY = "lo1-dashboard-seen";
const NOTICE_DISMISSED_KEY = "lo1-notice-dismissed";

export default function Dashboard() {
  const locale = useLocale() as AvailableLanguage;
  const [quote, setQuote] = useState<LocalizedDailyQuote | null>(null);
  const [bilingualQuote, setBilingualQuote] = useState<DailyQuote | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const [skipAnimations, setSkipAnimations] = useState(false);
  const [ready, setReady] = useState(false);
  const [noticeDismissed, setNoticeDismissed] = useState(true);
  const t = useTranslations();

  useEffect(() => {
    // Get quote on client to avoid hydration mismatch
    // Deterministic: same quote for all users on same day
    // Locale-aware: shows Spanish text for Spanish users
    const today = new Date();
    setQuote(getDailyQuote(locale));
    setBilingualQuote(getRawQuoteForDay(today));

    // Check if notice was previously dismissed
    setNoticeDismissed(!!localStorage.getItem(NOTICE_DISMISSED_KEY));

    // Skip entrance animations on return visits within this session
    if (sessionStorage.getItem(DASHBOARD_SEEN_KEY)) {
      setSkipAnimations(true);
      setReady(true);
    } else {
      sessionStorage.setItem(DASHBOARD_SEEN_KEY, "1");
      // Delay ready to allow fade-in transition
      requestAnimationFrame(() => setReady(true));
    }
  }, [locale]);

  // Compute formatted copy text
  const copyText = useMemo(() => {
    if (!quote) return "";
    return formatQuoteForShare(quote);
  }, [quote]);

  return (
    <div
      className={`max-w-2xl mx-auto px-4 py-8 space-y-8 transition-opacity duration-500 ease-out ${
        ready ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* Daily Quote */}
      {quote && (
        <div className="max-w-xl mx-auto text-center space-y-3">
          {/* Header */}
          <h2 className={`${skipAnimations ? "" : "animate-quote-header"} text-sm uppercase tracking-widest text-[var(--lo1-gold)]/80`}>
            {t("dashboard.dailyWisdom")}
          </h2>

          {/* Quote Card */}
          <div className={`light-quote-card ${skipAnimations ? "" : "animate-quote-wrapper"} group`}>
            <div
              role="link"
              tabIndex={0}
              aria-label={t("dashboard.readOnLawOfOneInfo", { reference: quote.reference })}
              onClick={() =>
                window.open(quote.url, "_blank", "noopener,noreferrer")
              }
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  window.open(quote.url, "_blank", "noopener,noreferrer");
                }
              }}
              className="p-5 rounded-2xl text-left
                       border-l-4 border-[var(--lo1-gold)] bg-[var(--lo1-indigo)]/60 backdrop-blur-sm
                       shadow-lg hover:bg-[var(--lo1-indigo)]/70
                       hover:shadow-[0_0_40px_rgba(212,168,83,0.2)]
                       transition-all duration-300 cursor-pointer"
            >
              <p className={`${skipAnimations ? "" : "animate-quote-enter"} font-[family-name:var(--font-cormorant)] italic text-xl md:text-2xl text-[var(--lo1-starlight)] leading-relaxed mb-4`}>
                &ldquo;{quote.text}&rdquo;
              </p>
              <div className="flex items-center justify-end gap-4">
                <div className={`flex items-center gap-2 ${skipAnimations ? "" : "animate-quote-reference"}`}>
                  <CopyButton textToCopy={copyText} size="md" />
                  <span className="text-[var(--lo1-stardust)] text-sm">
                    &mdash; {quote.reference}
                  </span>
                </div>
              </div>

              {/* Show English original toggle (for non-English locales) */}
              {locale !== "en" && bilingualQuote && (
                <div className="mt-4 pt-3 border-t border-[var(--lo1-celestial)]/20">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowOriginal(!showOriginal);
                    }}
                    className="text-xs text-[var(--lo1-celestial)] hover:text-[var(--lo1-starlight)] cursor-pointer"
                    aria-expanded={showOriginal}
                  >
                    {showOriginal ? `↑ ${t("quote.hideEnglishOriginal")}` : `↓ ${t("quote.showEnglishOriginal")}`}
                  </button>

                  {/* English original text */}
                  {showOriginal && (
                    <div className="mt-3 pl-3 border-l-2 border-[var(--lo1-celestial)]/30">
                      <div className="text-xs text-[var(--lo1-celestial)]/70 mb-2 uppercase tracking-wide">
                        {t("quote.englishOriginal")}
                      </div>
                      <p className="font-[family-name:var(--font-cormorant)] italic text-lg text-[var(--lo1-starlight)]/80 leading-relaxed">
                        &ldquo;{bilingualQuote.text.en}&rdquo;
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <p className={`${skipAnimations ? "" : "animate-quote-footer"} text-xs text-[var(--lo1-stardust)]/60`}>
            {t("dashboard.newReflectionTomorrow")}
          </p>
        </div>
      )}

      {/* Feature Change Notice */}
      {!noticeDismissed && (
        <div className="max-w-md mx-auto p-3 bg-[var(--lo1-indigo)]/60 border border-[var(--lo1-gold)]/30 rounded-xl">
          <div className="flex items-start gap-2.5">
            <svg className="w-4 h-4 text-[var(--lo1-gold)] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-[var(--lo1-stardust)] leading-relaxed">
                {t("dashboard.featureNotice")}{" "}
                <Link href="/about" className="text-[var(--lo1-gold)] hover:underline">
                  {t("dashboard.learnMore")}
                </Link>
              </p>
            </div>
            <button
              onClick={() => {
                localStorage.setItem(NOTICE_DISMISSED_KEY, "1");
                setNoticeDismissed(true);
              }}
              className="flex-shrink-0 text-[var(--lo1-stardust)] hover:text-[var(--lo1-starlight)] cursor-pointer"
              aria-label={t("dashboard.dismissNotice")}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Feature Cards Grid */}
      <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
        {/* Featured: Study Paths - full width */}
        <div className="col-span-2">
          <FeatureCard
            href="/paths"
            icon={BookIcon}
            title={t("features.study.title")}
            description={t("features.study.description")}
            index={0}
            featured
            skipAnimation={skipAnimations}
          />
        </div>
        {FEATURES.map((feature, index) => (
          <FeatureCard
            key={feature.href}
            href={feature.href}
            icon={feature.icon}
            title={t(`features.${feature.titleKey}.title`)}
            description={t(`features.${feature.titleKey}.description`)}
            index={index + 1}
            skipAnimation={skipAnimations}
          />
        ))}
      </div>

      {/* Footer Links */}
      <footer className="mt-12 pt-6 border-t border-[var(--lo1-celestial)]/20">
        <div className="flex items-center justify-center gap-6 text-sm">
          <Link
            href="/about"
            className="flex items-center gap-1.5 text-[var(--lo1-stardust)] hover:text-[var(--lo1-gold)] transition-colors"
          >
            <InfoIcon className="w-4 h-4" />
            <span>{t("nav.about")}</span>
          </Link>
          <span className="text-[var(--lo1-celestial)]/40">·</span>
          <Link
            href="/donate"
            className="flex items-center gap-1.5 text-[var(--lo1-stardust)] hover:text-[var(--lo1-gold)] transition-colors"
          >
            <HeartIcon className="w-4 h-4" />
            <span>{t("nav.support")}</span>
          </Link>
          <span className="text-[var(--lo1-celestial)]/40">·</span>
          <Link
            href="/app"
            className="flex items-center gap-1.5 text-[var(--lo1-stardust)] hover:text-[var(--lo1-gold)] transition-colors"
          >
            <DownloadIcon className="w-4 h-4" />
            <span>{t("nav.install")}</span>
          </Link>
        </div>
      </footer>
    </div>
  );
}
