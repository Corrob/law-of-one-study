"use client";

import { useEffect, useState, useMemo } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations, useLocale } from "next-intl";
import FeatureCard from "./FeatureCard";
import CopyButton from "./CopyButton";
import { ChatIcon, ExploreIcon, BookIcon, SearchIcon, InfoIcon, HeartIcon } from "./icons";
import { getDailyQuote, getRawQuoteForDay, formatQuoteForShare, type LocalizedDailyQuote } from "@/lib/daily-quote";
import { type DailyQuote } from "@/data/daily-quotes";
import { type AvailableLanguage } from "@/lib/language-config";

// Feature card configuration with translation keys
const FEATURES = [
  {
    href: "/chat",
    icon: ChatIcon,
    titleKey: "seek",
  },
  {
    href: "/explore",
    icon: ExploreIcon,
    titleKey: "explore",
  },
  {
    href: "/paths",
    icon: BookIcon,
    titleKey: "study",
  },
  {
    href: "/search",
    icon: SearchIcon,
    titleKey: "search",
  },
];

export default function Dashboard() {
  const locale = useLocale() as AvailableLanguage;
  const [quote, setQuote] = useState<LocalizedDailyQuote | null>(null);
  const [bilingualQuote, setBilingualQuote] = useState<DailyQuote | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const t = useTranslations();

  useEffect(() => {
    // Get quote on client to avoid hydration mismatch
    // Deterministic: same quote for all users on same day
    // Locale-aware: shows Spanish text for Spanish users
    const today = new Date();
    setQuote(getDailyQuote(locale));
    setBilingualQuote(getRawQuoteForDay(today));
  }, [locale]);

  // Compute formatted copy text
  const copyText = useMemo(() => {
    if (!quote) return "";
    return formatQuoteForShare(quote);
  }, [quote]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
      {/* Daily Quote */}
      {quote && (
        <div className="max-w-xl mx-auto text-center space-y-3">
          {/* Header */}
          <h2 className="animate-quote-header text-sm uppercase tracking-widest text-[var(--lo1-gold)]/80">
            {t("dashboard.dailyWisdom")}
          </h2>

          {/* Quote Card */}
          <div className="light-quote-card animate-quote-wrapper group">
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
              <p className="animate-quote-enter font-[family-name:var(--font-cormorant)] italic text-xl md:text-2xl text-[var(--lo1-starlight)] leading-relaxed mb-4">
                &ldquo;{quote.text}&rdquo;
              </p>
              <div className="flex items-center justify-between gap-4">
                <Link
                  href={`/chat?q=${encodeURIComponent(`Help me explore "${quote.text}" from ${quote.reference}`)}`}
                  className="animate-quote-reference text-sm text-[var(--lo1-gold)] hover:text-[var(--lo1-gold-light)] transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  {t("dashboard.exploreThis")} &rarr;
                </Link>
                <div className="flex items-center gap-2 animate-quote-reference">
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
          <p className="animate-quote-footer text-xs text-[var(--lo1-stardust)]/60">
            {t("dashboard.newReflectionTomorrow")}
          </p>
        </div>
      )}

      {/* Feature Cards Grid */}
      <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
        {FEATURES.map((feature, index) => (
          <FeatureCard
            key={feature.href}
            href={feature.href}
            icon={feature.icon}
            title={t(`features.${feature.titleKey}.title`)}
            description={t(`features.${feature.titleKey}.description`)}
            index={index}
          />
        ))}
      </div>

      {/* Continue Studying - Placeholder for now */}
      {/* TODO: Show when user has progress in Step 5 */}

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
        </div>
      </footer>
    </div>
  );
}
