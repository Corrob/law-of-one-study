"use client";

import { useEffect, useState, ReactNode } from "react";
import { getRandomStarters } from "@/data/starters";

// Warm, spiritual greetings (statements to complement question-style placeholders)
const GREETINGS = [
  "Welcome, seeker.",
  "In love and light.",
  "The journey continues.",
  "How may I serve?",
  "Greetings, wanderer.",
];

interface WelcomeScreenProps {
  onSelectStarter: (starter: string) => void;
  inputElement?: ReactNode;
}

export default function WelcomeScreen({ onSelectStarter, inputElement }: WelcomeScreenProps) {
  const [greeting, setGreeting] = useState<string | null>(null);
  const [starters, setStarters] = useState<string[]>([]);

  useEffect(() => {
    // Only run on client to avoid hydration mismatch
    setGreeting(GREETINGS[Math.floor(Math.random() * GREETINGS.length)]);
    setStarters(getRandomStarters(3));
  }, []);

  return (
    <div className="flex flex-col items-center justify-center flex-1 px-4 py-8">
      {/* Welcome Greeting */}
      {greeting && (
        <div className="animate-quote-wrapper text-center mb-8">
          <h1 className="animate-quote-enter font-[family-name:var(--font-cormorant)] text-3xl md:text-4xl text-[var(--lo1-starlight)]">
            {greeting}
          </h1>
        </div>
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

    </div>
  );
}
