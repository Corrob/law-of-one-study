"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { askAnalytics } from "@/lib/ask/analytics";
import { type RelatedResource, type ResourceType } from "@/lib/ask/resources";
import { type ResourceLinkRef } from "@/lib/ask/resource-links";

interface AskRelatedResourcesProps {
  items: RelatedResource[];
  /** Resources already linked inline in the answer — skipped to avoid repeats. */
  excludeInline: ResourceLinkRef[];
}

const MAX_CARDS = 3;

/** One small inline icon per resource type (stroke follows text color). */
const TYPE_ICON_PATHS: Record<ResourceType, string> = {
  // Lotus-ish person in repose (meditation)
  meditation: "M12 4a2 2 0 110 4 2 2 0 010-4zM6 20c1-4 3-6 6-6s5 2 6 6M4 16c2-1 4-1.5 8-1.5s6 .5 8 1.5",
  // Musical note
  song: "M9 18V6l10-2v12M9 18a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zm10-2a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z",
  // Open book (study path)
  path: "M12 6.5C10.5 5 8.5 4.5 4 4.5v13c4.5 0 6.5.5 8 2 1.5-1.5 3.5-2 8-2v-13c-4.5 0-6.5.5-8 2zM12 6.5v13",
  // Connected nodes (concept graph)
  concept: "M6 7a2 2 0 110-4 2 2 0 010 4zm12 2a2 2 0 110-4 2 2 0 010 4zM9 20a2 2 0 110-4 2 2 0 010 4zm8 0a2 2 0 110-4 2 2 0 010 4zM7.5 6.5l9 1.5M6.8 8.8 8.5 16m9-6.5-1 6.5m-5.5 1.5h4",
};

/**
 * "Explore further" — a footer inside a finished answer card: deterministic
 * pointers to the site's own meditations, songs, study paths, and concepts
 * related to the question, as compact boxed cards (icon, type caption, title).
 * Muted relative to the follow-up suggestion chips, which remain the primary
 * next step. On small screens the cards stack full-width for easy tapping; on
 * larger screens they sit side by side. Deduped against inline {{LINK}}
 * recommendations.
 */
export default function AskRelatedResources({ items, excludeInline }: AskRelatedResourcesProps) {
  const t = useTranslations("ask");
  const inline = new Set(excludeInline.map((l) => `${l.type}:${l.id}`));
  const cards = items.filter((r) => !inline.has(`${r.type}:${r.id}`)).slice(0, MAX_CARDS);
  if (cards.length === 0) return null;

  return (
    <div
      data-testid="ask-related"
      className="mt-3 border-t border-[var(--lo1-gold)]/10 pt-3"
    >
      <p className="mb-2 text-[11px] uppercase tracking-wider text-[var(--lo1-stardust)]/50">
        {t("related.title")}
      </p>
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {cards.map((resource, index) => (
          <Link
            key={`${resource.type}:${resource.id}`}
            href={resource.href}
            data-testid="ask-related-card"
            onClick={() =>
              askAnalytics.relatedResourceClicked({
                type: resource.type,
                id: resource.id,
                index,
              })
            }
            className="group flex min-w-0 items-center gap-2.5 rounded-lg border border-[var(--lo1-gold)]/15
                       bg-[var(--lo1-void)]/30 px-3 py-2 sm:max-w-[16rem]
                       hover:bg-[var(--lo1-gold)]/10 hover:border-[var(--lo1-gold)]/40
                       transition-colors cursor-pointer"
          >
            <svg
              aria-hidden
              className="h-4.5 w-4.5 shrink-0 text-[var(--lo1-gold)]/60 group-hover:text-[var(--lo1-gold)]"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              viewBox="0 0 24 24"
            >
              <path d={TYPE_ICON_PATHS[resource.type]} />
            </svg>
            <span className="flex min-w-0 flex-col text-left">
              <span className="text-[10px] uppercase tracking-wide text-[var(--lo1-stardust)]/50">
                {t(`related.types.${resource.type}`)}
              </span>
              <span className="truncate text-sm text-[var(--lo1-stardust)]/85 group-hover:text-[var(--lo1-starlight)]">
                {resource.title}
              </span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
