"use client";

import { memo, useState, useEffect } from "react";
import { Quote } from "@/lib/types";
import { analytics } from "@/lib/analytics";
import { debug } from "@/lib/debug";
import { formatWholeQuote, formatQuoteWithAttribution, getRaMaterialUrl } from "@/lib/quote-utils";
import { useTranslations } from "next-intl";
import { type AvailableLanguage } from "@/lib/language-config";
import { parseRaText, parseEllipsis, getShortReference } from "@/lib/ra-text-parser";
import { useBilingualQuote } from "@/hooks/useBilingualQuote";
import CopyButton from "../CopyButton";

interface BilingualQuoteCardProps {
  quote: Quote;
  /** Target language for translation display (e.g., 'es' for Spanish) */
  targetLanguage: AvailableLanguage;
}

/**
 * Displays a Ra Material quote with bilingual support.
 * Shows translated quote prominently with collapsible English original.
 */
const BilingualQuoteCard = memo(function BilingualQuoteCard({
  quote,
  targetLanguage,
}: BilingualQuoteCardProps) {
  const t = useTranslations("quote");
  const { hasLeading, hasTrailing, content } = parseEllipsis(quote.text);

  // UI state for expansion and showing original
  const [isExpanded, setIsExpanded] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);

  // SWR handles fetching, caching, and deduplication across components
  // Note: isLoading available but not displayed (instant fallback to content)
  const { data: bilingualData } = useBilingualQuote(
    quote.reference,
    targetLanguage
  );

  debug.log("[BilingualQuoteCard] Rendering quote:", {
    reference: quote.reference,
    targetLanguage,
    textLength: quote.text.length,
    hasData: !!bilingualData,
  });

  const shortRef = getShortReference(quote.reference);

  // Extract session and question numbers for tracking
  const match = quote.reference.match(/(\d+)\.(\d+)/);
  const sessionNumber = match ? parseInt(match[1]) : 0;
  const questionNumber = match ? parseInt(match[2]) : 0;

  // Generate locale-aware URL for the quote link
  const quoteUrl = getRaMaterialUrl(sessionNumber, questionNumber, targetLanguage);

  // Derive formatted texts from SWR data
  const initialTranslation = bilingualData?.text ? formatWholeQuote(bilingualData.text) : null;
  const initialOriginal = bilingualData?.originalText ? formatWholeQuote(bilingualData.originalText) : null;
  // Check if we're showing English as fallback (no original means the text IS the original)
  const isFallbackToEnglish = targetLanguage !== 'en' && bilingualData && !bilingualData.originalText;

  // Track quote display on mount
  useEffect(() => {
    analytics.quoteDisplayed({
      sessionNumber,
      questionNumber,
      positionInResponse: 0,
      sentenceRange: hasLeading || hasTrailing ? "partial" : undefined,
    });
  }, [sessionNumber, questionNumber, hasLeading, hasTrailing]);

  // Handle quote link clicks
  const handleLinkClick = (clickType: "session_link" | "ellipsis") => {
    analytics.quoteLinkClicked({
      sessionNumber,
      questionNumber,
      clickType,
    });
  };

  // Handle expand/collapse - SWR already has the data cached, just toggle UI
  const handleExpandClick = (e: React.MouseEvent) => {
    e.preventDefault();

    if (!isExpanded) {
      analytics.quoteLinkClicked({
        sessionNumber,
        questionNumber,
        clickType: "ellipsis",
      });
    }

    setIsExpanded(!isExpanded);
  };

  // Current display text (translated version)
  // When expanded, use full translated text; otherwise use translated excerpt or original content
  const displayText = isExpanded && initialTranslation
    ? initialTranslation
    : initialTranslation || content;
  const segments = parseRaText(displayText);

  // Original text segments (English) for "Show English original" toggle
  const originalSegments = showOriginal && initialOriginal
    ? parseRaText(initialOriginal)
    : null;

  // Compute copy text (use translated full text when available)
  const textToCopy = initialTranslation || content;
  const copyText = formatQuoteWithAttribution(textToCopy, quote.reference, quoteUrl);

  const handleCopyAnalytics = () => {
    analytics.quoteCopied({
      sessionNumber,
      questionNumber,
      isExpanded,
    });
  };

  const showEllipsis = !isExpanded && (hasLeading || hasTrailing);
  // Only show "Show English original" if we have a translation (not showing fallback)
  const hasOriginal = targetLanguage !== 'en' && !isFallbackToEnglish && initialOriginal;

  return (
    <div
      className="ra-quote mt-6 mb-4 rounded-lg bg-[var(--lo1-indigo)]/60 backdrop-blur-sm border-l-4 border-[var(--lo1-gold)] p-4 shadow-lg relative"
      data-testid="bilingual-quote-card"
    >
      {/* Header with reference number */}
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[var(--lo1-celestial)] uppercase tracking-wide">
            {t("questioner")}
          </span>
          {isFallbackToEnglish && (
            <span className="text-xs text-[var(--lo1-celestial)]/60 italic">
              ({t("translationUnavailable")})
            </span>
          )}
        </div>
        <a
          href={quoteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-medium text-[var(--lo1-gold)] hover:text-[var(--lo1-gold-light)] hover:underline"
          onClick={() => handleLinkClick("session_link")}
        >
          {shortRef}
        </a>
      </div>

      {/* Leading ellipsis - click to expand */}
      {showEllipsis && hasLeading && (
        <button
          onClick={handleExpandClick}
          className="block text-[var(--lo1-gold)] hover:text-[var(--lo1-gold-light)] mb-2 cursor-pointer"
          aria-expanded={isExpanded}
          aria-label={t("expand")}
        >
          ...
        </button>
      )}

      {/* Translated quote segments */}
      {segments.map((segment, index) => (
        <div key={index} className={segment.type === "ra" ? "mt-3" : ""}>
          {segment.type === "ra" && (
            <div className="mb-1">
              <span className="text-xs font-semibold text-[var(--lo1-gold)] uppercase tracking-wide">
                Ra
              </span>
            </div>
          )}
          <div
            className={`whitespace-pre-line leading-relaxed ${
              segment.type === "ra" ? "text-[var(--lo1-starlight)]" : "text-[var(--lo1-text-light)]"
            }`}
          >
            {segment.content}
          </div>
        </div>
      ))}

      {/* Trailing ellipsis - click to expand */}
      {showEllipsis && hasTrailing && (
        <button
          onClick={handleExpandClick}
          className="block text-[var(--lo1-gold)] hover:text-[var(--lo1-gold-light)] mt-2 cursor-pointer"
          aria-expanded={isExpanded}
          aria-label={t("expand")}
        >
          ...
        </button>
      )}

      {/* Collapse button when expanded */}
      {isExpanded && (hasLeading || hasTrailing) && (
        <button
          onClick={handleExpandClick}
          className="block text-xs text-[var(--lo1-gold)] hover:text-[var(--lo1-gold-light)] mt-3 cursor-pointer"
          aria-expanded={isExpanded}
          aria-label={t("collapse")}
        >
          ↑ {t("collapse")}
        </button>
      )}

      {/* Show original toggle (for non-English languages) */}
      {hasOriginal && (
        <div className="mt-4 pt-3 border-t border-[var(--lo1-celestial)]/20">
          <button
            onClick={() => setShowOriginal(!showOriginal)}
            className="text-xs text-[var(--lo1-celestial)] hover:text-[var(--lo1-starlight)] cursor-pointer"
            aria-expanded={showOriginal}
          >
            {showOriginal ? `↑ ${t("hideEnglishOriginal")}` : `↓ ${t("showEnglishOriginal")}`}
          </button>

          {/* Original English text */}
          {showOriginal && originalSegments && (
            <div className="mt-3 pl-3 border-l-2 border-[var(--lo1-celestial)]/30">
              {originalSegments.map((segment, index) => (
                <div key={index} className={segment.type === "ra" ? "mt-2" : ""}>
                  {/* Use hardcoded English labels for the English original */}
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

      {/* Copy button - bottom right corner */}
      <div className="absolute bottom-2 right-2">
        <CopyButton textToCopy={copyText} onCopy={handleCopyAnalytics} size="sm" />
      </div>
    </div>
  );
});

export default BilingualQuoteCard;
