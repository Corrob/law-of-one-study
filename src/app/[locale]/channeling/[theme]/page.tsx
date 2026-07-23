import type { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import NavigationWrapper from "@/components/NavigationWrapper";
import MotionFadeIn from "@/components/MotionFadeIn";
import {
  getChannelingThemes,
  getChannelingTheme,
  channelingThemeTitle,
} from "@/lib/ask/channeling";
import {
  channelingCitationLabel,
  channelingCitationUrl,
} from "@/lib/ask/channeling-references";

interface ThemePageProps {
  params: Promise<{ theme: string }>;
}

/** Prerender the English theme pages only (channeling is English-only). */
export function generateStaticParams() {
  return getChannelingThemes().map((theme) => ({ locale: "en", theme: theme.id }));
}

export async function generateMetadata({ params }: ThemePageProps): Promise<Metadata> {
  const { theme: id } = await params;
  const theme = getChannelingTheme(id);
  if (!theme) return {};
  const title = channelingThemeTitle(theme);
  const description = theme.summary.split("\n\n")[0].slice(0, 200);
  return {
    title: `${title} | Conscious Channeling`,
    description,
    alternates: { canonical: `/channeling/${id}` },
    openGraph: {
      title: `${title} | Conscious Channeling`,
      description,
      url: `https://lawofone.study/channeling/${id}`,
      type: "article",
    },
  };
}

export default async function ChannelingThemePage({ params }: ThemePageProps) {
  const locale = await getLocale();
  const { theme: id } = await params;
  if (locale !== "en") notFound();

  const theme = getChannelingTheme(id);
  if (!theme) notFound();

  const t = await getTranslations("channeling");
  const paragraphs = theme.summary.split("\n\n");
  const sources = theme.references
    .map((ref) => ({ ref, label: channelingCitationLabel(ref), url: channelingCitationUrl(ref) }))
    .filter((s): s is { ref: string; label: string; url: string } => Boolean(s.label && s.url));

  return (
    <NavigationWrapper>
      <main className="min-h-dvh flex flex-col cosmic-bg relative">
        <div className="flex-1 overflow-auto relative z-10 py-8 px-6">
          <article className="max-w-2xl mx-auto">
            <MotionFadeIn variant="title">
              <Link
                href="/channeling"
                className="inline-block mb-6 text-sm text-[var(--lo1-gold)] hover:text-[var(--lo1-gold)]/80 transition-colors cursor-pointer"
              >
                ← {t("back")}
              </Link>
              <h1 className="text-3xl md:text-4xl font-[family-name:var(--font-cormorant)] text-[var(--lo1-starlight)] mb-4 text-balance">
                {channelingThemeTitle(theme)}
              </h1>
            </MotionFadeIn>

            <div className="space-y-4">
              {paragraphs.map((para, i) => (
                <p key={i} className="text-[var(--lo1-starlight)]/90 leading-relaxed">
                  {para}
                </p>
              ))}
            </div>

            {sources.length > 0 && (
              <section className="mt-10">
                <h2 className="text-sm uppercase tracking-wider text-[var(--lo1-stardust)]/60 mb-3">
                  {t("sourcesHeading")}
                </h2>
                <ul className="flex flex-col gap-2 list-none p-0">
                  {sources.map((s) => (
                    <li key={s.ref}>
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={t("sourceLinkAria", { label: s.label })}
                        className="flex items-center gap-3 rounded-xl border border-[var(--lo1-celestial)]/40 bg-[var(--lo1-indigo)]/40
                                   px-4 py-3 hover:border-[var(--lo1-gold)]/40 transition-colors group cursor-pointer"
                      >
                        <span className="text-[var(--lo1-gold)]" aria-hidden="true">
                          ↗
                        </span>
                        <span className="flex-1 text-[var(--lo1-starlight)] group-hover:text-[var(--lo1-gold)] transition-colors">
                          {s.label}
                        </span>
                        <span className="text-xs text-[var(--lo1-stardust)]/60">
                          {t("openTranscript")}
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <p className="mt-10 text-xs italic leading-relaxed text-[var(--lo1-stardust)]/60">
              {t("disclaimer")}
            </p>
          </article>
        </div>
      </main>
    </NavigationWrapper>
  );
}
