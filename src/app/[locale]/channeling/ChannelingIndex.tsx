"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export interface IndexTheme {
  id: string;
  title: string;
  teaser: string;
  sources: string[];
  count: number;
  /** Precomputed lowercase haystack: title + summary + aliases. */
  search: string;
}

interface ChannelingIndexProps {
  themes: IndexTheme[];
}

export default function ChannelingIndex({ themes }: ChannelingIndexProps) {
  const t = useTranslations("channeling");
  const [query, setQuery] = useState("");
  const [source, setSource] = useState<string | null>(null);

  // Distinct sources (voices), most common first, for the filter row.
  const sources = useMemo(() => {
    const counts = new Map<string, number>();
    for (const theme of themes) {
      for (const s of theme.sources) counts.set(s, (counts.get(s) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([s]) => s);
  }, [themes]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return themes.filter(
      (theme) =>
        (!source || theme.sources.includes(source)) &&
        (!q || theme.search.includes(q))
    );
  }, [themes, query, source]);

  return (
    <div>
      {/* Search + voice filter */}
      <div className="mb-6 flex flex-col gap-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label={t("searchLabel")}
          placeholder={t("searchPlaceholder")}
          className="w-full rounded-xl border border-[var(--lo1-celestial)]/40 bg-[var(--lo1-indigo)]/40 px-4 py-2.5
                     text-base text-[var(--lo1-starlight)] placeholder:text-[var(--lo1-stardust)]/50 backdrop-blur-sm
                     focus:border-[var(--lo1-gold)]/50 focus:outline-none"
        />
        <div className="flex flex-wrap items-center gap-2">
          <FilterChip active={source === null} onClick={() => setSource(null)}>
            {t("allSources")}
          </FilterChip>
          {sources.map((s) => (
            <FilterChip key={s} active={source === s} onClick={() => setSource(s)}>
              {s}
            </FilterChip>
          ))}
          <span className="ml-auto text-xs text-[var(--lo1-stardust)]/60 tabular-nums">
            {t("count", { count: filtered.length })}
          </span>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="py-16 text-center text-[var(--lo1-stardust)]/70">{t("noResults")}</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 list-none p-0">
          {filtered.map((theme) => (
            <li key={theme.id}>
              <Link
                href={`/channeling/${theme.id}`}
                data-testid="channeling-card"
                className="flex h-full flex-col bg-[var(--lo1-indigo)]/40 backdrop-blur-sm border border-[var(--lo1-celestial)]/40
                           rounded-2xl p-5 hover:border-[var(--lo1-gold)]/40 hover:shadow-[0_0_30px_rgba(212,168,83,0.1)]
                           transition-all duration-300 group cursor-pointer"
              >
                <h2 className="text-lg font-semibold text-[var(--lo1-starlight)] group-hover:text-[var(--lo1-gold)] transition-colors text-balance">
                  {theme.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-[var(--lo1-stardust)] line-clamp-3">
                  {theme.teaser}
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-1.5">
                  {theme.sources.map((s) => (
                    <span
                      key={s}
                      className="rounded-full bg-[var(--lo1-gold)]/10 border border-[var(--lo1-gold)]/20 px-2 py-0.5 text-[11px] text-[var(--lo1-gold)]"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-3 py-1 text-xs transition-colors cursor-pointer ${
        active
          ? "border-[var(--lo1-gold)]/50 bg-[var(--lo1-gold)]/15 text-[var(--lo1-gold)]"
          : "border-[var(--lo1-celestial)]/30 text-[var(--lo1-stardust)]/70 hover:text-[var(--lo1-starlight)]"
      }`}
    >
      {children}
    </button>
  );
}
