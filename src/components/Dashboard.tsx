"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import FeatureCard from "./FeatureCard";
import CopyButton from "./CopyButton";
import { ChatIcon, ExploreIcon, BookIcon, SearchIcon } from "./icons";
import { getDailyQuote } from "@/lib/daily-quote";
import { formatQuoteWithAttribution } from "@/lib/quote-utils";
import { type DailyQuote } from "@/data/daily-quotes";

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
  const [quote, setQuote] = useState<DailyQuote | null>(null);

  useEffect(() => {
    // Get quote on client to avoid hydration mismatch
    // Deterministic: same quote for all users on same day
    setQuote(getDailyQuote());
  }, []);

  // Compute formatted copy text
  const copyText = useMemo(() => {
    if (!quote) return "";
    return formatQuoteWithAttribution(quote.text, quote.reference, quote.url);
  }, [quote]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
      {/* Daily Quote */}
      {quote && (
        <div className="max-w-xl mx-auto text-center space-y-3">
          {/* Header */}
          <h2 className="animate-quote-header text-sm uppercase tracking-widest text-[var(--lo1-gold)]/80">
            Daily Wisdom
          </h2>

          {/* Quote Card */}
          <div className="light-quote-card animate-quote-wrapper group">
            <div
              role="link"
              tabIndex={0}
              aria-label={`Read ${quote.reference} on lawofone.info`}
              onClick={() =>
                window.open(quote.url, "_blank", "noopener,noreferrer")
              }
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  window.open(quote.url, "_blank", "noopener,noreferrer");
                }
              }}
              className="p-5 rounded-2xl text-left
                       border-l-4 border-[var(--lo1-gold)] bg-[var(--lo1-indigo)]/60 backdrop-blur-sm
                       shadow-lg hover:bg-[var(--lo1-indigo)]/70
                       hover:shadow-[0_0_40px_rgba(212,168,83,0.2)]
                       transition-all duration-300 cursor-pointer"
            >
              <p className="animate-quote-enter font-[family-name:var(--font-cormorant)] italic text-xl md:text-2xl text-[var(--lo1-starlight)] leading-relaxed mb-4">
                &ldquo;{quote.text}&rdquo;
              </p>
              <div className="flex items-center justify-between gap-4">
                <Link
                  href={`/chat?q=${encodeURIComponent(`Help me explore "${quote.text}" from ${quote.reference}`)}`}
                  className="animate-quote-reference text-sm text-[var(--lo1-gold)] hover:text-[var(--lo1-gold-light)] transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  Explore this &rarr;
                </Link>
                <div className="flex items-center gap-2 animate-quote-reference">
                  <CopyButton textToCopy={copyText} size="md" />
                  <span className="text-[var(--lo1-stardust)] text-sm">
                    &mdash; {quote.reference}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <p className="animate-quote-footer text-xs text-[var(--lo1-stardust)]/60">
            A new reflection awaits tomorrow
          </p>
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
