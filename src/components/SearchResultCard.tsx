"use client";

import { useState, useMemo, useCallback } from "react";
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

const CONTEXT_WINDOW = 4;

/**
 * Trim text to ~CONTEXT_WINDOW sentences before and after the matched sentence.
 * If the sentence isn't found, returns the original text unchanged.
 */
function trimAroundSentence(text: string, matchedSentence: string): string {
  const sentences = text.split(/(?<=[.!?])\s+/).filter((s) => s.length > 0);
  if (sentences.length <= CONTEXT_WINDOW * 2 + 1) return text;

  // Find which sentence contains the match
  const lower = matchedSentence.slice(0, 60).toLowerCase();
  const idx = sentences.findIndex((s) => s.toLowerCase().includes(lower));
  if (idx === -1) return text;

  const start = Math.max(0, idx - CONTEXT_WINDOW);
  const end = Math.min(sentences.length, idx + CONTEXT_WINDOW + 1);
  return sentences.slice(start, end).join(" ");
}

/**
 * Highlight a matched sentence within text using gold text color.
 * Used in expanded context view to show which sentence matched the search.
 * Trims long text to sentences around the match, then highlights.
 */
function highlightMatchedSentence(
  text: string,
  matchedSentence: string | undefined
): React.ReactNode {
  if (!matchedSentence) return text;

  // Trim long passages to a window around the matched sentence
  const trimmed = trimAroundSentence(text, matchedSentence);

  let index = trimmed.indexOf(matchedSentence);
  let matchLength = matchedSentence.length;

  // Fallback: try case-insensitive search with first 60 chars as anchor
  if (index === -1 && matchedSentence.length > 20) {
    const anchor = matchedSentence.slice(0, 60).toLowerCase();
    const lowerText = trimmed.toLowerCase();
    const anchorIdx = lowerText.indexOf(anchor);
    if (anchorIdx !== -1) {
      // Find sentence end: period/exclamation/question followed by space+uppercase or end of text.
      // This avoids breaking on abbreviations like "Dr." or "U.S.A."
      const afterAnchor = trimmed.slice(anchorIdx + anchor.length);
      const endMatch = afterAnchor.match(/[.!?](?:\s+[A-Z]|\s*$)/);
      const endOffset = endMatch
        ? anchor.length + (endMatch.index ?? 0) + 1
        : matchedSentence.length;
      index = anchorIdx;
      matchLength = Math.min(endOffset, trimmed.length - anchorIdx);
    }
  }

  if (index === -1) return trimmed;

  const before = trimmed.slice(0, index);
  const matched = trimmed.slice(index, index + matchLength);
  const after = trimmed.slice(index + matchLength);

  return (
    <>
      {before}
      <span className="text-[var(--lo1-gold)] font-medium">{matched}</span>
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
  const [confederationPassageText, setConfederationPassageText] = useState<string | null>(null);
  const [loadingConfederationPassage, setLoadingConfederationPassage] = useState(false);

  // Determine if this result has a sentence match (from hybrid search)
  const hasSentenceMatch = hasSentence(result);

  // Determine source type
  const isConfederation = result.source === "confederation";

  // Fetch Confederation passage context for "View in context"
  const handleViewConfederationContext = useCallback(async () => {
    if (!result.transcriptId || result.chunkIndex === undefined) return;
    setLoadingConfederationPassage(true);
    setShowFullPassage(true);
    try {
      const params = new URLSearchParams({
        id: result.transcriptId,
        chunk: String(result.chunkIndex),
      });
      // Truncate sentence to avoid URL length limits — server only needs an anchor prefix
      if (result.sentence) params.set("sentence", result.sentence.slice(0, 120));
      const res = await fetch(`/api/confederation-passage?${params}`);
      if (res.ok) {
        const data = await res.json();
        setConfederationPassageText(data.text);
      }
    } catch {
      // Silently fail — user can still use the external link
    } finally {
      setLoadingConfederationPassage(false);
    }
  }, [result.transcriptId, result.chunkIndex, result.sentence]);

  // Build reference for SWR (only for Ra results)
  const reference = isConfederation ? "" : `${result.session}.${result.question}`;

  // SWR handles fetching, caching, and deduplication across all SearchResultCards
  // useQuoteData handles both English and non-English cases in a single hook
  // Skip SWR fetch for Confederation results (no local section files — empty string disables SWR)
  const { data: quoteData, isLoading: loadingTranslation } = useQuoteData(
    isConfederation ? "" : reference,
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

  // Extract short reference for badge display
  // Ra: "49.8" from "Ra 49.8"
  // Confederation: date like "2024-01-24" from "Q'uo, 2024-01-24"
  const shortRef = isConfederation
    ? result.date || result.reference
    : result.reference.match(/(\d+\.\d+)/)?.[1] || result.reference;

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

  // Get speaker label for sentence mode and Confederation passage mode
  const speakerLabel = (() => {
    if (isConfederation) {
      // Confederation: show entity name for channeling, "Questioner" for questions
      if (result.speaker === "questioner") return tQuote("questioner");
      return result.entity || result.reference.split(",")[0];
    }
    if (hasSentenceMatch) {
      if (result.speaker === "ra") return tQuote("ra");
      if (result.speaker === "questioner") return tQuote("questioner");
    }
    return null;
  })();

  // Determine if speaker should be styled as "gold" (Ra or channeling entity)
  const isSpeakerGold = isConfederation
    ? result.speaker !== "questioner"
    : result.speaker === "ra";

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
          {(hasSentenceMatch || isConfederation) && speakerLabel ? (
            <span
              className={`text-xs font-semibold uppercase tracking-wider ${
                isSpeakerGold
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
            className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
              isConfederation
                ? "bg-[var(--lo1-celestial)]/15 text-[var(--lo1-celestial)] hover:bg-[var(--lo1-celestial)]/25"
                : "bg-[var(--lo1-gold)]/15 text-[var(--lo1-gold)] hover:bg-[var(--lo1-gold)]/25"
            }`}
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
                isSpeakerGold
                  ? "text-[var(--lo1-starlight)]"
                  : "text-[var(--lo1-text-light)]/90"
              }`}
            >
              {loadingTranslation && !isConfederation ? (
                <span className="text-[var(--lo1-stardust)]">...</span>
              ) : (
                highlightText(
                  translatedSentence || result.sentence!,
                  highlightTerms
                )
              )}
            </p>
            <div className="flex items-center gap-4">
              {isConfederation ? (
                <button
                  onClick={handleViewConfederationContext}
                  className="text-xs text-[var(--lo1-gold)] hover:text-[var(--lo1-gold-light)] cursor-pointer"
                >
                  ↓ {t("viewInContext")}
                </button>
              ) : (
                <button
                  onClick={() => setShowFullPassage(true)}
                  className="text-xs text-[var(--lo1-gold)] hover:text-[var(--lo1-gold-light)] cursor-pointer"
                >
                  {loadingTranslation ? t("loadingPassage") : `↓ ${t("viewInContext")}`}
                </button>
              )}
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
            {isConfederation ? (
              // Confederation: show passage fetched from Pinecone
              loadingConfederationPassage ? (
                <p className="text-[var(--lo1-stardust)] text-sm">{t("loadingPassage")}</p>
              ) : confederationPassageText ? (
                <p className="text-[15px] leading-relaxed whitespace-pre-line text-[var(--lo1-starlight)]">
                  {highlightMatchedSentence(confederationPassageText, result.sentence)}
                </p>
              ) : (
                // Fetch failed or passage not found — show the sentence itself
                <p className="text-[15px] leading-relaxed text-[var(--lo1-starlight)]">
                  <span className="text-[var(--lo1-gold)] font-medium">{result.sentence}</span>
                </p>
              )
            ) : (
              // Ra: show passage from local section files
              fullPassageSegments ? (
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
              )
            )}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowFullPassage(false)}
                className="text-xs text-[var(--lo1-gold)] hover:text-[var(--lo1-gold-light)] cursor-pointer"
              >
                ↑ {t("showLess")}
              </button>
              {/* English original toggle for non-English users (Ra only) */}
              {!isConfederation && language !== 'en' && englishOriginalText && (
                <button
                  onClick={() => setShowEnglishOriginal(!showEnglishOriginal)}
                  className="text-xs text-[var(--lo1-celestial)] hover:text-[var(--lo1-celestial-light)] cursor-pointer"
                >
                  {showEnglishOriginal ? tQuote("hideEnglishOriginal") : tQuote("showEnglishOriginal")}
                </button>
              )}
            </div>
            {/* Show English original if toggled (Ra only) */}
            {!isConfederation && showEnglishOriginal && englishOriginalText && (
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
            {/* Loading indicator for translation (not for Confederation) */}
            {loadingTranslation && !isConfederation && (
              <p className="text-[var(--lo1-stardust)] text-sm">...</p>
            )}
            {(!loadingTranslation || isConfederation) && segments.map((segment, index) => {
              const isExpanded = expandedSegments.has(index);
              const { content, needsButton } = getSegmentDisplayContent(
                segment.type,
                segment.content,
                isExpanded,
                highlightTerms
              );

              return (
                <div key={index}>
                  {/* Speaker label: Ra for Ra results, entity name for Confederation */}
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
            {isConfederation ? t("readFullTranscript") : t("readFullPassage")}
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
