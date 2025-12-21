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

// Extract just the session.question from reference like "Ra 49.8"
function getShortReference(reference: string): string {
  const match = reference.match(/(\d+\.\d+)/);
  return match ? match[1] : reference;
}

export default function AnimatedQuoteCard({ quote, animate = true, onComplete }: AnimatedQuoteCardProps) {
  const { displayedText, isComplete } = useQuoteAnimation(
    animate ? quote.text : '',
    { speed: 50, startDelay: 0, onComplete }
  );

  const textToShow = animate ? displayedText : quote.text;
  const showMeta = !animate || isComplete;
  const shortRef = getShortReference(quote.reference);

  // Format the text being displayed (works for both partial and complete text)
  const segments = formatRaText(textToShow);

  return (
    <div className="ra-quote my-4 rounded-lg bg-[var(--acim-bg)] border-l-4 border-[var(--acim-gold)] p-4">
      {segments.length === 0 ? (
        // Show placeholder while waiting for first character
        <div className="h-6" />
      ) : (
        segments.map((segment, index) => (
          <div key={index} className={segment.type !== 'text' && index > 0 ? 'mt-3' : ''}>
            {segment.type === 'questioner' && (
              <div className="mb-1">
                <span className="text-xs font-semibold text-[var(--acim-text-light)] uppercase tracking-wide">
                  Questioner
                </span>
              </div>
            )}
            {segment.type === 'ra' && (
              <div className="mb-1">
                <span className="text-xs font-semibold text-[var(--acim-gold)] uppercase tracking-wide">
                  Ra
                </span>
              </div>
            )}
            <div className={`leading-relaxed whitespace-pre-line ${
              segment.type === 'ra'
                ? 'text-[var(--acim-text)] font-[family-name:var(--font-playfair)] italic'
                : 'text-[var(--acim-text-light)]'
            }`}>
              {segment.content}
            </div>
          </div>
        ))
      )}
      {showMeta && (
        <div className="mt-3 text-right animate-fade-in">
          <a
            href={quote.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-[var(--acim-gold)] hover:text-[var(--acim-gold-light)] hover:underline"
          >
            {shortRef}
          </a>
        </div>
      )}
    </div>
  );
}
