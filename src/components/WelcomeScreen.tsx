'use client';

import { useEffect, useState } from 'react';
import { getRandomStarters, getRandomQuote } from '@/data/starters';

interface WelcomeScreenProps {
  onSelectStarter: (starter: string) => void;
}

export default function WelcomeScreen({ onSelectStarter }: WelcomeScreenProps) {
  const [quote, setQuote] = useState<{ text: string; reference: string; url: string } | null>(null);
  const [starters, setStarters] = useState<string[]>([]);

  useEffect(() => {
    // Only run on client to avoid hydration mismatch
    setQuote(getRandomQuote());
    setStarters(getRandomStarters(3));
  }, []);

  return (
    <div className="flex flex-col items-center justify-center flex-1 px-4 py-8">
      {/* Welcome Quote */}
      {quote && (
        <div className="max-w-xl text-center mb-10">
          <p className="font-[family-name:var(--font-playfair)] italic text-xl md:text-2xl text-[var(--acim-navy)] leading-relaxed mb-4">
            "{quote.text}"
          </p>
          <a
            href={quote.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--acim-text-light)] hover:text-[var(--acim-gold)] text-sm"
          >
            — {quote.reference}
          </a>
        </div>
      )}

      {/* Conversation Starters */}
      <div className="w-full max-w-2xl">
        <p className="text-[var(--acim-text-light)] text-sm mb-4 text-center">
          Try asking:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {starters.map((starter, index) => (
            <button
              key={index}
              onClick={() => onSelectStarter(starter)}
              className="p-4 rounded-xl bg-white border border-gray-200
                       hover:border-[var(--acim-gold)] hover:shadow-md
                       text-[var(--acim-text)] text-sm text-left
                       transition-all duration-200 cursor-pointer"
            >
              {starter}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
