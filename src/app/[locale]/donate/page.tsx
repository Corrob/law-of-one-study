"use client";

import { motion } from "framer-motion";
import NavigationWrapper from "@/components/NavigationWrapper";
import { titleVariants, staggerContainer, staggerChild } from "@/lib/animations";
import { useTranslations, useLocale } from "next-intl";
import { getRaMaterialUrl, type AvailableLanguage } from "@/lib/quote-utils";

function HeartIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
      />
    </svg>
  );
}

function CoffeeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17 8h1a4 4 0 1 1 0 8h-1M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8zM6 1v3M10 1v3M14 1v3"
      />
    </svg>
  );
}

function ServerIcon({ className }: { className?: string }) {
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

function CodeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 18l6-6-6-6M8 6l-6 6 6 6" />
    </svg>
  );
}

function GlobeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
    >
      <circle cx="12" cy="12" r="10" />
      <path strokeLinecap="round" d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

export default function DonatePage() {
  const t = useTranslations("donate");
  const locale = useLocale() as AvailableLanguage;

  return (
    <NavigationWrapper>
      <main className="min-h-dvh flex flex-col cosmic-bg relative">
        {/* Content */}
        <div className="flex-1 overflow-auto relative z-10 py-8 px-6">
          <article className="max-w-3xl mx-auto">
            {/* Page Title */}
            <motion.div
              className="text-center mb-12"
              variants={titleVariants}
              initial="hidden"
              animate="visible"
            >
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-[var(--lo1-gold)]/20 flex items-center justify-center">
                  <HeartIcon className="w-8 h-8 text-[var(--lo1-gold)]" />
                </div>
              </div>
              <h1 className="text-4xl md:text-5xl font-[family-name:var(--font-cormorant)] text-[var(--lo1-starlight)] mb-4">
                {t("title")}
              </h1>
              <p className="text-[var(--lo1-stardust)] text-lg max-w-xl mx-auto">
                {t("subtitle")}
              </p>
            </motion.div>

            {/* Buy Me a Coffee Card */}
            <motion.section
              className="mb-12"
              variants={staggerContainer(0.1)}
              initial="hidden"
              animate="visible"
            >
              <motion.div variants={staggerChild}>
                <a
                  href="https://buymeacoffee.com/lawofone.study"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-[var(--lo1-indigo)]/50 backdrop-blur-sm border border-[var(--lo1-gold)]/30 rounded-2xl p-8 hover:border-[var(--lo1-gold)]/60 hover:shadow-[0_0_40px_rgba(212,168,83,0.2)] transition-all duration-300 group text-center"
                >
                  <div className="flex justify-center mb-4">
                    <div className="w-14 h-14 rounded-full bg-[var(--lo1-gold)]/20 flex items-center justify-center group-hover:bg-[var(--lo1-gold)]/30 transition-colors">
                      <CoffeeIcon className="w-7 h-7 text-[var(--lo1-gold)]" />
                    </div>
                  </div>
                  <h2 className="text-2xl font-[family-name:var(--font-cormorant)] text-[var(--lo1-starlight)] group-hover:text-[var(--lo1-gold)] transition-colors mb-2">
                    {t("buyMeACoffee.title")}
                  </h2>
                  <p className="text-[var(--lo1-stardust)] mb-4">
                    {t("buyMeACoffee.description")}
                  </p>
                  <span className="inline-flex items-center gap-2 text-[var(--lo1-gold)] font-medium">
                    {t("buyMeACoffee.linkText")}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </span>
                </a>
              </motion.div>
            </motion.section>

            {/* What Your Support Enables */}
            <motion.section
              className="mb-12"
              variants={staggerContainer(0.1)}
              initial="hidden"
              animate="visible"
            >
              <h2 className="text-2xl font-[family-name:var(--font-cormorant)] text-[var(--lo1-gold)] mb-6 text-center">
                {t("whatYourSupportEnables.title")}
              </h2>
              <motion.div
                className="grid md:grid-cols-3 gap-4"
                variants={staggerContainer(0.1)}
              >
                <motion.div
                  variants={staggerChild}
                  className="bg-[var(--lo1-indigo)]/30 backdrop-blur-sm border border-[var(--lo1-celestial)]/30 rounded-xl p-5"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-[var(--lo1-gold)]/15 flex items-center justify-center">
                      <ServerIcon className="w-5 h-5 text-[var(--lo1-gold)]" />
                    </div>
                    <h3 className="font-semibold text-[var(--lo1-starlight)]">{t("whatYourSupportEnables.hosting.title")}</h3>
                  </div>
                  <p className="text-sm text-[var(--lo1-stardust)] leading-relaxed">
                    {t("whatYourSupportEnables.hosting.description")}
                  </p>
                </motion.div>

                <motion.div
                  variants={staggerChild}
                  className="bg-[var(--lo1-indigo)]/30 backdrop-blur-sm border border-[var(--lo1-celestial)]/30 rounded-xl p-5"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-[var(--lo1-gold)]/15 flex items-center justify-center">
                      <CodeIcon className="w-5 h-5 text-[var(--lo1-gold)]" />
                    </div>
                    <h3 className="font-semibold text-[var(--lo1-starlight)]">{t("whatYourSupportEnables.development.title")}</h3>
                  </div>
                  <p className="text-sm text-[var(--lo1-stardust)] leading-relaxed">
                    {t("whatYourSupportEnables.development.description")}
                  </p>
                </motion.div>

                <motion.div
                  variants={staggerChild}
                  className="bg-[var(--lo1-indigo)]/30 backdrop-blur-sm border border-[var(--lo1-celestial)]/30 rounded-xl p-5"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-[var(--lo1-gold)]/15 flex items-center justify-center">
                      <GlobeIcon className="w-5 h-5 text-[var(--lo1-gold)]" />
                    </div>
                    <h3 className="font-semibold text-[var(--lo1-starlight)]">{t("whatYourSupportEnables.freeAccess.title")}</h3>
                  </div>
                  <p className="text-sm text-[var(--lo1-stardust)] leading-relaxed">
                    {t("whatYourSupportEnables.freeAccess.description")}
                  </p>
                </motion.div>
              </motion.div>
            </motion.section>

            {/* Footer Quote */}
            <motion.section
              className="text-center mt-16"
              variants={staggerChild}
              initial="hidden"
              animate="visible"
            >
              <blockquote className="max-w-2xl mx-auto">
                <p className="font-[family-name:var(--font-cormorant)] italic text-xl text-[var(--lo1-stardust)] leading-relaxed mb-3">
                  &ldquo;{t("footerQuote.text")}&rdquo;
                </p>
                <footer className="text-sm text-[var(--lo1-stardust)]/60">
                  <a
                    href={getRaMaterialUrl(1, 7, locale)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[var(--lo1-gold)] transition-colors"
                  >
                    {t("footerQuote.attribution")}
                  </a>
                </footer>
              </blockquote>
            </motion.section>
          </article>
        </div>
      </main>
    </NavigationWrapper>
  );
}
