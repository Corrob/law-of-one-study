"use client";

import { useState, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import NavigationWrapper from "@/components/NavigationWrapper";
import ErrorBoundary from "@/components/ErrorBoundary";
import ConceptGraph from "@/components/ConceptGraph";
import ConceptPanel from "@/components/ConceptPanel";
import { useConceptGraph } from "@/hooks/useConceptGraph";
import type { ConceptNode, GraphConcept } from "@/lib/graph/types";
import { findConceptById } from "@/lib/concept-graph";

export default function ExplorePage() {
  const {
    nodes,
    links,
    toggleCluster,
    toggleSubcluster,
    stats,
    expandedCategories,
  } = useConceptGraph();

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
              />

              {/* Stats overlay */}
              <div className="absolute top-4 left-4 text-xs text-[var(--lo1-stardust)]">
                {stats.visibleConcepts > 0 ? (
                  <span>
                    {stats.visibleConcepts} concepts &middot; {stats.totalLinks} connections
                  </span>
                ) : (
                  <span>Click a category to explore</span>
                )}
              </div>
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
