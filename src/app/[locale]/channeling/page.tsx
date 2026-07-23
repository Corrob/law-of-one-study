import { getTranslations, getLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import NavigationWrapper from "@/components/NavigationWrapper";
import MotionFadeIn from "@/components/MotionFadeIn";
import { getChannelingThemes, channelingThemeTitle } from "@/lib/ask/channeling";
import { getChannelingReference } from "@/lib/ask/channeling-references";
import ChannelingIndex, { type IndexTheme } from "./ChannelingIndex";

/**
 * Public browse page for the conscious-channeling themes — the channeling
 * counterpart to Explore. English-only (the transcripts have no translations),
 * so non-English locales 404. Read-only view over the same curated data the
 * Ask feature grounds on; no transcript text, only our-words summaries + links.
 */
export default async function ChannelingPage() {
  const locale = await getLocale();
  if (locale !== "en") notFound();

  const t = await getTranslations("channeling");

  const themes: IndexTheme[] = getChannelingThemes().map((theme) => {
    const title = channelingThemeTitle(theme);
    const teaser = theme.summary.split("\n\n")[0];
    const sources = [
      ...new Set(
        theme.references
          .map((r) => getChannelingReference(r)?.source)
          .filter((s): s is string => Boolean(s))
      ),
    ];
    return {
      id: theme.id,
      title,
      teaser,
      sources,
      count: theme.references.length,
      search: `${title} ${theme.summary} ${theme.aliases.join(" ")}`.toLowerCase(),
    };
  });

  return (
    <NavigationWrapper>
      <main className="min-h-dvh flex flex-col cosmic-bg relative">
        <div className="flex-1 overflow-auto relative z-10 py-8 px-6">
          <div className="max-w-5xl mx-auto">
            <MotionFadeIn className="text-center mb-6" variant="title">
              <h1 className="text-4xl md:text-5xl font-[family-name:var(--font-cormorant)] text-[var(--lo1-starlight)] mb-4">
                {t("title")}
              </h1>
              <p className="text-[var(--lo1-stardust)] text-lg max-w-2xl mx-auto">
                {t("subtitle")}
              </p>
            </MotionFadeIn>

            <p className="max-w-2xl mx-auto mb-8 text-center text-sm italic leading-relaxed text-[var(--lo1-stardust)]/70">
              {t("disclaimer")}
            </p>

            <ChannelingIndex themes={themes} />

            <footer className="mt-14 pt-6 border-t border-[var(--lo1-celestial)]/20 max-w-2xl mx-auto text-center">
              <h2 className="text-sm uppercase tracking-wider text-[var(--lo1-gold)]/80 mb-2">
                {t("aboutHeading")}
              </h2>
              <p className="text-sm leading-relaxed text-[var(--lo1-stardust)]/70">
                {t("aboutBody")}
              </p>
            </footer>
          </div>
        </div>
      </main>
    </NavigationWrapper>
  );
}
