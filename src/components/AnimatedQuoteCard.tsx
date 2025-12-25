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
  // Split on period followed by space or newline, question mark, or exclamation
  // But preserve decimal numbers and common abbreviations
  const sentences: string[] = [];
  const parts = text.split(/(?<=[.!?])\s+/);

  for (const part of parts) {
    if (part.trim()) {
      sentences.push(part.trim());
    }
  }

  return sentences;
}

// Find paragraph boundaries and expand sentence range to include full paragraphs
function expandToParagraphBoundaries(text: string, sentenceStart: number, sentenceEnd: number): { start: number; end: number } {
  const sentences = splitIntoSentences(text);

  // Split text into paragraphs (by double newline or speaker changes)
  const paragraphDelimiters: number[] = [0]; // Start of text
  const lines = text.split('\n');
  let charCount = 0;

  for (let i = 0; i < lines.length; i++) {
    if (i > 0 && (lines[i-1].trim() === '' || lines[i].match(/^(Questioner:|Ra:)/))) {
      paragraphDelimiters.push(charCount);
    }
    charCount += lines[i].length + 1; // +1 for newline
  }
  paragraphDelimiters.push(text.length); // End of text

  // Map sentences to character positions
  const sentencePositions: { start: number; end: number }[] = [];
  let searchPos = 0;
  for (const sentence of sentences) {
    const start = text.indexOf(sentence, searchPos);
    if (start !== -1) {
      sentencePositions.push({ start, end: start + sentence.length });
      searchPos = start + sentence.length;
    }
  }

  // Find which paragraph contains the start sentence
  const startSentencePos = sentencePositions[sentenceStart - 1]?.start ?? 0;
  const endSentencePos = sentencePositions[Math.min(sentenceEnd - 1, sentences.length - 1)]?.end ?? text.length;

  // Find paragraph containing start sentence
  let paragraphStart = 0;
  for (let i = paragraphDelimiters.length - 1; i >= 0; i--) {
    if (paragraphDelimiters[i] <= startSentencePos) {
      paragraphStart = paragraphDelimiters[i];
      break;
    }
  }

  // Find paragraph containing end sentence
  let paragraphEnd = text.length;
  for (let i = 0; i < paragraphDelimiters.length; i++) {
    if (paragraphDelimiters[i] >= endSentencePos) {
      paragraphEnd = paragraphDelimiters[i];
      break;
    }
  }

  // Convert back to sentence indices
  let newStart = 1;
  for (let i = 0; i < sentencePositions.length; i++) {
    if (sentencePositions[i].start >= paragraphStart) {
      newStart = i + 1;
      break;
    }
  }

  let newEnd = sentences.length;
  for (let i = sentencePositions.length - 1; i >= 0; i--) {
    if (sentencePositions[i].end <= paragraphEnd) {
      newEnd = i + 1;
      break;
    }
  }

  return { start: newStart, end: newEnd };
}

// Extract just the session.question from reference like "Ra 49.8"
function getShortReference(reference: string): string {
  const match = reference.match(/(\d+\.\d+)/);
  return match ? match[1] : reference;
}

export default function AnimatedQuoteCard({ quote, animate = true, onComplete }: AnimatedQuoteCardProps) {
  // Apply sentence range if specified
  let fullText = quote.text;
  if (quote.sentenceStart !== undefined && quote.sentenceEnd !== undefined) {
    const sentences = splitIntoSentences(quote.text);

    // Expand to paragraph boundaries
    const expanded = expandToParagraphBoundaries(quote.text, quote.sentenceStart, quote.sentenceEnd);

    // Convert from 1-indexed to 0-indexed and extract range
    const start = Math.max(0, expanded.start - 1);
    const end = Math.min(sentences.length, expanded.end);
    const selectedSentences = sentences.slice(start, end);

    const hasTextBefore = expanded.start > 1;
    const hasTextAfter = expanded.end < sentences.length;

    const excerpt = selectedSentences.join(' ');
    fullText = `${hasTextBefore ? '... ' : ''}${excerpt}${hasTextAfter ? ' ...' : ''}`;
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
