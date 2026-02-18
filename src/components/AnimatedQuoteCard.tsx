"use client";

import { Quote } from "@/lib/types";
import { analytics } from "@/lib/analytics";
import { useEffect, useState, useRef } from "react";
import { formatWholeQuote, formatQuoteForCopy } from "@/lib/quote-utils";
import { useTranslations } from "next-intl";
import { useLanguage } from "@/contexts/LanguageContext";
import { type AvailableLanguage } from "@/lib/language-config";
import { parseRaText, parseEllipsis, getShortReference, isRaReference } from "@/lib/ra-text-parser";
import { useQuoteText } from "@/hooks/useBilingualQuote";

interface AnimatedQuoteCardProps {
  quote: Quote;
  animate?: boolean;
  onComplete?: () => void;
}

export default function AnimatedQuoteCard({
  quote,
  animate = true,
  onComplete,
}: AnimatedQuoteCardProps) {
  // Get current language setting and translations
  const { language } = useLanguage();
  const t = useTranslations("quote");

  const [isVisible, setIsVisible] = useState(!animate);
  const hasCompletedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);

  // State for expansion and UI
  const [isExpanded, setIsExpanded] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // SWR handles fetching, caching, and deduplication
  // Fetch the full quote text in the current language (Ra only — Confederation has no local files)
  const isRa = isRaReference(quote.reference);
  const { data: fullQuoteData } = useQuoteText(isRa ? quote.reference : "", language as AvailableLanguage);

  // Format the fetched text
  const fullQuoteText = fullQuoteData ? formatWholeQuote(fullQuoteData) : null;

  // Keep onComplete ref updated
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Handle fade-in animation
  useEffect(() => {
    if (!animate) return;

    hasCompletedRef.current = false;
    setIsVisible(false);

    // Small delay before showing, then fade in
    const showTimeout = setTimeout(() => {
      setIsVisible(true);
    }, 50);

    // Complete after fade-in transition
    const completeTimeout = setTimeout(() => {
      if (!hasCompletedRef.current) {
        hasCompletedRef.current = true;
        onCompleteRef.current?.();
      }
    }, 350); // 50ms delay + 300ms fade

    return () => {
      clearTimeout(showTimeout);
      clearTimeout(completeTimeout);
    };
  }, [animate, quote.text]);

  // Parse ellipsis from full quote text
  const { hasLeading, hasTrailing, content: fullTextWithoutEllipsis } = parseEllipsis(quote.text);

  const shortRef = getShortReference(quote.reference);

  // Determine what text to display
  // Use full quote text from SWR when expanded or available, otherwise use the excerpt
  const displayContent = isExpanded && fullQuoteText
    ? fullQuoteText
    : fullQuoteText || fullTextWithoutEllipsis;

  // Format the text being displayed
  const segments = parseRaText(displayContent);

  // Extract session and question numbers for tracking
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

  // Handle expand/collapse - SWR already has the data cached
  const handleExpandClick = (e: React.MouseEvent) => {
    e.preventDefault();

    if (!isExpanded) {
      // Track expansion
      analytics.quoteLinkClicked({
        sessionNumber,
        questionNumber,
        clickType: "ellipsis",
      });
    }

    setIsExpanded(!isExpanded);
  };

  // Handle copy quote
  const handleCopyQuote = async () => {
    try {
      const textToCopy = isExpanded && fullQuoteText ? fullQuoteText : fullTextWithoutEllipsis;
      // Format with proper paragraph breaks between speakers
      const formattedText = formatQuoteForCopy(textToCopy);
      await navigator.clipboard.writeText(formattedText);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);

      // Track copy action
      analytics.quoteCopied({
        sessionNumber,
        questionNumber,
        isExpanded,
      });
    } catch (error) {
      console.error("Failed to copy quote:", error);
    }
  };

  const showEllipsis = !isExpanded && (hasLeading || hasTrailing);

  return (
    <div
      className="ra-quote mt-6 mb-4 rounded-lg bg-[var(--lo1-indigo)]/60 backdrop-blur-sm border-l-4 border-[var(--lo1-gold)] p-4 shadow-lg relative"
      style={{
        opacity: isVisible ? 1 : 0,
        transition: "opacity 300ms ease-in",
      }}
    >
      {/* Header with reference number */}
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-semibold text-[var(--lo1-celestial)] uppercase tracking-wide">
          {t("questioner")}
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

      {/* Content area */}
      <div className="min-h-[1.5rem]">
        {/* Leading ellipsis - click to expand */}
        {showEllipsis && hasLeading && (
          <button
            onClick={handleExpandClick}
            className="block text-[var(--lo1-gold)] hover:text-[var(--lo1-gold-light)] mb-2 cursor-pointer"
          >
            ...
          </button>
        )}

        {segments.map((segment, index) => (
          <div key={index} className={segment.type === "ra" ? "mt-3" : ""}>
            {/* Only show Ra label, Questioner is in header */}
            {segment.type === "ra" && (
              <div className="mb-1">
                <span className="text-xs font-semibold text-[var(--lo1-gold)] uppercase tracking-wide">
                  Ra
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

        {/* Trailing ellipsis - click to expand */}
        {showEllipsis && hasTrailing && (
          <button
            onClick={handleExpandClick}
            className="block text-[var(--lo1-gold)] hover:text-[var(--lo1-gold-light)] mt-2 cursor-pointer"
          >
            ...
          </button>
        )}

        {/* Collapse button when expanded */}
        {isExpanded && (hasLeading || hasTrailing) && (
          <button
            onClick={handleExpandClick}
            className="block text-xs text-[var(--lo1-gold)] hover:text-[var(--lo1-gold-light)] mt-3 cursor-pointer"
          >
            ↑ {t("collapse")}
          </button>
        )}
      </div>

      {/* Copy button - bottom right corner */}
      <button
        onClick={handleCopyQuote}
        className="absolute bottom-2 right-2 p-1.5 rounded hover:bg-[var(--lo1-celestial)]/20 transition-colors group"
        title="Copy quote"
        aria-label="Copy quote"
      >
        {copySuccess ? (
          <svg
            className="w-3.5 h-3.5 text-[var(--lo1-gold)]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        ) : (
          <svg
            className="w-3.5 h-3.5 text-[var(--lo1-celestial)] group-hover:text-[var(--lo1-gold)] transition-colors"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
        )}
      </button>
    </div>
  );
}
