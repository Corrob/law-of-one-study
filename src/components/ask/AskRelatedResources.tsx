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
 * "Explore further" — a quiet footer inside a finished answer card:
 * deterministic pointers to the site's own meditations, songs, study paths,
 * and concepts related to the question. Deliberately understated (hairline
 * divider, muted text links) so the answer and the follow-up suggestion chips
 * stay the visual focus. Deduped against inline {{LINK}} recommendations.
 */
export default function AskRelatedResources({ items, excludeInline }: AskRelatedResourcesProps) {
  const t = useTranslations("ask");
  const inline = new Set(excludeInline.map((l) => `${l.type}:${l.id}`));
  const cards = items.filter((r) => !inline.has(`${r.type}:${r.id}`)).slice(0, MAX_CARDS);
  if (cards.length === 0) return null;

  return (
    <div
      data-testid="ask-related"
      className="mt-3 border-t border-[var(--lo1-gold)]/10 pt-2.5"
    >
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1.5">
        <span className="text-[11px] uppercase tracking-wider text-[var(--lo1-stardust)]/50">
          {t("related.title")}
        </span>
        {cards.map((resource, index) => (
          <Link
            key={`${resource.type}:${resource.id}`}
            href={resource.href}
            data-testid="ask-related-card"
            title={t(`related.types.${resource.type}`)}
            onClick={() =>
              askAnalytics.relatedResourceClicked({
                type: resource.type,
                id: resource.id,
                index,
              })
            }
            className="group inline-flex items-center gap-1.5 text-sm text-[var(--lo1-stardust)]/70
                       hover:text-[var(--lo1-gold)] transition-colors cursor-pointer"
          >
            <svg
              aria-hidden
              className="h-3.5 w-3.5 shrink-0 opacity-60 group-hover:opacity-100"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              viewBox="0 0 24 24"
            >
              <path d={TYPE_ICON_PATHS[resource.type]} />
            </svg>
            <span className="underline decoration-dotted decoration-[var(--lo1-stardust)]/30 underline-offset-2 group-hover:decoration-[var(--lo1-gold)]/60">
              {resource.title}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
