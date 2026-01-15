"use client";

import { memo, useState, useEffect } from "react";
import { Quote } from "@/lib/types";
import { analytics } from "@/lib/analytics";
import { debug } from "@/lib/debug";
import { fetchBilingualQuote, formatWholeQuote, formatQuoteWithAttribution } from "@/lib/quote-utils";
import { useTranslations } from "next-intl";
import { type AvailableLanguage } from "@/lib/language-config";
import { parseRaText, parseEllipsis, getShortReference } from "@/lib/ra-text-parser";
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

  // State for expansion and bilingual loading
  const [isExpanded, setIsExpanded] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [fullTexts, setFullTexts] = useState<{ translated: string; original?: string } | null>(null);
  const [isLoadingFull, setIsLoadingFull] = useState(false);

  // State for initial translation (fetched on mount)
  const [initialTranslation, setInitialTranslation] = useState<string | null>(null);
  const [isLoadingInitial, setIsLoadingInitial] = useState(false);
  const [isFallbackToEnglish, setIsFallbackToEnglish] = useState(false);
  const [translationAttempted, setTranslationAttempted] = useState(false);

  debug.log("[BilingualQuoteCard] Rendering quote:", {
    reference: quote.reference,
    targetLanguage,
    textLength: quote.text.length,
  });

  const shortRef = getShortReference(quote.reference);

  // Extract session and question numbers for tracking
  const match = quote.reference.match(/(\d+)\.(\d+)/);
  const sessionNumber = match ? parseInt(match[1]) : 0;
  const questionNumber = match ? parseInt(match[2]) : 0;

  // Fetch translated quote on mount
  useEffect(() => {
    if (targetLanguage === 'en' || translationAttempted || isLoadingInitial) return;

    setTranslationAttempted(true);
    setIsLoadingInitial(true);
    debug.log("[BilingualQuoteCard] Fetching initial translation:", quote.reference, targetLanguage);

    fetchBilingualQuote(quote.reference, targetLanguage)
      .then((result) => {
        if (result) {
          setInitialTranslation(formatWholeQuote(result.text));
          // Check if we're showing English as fallback (no original means the text IS the original)
          // Note: We already guard for targetLanguage === 'en' at the top of this effect
          setIsFallbackToEnglish(!result.originalText);
          debug.log("[BilingualQuoteCard] Initial translation loaded, fallback:", !result.originalText);
        }
      })
      .catch((err) => {
        debug.error("[BilingualQuoteCard] Failed to fetch translation:", err);
      })
      .finally(() => {
        setIsLoadingInitial(false);
      });
  }, [quote.reference, targetLanguage, translationAttempted, isLoadingInitial]);

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

  // Handle expand/collapse
  const handleExpandClick = async (e: React.MouseEvent) => {
    e.preventDefault();

    if (isExpanded) {
      setIsExpanded(false);
      return;
    }

    // Fetch full quote if not already loaded
    if (!fullTexts) {
      setIsLoadingFull(true);
      debug.log("[BilingualQuoteCard] Fetching bilingual quote:", quote.reference, targetLanguage);

      const result = await fetchBilingualQuote(quote.reference, targetLanguage);

      if (result) {
        const formattedTranslated = formatWholeQuote(result.text);
        const formattedOriginal = result.originalText
          ? formatWholeQuote(result.originalText)
          : undefined;

        setFullTexts({
          translated: formattedTranslated,
          original: formattedOriginal,
        });
        debug.log("[BilingualQuoteCard] Loaded bilingual texts");
      }
      setIsLoadingFull(false);
    }

    setIsExpanded(true);
    analytics.quoteLinkClicked({
      sessionNumber,
      questionNumber,
      clickType: "ellipsis",
    });
  };

  // Current display text (translated version)
  // Priority: expanded fullTexts > initial translation > original content
  const displayText = isExpanded && fullTexts
    ? fullTexts.translated
    : initialTranslation || content;
  const segments = parseRaText(displayText);

  // Original text segments (English)
  const originalSegments = showOriginal && fullTexts?.original
    ? parseRaText(fullTexts.original)
    : null;

  // Compute copy text
  const textToCopy = isExpanded && fullTexts ? fullTexts.translated : content;
  const copyText = formatQuoteWithAttribution(textToCopy, quote.reference, quote.url);

  const handleCopyAnalytics = () => {
    analytics.quoteCopied({
      sessionNumber,
      questionNumber,
      isExpanded,
    });
  };

  const showEllipsis = !isExpanded && (hasLeading || hasTrailing);
  // Only show "Show English original" if we have a translation (not showing fallback)
  const hasOriginal = targetLanguage !== 'en' && !isFallbackToEnglish && (fullTexts?.original || !isExpanded);

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
          href={quote.url}
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
          disabled={isLoadingFull}
          aria-expanded={isExpanded}
          aria-label={isLoadingFull ? t("loading") : t("expand")}
        >
          {isLoadingFull ? t("loading") : "..."}
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
          disabled={isLoadingFull}
          aria-expanded={isExpanded}
          aria-label={isLoadingFull ? t("loading") : t("expand")}
        >
          {isLoadingFull ? t("loading") : "..."}
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
      {hasOriginal && isExpanded && fullTexts?.original && (
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
              <div className="text-xs text-[var(--lo1-celestial)]/70 mb-2 uppercase tracking-wide">
                {t("englishOriginal")}
              </div>
              {originalSegments.map((segment, index) => (
                <div key={index} className={segment.type === "ra" ? "mt-2" : ""}>
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
