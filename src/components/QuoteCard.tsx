"use client";

import { memo } from "react";
import { Quote } from "@/lib/types";
import { analytics } from "@/lib/analytics";
import { debug } from "@/lib/debug";
import { useEffect, useState } from "react";
import { fetchFullQuote, formatWholeQuote, formatQuoteWithAttribution } from "@/lib/quote-utils";
import { useTranslations } from "next-intl";
import { useLanguage } from "@/contexts/LanguageContext";
import { type AvailableLanguage } from "@/lib/language-config";
import { parseRaText, parseEllipsis, getShortReference, isRaReference, getConfederationEntity } from "@/lib/ra-text-parser";
import CopyButton from "./CopyButton";

interface QuoteCardProps {
  quote: Quote;
}

/**
 * Displays a quote card for Ra Material or Confederation sources.
 *
 * Features:
 * - Formats Questioner/Ra dialogue with distinct styling
 * - Shows entity name (Q'uo, Hatonn) for Confederation quotes
 * - Handles partial quotes with ellipsis indicators
 * - Supports expanding to show full quote text (Ra only)
 * - Copy-to-clipboard functionality
 * - Analytics tracking for user interactions
 * - Multilingual support via language context
 *
 * Memoized to prevent unnecessary re-renders during streaming.
 */
