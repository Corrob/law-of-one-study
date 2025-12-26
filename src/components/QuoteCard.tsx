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
      // Backend now handles paragraph breaks, just pass through
      segments.push({ type: currentType, content: trimmed });
    }
  }

  return segments;
}

// Extract just the session.question from reference like "Ra 49.8"
function getShortReference(reference: string): string {
  const match = reference.match(/(\d+\.\d+)/);
  return match ? match[1] : reference;
}

export default function QuoteCard({ quote }: QuoteCardProps) {
  // Backend now handles all sentence range filtering
  // We just display the text we receive
  const segments = formatRaText(quote.text);
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
          className="text-xs font-medium text-[var(--lo1-gold)} hover:text-[var(--lo1-gold-light)] hover:underline"
        >
          {shortRef}
        </a>
      </div>

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
  );
}
