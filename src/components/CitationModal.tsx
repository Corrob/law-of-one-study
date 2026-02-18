"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { formatWholeQuote, getRaMaterialUrl } from "@/lib/quote-utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { type AvailableLanguage } from "@/lib/language-config";
import { useQuoteData } from "@/hooks/useBilingualQuote";

interface RaCitationModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: number;
  question: number;
}

interface ConfederationCitationModalProps {
  isOpen: boolean;
  onClose: () => void;
  confederationRef: string;
  confederationText: string;
  confederationUrl: string;
  confederationEntity: string;
}

type CitationModalProps = RaCitationModalProps | ConfederationCitationModalProps;

function isConfederationModal(props: CitationModalProps): props is ConfederationCitationModalProps {
  return "confederationRef" in props;
}

// Format Ra material text into segments for display
function formatRaText(text: string): { type: "questioner" | "ra" | "text"; content: string }[] {
  const segments: { type: "questioner" | "ra" | "text"; content: string }[] = [];

  if (!text || !text.trim()) {
    return [{ type: "text", content: "" }];
  }

  const parts = text.split(/(Questioner:|Ra:)/);
  let currentType: "questioner" | "ra" | "text" = "text";

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    if (trimmed === "Questioner:") {
      currentType = "questioner";
    } else if (trimmed === "Ra:") {
      currentType = "ra";
    } else {
      segments.push({ type: currentType, content: trimmed });
    }
  }

  if (segments.length === 0) {
    segments.push({ type: "text", content: text.trim() });
  }

  return segments;
}

export default function CitationModal(props: CitationModalProps) {
  const { isOpen, onClose } = props;
  const modalRef = useRef<HTMLDivElement>(null);

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Focus trap
  useEffect(() => {
    if (!isOpen) return;

    const modal = modalRef.current;
    if (!modal) return;

    const focusableSelector =
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      const focusableElements =
        modal.querySelectorAll<HTMLElement>(focusableSelector);
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleBackdropClick = useCallback(() => {
    onClose();
  }, [onClose]);

  const content = isConfederationModal(props)
    ? <ConfederationContent {...props} />
    : <RaContent {...props} />;

  // Use portal to render modal at document body level (avoids HTML nesting issues)
  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={handleBackdropClick}
        >
          <motion.div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="citation-title"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, delay: 0.05 }}
            className="relative bg-[var(--lo1-indigo)]/95 backdrop-blur-sm border-l-4 border-[var(--lo1-gold)] rounded-lg p-4 max-w-lg w-full max-h-[80vh] overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {content}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Render via portal to avoid HTML nesting issues (modal inside <p> tags)
  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(modalContent, document.body);
}

