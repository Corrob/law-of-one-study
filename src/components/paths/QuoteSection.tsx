"use client";

import { memo, useMemo } from "react";
import type { QuoteSection as QuoteSectionType } from "@/lib/schemas/study-paths";

interface QuoteSectionProps {
  section: QuoteSectionType;
}

/**
 * Highlight specific phrases in quote text.
 * Returns JSX with highlighted spans.
 */
function highlightText(text: string, highlights: string[] | undefined): React.ReactNode {
  if (!highlights || highlights.length === 0) {
    return text;
  }

  // Sort highlights by length (longest first) to avoid partial matches
  const sortedHighlights = [...highlights].sort((a, b) => b.length - a.length);

  // Build regex pattern (escape special chars)
  const pattern = sortedHighlights
    .map((h) => h.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");
  const regex = new RegExp(`(${pattern})`, "gi");

  const parts = text.split(regex);

  return parts.map((part, index) => {
    const isHighlight = sortedHighlights.some(
      (h) => h.toLowerCase() === part.toLowerCase()
    );
    if (isHighlight) {
      return (
        <span key={index} className="text-[var(--lo1-gold)] font-medium">
          {part}
        </span>
      );
    }
    return part;
  });
}

/**
 * Get URL for a Ra Material reference.
 */
function getQuoteUrl(reference: string): string {
  // Reference format: "13.5" -> session 13, question 5
  const match = reference.match(/(\d+)\.(\d+)/);
  if (!match) return `https://lawofone.info`;
  const [, session, question] = match;
  return `https://lawofone.info/s/${session}#${question}`;
}

/**
 * Renders a Ra Material quote with styling, highlighting, and context.
 * Features:
 * - Gold left border styling
 * - Highlighted key phrases
 * - Optional context explanation
 * - Link to lawofone.info
 */
const QuoteSection = memo(function QuoteSection({ section }: QuoteSectionProps) {
  const url = useMemo(() => getQuoteUrl(section.reference), [section.reference]);
  const highlightedText = useMemo(
    () => highlightText(section.text, section.highlight),
    [section.text, section.highlight]
  );

  return (
    <div className="rounded-lg bg-[var(--lo1-indigo)]/60 backdrop-blur-sm border-l-4 border-[var(--lo1-gold)] p-4 shadow-lg">
      {/* Quote text */}
      <blockquote className="text-[var(--lo1-starlight)] leading-relaxed whitespace-pre-line">
        {highlightedText}
      </blockquote>

      {/* Context explanation if provided */}
      {section.context && (
        <p className="mt-3 text-sm text-[var(--lo1-text-light)]/80 italic">
          {section.context}
        </p>
      )}

      {/* Attribution with link */}
      <div className="mt-3 flex justify-end">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-[var(--lo1-gold)] hover:text-[var(--lo1-gold-light)] hover:underline inline-flex items-center gap-1 cursor-pointer"
        >
          — Ra, {section.reference}
          <svg
            className="w-3 h-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        </a>
      </div>
    </div>
  );
});

export default QuoteSection;
