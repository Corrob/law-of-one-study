"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import FeatureCard from "./FeatureCard";
import { ChatIcon, ExploreIcon, BookIcon, SearchIcon } from "./icons";
import { getRandomQuote } from "@/data/starters";

interface Quote {
  text: string;
  reference: string;
  url: string;
}

const FEATURES = [
  {
    href: "/chat",
    icon: ChatIcon,
    title: "Seek",
    description: "Chat with AI guide",
  },
  {
    href: "/explore",
    icon: ExploreIcon,
    title: "Explore",
    description: "Explore Ra's concepts",
  },
  {
    href: "/paths",
    icon: BookIcon,
    title: "Study",
    description: "Study guided lessons",
  },
  {
    href: "/search",
    icon: SearchIcon,
    title: "Search",
    description: "Search for any quote",
  },
];

export default function Dashboard() {
  const [quote, setQuote] = useState<Quote | null>(null);

  useEffect(() => {
    // Get quote on client to avoid hydration mismatch
    // TODO: Replace with deterministic daily quote in Step 3
    setQuote(getRandomQuote());
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
      {/* Daily Quote */}
      {quote && (
        <div className="light-quote-card animate-quote-wrapper group max-w-xl mx-auto">
          <div
            className="p-5 rounded-2xl
                     border-l-4 border-[var(--lo1-gold)] bg-[var(--lo1-indigo)]/60 backdrop-blur-sm
                     shadow-lg hover:bg-[var(--lo1-indigo)]/70
                     hover:shadow-[0_0_40px_rgba(212,168,83,0.2)]
                     transition-all duration-300"
          >
            <p className="animate-quote-enter font-[family-name:var(--font-cormorant)] italic text-xl md:text-2xl text-[var(--lo1-starlight)] leading-relaxed mb-4">
              &ldquo;{quote.text}&rdquo;
            </p>
            <div className="flex items-center justify-between gap-4">
              <Link
                href={`/chat?quote=${encodeURIComponent(quote.reference)}`}
                className="animate-quote-reference text-sm text-[var(--lo1-gold)] hover:text-[var(--lo1-gold-light)] transition-colors"
              >
                Explore this &rarr;
              </Link>
              <a
                href={quote.url}
                target="_blank"
                rel="noopener noreferrer"
                className="animate-quote-reference text-[var(--lo1-stardust)] hover:text-[var(--lo1-gold)] text-sm transition-colors"
              >
                &mdash; {quote.reference}
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Feature Cards Grid */}
      <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
        {FEATURES.map((feature, index) => (
          <FeatureCard
            key={feature.href}
            href={feature.href}
            icon={feature.icon}
            title={feature.title}
            description={feature.description}
            index={index}
          />
        ))}
      </div>

      {/* Continue Studying - Placeholder for now */}
      {/* TODO: Show when user has progress in Step 5 */}
    </div>
  );
}
