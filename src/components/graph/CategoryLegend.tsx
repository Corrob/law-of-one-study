/**
 * Category legend shown when categories are expanded in the graph.
 */

import type { ConceptCategory } from "@/lib/graph/types";
import { CATEGORY_COLORS } from "@/lib/graph/layout";

interface CategoryLegendProps {
  expandedCategories: Set<ConceptCategory>;
  /** Translated title for the legend (e.g., "Categories") */
  title: string;
  /** Function to get translated category label */
  getCategoryLabel: (category: ConceptCategory) => string;
}

export function CategoryLegend({
  expandedCategories,
  title,
  getCategoryLabel,
}: CategoryLegendProps) {
  if (expandedCategories.size === 0) {
    return null;
  }

  return (
    <div className="absolute bottom-4 left-4 p-2 rounded-lg bg-[var(--lo1-void)]/90
                    border border-[var(--lo1-celestial)]/20 backdrop-blur-sm">
      <div className="text-[10px] text-[var(--lo1-stardust)] uppercase tracking-wider mb-1.5">
        {title}
      </div>
      <div className="flex flex-col gap-1">
        {Array.from(expandedCategories).map((category) => (
          <div key={category} className="flex items-center gap-2">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: CATEGORY_COLORS[category] }}
            />
            <span className="text-xs text-[var(--lo1-text-light)]">
              {getCategoryLabel(category)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
