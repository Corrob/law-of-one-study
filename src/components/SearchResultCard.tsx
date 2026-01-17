"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useLanguage } from "@/contexts/LanguageContext";
import { type SearchResult } from "@/lib/schemas";
import { formatWholeQuote, formatQuoteWithAttribution, splitIntoSentences } from "@/lib/quote-utils";
import { type AvailableLanguage } from "@/lib/language-config";
import {
  getHighlightTerms,
  parseRaMaterialText,
  getSegmentDisplayContent,
} from "@/lib/search";
import { useQuoteData } from "@/hooks/useBilingualQuote";
import CopyButton from "./CopyButton";

/**
 * Check if result has a sentence match attached.
 */
function hasSentence(result: SearchResult): boolean {
  return typeof result.sentence === "string" && result.sentence.length > 0;
}

// Cache for highlight RegExp patterns - avoids recreation on each render
const highlightRegexCache = new Map<string, RegExp>();

/**
 * Get or create a cached RegExp for highlighting terms.
 * The cache key is the sorted, joined terms to ensure consistency.
 */
function getHighlightRegex(terms: string[]): RegExp {
  const cacheKey = terms.slice().sort().join("|");
  let regex = highlightRegexCache.get(cacheKey);
  if (!regex) {
    const escapedTerms = terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\w*");
    regex = new RegExp(`\\b(${escapedTerms.join("|")})`, "gi");
    highlightRegexCache.set(cacheKey, regex);
    // Limit cache size to prevent memory leaks
    if (highlightRegexCache.size > 100) {
      const firstKey = highlightRegexCache.keys().next().value;
      if (firstKey) highlightRegexCache.delete(firstKey);
    }
  }
  return regex;
}

export interface SearchResultCardProps {
  result: SearchResult;
  query: string;
  onAskAbout: (displayText: string) => void;
}

/**
 * Highlight a matched sentence within text using gold text color.
 * Used in expanded context view to show which sentence matched the search.
 */
function highlightMatchedSentence(
  text: string,
  matchedSentence: string | undefined
): React.ReactNode {
  if (!matchedSentence) return text;

  const index = text.indexOf(matchedSentence);
  if (index === -1) return text;

  const before = text.slice(0, index);
  const after = text.slice(index + matchedSentence.length);

  return (
    <>
      {before}
      <span className="text-[var(--lo1-gold)] font-medium">{matchedSentence}</span>
      {after}
    </>
  );
}

/**
 * Highlight matching terms in text.
 * Highlights entire words that START with the search term (prefix match).
 * E.g., searching "law" highlights "law", "lawful", "laws" but not "flaw".
 * Returns React elements with highlighted spans.
 */
