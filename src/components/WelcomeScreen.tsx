"use client";

import { useEffect, useState, ReactNode } from "react";
import { getRandomStarters, getRandomQuote } from "@/data/starters";
import { ThemeToggle } from "./ThemeToggle";

interface WelcomeScreenProps {
  onSelectStarter: (starter: string) => void;
  inputElement?: ReactNode;
}

export default function WelcomeScreen({ onSelectStarter, inputElement }: WelcomeScreenProps) {
  const [quote, setQuote] = useState<{ text: string; reference: string; url: string } | null>(null);
  const [starters, setStarters] = useState<string[]>([]);

  useEffect(() => {
    // Only run on client to avoid hydration mismatch
    setQuote(getRandomQuote());
    setStarters(getRandomStarters(3));
  }, []);

  return (
    <div className="flex flex-col items-center justify-center flex-1 px-4 py-8">
      {/* Welcome Quote with decorative wrapper */}
      {quote && (
        <a
          href={quote.url}
          target="_blank"
          rel="noopener noreferrer"
          className="light-quote-card animate-quote-wrapper group max-w-xl text-left mb-8 p-4 rounded-lg block
                     border-l-4 border-[var(--lo1-gold)] bg-[var(--lo1-indigo)]/60 backdrop-blur-sm
                     shadow-lg hover:bg-[var(--lo1-indigo)]/70
                     hover:shadow-[0_0_30px_rgba(212,168,83,0.15)]
                     transition-all duration-300 cursor-pointer"
        >
          <p className="animate-quote-enter font-[family-name:var(--font-cormorant)] italic text-xl md:text-2xl text-[var(--lo1-starlight)] leading-relaxed mb-3">
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
        <p className="light-explore-label text-[var(--lo1-starlight)]/70 text-sm font-medium mb-4 text-center tracking-wide animate-starter-0">
          Or explore:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {starters.map((starter, index) => (
            <button
              key={index}
              onClick={() => onSelectStarter(starter)}
              className={`starter-card light-starter-btn animate-starter-${index} p-4 rounded-2xl
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

      {/* Theme Toggle */}
      <div className="mt-6 animate-starter-0">
        <ThemeToggle />
      </div>
    </div>
  );
}