const QuoteCard = memo(function QuoteCard({ quote }: QuoteCardProps) {
  // Get current language setting and translations
  const { language } = useLanguage();
  const t = useTranslations("quote");

  // Determine source type
  const isRa = isRaReference(quote.reference);
  const confederationEntity = isRa ? null : getConfederationEntity(quote.reference);

  // Parse ellipsis from quote text
  const { hasLeading, hasTrailing, content } = parseEllipsis(quote.text);

  debug.log("[QuoteCard] Rendering quote:", {
    reference: quote.reference,
    textLength: quote.text.length,
    hasLeading,
    hasTrailing,
    contentLength: content.length,
    language,
    isRa,
    confederationEntity,
  });

  // State for expansion (Ra only - confederation quotes don't have local section files)
  const [isExpanded, setIsExpanded] = useState(false);
  const [fullQuoteText, setFullQuoteText] = useState<string | null>(null);
  const [isLoadingFull, setIsLoadingFull] = useState(false);

  // State for translated quote (loaded on mount for non-English, Ra only)
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [isLoadingTranslation, setIsLoadingTranslation] = useState(false);

  // Fetch translated quote on mount if language is not English (Ra only)
  useEffect(() => {
    if (!isRa) return; // No translation fetch for confederation
    if (language !== 'en' && !translatedText && !isLoadingTranslation) {
      setIsLoadingTranslation(true);
      debug.log("[QuoteCard] Fetching translated quote:", quote.reference, language);

      fetchFullQuote(quote.reference, language as AvailableLanguage)
        .then((text) => {
          if (text) {
            const formatted = formatWholeQuote(text);
            setTranslatedText(formatted);
            debug.log("[QuoteCard] Loaded translated text:", formatted.length);
          }
        })
        .catch((err) => {
          debug.error("[QuoteCard] Failed to fetch translation:", err);
        })
        .finally(() => {
          setIsLoadingTranslation(false);
        });
    }
  }, [language, quote.reference, translatedText, isLoadingTranslation, isRa]);

  // Determine what text to display:
  // - If expanded and have full quote, use that
  // - Else if have translation (for non-English), use that
  // - Else use original content
  const displayContent = isExpanded && fullQuoteText
    ? fullQuoteText
    : (language !== 'en' && translatedText)
      ? translatedText
      : content;

  // Format the content (without ellipsis)
  // For confederation quotes, parseRaText won't find Ra/Questioner prefixes,
  // so it returns the text as a single "text" segment — which is correct.
  const segments = parseRaText(displayContent);
  debug.log("[QuoteCard] Formatted segments:", segments.length, segments);
  const shortRef = getShortReference(quote.reference);

  // Extract session and question numbers for tracking (Ra only)
  const match = quote.reference.match(/(\d+)\.(\d+)/);
  const sessionNumber = match ? parseInt(match[1]) : 0;
  const questionNumber = match ? parseInt(match[2]) : 0;

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

  // Handle expand/collapse (Ra only)
  const handleExpandClick = async (e: React.MouseEvent) => {
    e.preventDefault();

    if (isExpanded) {
      setIsExpanded(false);
      return;
    }

    // Expand - fetch full quote if not already loaded
    if (!fullQuoteText) {
      setIsLoadingFull(true);
      debug.log("[QuoteCard] Fetching full quote for reference:", quote.reference, "language:", language);
      const fullText = await fetchFullQuote(quote.reference, language as AvailableLanguage);
      debug.log("[QuoteCard] Fetched full text length:", fullText?.length || 0);
      debug.log("[QuoteCard] Original text length:", quote.text.length);
      if (fullText) {
        const formatted = formatWholeQuote(fullText);
        debug.log("[QuoteCard] Formatted text length:", formatted.length);
        setFullQuoteText(formatted);
      } else {
        debug.error("[QuoteCard] Failed to fetch full quote");
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

  // Compute formatted copy text
  const textToCopy = isExpanded && fullQuoteText ? fullQuoteText : content;
  const copyText = formatQuoteWithAttribution(textToCopy, quote.reference, quote.url);

  // Track copy action for analytics
  const handleCopyAnalytics = () => {
    analytics.quoteCopied({
      sessionNumber,
      questionNumber,
      isExpanded,
    });
  };

  const showEllipsis = !isExpanded && (hasLeading || hasTrailing);

  // Header label: entity name for confederation, "Questioner" for Ra
  const headerLabel = confederationEntity || t("questioner");
  // Header label styling: gold for confederation entity, celestial for questioner
  const headerLabelClass = confederationEntity
    ? "text-xs font-semibold text-[var(--lo1-gold)] uppercase tracking-wide"
    : "text-xs font-semibold text-[var(--lo1-celestial)] uppercase tracking-wide";

  // Speaker label for "ra" segments: entity name for confederation, "Ra" for Ra
  const speakerLabel = confederationEntity || "Ra";

  return (
    <div className="ra-quote mt-6 mb-4 rounded-lg bg-[var(--lo1-indigo)]/60 backdrop-blur-sm border-l-4 border-[var(--lo1-gold)] p-4 shadow-lg relative" data-testid="quote-card">
      {/* Header with reference number */}
      <div className="flex justify-between items-center mb-2">
        <span className={headerLabelClass}>
          {headerLabel}
        </span>
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

      {/* Leading ellipsis - click to expand (Ra only) */}
      {isRa && showEllipsis && hasLeading && (
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

      {segments.map((segment, index) => (
        <div key={index} className={segment.type === "ra" ? "mt-3" : ""}>
          {/* Show speaker label for Ra/entity segments */}
          {segment.type === "ra" && (
            <div className="mb-1">
              <span className="text-xs font-semibold text-[var(--lo1-gold)] uppercase tracking-wide">
                {speakerLabel}
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

      {/* Trailing ellipsis - click to expand (Ra only) */}
      {isRa && showEllipsis && hasTrailing && (
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

      {/* Collapse button when expanded (Ra only) */}
      {isRa && isExpanded && (hasLeading || hasTrailing) && (
        <button
          onClick={handleExpandClick}
          className="block text-xs text-[var(--lo1-gold)] hover:text-[var(--lo1-gold-light)] mt-3 cursor-pointer"
          aria-expanded={isExpanded}
          aria-label={t("collapse")}
        >
          ↑ {t("collapse")}
        </button>
      )}

      {/* Copy button - bottom right corner */}
      <div className="absolute bottom-2 right-2">
        <CopyButton
          textToCopy={copyText}
          onCopy={handleCopyAnalytics}
          size="sm"
        />
      </div>
    </div>
  );
});

export default QuoteCard;