function highlightText(text: string, terms: string[]): React.ReactNode {
  if (terms.length === 0) return text;

  // Use cached regex pattern for performance
  const pattern = getHighlightRegex(terms);
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
  const t = useTranslations("search");
  const tQuote = useTranslations("quote");
  const { language } = useLanguage();
  const [expandedSegments, setExpandedSegments] = useState<Set<number>>(new Set());
  const [showFullPassage, setShowFullPassage] = useState(false);
  const [showEnglishOriginal, setShowEnglishOriginal] = useState(false);

  // Determine if this result has a sentence match (from hybrid search)
  const hasSentenceMatch = hasSentence(result);

  // Build reference for SWR
  const reference = `${result.session}.${result.question}`;

  // SWR handles fetching, caching, and deduplication across all SearchResultCards
  // useQuoteData handles both English and non-English cases in a single hook
  const { data: quoteData, isLoading: loadingTranslation } = useQuoteData(
    reference,
    language as AvailableLanguage
  );

  // For bilingual sentence matching, we need the original text (only for non-English)
  const bilingualData = language !== 'en' ? quoteData : null;

  // Derive translated content from SWR data with sentence matching logic
  const { translatedSentence, translatedPassage, passageEnglishOriginal } = useMemo(() => {
    if (!bilingualData?.text || language === 'en') {
      return { translatedSentence: null, translatedPassage: null, passageEnglishOriginal: null };
    }

    const englishOriginal = bilingualData.originalText || null;

    if (hasSentenceMatch && result.sentence && bilingualData.originalText) {
      // Sentence mode: find corresponding translated sentence by position
      // Filter helper: skip greeting "I am Ra" / "Soy Ra" and short sentences
      const isContentSentence = (s: string) =>
        s.length >= 10 &&
        !s.match(/^(Ra:\s*)?(I am Ra|Soy Ra)\.?$/i);

      const englishSentences = splitIntoSentences(bilingualData.originalText)
        .filter(isContentSentence);
      const translatedSentences = splitIntoSentences(bilingualData.text)
        .filter(isContentSentence);

      // Normalize text for comparison (remove punctuation, lowercase)
      const normalize = (s: string) =>
        s.toLowerCase().replace(/[^\w\s]/g, '').trim();
      const normalizedTarget = normalize(result.sentence);

      // Find which English sentence matches result.sentence
      const englishIndex = englishSentences.findIndex(s => {
        const normalizedSentence = normalize(s);
        return normalizedSentence.includes(normalizedTarget) ||
               normalizedTarget.includes(normalizedSentence);
      });

      if (englishIndex !== -1 && translatedSentences.length > 0) {
        // Map English position to translated position proportionally
        const relativePosition = englishIndex / Math.max(englishSentences.length, 1);
        const translatedIndex = Math.min(
          Math.round(relativePosition * translatedSentences.length),
          translatedSentences.length - 1
        );
        return {
          translatedSentence: translatedSentences[translatedIndex].trim(),
          translatedPassage: null,
          passageEnglishOriginal: englishOriginal,
        };
      } else if (translatedSentences.length > 0) {
        // Fallback: use first content sentence if we can't find the match
        return {
          translatedSentence: translatedSentences[0].trim(),
          translatedPassage: null,
          passageEnglishOriginal: englishOriginal,
        };
      }
    } else if (hasSentenceMatch) {
      // Sentence mode without English original - use first content sentence
      const translatedSentences = splitIntoSentences(bilingualData.text)
        .filter(s => s.length >= 10 && !s.match(/^(Ra:\s*)?(I am Ra|Soy Ra)\.?$/i));
      if (translatedSentences.length > 0) {
        return {
          translatedSentence: translatedSentences[0].trim(),
          translatedPassage: null,
          passageEnglishOriginal: englishOriginal,
        };
      }
    }

    // Passage mode: use the full translated passage
    return {
      translatedSentence: null,
      translatedPassage: bilingualData.text,
      passageEnglishOriginal: englishOriginal,
    };
  }, [bilingualData, language, hasSentenceMatch, result.sentence]);

  // Full passage text and English original (from SWR data when expanded)
  const fullPassageText = showFullPassage && quoteData?.text
    ? formatWholeQuote(quoteData.text)
    : null;
  const englishOriginalText = showFullPassage && quoteData?.originalText
    ? formatWholeQuote(quoteData.originalText)
    : null;

  // Get highlight terms from query
  const highlightTerms = useMemo(() => getHighlightTerms(query), [query]);

  // Extract short reference (e.g., "49.8" from "Ra 49.8")
  const shortRef = result.reference.match(/(\d+\.\d+)/)?.[1] || result.reference;

  // Get text content - always show translated version when available
  // The "Show English original" toggle controls the separate English section below
  const displayText = useMemo(() => {
    if (hasSentenceMatch) {
      // Sentence mode: use translated sentence if available, fall back to English
      return translatedSentence || result.sentence;
    } else {
      // Passage mode: use translated passage if available, fall back to English
      return translatedPassage || result.text;
    }
  }, [hasSentenceMatch, translatedSentence, translatedPassage, result.sentence, result.text]);

  // Format text with proper paragraph breaks
  const formattedText = useMemo(
    () => (displayText ? formatWholeQuote(displayText) : ""),
    [displayText]
  );

  // Parse formatted text into Questioner/Ra segments
  const segments = useMemo(() => parseRaMaterialText(formattedText), [formattedText]);

  // Compute formatted copy text with attribution
  const copyText = useMemo(
    () => formatQuoteWithAttribution(formattedText, result.reference, result.url),
    [formattedText, result.reference, result.url]
  );

  // For sentence mode, parse full passage if available
  const fullPassageSegments = useMemo(() => {
    if (fullPassageText) {
      const formatted = formatWholeQuote(fullPassageText);
      return parseRaMaterialText(formatted);
    }
    return null;
  }, [fullPassageText]);

  const toggleSegment = (index: number) => {
    setExpandedSegments((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  // Get speaker label for sentence mode
  const speakerLabel = hasSentenceMatch
    ? result.speaker === "ra"
      ? tQuote("ra")
      : result.speaker === "questioner"
        ? tQuote("questioner")
        : null
    : null;

  return (
    <div
      className="rounded-xl bg-[var(--lo1-indigo)]/50 backdrop-blur-sm border border-[var(--lo1-celestial)]/20
                    hover:border-[var(--lo1-gold)]/30 hover:shadow-[0_0_30px_rgba(212,168,83,0.1)]
                    transition-all duration-300 overflow-hidden"
    >
      {/* Gold accent bar */}
      <div className="h-1 bg-gradient-to-r from-[var(--lo1-gold)] via-[var(--lo1-gold)]/60 to-transparent" />

      <div className="p-5">
        {/* Header with reference badge and speaker */}
        <div className="flex justify-between items-start mb-4">
          {hasSentenceMatch && speakerLabel ? (
            <span
              className={`text-xs font-semibold uppercase tracking-wider ${
                result.speaker === "ra"
                  ? "text-[var(--lo1-gold)]"
                  : "text-[var(--lo1-celestial)]/80"
              }`}
            >
              {speakerLabel}
            </span>
          ) : (
            <span className="text-xs font-medium text-[var(--lo1-celestial)]/80 uppercase tracking-wider">
              {tQuote("questioner")}
            </span>
          )}
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

        {/* Sentence mode: show matched sentence prominently */}
        {hasSentenceMatch && !showFullPassage && (
          <div className="space-y-4">
            {/* Show translated sentence if available, otherwise show original */}
            <p
              className={`text-[16px] leading-relaxed ${
                result.speaker === "ra"
                  ? "text-[var(--lo1-starlight)]"
                  : "text-[var(--lo1-text-light)]/90"
              }`}
            >
              {loadingTranslation ? (
                <span className="text-[var(--lo1-stardust)]">...</span>
              ) : (
                highlightText(
                  translatedSentence || result.sentence!,
                  highlightTerms
                )
              )}
            </p>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowFullPassage(true)}
                className="text-xs text-[var(--lo1-gold)] hover:text-[var(--lo1-gold-light)] cursor-pointer"
              >
                {loadingTranslation ? t("loadingPassage") : `↓ ${t("viewInContext")}`}
              </button>
              {/* English original toggle for non-English users */}
              {language !== 'en' && translatedSentence && (
                <button
                  onClick={() => setShowEnglishOriginal(!showEnglishOriginal)}
                  className="text-xs text-[var(--lo1-celestial)] hover:text-[var(--lo1-celestial-light)] cursor-pointer"
                >
                  {showEnglishOriginal ? tQuote("hideEnglishOriginal") : tQuote("showEnglishOriginal")}
                </button>
              )}
            </div>
            {/* Show English original sentence if toggled */}
            {showEnglishOriginal && translatedSentence && result.sentence && (
              <div className="mt-3 pt-3 border-t border-[var(--lo1-celestial)]/20">
                {result.speaker && (
                  <div className="mb-1">
                    <span
                      className={`text-xs font-semibold uppercase tracking-wider ${
                        result.speaker === "ra"
                          ? "text-[var(--lo1-gold)]/70"
                          : "text-[var(--lo1-celestial)]/70"
                      }`}
                    >
                      {result.speaker === "ra" ? "Ra" : "Questioner"}
                    </span>
                  </div>
                )}
                <p
                  className={`text-[14px] leading-relaxed opacity-80 ${
                    result.speaker === "ra"
                      ? "text-[var(--lo1-starlight)]"
                      : "text-[var(--lo1-text-light)]"
                  }`}
                >
                  {result.sentence}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Sentence mode expanded: show full passage with sentence highlighted */}
        {hasSentenceMatch && showFullPassage && (
          <div className="space-y-4">
            {fullPassageSegments ? (
              fullPassageSegments.map((segment, index) => {
                return (
                  <div key={index}>
                    {segment.type === "ra" && (
                      <div className="mb-2">
                        <span className="text-xs font-semibold text-[var(--lo1-gold)] uppercase tracking-wider">
                          {tQuote("ra")}
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
                      {highlightMatchedSentence(segment.content, translatedSentence || result.sentence)}
                    </p>
                  </div>
                );
              })
            ) : (
              <p className="text-[var(--lo1-stardust)] text-sm">{t("loadingPassage")}</p>
            )}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowFullPassage(false)}
                className="text-xs text-[var(--lo1-gold)] hover:text-[var(--lo1-gold-light)] cursor-pointer"
              >
                ↑ {t("showLess")}
              </button>
              {/* English original toggle for non-English users */}
              {language !== 'en' && englishOriginalText && (
                <button
                  onClick={() => setShowEnglishOriginal(!showEnglishOriginal)}
                  className="text-xs text-[var(--lo1-celestial)] hover:text-[var(--lo1-celestial-light)] cursor-pointer"
                >
                  {showEnglishOriginal ? tQuote("hideEnglishOriginal") : tQuote("showEnglishOriginal")}
                </button>
              )}
            </div>
            {/* Show English original if toggled */}
            {showEnglishOriginal && englishOriginalText && (
              <div className="mt-4 pt-4 border-t border-[var(--lo1-celestial)]/20">
                {parseRaMaterialText(formatWholeQuote(englishOriginalText)).map((segment, index) => (
                  <div key={index} className={segment.type === "ra" ? "mt-3" : ""}>
                    {segment.type === "questioner" && (
                      <div className="mb-1">
                        <span className="text-xs font-semibold text-[var(--lo1-celestial)]/70 uppercase tracking-wider">
                          Questioner
                        </span>
                      </div>
                    )}
                    {segment.type === "ra" && (
                      <div className="mb-1">
                        <span className="text-xs font-semibold text-[var(--lo1-gold)]/70 uppercase tracking-wider">
                          Ra
                        </span>
                      </div>
                    )}
                    <p
                      className={`text-[14px] leading-relaxed whitespace-pre-line opacity-80 ${
                        segment.type === "ra"
                          ? "text-[var(--lo1-starlight)]"
                          : "text-[var(--lo1-text-light)]"
                      }`}
                    >
                      {highlightMatchedSentence(segment.content, result.sentence)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Passage mode: show segments as before */}
        {!hasSentenceMatch && (
          <div className="space-y-4">
            {/* Loading indicator for translation */}
            {loadingTranslation && (
              <p className="text-[var(--lo1-stardust)] text-sm">...</p>
            )}
            {!loadingTranslation && segments.map((segment, index) => {
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
                        {tQuote("ra")}
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
                      {isExpanded ? `↑ ${t("showLess")}` : `↓ ${t("showMore")}`}
                    </button>
                  )}
                </div>
              );
            })}
            {/* English original toggle for non-English users in passage mode */}
            {language !== 'en' && passageEnglishOriginal && (
              <div className="mt-2">
                <button
                  onClick={() => setShowEnglishOriginal(!showEnglishOriginal)}
                  className="text-xs text-[var(--lo1-celestial)] hover:text-[var(--lo1-celestial-light)] cursor-pointer"
                >
                  {showEnglishOriginal ? tQuote("hideEnglishOriginal") : tQuote("showEnglishOriginal")}
                </button>
              </div>
            )}
            {/* Show English original if toggled in passage mode */}
            {showEnglishOriginal && passageEnglishOriginal && (
              <div className="mt-4 pt-4 border-t border-[var(--lo1-celestial)]/20">
                {parseRaMaterialText(formatWholeQuote(passageEnglishOriginal)).map((segment, index) => (
                  <div key={index} className={segment.type === "ra" ? "mt-3" : ""}>
                    {segment.type === "questioner" && (
                      <div className="mb-1">
                        <span className="text-xs font-semibold text-[var(--lo1-celestial)]/70 uppercase tracking-wider">
                          Questioner
                        </span>
                      </div>
                    )}
                    {segment.type === "ra" && (
                      <div className="mb-1">
                        <span className="text-xs font-semibold text-[var(--lo1-gold)]/70 uppercase tracking-wider">
                          Ra
                        </span>
                      </div>
                    )}
                    <p
                      className={`text-[14px] leading-relaxed whitespace-pre-line opacity-80 ${
                        segment.type === "ra"
                          ? "text-[var(--lo1-starlight)]"
                          : "text-[var(--lo1-text-light)]"
                      }`}
                    >
                      {segment.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

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
            {t("readFullPassage")}
          </a>
          <button
            onClick={() => onAskAbout(displayText || "")}
            className="text-sm px-4 py-2 rounded-lg
                       bg-[var(--lo1-gold)]/10 border border-[var(--lo1-gold)]/30
                       text-[var(--lo1-gold)] hover:bg-[var(--lo1-gold)]/20
                       transition-all duration-200 cursor-pointer"
          >
            {t("askAboutThis")}
          </button>
          <div className="ml-auto">
            <CopyButton textToCopy={copyText} size="sm" />
          </div>
        </div>
      </div>
    </div>
  );
}
