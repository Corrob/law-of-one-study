import { getTranslations, getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import NavigationWrapper from "@/components/NavigationWrapper";
import MotionFadeIn from "@/components/MotionFadeIn";
import { MotionStaggerGroup, MotionStaggerItem } from "@/components/MotionStaggerGroup";
import { type AvailableLanguage } from "@/lib/quote-utils";
import { MeditateIcon } from "@/components/icons";
import FeatureChangesSection from "./FeatureChangesSection";
import AboutSections from "./AboutSections";

// Feature icons (pure SVG - no client JS needed)
function ExploreIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <circle cx="12" cy="12" r="3" />
      <circle cx="5" cy="8" r="2" />
      <circle cx="19" cy="8" r="2" />
      <circle cx="8" cy="18" r="2" />
      <circle cx="16" cy="18" r="2" />
      <path strokeLinecap="round" d="M9.5 10.5L6.5 9M14.5 10.5L17.5 9M10 14.5L8.5 16.5M14 14.5L15.5 16.5" />
    </svg>
  );
}

function StudyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
  );
}

export default async function AboutPage() {
  const t = await getTranslations("about");
  const locale = (await getLocale()) as AvailableLanguage;

  return (
    <NavigationWrapper>
      <main className="min-h-dvh flex flex-col cosmic-bg relative">
        <div className="flex-1 overflow-auto relative z-10 py-8 px-6">
          <article className="max-w-4xl mx-auto">
            {/* Page Title - animated */}
            <MotionFadeIn className="text-center mb-12" variant="title">
              <h1 className="text-4xl md:text-5xl font-[family-name:var(--font-cormorant)] text-[var(--lo1-starlight)] mb-4">
                {t("title")}
              </h1>
              <p className="text-[var(--lo1-stardust)] text-lg">
                {t("subtitle")}
              </p>
            </MotionFadeIn>

            {/* Features Section - animated stagger */}
            <section className="mb-16">
              <h2 className="text-3xl font-[family-name:var(--font-cormorant)] text-[var(--lo1-gold)] mb-6 text-center">
                {t("features.title")}
              </h2>
              <MotionStaggerGroup className="grid md:grid-cols-3 gap-4">
                <MotionStaggerItem>
                  <Link
                    href="/explore"
                    className="block h-full bg-[var(--lo1-indigo)]/40 backdrop-blur-sm border border-[var(--lo1-celestial)]/40 rounded-2xl p-6 hover:border-[var(--lo1-gold)]/40 hover:shadow-[0_0_30px_rgba(212,168,83,0.1)] transition-all duration-300 group"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-[var(--lo1-gold)]/20 flex items-center justify-center">
                        <ExploreIcon className="w-5 h-5 text-[var(--lo1-gold)]" />
                      </div>
                      <h3 className="text-xl font-semibold text-[var(--lo1-starlight)] group-hover:text-[var(--lo1-gold)] transition-colors">
                        {t("features.explore.title")}
                      </h3>
                    </div>
                    <p className="text-[var(--lo1-stardust)] text-sm leading-relaxed">
                      {t("features.explore.description")}
                    </p>
                  </Link>
                </MotionStaggerItem>

                <MotionStaggerItem>
                  <Link
                    href="/paths"
                    className="block h-full bg-[var(--lo1-indigo)]/40 backdrop-blur-sm border border-[var(--lo1-celestial)]/40 rounded-2xl p-6 hover:border-[var(--lo1-gold)]/40 hover:shadow-[0_0_30px_rgba(212,168,83,0.1)] transition-all duration-300 group"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-[var(--lo1-gold)]/20 flex items-center justify-center">
                        <StudyIcon className="w-5 h-5 text-[var(--lo1-gold)]" />
                      </div>
                      <h3 className="text-xl font-semibold text-[var(--lo1-starlight)] group-hover:text-[var(--lo1-gold)] transition-colors">
                        {t("features.study.title")}
                      </h3>
                    </div>
                    <p className="text-[var(--lo1-stardust)] text-sm leading-relaxed">
                      {t("features.study.description")}
                    </p>
                  </Link>
                </MotionStaggerItem>

                <MotionStaggerItem>
                  <Link
                    href="/meditate"
                    className="block h-full bg-[var(--lo1-indigo)]/40 backdrop-blur-sm border border-[var(--lo1-celestial)]/40 rounded-2xl p-6 hover:border-[var(--lo1-gold)]/40 hover:shadow-[0_0_30px_rgba(212,168,83,0.1)] transition-all duration-300 group"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-[var(--lo1-gold)]/20 flex items-center justify-center">
                        <MeditateIcon className="w-5 h-5 text-[var(--lo1-gold)]" />
                      </div>
                      <h3 className="text-xl font-semibold text-[var(--lo1-starlight)] group-hover:text-[var(--lo1-gold)] transition-colors">
                        {t("features.meditate.title")}
                      </h3>
                    </div>
                    <p className="text-[var(--lo1-stardust)] text-sm leading-relaxed">
                      {t("features.meditate.description")}
                    </p>
                  </Link>
                </MotionStaggerItem>
              </MotionStaggerGroup>
            </section>

            <FeatureChangesSection t={t} />
            <AboutSections t={t} locale={locale} />
          </article>
        </div>
      </main>
    </NavigationWrapper>
  );
}
