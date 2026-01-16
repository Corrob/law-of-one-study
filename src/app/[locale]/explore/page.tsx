"use client";

import { useState, useCallback, useMemo } from "react";
import { AnimatePresence } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import NavigationWrapper from "@/components/NavigationWrapper";
import ErrorBoundary from "@/components/ErrorBoundary";
import ConceptGraph from "@/components/ConceptGraph";
import ConceptPanel from "@/components/ConceptPanel";
import { useConceptGraph } from "@/hooks/useConceptGraph";
import type { ConceptNode, GraphConcept, ConceptCategory } from "@/lib/graph/types";
import { findConceptById } from "@/lib/concept-graph";
import type { AvailableLanguage } from "@/lib/language-config";

export default function ExplorePage() {
  const locale = useLocale() as AvailableLanguage;
  const t = useTranslations();

  // Memoize getCategoryLabel to prevent unnecessary re-renders
  const getCategoryLabel = useMemo(
    () => (category: ConceptCategory) => t(`categories.${category}`),
    [t]
  );

  const {
    nodes,
    links,
    toggleCluster,
    toggleSubcluster,
    stats,
    expandedCategories,
  } = useConceptGraph({ locale, getCategoryLabel });

  const [selectedConcept, setSelectedConcept] = useState<GraphConcept | null>(
    null
  );

  const handleSelectConcept = useCallback((node: ConceptNode) => {
    setSelectedConcept(node.concept);
  }, []);

  const handleSelectConceptById = useCallback((conceptId: string) => {
    const concept = findConceptById(conceptId);
    if (concept) {
      setSelectedConcept(concept);
    }
  }, []);

  const handleClosePanel = useCallback(() => {
    setSelectedConcept(null);
  }, []);

  return (
    <main className="h-dvh flex flex-col cosmic-bg relative">
      {/* Starfield background */}
      <div className="starfield" />

      <NavigationWrapper>
        <ErrorBoundary>
          <div className="flex-1 overflow-hidden relative z-10 flex">
            {/* Graph area */}
            <div className="flex-1 relative min-w-0">
              <ConceptGraph
                nodes={nodes}
                links={links}
                onSelectConcept={handleSelectConcept}
                onExpandCluster={toggleCluster}
                onExpandSubcluster={toggleSubcluster}
                selectedConceptId={selectedConcept?.id}
                expandedCategories={expandedCategories}
                categoriesTitle={t("explorePage.categoriesTitle")}
                getCategoryLabel={getCategoryLabel}
              />

              {/* Stats overlay - only show when concepts visible */}
              {stats.visibleConcepts > 0 && (
                <div className="absolute top-4 left-4 text-xs text-[var(--lo1-stardust)] bg-[var(--lo1-space)]/60 backdrop-blur-sm px-3 py-1.5 rounded-full">
                  {t("explorePage.stats", { concepts: stats.visibleConcepts, connections: stats.totalLinks })}
                </div>
              )}

              {/* Onboarding hint - show when no categories expanded */}
              {stats.visibleConcepts === 0 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center max-w-xs mx-4 animate-pulse">
                    <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[var(--lo1-gold)]/20 flex items-center justify-center">
                      <svg className="w-6 h-6 text-[var(--lo1-gold)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                      </svg>
                    </div>
                    <p className="text-[var(--lo1-starlight)] font-medium mb-2">
                      {t("explorePage.tapCategory")}
                    </p>
                    <p className="text-sm text-[var(--lo1-stardust)]/70">
                      {t("explorePage.categoryHint")}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Concept detail panel */}
            <AnimatePresence>
              {selectedConcept && (
                <ConceptPanel
                  concept={selectedConcept}
                  onClose={handleClosePanel}
                  onSelectConcept={handleSelectConceptById}
                />
              )}
            </AnimatePresence>
          </div>
        </ErrorBoundary>
      </NavigationWrapper>
    </main>
  );
}
