"use client";

import { useState, useMemo, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useLanguage } from "@/contexts/LanguageContext";
import { type SearchResult } from "@/lib/schemas";
import { formatWholeQuote, formatQuoteWithAttribution, fetchBilingualQuote } from "@/lib/quote-utils";
import { type AvailableLanguage } from "@/lib/language-config";
import {
  getHighlightTerms,
  parseRaMaterialText,
  getSegmentDisplayContent,
} from "@/lib/search";
import CopyButton from "./CopyButton";

/**
 * Check if result has a sentence match attached.
 */
function hasSentence(result: SearchResult): boolean {
  return typeof result.sentence === "string" && result.sentence.length > 0;
}

export interface SearchResultCardProps {
  result: SearchResult;
  query: string;
  onAskAbout: () => void;
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
  const t = useTranslations("search");
  const tQuote = useTranslations("quote");
  const { language } = useLanguage();
  const [expandedSegments, setExpandedSegments] = useState<Set<number>>(new Set());
  const [showFullPassage, setShowFullPassage] = useState(false);
  const [fullPassageText, setFullPassageText] = useState<string | null>(null);
  const [englishOriginalText, setEnglishOriginalText] = useState<string | null>(null);
  const [showEnglishOriginal, setShowEnglishOriginal] = useState(false);
  const [loadingPassage, setLoadingPassage] = useState(false);

  // State for bilingual initial content
  const [translatedSentence, setTranslatedSentence] = useState<string | null>(null);
  const [translatedPassage, setTranslatedPassage] = useState<string | null>(null);
  const [passageEnglishOriginal, setPassageEnglishOriginal] = useState<string | null>(null);
  const [loadingTranslation, setLoadingTranslation] = useState(false);
  const [translationAttempted, setTranslationAttempted] = useState(false);

  // Determine if this result has a sentence match (from hybrid search)
  const hasSentenceMatch = hasSentence(result);

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

  // Fetch translated content on mount for non-English languages
  useEffect(() => {
    // Only attempt translation once per result
    if (language !== 'en' && !translationAttempted && !loadingTranslation) {
      setTranslationAttempted(true);
      setLoadingTranslation(true);

      const reference = `${result.session}.${result.question}`;

      fetchBilingualQuote(reference, language as AvailableLanguage)
        .then((data) => {
          if (data?.text) {
            if (hasSentenceMatch) {
              // Sentence mode: extract the matching sentence by position
              const sentences = data.text.split(/(?<=[.!?])\s+/);
              const sentenceIndex = result.sentenceIndex ?? 0;
              if (sentences[sentenceIndex]) {
                setTranslatedSentence(sentences[sentenceIndex].trim());
              }
            } else {
              // Passage mode: use the full translated passage
              setTranslatedPassage(data.text);
            }
            if (data.originalText) {
              setPassageEnglishOriginal(data.originalText);
            }
          }
        })
        .finally(() => setLoadingTranslation(false));
    }
  }, [language, translationAttempted, loadingTranslation, hasSentenceMatch, result.session, result.question, result.sentenceIndex]);

  // Load full passage when user expands in sentence mode
  useEffect(() => {
    if (showFullPassage && !fullPassageText && !loadingPassage) {
      setLoadingPassage(true);
      const reference = `${result.session}.${result.question}`;

      // Fetch bilingual content for non-English, just target language for English
      fetchBilingualQuote(reference, language as AvailableLanguage)
        .then((data) => {
          if (data) {
            setFullPassageText(data.text);
            if (data.originalText) {
              setEnglishOriginalText(data.originalText);
            }
          }
        })
        .catch(() => {
          // Silently fail - user can still click the link
        })
        .finally(() => setLoadingPassage(false));
    }
  }, [showFullPassage, fullPassageText, loadingPassage, result.session, result.question, language]);

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
                {loadingPassage ? t("loadingPassage") : `↓ ${t("viewInContext")}`}
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
                <p className="text-xs text-[var(--lo1-celestial)]/70 mb-1">{tQuote("englishOriginal")}</p>
                <p className="text-[14px] leading-relaxed text-[var(--lo1-stardust)]">
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
                <p className="text-xs text-[var(--lo1-celestial)]/70 mb-2">{tQuote("englishOriginal")}</p>
                <p className="text-[14px] leading-relaxed text-[var(--lo1-stardust)] whitespace-pre-line">
                  {formatWholeQuote(englishOriginalText)}
                </p>
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
                <p className="text-xs text-[var(--lo1-celestial)]/70 mb-2">{tQuote("englishOriginal")}</p>
                <p className="text-[14px] leading-relaxed text-[var(--lo1-stardust)] whitespace-pre-line">
                  {formatWholeQuote(passageEnglishOriginal)}
                </p>
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
            onClick={onAskAbout}
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
