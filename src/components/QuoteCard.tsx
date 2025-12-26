'use client';

import { Quote } from '@/lib/types';

interface QuoteCardProps {
  quote: Quote;
}

// Parse Ra material text into formatted segments
function formatRaText(text: string): { type: 'questioner' | 'ra' | 'text'; content: string }[] {
  const segments: { type: 'questioner' | 'ra' | 'text'; content: string }[] = [];

  // Split by Questioner: and Ra: prefixes
  const parts = text.split(/(Questioner:|Ra:)/);

  let currentType: 'questioner' | 'ra' | 'text' = 'text';

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    if (trimmed === 'Questioner:') {
      currentType = 'questioner';
    } else if (trimmed === 'Ra:') {
      currentType = 'ra';
    } else {
      // Fix periods without spaces (paragraph breaks)
      const fixed = trimmed.replace(/\.(?=[A-Z])/g, '.\n\n');
      segments.push({ type: currentType, content: fixed });
    }
  }

  return segments;
}

// Split text into sentences (handles Ra Material formatting)
function splitIntoSentences(text: string): string[] {
  // Fix periods without spaces first (same normalization as formatRaText)
  // This ensures sentence counting matches the display formatting
  const normalized = text.replace(/\.(?=[A-Z])/g, '. ');

  // Split on period followed by space or newline, question mark, or exclamation
  // But preserve decimal numbers and common abbreviations
  const sentences: string[] = [];
  const parts = normalized.split(/(?<=[.!?])\s+/);

  for (const part of parts) {
    if (part.trim()) {
      sentences.push(part.trim());
    }
  }

  return sentences;
}

// Paragraph data structure with sentence range
interface Paragraph {
  type: 'questioner' | 'ra' | 'text';
  content: string;
  sentenceStart: number; // 1-indexed
  sentenceEnd: number; // 1-indexed
}

// Parse Ra material text into paragraphs with sentence ranges
function parseIntoParagraphs(text: string): Paragraph[] {
  // Normalize text to add spaces after periods
  const normalizedText = text.replace(/\.(?=[A-Z])/g, '. ');
  const allSentences = splitIntoSentences(text);

  // Split by speaker and paragraph breaks
  // First, split by speaker changes (Questioner: and Ra:)
  const parts = normalizedText.split(/(?=\s(?:Questioner:|Ra:))/);

  const paragraphs: Paragraph[] = [];
  let sentenceIndex = 0; // Track which sentence we're at (0-indexed)

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    // Determine speaker type
    let type: 'questioner' | 'ra' | 'text' = 'text';
    let content = trimmed;

    if (trimmed.startsWith('Questioner:')) {
      type = 'questioner';
      content = trimmed.substring('Questioner:'.length).trim();
    } else if (trimmed.startsWith('Ra:')) {
      type = 'ra';
      content = trimmed.substring('Ra:'.length).trim();
    }

    // Split this speaker's content by paragraph breaks (". " followed by uppercase)
    const subParagraphs = content.split(/\.(?=\s+[A-Z])/);

    for (let i = 0; i < subParagraphs.length; i++) {
      let paragraphText = subParagraphs[i].trim();

      // Re-add the period that was removed by split (except for last subparagraph)
      if (i < subParagraphs.length - 1) {
        paragraphText += '.';
      }

      if (!paragraphText) continue;

      // Count sentences in this paragraph
      const paragraphSentences = splitIntoSentences(paragraphText);
      const sentenceStart = sentenceIndex + 1; // Convert to 1-indexed
      sentenceIndex += paragraphSentences.length;
      const sentenceEnd = sentenceIndex; // Already 1-indexed

      paragraphs.push({
        type,
        content: paragraphText,
        sentenceStart,
        sentenceEnd
      });
    }
  }

  return paragraphs;
}

// Filter paragraphs to those that intersect with the requested sentence range
function filterParagraphsByRange(paragraphs: Paragraph[], sentenceStart: number, sentenceEnd: number): Paragraph[] {
  return paragraphs.filter(p => {
    // Check if paragraph's sentence range intersects with requested range
    return p.sentenceEnd >= sentenceStart && p.sentenceStart <= sentenceEnd;
  });
}

// Extract just the session.question from reference like "Ra 49.8"
function getShortReference(reference: string): string {
  const match = reference.match(/(\d+\.\d+)/);
  return match ? match[1] : reference;
}

export default function QuoteCard({ quote }: QuoteCardProps) {
  console.log('[QuoteCard] Received quote:', {
    reference: quote.reference,
    sentenceStart: quote.sentenceStart,
    sentenceEnd: quote.sentenceEnd,
    fullTextLength: quote.text.length
  });

  // Determine if we're showing a subset or full quote
  const isSubset = quote.sentenceStart !== undefined && quote.sentenceEnd !== undefined;

  let paragraphs: Paragraph[];
  let hasTextBefore = false;
  let hasTextAfter = false;

  if (isSubset) {
    // Parse text into paragraphs with sentence ranges
    const allParagraphs = parseIntoParagraphs(quote.text);
    console.log('[QuoteCard] Total paragraphs:', allParagraphs.length);
    console.log('[QuoteCard] Requested sentence range:', quote.sentenceStart, 'to', quote.sentenceEnd);

    // Filter to paragraphs that intersect with the requested range
    paragraphs = filterParagraphsByRange(allParagraphs, quote.sentenceStart!, quote.sentenceEnd!);
    console.log('[QuoteCard] Selected paragraphs:', paragraphs.length);

    if (paragraphs.length > 0) {
      // Check if there's text before/after the selection
      const firstParagraph = paragraphs[0];
      const lastParagraph = paragraphs[paragraphs.length - 1];
      hasTextBefore = firstParagraph.sentenceStart > 1;
      hasTextAfter = lastParagraph.sentenceEnd < allParagraphs[allParagraphs.length - 1].sentenceEnd;
    }
  } else {
    // Use full quote - parse it for consistent rendering
    console.log('[QuoteCard] No sentence range, showing full quote');
    paragraphs = parseIntoParagraphs(quote.text);
  }

  const shortRef = getShortReference(quote.reference);

  return (
    <div className="ra-quote mt-6 mb-4 rounded-lg bg-[var(--lo1-indigo)]/60 backdrop-blur-sm border-l-4 border-[var(--lo1-gold)] p-4 shadow-lg">
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
        >
          {shortRef}
        </a>
      </div>

      {/* Show ellipsis if text before */}
      {hasTextBefore && (
        <div className="text-[var(--lo1-text-light)] mb-2">...</div>
      )}

      {/* Render paragraphs */}
      {paragraphs.map((para, index) => {
        const isFirstOfType = index === 0 || para.type !== paragraphs[index - 1].type;

        return (
          <div key={index} className={para.type === 'ra' ? 'mt-3' : 'mt-3'}>
            {/* Show Ra label when switching to Ra */}
            {para.type === 'ra' && isFirstOfType && (
              <div className="mb-1">
                <span className="text-xs font-semibold text-[var(--lo1-gold)] uppercase tracking-wide">
                  Ra
                </span>
              </div>
            )}
            <div className={`leading-relaxed ${
              para.type === 'ra'
                ? 'text-[var(--lo1-starlight)]'
                : 'text-[var(--lo1-text-light)]'
            }`}>
              {para.content}
            </div>
          </div>
        );
      })}

      {/* Show ellipsis if text after */}
      {hasTextAfter && (
        <div className="text-[var(--lo1-text-light)] mt-2">...</div>
      )}
    </div>
  );
}
