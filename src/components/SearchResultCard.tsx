"use client";

import { useState, useMemo } from "react";
import { SearchResult } from "@/lib/schemas";
import { formatWholeQuote } from "@/lib/quote-utils";
import {
  getHighlightTerms,
  parseRaMaterialText,
  getSegmentDisplayContent,
} from "@/lib/search";

export interface SearchResultCardProps {
  result: SearchResult;
  query: string;
  onAskAbout: () => void;
}

/**
 * Highlight matching terms in text.
 * Highlights entire words that START with the search term (prefix match).
 * E.g., searching "law" highlights "law", "lawful", "laws" but not "flaw".
 * Returns React elements with highlighted spans.
 */
function highlightText(text: string, terms: string[]): React.ReactNode {
  if (terms.length === 0) return text;

  // Create regex pattern that matches term + rest of word
  // \b(term\w*) matches "law" in "lawful" and captures the whole word
  const escapedTerms = terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\w*");
  const pattern = new RegExp(
    `\\b(${escapedTerms.join("|")})`,
    "gi"
  );

  const parts = text.split(pattern);

  return parts.map((part, index) => {
    // Check if this part starts with any of our terms (case-insensitive)
    const isMatch = terms.some(term =>
      part.toLowerCase().startsWith(term.toLowerCase())
    );
    if (isMatch) {
      return (
        <mark
          key={index}
          className="bg-[var(--lo1-gold)]/20 text-inherit rounded px-0.5"
        >
          {part}
        </mark>
      );
    }
    return part;
  });
}

export default function SearchResultCard({
  result,
  query,
  onAskAbout,
}: SearchResultCardProps) {
  const [expandedSegments, setExpandedSegments] = useState<Set<number>>(new Set());

  // Get highlight terms from query
  const highlightTerms = useMemo(() => getHighlightTerms(query), [query]);

  // Extract short reference (e.g., "49.8" from "Ra 49.8")
  const shortRef = result.reference.match(/(\d+\.\d+)/)?.[1] || result.reference;

  // Format text with proper paragraph breaks
  const formattedText = useMemo(() => formatWholeQuote(result.text), [result.text]);

  // Parse formatted text into Questioner/Ra segments
  const segments = useMemo(() => parseRaMaterialText(formattedText), [formattedText]);

  const toggleSegment = (index: number) => {
    setExpandedSegments(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  return (
    <div className="rounded-lg bg-[var(--lo1-indigo)]/60 backdrop-blur-sm border-l-4 border-[var(--lo1-gold)] p-4
                    hover:shadow-[0_0_20px_rgba(212,168,83,0.1)] transition-all duration-200">
      {/* Header with Questioner label and reference */}
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-semibold text-[var(--lo1-celestial)] uppercase tracking-wide">
          Questioner
        </span>
        <a
          href={result.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-medium text-[var(--lo1-gold)] hover:text-[var(--lo1-gold-light)] hover:underline"
        >
          {shortRef}
        </a>
      </div>

      {/* Content segments */}
      <div className="space-y-3">
        {segments.map((segment, index) => {
          const isExpanded = expandedSegments.has(index);
          const { content, needsButton } = getSegmentDisplayContent(
            segment.type,
            segment.content,
            isExpanded,
            highlightTerms
          );

          return (
            <div key={index}>
              {/* Ra label */}
              {segment.type === "ra" && (
                <div className="mb-1">
                  <span className="text-xs font-semibold text-[var(--lo1-gold)] uppercase tracking-wide">
                    Ra
                  </span>
                </div>
              )}
              <p
                className={`text-sm leading-relaxed whitespace-pre-line ${
                  segment.type === "ra"
                    ? "text-[var(--lo1-starlight)]"
                    : "text-[var(--lo1-text-light)]"
                }`}
              >
                {highlightText(content, highlightTerms)}
              </p>
              {/* Per-segment expand/collapse button */}
              {needsButton && (
                <button
                  onClick={() => toggleSegment(index)}
                  className="mt-1 text-xs text-[var(--lo1-gold)] hover:text-[var(--lo1-gold-light)] cursor-pointer"
                >
                  {isExpanded ? "↑ Show less" : "↓ Show more"}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-4 pt-3 border-t border-[var(--lo1-celestial)]/10">
        <a
          href={result.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs px-3 py-1.5 rounded-lg
                     border border-[var(--lo1-celestial)]/30
                     text-[var(--lo1-stardust)] hover:text-[var(--lo1-starlight)]
                     hover:border-[var(--lo1-celestial)]/50
                     transition-all duration-200"
        >
          Read full passage
        </a>
        <button
          onClick={onAskAbout}
          className="text-xs px-3 py-1.5 rounded-lg
                     bg-[var(--lo1-gold)]/10 border border-[var(--lo1-gold)]/30
                     text-[var(--lo1-gold)] hover:bg-[var(--lo1-gold)]/20
                     transition-all duration-200 cursor-pointer"
        >
          Ask about this
        </button>
      </div>
    </div>
  );
}
