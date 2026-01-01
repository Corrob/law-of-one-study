"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { roadmapFeatures } from "@/data/roadmapFeatures";
import { Feature, VoteData } from "@/types/roadmap";

// Spiral/Unity icon
function UnityIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
    >
      <path
        d="M50 20
           C70 20, 80 35, 80 50
           C80 65, 65 75, 50 75
           C35 75, 25 62, 25 50
           C25 38, 35 30, 50 30
           C60 30, 68 40, 68 50
           C68 60, 58 67, 50 67
           C42 67, 35 58, 35 50
           C35 42, 43 37, 50 37"
        strokeLinecap="round"
      />
      <circle cx="50" cy="50" r="4" fill="currentColor" stroke="none" />
    </svg>
  );
}

// Star rating display
function StarRating({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`w-4 h-4 ${star <= value ? "text-[var(--lo1-gold)]" : "text-[var(--lo1-celestial)]/30"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

// Feature card component
function FeatureCard({
  feature,
  hasVoted,
  onVote,
}: {
  feature: Feature & { votes: number };
  hasVoted: boolean;
  onVote: () => void;
}) {
  const complexityColors = {
    Low: "text-green-400",
    "Low-Medium": "text-green-300",
    Medium: "text-yellow-400",
    "Medium-High": "text-orange-400",
    High: "text-orange-500",
  };

  const statusInfo = {
    planned: { label: "Planned", color: "text-[var(--lo1-stardust)]" },
    "in-progress": { label: "In Progress", color: "text-blue-400" },
    shipped: { label: "Shipped", color: "text-green-400" },
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-[var(--lo1-indigo)]/40 backdrop-blur-sm border border-[var(--lo1-celestial)]/40 rounded-2xl p-6 hover:border-[var(--lo1-gold)]/40 hover:shadow-[0_0_30px_rgba(212,168,83,0.1)] transition-all duration-300"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            {/* Priority Badge */}
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--lo1-gold)]/20 text-[var(--lo1-gold)] font-bold text-sm flex-shrink-0">
              {feature.priority}
            </div>
            <h3 className="text-xl font-semibold text-[var(--lo1-starlight)]">{feature.title}</h3>
            <span
              className={`text-xs px-2 py-1 rounded-full ${statusInfo[feature.status].color} bg-[var(--lo1-indigo)]/60 flex-shrink-0`}
            >
              {statusInfo[feature.status].label}
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm flex-wrap">
            <StarRating value={feature.userValue} />
            <span className="text-[var(--lo1-stardust)]">•</span>
            <span className={complexityColors[feature.complexity]}>{feature.complexity}</span>
          </div>
        </div>

        {/* Vote button */}
        <button
          onClick={onVote}
          disabled={feature.status === "shipped"}
          className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-200 flex-shrink-0 ${
            hasVoted
              ? "bg-[var(--lo1-gold)]/20 border-2 border-[var(--lo1-gold)] text-[var(--lo1-gold)]"
              : "bg-[var(--lo1-indigo)]/60 border-2 border-[var(--lo1-celestial)]/40 text-[var(--lo1-celestial)] hover:border-[var(--lo1-gold)]/60 hover:text-[var(--lo1-gold)]"
          } ${feature.status === "shipped" ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
          </svg>
          <span className="text-xs font-semibold">{feature.votes}</span>
        </button>
      </div>

      {/* Description */}
      <p className="text-[var(--lo1-stardust)] leading-relaxed mb-4">{feature.description}</p>

      {/* Features list */}
      <ul className="space-y-2">
        {feature.features.map((item, index) => (
          <li key={index} className="flex items-start gap-2 text-sm">
            <span className="text-[var(--lo1-gold)] mt-1 flex-shrink-0">•</span>
            <span className="text-[var(--lo1-celestial)]">{item}</span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

export default function RoadmapPage() {
  const [features, setFeatures] = useState(roadmapFeatures);
  const [votes, setVotes] = useState<VoteData>({});
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"priority" | "votes" | "value">("priority");

  // Load votes from localStorage on mount
  useEffect(() => {
    const storedVotes = localStorage.getItem("roadmap-votes");
    if (storedVotes) {
      const parsedVotes: VoteData = JSON.parse(storedVotes);
      setVotes(parsedVotes);
    }

    // Load global vote counts from localStorage
    const storedCounts = localStorage.getItem("roadmap-vote-counts");
    if (storedCounts) {
      const counts: Record<string, number> = JSON.parse(storedCounts);
      setFeatures((prevFeatures) =>
        prevFeatures.map((f) => ({
          ...f,
          votes: counts[f.id] || 0,
        }))
      );
    }
  }, []);

  const handleVote = (featureId: string) => {
    const hasVoted = votes[featureId];

    const newVotes = {
      ...votes,
      [featureId]: !hasVoted,
    };

    setVotes(newVotes);
    localStorage.setItem("roadmap-votes", JSON.stringify(newVotes));

    // Update vote count
    setFeatures((prevFeatures) =>
      prevFeatures.map((f) => {
        if (f.id === featureId) {
          const newCount = hasVoted ? f.votes - 1 : f.votes + 1;
          return { ...f, votes: newCount };
        }
        return f;
      })
    );

    // Store updated counts
    const updatedCounts = features.reduce(
      (acc, f) => {
        if (f.id === featureId) {
          acc[f.id] = hasVoted ? f.votes - 1 : f.votes + 1;
        } else {
          acc[f.id] = f.votes;
        }
        return acc;
      },
      {} as Record<string, number>
    );
    localStorage.setItem("roadmap-vote-counts", JSON.stringify(updatedCounts));
  };

  // Filter and sort features
  const filteredFeatures = features
    .filter((f) => selectedCategory === "all" || f.category === selectedCategory)
    .sort((a, b) => {
      if (sortBy === "priority") return a.priority - b.priority; // Lower number = higher priority
      if (sortBy === "votes") return b.votes - a.votes;
      if (sortBy === "value") return b.userValue - a.userValue;
      return 0;
    });

  const categories = ["all", "foundation", "study-tools", "content", "immersive"];

  return (
    <main className="min-h-dvh flex flex-col cosmic-bg relative">
      {/* Header */}
      <header className="relative z-10 bg-[var(--lo1-indigo)]/80 backdrop-blur-sm text-white py-4 px-6 border-b border-[var(--lo1-gold)]/20">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-[var(--lo1-gold)] hover:text-[var(--lo1-gold)]/80 transition-colors text-sm group"
          >
            <svg
              className="w-4 h-4 group-hover:-translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Study Companion
          </Link>
          <div className="flex items-center gap-2">
            <UnityIcon className="w-6 h-6 text-[var(--lo1-gold)] starburst" />
            <span className="text-xs text-[var(--lo1-stardust)] hidden sm:inline">Roadmap</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-auto relative z-10 py-12 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Page Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-[family-name:var(--font-cormorant)] text-[var(--lo1-starlight)] mb-4">
              Product Roadmap
            </h1>
            <p className="text-[var(--lo1-stardust)] text-lg max-w-2xl mx-auto mb-6">
              Help us prioritize features by voting for what matters most to you. Your input shapes
              the future of this tool.
            </p>

            {/* Instructions */}
            <div className="inline-flex items-center gap-2 bg-[var(--lo1-indigo)]/60 border border-[var(--lo1-gold)]/30 rounded-full px-6 py-3 text-sm text-[var(--lo1-gold)]">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
              </svg>
              Click the thumbs up to vote for features you want most
            </div>
          </div>

          {/* Filters and Sort */}
          <div className="mb-8 flex flex-wrap gap-4 items-center justify-between bg-[var(--lo1-indigo)]/40 border border-[var(--lo1-celestial)]/40 rounded-2xl p-6">
            {/* Category Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-[var(--lo1-stardust)] font-medium">Category:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 rounded-lg text-sm bg-[var(--lo1-indigo)]/60 text-[var(--lo1-celestial)] border border-[var(--lo1-celestial)]/30 hover:border-[var(--lo1-gold)]/50 focus:border-[var(--lo1-gold)] focus:outline-none"
              >
                <option value="all">All Categories</option>
                <option value="foundation">Foundation</option>
                <option value="study-tools">Study Tools</option>
                <option value="content">Content</option>
                <option value="immersive">Immersive</option>
              </select>
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-[var(--lo1-stardust)] font-medium">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "priority" | "votes" | "value")}
                className="px-3 py-2 rounded-lg text-sm bg-[var(--lo1-indigo)]/60 text-[var(--lo1-celestial)] border border-[var(--lo1-celestial)]/30 hover:border-[var(--lo1-gold)]/50 focus:border-[var(--lo1-gold)] focus:outline-none"
              >
                <option value="priority">Priority (Default)</option>
                <option value="votes">Most Votes</option>
                <option value="value">User Value</option>
              </select>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <AnimatePresence mode="popLayout">
              {filteredFeatures.map((feature) => (
                <FeatureCard
                  key={feature.id}
                  feature={feature}
                  hasVoted={!!votes[feature.id]}
                  onVote={() => handleVote(feature.id)}
                />
              ))}
            </AnimatePresence>
          </div>

          {/* Footer CTA */}
          <div className="text-center py-8 border-t border-[var(--lo1-gold)]/20">
            <h2 className="text-2xl font-[family-name:var(--font-cormorant)] text-[var(--lo1-gold)] mb-4">
              Have an idea we haven't thought of?
            </h2>
            <p className="text-[var(--lo1-stardust)] mb-6 max-w-2xl mx-auto">
              We'd love to hear your suggestions! Submit a feature request on GitHub or join the
              discussion.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <a
                href="https://github.com/Corrob/law-of-one-study/issues/new?labels=feature-request&template=feature_request.md"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--lo1-gold)]/10 border border-[var(--lo1-gold)]/30 rounded-lg text-[var(--lo1-gold)] hover:bg-[var(--lo1-gold)]/20 hover:border-[var(--lo1-gold)]/50 transition-all duration-200"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path
                    fillRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    clipRule="evenodd"
                  />
                </svg>
                Submit Feature Request
              </a>
              <Link
                href="/support"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--lo1-indigo)]/60 border border-[var(--lo1-celestial)]/40 rounded-lg text-[var(--lo1-celestial)] hover:border-[var(--lo1-gold)]/50 hover:text-[var(--lo1-gold)] transition-all duration-200"
              >
                Learn More About This Tool
              </Link>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-12 p-6 bg-[var(--lo1-indigo)]/40 border border-[var(--lo1-celestial)]/40 rounded-2xl">
            <h3 className="text-lg font-semibold text-[var(--lo1-starlight)] mb-4">Legend</h3>
            <div className="grid sm:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-[var(--lo1-gold)] font-medium mb-2">Priority Number</p>
                <p className="text-[var(--lo1-stardust)]">
                  Lower numbers = higher priority. Priority 1 is the most important feature.
                </p>
              </div>
              <div>
                <p className="text-[var(--lo1-gold)] font-medium mb-2">User Value (Stars)</p>
                <p className="text-[var(--lo1-stardust)]">
                  How valuable this feature is to students of the Ra Material (1-5 stars)
                </p>
              </div>
              <div>
                <p className="text-[var(--lo1-gold)] font-medium mb-2">Complexity</p>
                <p className="text-[var(--lo1-stardust)]">
                  How much time and resources required to build this feature
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
