'use client';

import { Quote } from '@/lib/types';
import { useQuoteAnimation } from '@/hooks/useTypingAnimation';

interface AnimatedQuoteCardProps {
  quote: Quote;
  animate?: boolean;
  onComplete?: () => void;
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

// Reconstruct text from paragraphs (for animation)
function reconstructText(paragraphs: Paragraph[], hasTextBefore: boolean, hasTextAfter: boolean): string {
  const parts: string[] = [];
  let lastType: 'questioner' | 'ra' | 'text' | null = null;

  for (const para of paragraphs) {
    // Add speaker label if type changed
    if (para.type !== lastType) {
      if (para.type === 'questioner') {
        parts.push('Questioner:');
      } else if (para.type === 'ra') {
        parts.push('Ra:');
      }
      lastType = para.type;
    }

    parts.push(para.content);
  }

  const text = parts.join(' ');
  return `${hasTextBefore ? '... ' : ''}${text}${hasTextAfter ? ' ...' : ''}`;
}

// Extract just the session.question from reference like "Ra 49.8"
function getShortReference(reference: string): string {
  const match = reference.match(/(\d+\.\d+)/);
  return match ? match[1] : reference;
}

export default function AnimatedQuoteCard({ quote, animate = true, onComplete }: AnimatedQuoteCardProps) {
  // Apply sentence range if specified using paragraph-based parsing
  let fullText = quote.text;
  if (quote.sentenceStart !== undefined && quote.sentenceEnd !== undefined) {
    const allParagraphs = parseIntoParagraphs(quote.text);
    const selectedParagraphs = filterParagraphsByRange(allParagraphs, quote.sentenceStart, quote.sentenceEnd);

    if (selectedParagraphs.length > 0) {
      const hasTextBefore = selectedParagraphs[0].sentenceStart > 1;
      const hasTextAfter = selectedParagraphs[selectedParagraphs.length - 1].sentenceEnd <
                          allParagraphs[allParagraphs.length - 1].sentenceEnd;

      fullText = reconstructText(selectedParagraphs, hasTextBefore, hasTextAfter);
    }
  }

  const { displayedText, isComplete } = useQuoteAnimation(
    animate ? fullText : '',
    { speed: 50, startDelay: 0, onComplete }
  );

  const textToShow = animate ? displayedText : fullText;
  const shortRef = getShortReference(quote.reference);

  // Format the text being displayed (works for both partial and complete text)
  const segments = formatRaText(textToShow);

  return (
    <div className="ra-quote mt-6 mb-4 rounded-lg bg-[var(--lo1-indigo)]/60 backdrop-blur-sm border-l-4 border-[var(--lo1-gold)] p-4 shadow-lg">
      {/* Header with reference number - always visible */}
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

      {/* Content area - maintain consistent spacing */}
      <div className="min-h-[1.5rem]">
        {segments.map((segment, index) => (
          <div key={index} className={segment.type === 'ra' ? 'mt-3' : ''}>
            {/* Only show Ra label, Questioner is in header */}
            {segment.type === 'ra' && (
              <div className="mb-1">
                <span className="text-xs font-semibold text-[var(--lo1-gold)] uppercase tracking-wide">
                  Ra
                </span>
              </div>
            )}
            <div className={`whitespace-pre-line leading-relaxed ${
              segment.type === 'ra'
                ? 'text-[var(--lo1-starlight)]'
                : 'text-[var(--lo1-text-light)]'
            }`}>
              {segment.content}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
