import type { getTranslations } from "next-intl/server";

export default function HowItWorksSection({
  t,
}: {
  t: Awaited<ReturnType<typeof getTranslations<"about">>>;
}) {
  return (
    <section className="mb-20">
      <h2 className="text-3xl font-[family-name:var(--font-cormorant)] text-[var(--lo1-gold)] mb-8 text-center">
        {t("howItWorks.title")}
      </h2>
      <p className="text-[var(--lo1-stardust)] text-center mb-10 max-w-2xl mx-auto">
        {t("howItWorks.subtitle")}
      </p>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-[var(--lo1-indigo)]/40 backdrop-blur-sm border border-[var(--lo1-celestial)]/40 rounded-2xl p-6 hover:border-[var(--lo1-gold)]/40 hover:shadow-[0_0_30px_rgba(212,168,83,0.1)] transition-all duration-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-[var(--lo1-gold)]/20 flex items-center justify-center text-[var(--lo1-gold)] font-bold text-xl">
              {t("howItWorks.step1.number")}
            </div>
            <h3 className="text-xl font-semibold text-[var(--lo1-starlight)]">
              {t("howItWorks.step1.title")}
            </h3>
          </div>
          <p className="text-[var(--lo1-stardust)] text-sm leading-relaxed">
            {t("howItWorks.step1.description")}
          </p>
        </div>

        <div className="bg-[var(--lo1-indigo)]/40 backdrop-blur-sm border border-[var(--lo1-celestial)]/40 rounded-2xl p-6 hover:border-[var(--lo1-gold)]/40 hover:shadow-[0_0_30px_rgba(212,168,83,0.1)] transition-all duration-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-[var(--lo1-gold)]/20 flex items-center justify-center text-[var(--lo1-gold)] font-bold text-xl">
              {t("howItWorks.step2.number")}
            </div>
            <h3 className="text-xl font-semibold text-[var(--lo1-starlight)]">{t("howItWorks.step2.title")}</h3>
          </div>
          <p className="text-[var(--lo1-stardust)] text-sm leading-relaxed">
            {t("howItWorks.step2.description")}
          </p>
        </div>

        <div className="bg-[var(--lo1-indigo)]/40 backdrop-blur-sm border border-[var(--lo1-celestial)]/40 rounded-2xl p-6 hover:border-[var(--lo1-gold)]/40 hover:shadow-[0_0_30px_rgba(212,168,83,0.1)] transition-all duration-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-[var(--lo1-gold)]/20 flex items-center justify-center text-[var(--lo1-gold)] font-bold text-xl">
              {t("howItWorks.step3.number")}
            </div>
            <h3 className="text-xl font-semibold text-[var(--lo1-starlight)]">
              {t("howItWorks.step3.title")}
            </h3>
          </div>
          <p className="text-[var(--lo1-stardust)] text-sm leading-relaxed mb-3">
            {t("howItWorks.step3.description")}
          </p>
          <ul className="text-[var(--lo1-stardust)] text-sm space-y-1">
            <li className="flex items-start gap-2">
              <span className="text-[var(--lo1-gold)] mt-1">•</span>
              <span>{t("howItWorks.step3.bullets.quotes")}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[var(--lo1-gold)] mt-1">•</span>
              <span>{t("howItWorks.step3.bullets.explanations")}</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[var(--lo1-gold)] mt-1">•</span>
              <span>{t("howItWorks.step3.bullets.concepts")}</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="p-6 bg-[var(--lo1-indigo)]/40 border border-[var(--lo1-gold)]/40 rounded-xl max-w-3xl mx-auto">
        <div className="flex gap-4">
          <div className="flex-shrink-0">
            <svg className="w-6 h-6 text-[var(--lo1-gold)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm text-[var(--lo1-starlight)] leading-relaxed">
              <strong className="text-[var(--lo1-gold)]">{t("howItWorks.warning.label")}</strong>{" "}
              {t("howItWorks.warning.text")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
