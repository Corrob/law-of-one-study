"use client";

import { useRouter } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { motion, useDragControls } from "framer-motion";
import type { GraphConcept } from "@/lib/graph/types";
import { findConceptById } from "@/lib/concept-graph";
import { getLocalizedText } from "@/lib/types-graph";
import { CATEGORY_COLORS } from "@/lib/graph/layout";
import { CloseIcon, ChatIcon } from "@/components/icons";
import { getRaMaterialUrlFromReference } from "@/lib/quote-utils";
import type { AvailableLanguage } from "@/lib/language-config";

interface ConceptPanelProps {
  concept: GraphConcept;
  onClose: () => void;
  onSelectConcept: (conceptId: string) => void;
}

export default function ConceptPanel({
  concept,
  onClose,
  onSelectConcept,
}: ConceptPanelProps) {
  const locale = useLocale() as AvailableLanguage;
  const router = useRouter();
  const dragControls = useDragControls();
  const t = useTranslations();

  const handleExploreInChat = () => {
    const term = getLocalizedText(concept.term, locale);
    const query = `Help me understand ${term}`;
    router.push(`/chat?q=${encodeURIComponent(query)}`);
  };

  // Get related concepts that exist (deduplicated)
  const relatedConceptIds = [
    ...(concept.relationships.related || []),
    ...(concept.relationships.leads_to || []),
    ...(concept.relationships.prerequisite || []),
  ];

  // Deduplicate and limit to 6
  const uniqueRelatedIds = [...new Set(relatedConceptIds)].slice(0, 6);

  const relatedConcepts = uniqueRelatedIds
    .map((id) => findConceptById(id))
    .filter((c): c is GraphConcept => c !== undefined);

  const categoryColor = CATEGORY_COLORS[concept.category];

  return (
    <>
      {/* Desktop: Side Panel */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="hidden md:flex flex-col w-96 shrink-0 border-l border-[var(--lo1-celestial)]/20
                   bg-[var(--lo1-void)]/95 backdrop-blur-sm self-stretch"
      >
        <PanelContent
          concept={concept}
          categoryColor={categoryColor}
          relatedConcepts={relatedConcepts}
          locale={locale}
          t={t}
          onClose={onClose}
          onSelectConcept={onSelectConcept}
          onExploreInChat={handleExploreInChat}
        />
      </motion.div>

      {/* Mobile: Bottom Sheet */}
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        drag="y"
        dragControls={dragControls}
        dragListener={false}
        dragConstraints={{ top: 0 }}
        dragElastic={0.2}
        onDragEnd={(_, info) => {
          if (info.offset.y > 100) {
            onClose();
          }
        }}
        className="md:hidden fixed bottom-0 inset-x-0 max-h-[80vh] rounded-t-2xl
                   bg-[var(--lo1-void)] border-t border-[var(--lo1-celestial)]/20
                   flex flex-col z-50"
      >
        {/* Drag handle - touch here to drag */}
        <div
          className="flex justify-center py-3 cursor-grab active:cursor-grabbing touch-none"
          onPointerDown={(e) => dragControls.start(e)}
        >
          <div className="w-12 h-1.5 rounded-full bg-[var(--lo1-stardust)]/50" />
        </div>

        <div className="flex-1 overflow-y-auto">
          <PanelContent
            concept={concept}
            categoryColor={categoryColor}
            relatedConcepts={relatedConcepts}
            locale={locale}
            t={t}
            onClose={onClose}
            onSelectConcept={onSelectConcept}
            onExploreInChat={handleExploreInChat}
          />
        </div>
      </motion.div>

      {/* Mobile backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="md:hidden fixed inset-0 bg-black/50 z-40 cursor-pointer"
      />
    </>
  );
}

// Shared panel content
function PanelContent({
  concept,
  categoryColor,
  relatedConcepts,
  locale,
  t,
  onClose,
  onSelectConcept,
  onExploreInChat,
}: {
  concept: GraphConcept;
  categoryColor: string;
  relatedConcepts: GraphConcept[];
  locale: AvailableLanguage;
  t: ReturnType<typeof useTranslations>;
  onClose: () => void;
  onSelectConcept: (conceptId: string) => void;
  onExploreInChat: () => void;
}) {
  // Get localized text
  const term = getLocalizedText(concept.term, locale);
  const definition = getLocalizedText(concept.definition, locale);
  const extendedDefinition = getLocalizedText(concept.extendedDefinition, locale);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start justify-between p-4 border-b border-[var(--lo1-celestial)]/10">
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-semibold text-[var(--lo1-starlight)] truncate">
            {term}
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <span
              className="px-2 py-0.5 rounded-full text-xs font-medium"
              style={{ backgroundColor: `${categoryColor}30`, color: categoryColor }}
            >
              {t(`categories.${concept.category}`)}
            </span>
            <span className="text-xs text-[var(--lo1-stardust)]">
              {t(`concept.teachingLevel.${concept.teachingLevel}`)}
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-[var(--lo1-celestial)]/10 transition-colors cursor-pointer"
          aria-label="Close panel"
        >
          <CloseIcon className="w-5 h-5 text-[var(--lo1-stardust)]" />
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Definition */}
        <div>
          <h3 className="text-sm font-medium text-[var(--lo1-stardust)] mb-1">
            {t("concept.definition")}
          </h3>
          <p className="text-[var(--lo1-starlight)] text-sm leading-relaxed">
            {definition}
          </p>
        </div>

        {/* Extended definition */}
        {extendedDefinition && (
          <div>
            <p className="text-[var(--lo1-text-light)] text-sm leading-relaxed">
              {extendedDefinition}
            </p>
          </div>
        )}

        {/* Key passages */}
        {concept.keyPassages.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-[var(--lo1-stardust)] mb-2">
              {t("concept.keyPassages")}
            </h3>
            <div className="space-y-2">
              {concept.keyPassages.slice(0, 2).map((passage, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-[var(--lo1-indigo)]/30 border border-[var(--lo1-celestial)]/10"
                >
                  <p className="text-sm text-[var(--lo1-starlight)] italic leading-relaxed">
                    &ldquo;{getLocalizedText(passage.excerpt, locale)}&rdquo;
                  </p>
                  <a
                    href={getRaMaterialUrlFromReference(passage.reference, locale)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[var(--lo1-gold)] hover:underline mt-1 inline-block cursor-pointer"
                  >
                    Ra {passage.reference}
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Related concepts */}
        {relatedConcepts.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-[var(--lo1-stardust)] mb-2">
              {t("concept.relatedConcepts")}
            </h3>
            <div className="flex flex-wrap gap-2">
              {relatedConcepts.map((related) => (
                <button
                  key={related.id}
                  onClick={() => onSelectConcept(related.id)}
                  className="px-3 py-1.5 rounded-full text-sm cursor-pointer
                           bg-[var(--lo1-celestial)]/10 text-[var(--lo1-text-light)]
                           hover:bg-[var(--lo1-celestial)]/20 transition-colors"
                >
                  {getLocalizedText(related.term, locale)}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer with CTA */}
      <div className="p-4 border-t border-[var(--lo1-celestial)]/10">
        <button
          onClick={onExploreInChat}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 cursor-pointer
                   rounded-xl bg-[var(--lo1-gold)] text-[var(--lo1-deep-space)]
                   font-medium hover:bg-[var(--lo1-gold-light)] transition-colors"
        >
          <ChatIcon className="w-5 h-5" />
          {t("concept.explore")}
        </button>
      </div>
    </div>
  );
}
