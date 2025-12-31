"use client";

import { Quote } from "@/lib/types";
import { analytics } from "@/lib/analytics";
import { useEffect, useState, useRef } from "react";
import { fetchFullQuote, formatWholeQuote } from "@/lib/quote-utils";

interface AnimatedQuoteCardProps {
  quote: Quote;
  animate?: boolean;
  onComplete?: () => void;
}

// Parse Ra material text into formatted segments
function formatRaText(text: string): { type: "questioner" | "ra" | "text"; content: string }[] {
  const segments: { type: "questioner" | "ra" | "text"; content: string }[] = [];

  // Handle empty or undefined text
  if (!text || !text.trim()) {
    return [{ type: "text", content: "" }];
  }

  // Split by Questioner: and Ra: prefixes
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
      // Backend now handles paragraph breaks, just pass through
      segments.push({ type: currentType, content: trimmed });
    }
  }

  // If no segments were found, treat entire text as a single segment
  if (segments.length === 0) {
    segments.push({ type: "text", content: text.trim() });
  }

  return segments;
}

// Parse ellipsis from text (added by backend for partial quotes)
function parseEllipsis(text: string): {
  hasLeading: boolean;
  hasTrailing: boolean;
  content: string;
} {
  let content = text;
  const hasLeading = text.startsWith("...\n\n") || text.startsWith("...");
  const hasTrailing = text.endsWith("\n\n...") || text.endsWith("...");

  if (hasLeading) {
    content = content.replace(/^\.\.\.(\n\n)?/, "");
  }
  if (hasTrailing) {
    content = content.replace(/(\n\n)?\.\.\.$/, "");
  }

  return { hasLeading, hasTrailing, content };
}

// Extract just the session.question from reference like "Ra 49.8"
function getShortReference(reference: string): string {
  const match = reference.match(/(\d+\.\d+)/);
  return match ? match[1] : reference;
}

export default function AnimatedQuoteCard({
  quote,
  animate = true,
  onComplete,
}: AnimatedQuoteCardProps) {
  const [isVisible, setIsVisible] = useState(!animate);
  const hasCompletedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);

  // State for expansion
  const [isExpanded, setIsExpanded] = useState(false);
  const [fullQuoteText, setFullQuoteText] = useState<string | null>(null);
  const [isLoadingFull, setIsLoadingFull] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

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

  // Format the text being displayed (expanded or original)
  const segments = formatRaText(
    isExpanded && fullQuoteText ? fullQuoteText : fullTextWithoutEllipsis
  );

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

  // Handle expand/collapse
  const handleExpandClick = async (e: React.MouseEvent) => {
    e.preventDefault();

    if (isExpanded) {
      // Collapse
      setIsExpanded(false);
      return;
    }

    // Expand - fetch full quote if not already loaded
    if (!fullQuoteText) {
      setIsLoadingFull(true);
      const fullText = await fetchFullQuote(quote.reference);
      if (fullText) {
        // Format with paragraph breaks
        const formatted = formatWholeQuote(fullText);
        setFullQuoteText(formatted);
      }
      setIsLoadingFull(false);
    }

    setIsExpanded(true);

    // Track expansion
    analytics.quoteLinkClicked({
      sessionNumber,
      questionNumber,
      clickType: "ellipsis",
    });
  };

  // Handle copy quote
  const handleCopyQuote = async () => {
    try {
      const textToCopy = isExpanded && fullQuoteText ? fullQuoteText : fullTextWithoutEllipsis;
      await navigator.clipboard.writeText(textToCopy);
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
          Questioner
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
            disabled={isLoadingFull}
          >
            {isLoadingFull ? "Loading..." : "..."}
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
            disabled={isLoadingFull}
          >
            {isLoadingFull ? "Loading..." : "..."}
          </button>
        )}

        {/* Collapse button when expanded */}
        {isExpanded && (hasLeading || hasTrailing) && (
          <button
            onClick={handleExpandClick}
            className="block text-xs text-[var(--lo1-gold)] hover:text-[var(--lo1-gold-light)] mt-3 cursor-pointer"
          >
            ↑ Collapse
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
