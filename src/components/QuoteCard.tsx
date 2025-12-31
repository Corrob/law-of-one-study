"use client";

import { Quote } from "@/lib/types";
import { analytics } from "@/lib/analytics";
import { useEffect, useState } from "react";
import { fetchFullQuote, formatWholeQuote } from "@/lib/quote-utils";

interface QuoteCardProps {
  quote: Quote;
}

// Parse Ra material text into formatted segments
function formatRaText(text: string): { type: "questioner" | "ra" | "text"; content: string }[] {
  const segments: { type: "questioner" | "ra" | "text"; content: string }[] = [];

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

export default function QuoteCard({ quote }: QuoteCardProps) {
  // Parse ellipsis from quote text
  const { hasLeading, hasTrailing, content } = parseEllipsis(quote.text);

  // State for expansion
  const [isExpanded, setIsExpanded] = useState(false);
  const [fullQuoteText, setFullQuoteText] = useState<string | null>(null);
  const [isLoadingFull, setIsLoadingFull] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // Format the content (without ellipsis)
  const segments = formatRaText(isExpanded && fullQuoteText ? fullQuoteText : content);
  const shortRef = getShortReference(quote.reference);

  // Extract session and question numbers for tracking
  const match = quote.reference.match(/(\d+)\.(\d+)/);
  const sessionNumber = match ? parseInt(match[1]) : 0;
  const questionNumber = match ? parseInt(match[2]) : 0;

  // Track quote display on mount
  useEffect(() => {
    analytics.quoteDisplayed({
      sessionNumber,
      questionNumber,
      positionInResponse: 0, // Could be enhanced to track actual position
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
      const textToCopy = isExpanded && fullQuoteText ? fullQuoteText : content;
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
    <div className="ra-quote mt-6 mb-4 rounded-lg bg-[var(--lo1-indigo)]/60 backdrop-blur-sm border-l-4 border-[var(--lo1-gold)] p-4 shadow-lg">
      {/* Header with reference number and copy button */}
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-semibold text-[var(--lo1-celestial)] uppercase tracking-wide">
          Questioner
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyQuote}
            className="text-xs font-medium text-[var(--lo1-gold)] hover:text-[var(--lo1-gold-light)] transition-colors"
            title="Copy quote"
          >
            {copySuccess ? "✓ Copied" : "📋 Copy"}
          </button>
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
      </div>

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
  );
}
