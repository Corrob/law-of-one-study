import type { getTranslations } from "next-intl/server";

export default function FeatureChangesSection({
  t,
}: {
  t: Awaited<ReturnType<typeof getTranslations<"about">>>;
}) {
  return (
    <section className="mb-20">
      <h2 className="text-3xl font-[family-name:var(--font-cormorant)] text-[var(--lo1-gold)] mb-8 text-center">
        {t("featureChanges.title")}
      </h2>

      <div className="p-6 bg-[var(--lo1-indigo)]/40 border border-[var(--lo1-gold)]/40 rounded-xl max-w-3xl mx-auto">
        <div className="flex gap-4">
          <div className="flex-shrink-0">
            <svg className="w-6 h-6 text-[var(--lo1-gold)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1 space-y-3">
            <p className="text-sm text-[var(--lo1-starlight)] leading-relaxed">
              {t("featureChanges.message")}
            </p>
            <p className="text-sm text-[var(--lo1-stardust)] leading-relaxed">
              {t("featureChanges.remaining")}
            </p>
            <p className="text-sm text-[var(--lo1-stardust)] leading-relaxed">
              {t("featureChanges.readMaterial")}{" "}
              <a
                href="https://www.llresearch.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--lo1-gold)] hover:underline"
              >
                {t("featureChanges.llresearchLink")}
              </a>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
