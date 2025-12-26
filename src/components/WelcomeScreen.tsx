"use client";

import { useEffect, useState, ReactNode } from "react";
import { getRandomStarters, getRandomQuote } from "@/data/starters";
import { useSearchMode } from "@/contexts/SearchModeContext";

interface WelcomeScreenProps {
  onSelectStarter: (starter: string) => void;
  inputElement?: ReactNode;
}

export default function WelcomeScreen({ onSelectStarter, inputElement }: WelcomeScreenProps) {
  const [quote, setQuote] = useState<{ text: string; reference: string; url: string } | null>(null);
  const [starters, setStarters] = useState<string[]>([]);
  const { setMode } = useSearchMode();

  useEffect(() => {
    // Only run on client to avoid hydration mismatch
    setQuote(getRandomQuote());
    setStarters(getRandomStarters(3));
  }, []);

  const handleQuoteSearchStarter = (searchTerm: string) => {
    setMode("quote");
    onSelectStarter(searchTerm);
  };

  return (
    <div className="flex flex-col items-center justify-center flex-1 px-4 py-8">
      {/* Welcome Quote with decorative wrapper */}
      {quote && (
        <a
          href={quote.url}
          target="_blank"
          rel="noopener noreferrer"
          className="animate-quote-wrapper group relative max-w-xl text-center mb-8 p-6 rounded-2xl block
                     border border-[var(--lo1-gold)]/20 bg-[var(--lo1-indigo)]/30
                     hover:border-[var(--lo1-gold)]/40 hover:bg-[var(--lo1-indigo)]/40
                     hover:shadow-[0_0_30px_rgba(212,168,83,0.15)]
                     transition-all duration-300 cursor-pointer"
        >
          {/* Corner flourishes */}
          <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-[var(--lo1-gold)]/40 rounded-tl-xl transition-colors duration-300 group-hover:border-[var(--lo1-gold)]/60" />
          <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-[var(--lo1-gold)]/40 rounded-br-xl transition-colors duration-300 group-hover:border-[var(--lo1-gold)]/60" />

          <p className="animate-quote-enter font-[family-name:var(--font-cormorant)] italic text-xl md:text-2xl text-[var(--lo1-starlight)] leading-relaxed mb-4">
            &ldquo;{quote.text}&rdquo;
          </p>
          <span className="animate-quote-reference inline-block text-[var(--lo1-stardust)] group-hover:text-[var(--lo1-gold)] text-sm transition-colors">
            — {quote.reference}
          </span>
        </a>
      )}

      {/* Input slot with ambient glow */}
      {inputElement && (
        <div className="relative w-full max-w-lg mb-10 animate-input-enter">
          <div className="welcome-input-glow" />
          {inputElement}
        </div>
      )}

      {/* Conversation Starters */}
      <div className="w-full max-w-2xl">
        <p className="text-[var(--lo1-starlight)]/70 text-sm font-medium mb-4 text-center tracking-wide animate-starter-0">
          Or explore:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
          {starters.map((starter, index) => (
            <button
              key={index}
              onClick={() => onSelectStarter(starter)}
              className={`starter-card animate-starter-${index} p-4 rounded-2xl
                       bg-[var(--lo1-indigo)]/60 backdrop-blur-sm
                       border border-[var(--lo1-celestial)]/40
                       shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]
                       hover:border-[var(--lo1-gold)]/60 hover:bg-[var(--lo1-indigo)]/80
                       hover:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),0_0_20px_rgba(212,168,83,0.1)]
                       text-[var(--lo1-text-light)] text-sm text-left
                       transition-all duration-200 cursor-pointer`}
            >
              {starter}
            </button>
          ))}
        </div>

        {/* Quote Search Starter - Distinctive styling */}
        <button
          onClick={() => handleQuoteSearchStarter("wanderer")}
          className="w-full p-4 rounded-2xl animate-starter-0
                   bg-gradient-to-r from-[var(--lo1-gold)]/10 to-[var(--lo1-gold)]/5
                   border border-[var(--lo1-gold)]/40
                   shadow-[inset_0_1px_0_0_rgba(212,168,83,0.1)]
                   hover:border-[var(--lo1-gold)]/60 hover:from-[var(--lo1-gold)]/15 hover:to-[var(--lo1-gold)]/8
                   hover:shadow-[inset_0_1px_0_0_rgba(212,168,83,0.15),0_0_25px_rgba(212,168,83,0.15)]
                   transition-all duration-200 cursor-pointer
                   group"
        >
          <div className="flex items-center justify-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-4 h-4 text-[var(--lo1-gold)] group-hover:scale-110 transition-transform"
            >
              <path
                fillRule="evenodd"
                d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-[var(--lo1-gold)] text-sm font-medium">
              Try Quote Search: &ldquo;wanderer&rdquo;
            </span>
          </div>
        </button>
      </div>

      {/* Disclaimer */}
      <div className="w-full max-w-2xl mt-8 animate-starter-0">
        <p className="text-[var(--lo1-stardust)]/60 text-xs text-center leading-relaxed">
          This AI companion provides helpful explanations, but only the highlighted quote cards
          contain authentic passages from the Ra Material.{" "}
          <a
            href="/support"
            className="text-[var(--lo1-gold)]/70 hover:text-[var(--lo1-gold)] underline transition-colors"
          >
            Learn more
          </a>
        </p>
      </div>
    </div>
  );
}
