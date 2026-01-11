"use client";

import { useState, useMemo } from "react";
import { SearchResult } from "@/lib/schemas";
import { formatWholeQuote, formatQuoteWithAttribution } from "@/lib/quote-utils";
import {
  getHighlightTerms,
  parseRaMaterialText,
  getSegmentDisplayContent,
} from "@/lib/search";
import CopyButton from "./CopyButton";

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

  // Compute formatted copy text with attribution
  const copyText = useMemo(
    () => formatQuoteWithAttribution(formattedText, result.reference, result.url),
    [formattedText, result.reference, result.url]
  );

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
    <div className="rounded-xl bg-[var(--lo1-indigo)]/50 backdrop-blur-sm border border-[var(--lo1-celestial)]/20
                    hover:border-[var(--lo1-gold)]/30 hover:shadow-[0_0_30px_rgba(212,168,83,0.1)]
                    transition-all duration-300 overflow-hidden">
      {/* Gold accent bar */}
      <div className="h-1 bg-gradient-to-r from-[var(--lo1-gold)] via-[var(--lo1-gold)]/60 to-transparent" />

      <div className="p-5">
        {/* Header with reference badge */}
        <div className="flex justify-between items-start mb-4">
          <span className="text-xs font-medium text-[var(--lo1-celestial)]/80 uppercase tracking-wider">
            Questioner
          </span>
          <a
            href={result.url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[var(--lo1-gold)]/15 text-[var(--lo1-gold)]
                       hover:bg-[var(--lo1-gold)]/25 transition-colors"
          >
            {shortRef}
          </a>
        </div>

        {/* Content segments */}
        <div className="space-y-4">
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
                  <div className="mb-2">
                    <span className="text-xs font-semibold text-[var(--lo1-gold)] uppercase tracking-wider">
                      Ra
                    </span>
                  </div>
                )}
                <p
                  className={`text-[15px] leading-relaxed whitespace-pre-line ${
                    segment.type === "ra"
                      ? "text-[var(--lo1-starlight)]"
                      : "text-[var(--lo1-text-light)]/90"
                  }`}
                >
                  {highlightText(content, highlightTerms)}
                </p>
                {/* Per-segment expand/collapse button */}
                {needsButton && (
                  <button
                    onClick={() => toggleSegment(index)}
                    className="mt-2 text-xs text-[var(--lo1-gold)] hover:text-[var(--lo1-gold-light)] cursor-pointer"
                  >
                    {isExpanded ? "↑ Show less" : "↓ Show more"}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 mt-5 pt-4 border-t border-[var(--lo1-celestial)]/10">
          <a
            href={result.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm px-4 py-2 rounded-lg
                       border border-[var(--lo1-celestial)]/30
                       text-[var(--lo1-stardust)] hover:text-[var(--lo1-starlight)]
                       hover:border-[var(--lo1-celestial)]/50 hover:bg-[var(--lo1-celestial)]/5
                       transition-all duration-200"
          >
            Read full passage
          </a>
          <button
            onClick={onAskAbout}
            className="text-sm px-4 py-2 rounded-lg
                       bg-[var(--lo1-gold)]/10 border border-[var(--lo1-gold)]/30
                       text-[var(--lo1-gold)] hover:bg-[var(--lo1-gold)]/20
                       transition-all duration-200 cursor-pointer"
          >
            Ask about this
          </button>
          <div className="ml-auto">
            <CopyButton textToCopy={copyText} size="sm" />
          </div>
        </div>
      </div>
    </div>
  );
}