/** Ra Material citation content with SWR fetching and bilingual support */
function RaContent({ isOpen, onClose, session, question }: RaCitationModalProps) {
  const t = useTranslations("quote");
  const { language } = useLanguage();
  const [showOriginal, setShowOriginal] = useState(false);

  const reference = `${session}.${question}`;
  const url = getRaMaterialUrl(session, question, language as AvailableLanguage);

  const conditionalRef = isOpen ? reference : "";
  const { data, isLoading, error: fetchError } = useQuoteData(conditionalRef, language as AvailableLanguage);

  const quoteText = data?.text ? formatWholeQuote(data.text) : null;
  const originalText = data?.originalText ? formatWholeQuote(data.originalText) : null;
  const error = fetchError ? t("loadError") : (!isLoading && isOpen && !quoteText ? t("quoteNotFound") : null);

  const segments = quoteText ? formatRaText(quoteText) : [];
  const originalSegments = originalText ? formatRaText(originalText) : [];
  const hasOriginal = language !== 'en' && originalText;

  return (
    <>
      {/* Header - reference link and X button in top right */}
      <div className="flex items-center gap-2 absolute top-3 right-3">
        <a
          id="citation-title"
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-medium text-[var(--lo1-gold)] hover:text-[var(--lo1-gold-light)] hover:underline"
        >
          {reference}
        </a>
        <CloseButton onClose={onClose} />
      </div>

      {/* Quote content */}
      <div className="flex-1 overflow-y-auto pr-12">
        {isLoading && (
          <div className="text-[var(--lo1-text-muted)] animate-pulse">
            {t("loading")}
          </div>
        )}
        {error && (
          <div className="text-[var(--lo1-error)]">{error}</div>
        )}
        {quoteText && (
          <div>
            {segments.map((segment, index) => (
              <div key={index} className={segment.type === "ra" ? "mt-3" : ""}>
                {segment.type === "questioner" && (
                  <div className="mb-1">
                    <span className="text-xs font-semibold text-[var(--lo1-celestial)] uppercase tracking-wide">
                      {t("questioner")}
                    </span>
                  </div>
                )}
                {segment.type === "ra" && (
                  <div className="mb-1">
                    <span className="text-xs font-semibold text-[var(--lo1-gold)] uppercase tracking-wide">
                      {t("ra")}
                    </span>
                  </div>
                )}
                <div
                  className={`whitespace-pre-line leading-relaxed ${
                    segment.type === "ra"
                      ? "text-[var(--lo1-starlight)]"
                      : "text-[var(--lo1-text-light)]"
                  }`}
                >
                  {segment.content}
                </div>
              </div>
            ))}

            {hasOriginal && (
              <div className="mt-4 pt-3 border-t border-[var(--lo1-celestial)]/20">
                <button
                  onClick={() => setShowOriginal(!showOriginal)}
                  className="text-xs text-[var(--lo1-celestial)] hover:text-[var(--lo1-starlight)] cursor-pointer"
                  aria-expanded={showOriginal}
                >
                  {showOriginal ? `\u2191 ${t("hideEnglishOriginal")}` : `\u2193 ${t("showEnglishOriginal")}`}
                </button>

                {showOriginal && (
                  <div className="mt-3 pl-3 border-l-2 border-[var(--lo1-celestial)]/30">
                    {originalSegments.map((segment, index) => (
                      <div key={index} className={segment.type === "ra" ? "mt-2" : ""}>
                        {segment.type === "questioner" && (
                          <div className="mb-1">
                            <span className="text-xs font-semibold text-[var(--lo1-celestial)]/70 uppercase tracking-wide">
                              Questioner
                            </span>
                          </div>
                        )}
                        {segment.type === "ra" && (
                          <div className="mb-1">
                            <span className="text-xs font-semibold text-[var(--lo1-gold)]/70 uppercase tracking-wide">
                              Ra
                            </span>
                          </div>
                        )}
                        <div
                          className={`whitespace-pre-line leading-relaxed text-sm opacity-80 ${
                            segment.type === "ra"
                              ? "text-[var(--lo1-starlight)]"
                              : "text-[var(--lo1-text-light)]"
                          }`}
                        >
                          {segment.content}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

/** Confederation citation content with pre-loaded passage text */
function ConfederationContent({
  onClose,
  confederationRef,
  confederationText,
  confederationUrl,
  confederationEntity,
}: ConfederationCitationModalProps) {
  return (
    <>
      {/* Header - entity name, reference link, and X button */}
      <div className="flex items-center gap-2 absolute top-3 right-3">
        <a
          id="citation-title"
          href={confederationUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-medium text-[var(--lo1-gold)] hover:text-[var(--lo1-gold-light)] hover:underline"
        >
          {confederationRef}
        </a>
        <CloseButton onClose={onClose} />
      </div>

      {/* Passage content */}
      <div className="flex-1 overflow-y-auto pr-12">
        <div className="mb-1">
          <span className="text-xs font-semibold text-[var(--lo1-gold)] uppercase tracking-wide">
            {confederationEntity}
          </span>
        </div>
        <div className="whitespace-pre-line leading-relaxed text-[var(--lo1-starlight)]">
          {confederationText}
        </div>
      </div>
    </>
  );
}

function CloseButton({ onClose }: { onClose: () => void }) {
  return (
    <button
      onClick={onClose}
      className="p-1 text-[var(--lo1-stardust)] hover:text-[var(--lo1-starlight)] transition-colors rounded hover:bg-white/5 cursor-pointer"
      aria-label="Close"
    >
      <svg
        viewBox="0 0 24 24"
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <path d="M18 6L6 18M6 6l12 12" />
      </svg>
    </button>
  );
}
