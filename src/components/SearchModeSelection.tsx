"use client";

import { motion } from "framer-motion";
import type { SearchMode } from "@/lib/schemas";

interface SearchModeSelectionProps {
  onSelectMode: (mode: SearchMode) => void;
}

const cardVariants = {
  hidden: { opacity: 0 },
  visible: (i: number) => ({
    opacity: 1,
    transition: {
      delay: 0.1 + i * 0.1,
      duration: 0.4,
      ease: "easeOut" as const,
    },
  }),
};

const titleVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: "easeOut" as const,
    },
  },
};

export default function SearchModeSelection({ onSelectMode }: SearchModeSelectionProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 pb-16">
      <motion.h2
        variants={titleVariants}
        initial="hidden"
        animate="visible"
        className="font-[family-name:var(--font-cormorant)] text-2xl md:text-3xl text-[var(--lo1-starlight)] mb-8 text-center"
      >
        How would you like to search?
      </motion.h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl w-full">
        {/* Sentence Search Card */}
        <motion.button
          custom={0}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          onClick={() => onSelectMode("sentence")}
          className="flex flex-col items-center p-6 rounded-xl
                     bg-[var(--lo1-indigo)]/50 border border-[var(--lo1-celestial)]/20
                     hover:border-[var(--lo1-gold)]/40 hover:bg-[var(--lo1-indigo)]/70
                     transition-all duration-300 cursor-pointer text-center group"
        >
          <svg
            className="w-8 h-8 text-[var(--lo1-gold)] mb-3 group-hover:scale-110 transition-transform"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
            />
          </svg>
          <h3 className="font-[family-name:var(--font-cormorant)] text-xl text-[var(--lo1-starlight)] mb-2">
            Sentence Search
          </h3>
          <p className="text-sm text-[var(--lo1-stardust)]">
            Find quotes you already know
          </p>
        </motion.button>

        {/* Passage Search Card */}
        <motion.button
          custom={1}
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          onClick={() => onSelectMode("passage")}
          className="flex flex-col items-center p-6 rounded-xl
                     bg-[var(--lo1-indigo)]/50 border border-[var(--lo1-celestial)]/20
                     hover:border-[var(--lo1-gold)]/40 hover:bg-[var(--lo1-indigo)]/70
                     transition-all duration-300 cursor-pointer text-center group"
        >
          <svg
            className="w-8 h-8 text-[var(--lo1-gold)] mb-3 group-hover:scale-110 transition-transform"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
          <h3 className="font-[family-name:var(--font-cormorant)] text-xl text-[var(--lo1-starlight)] mb-2">
            Passage Search
          </h3>
          <p className="text-sm text-[var(--lo1-stardust)]">
            Discover quotes by concept
          </p>
        </motion.button>
      </div>
    </div>
  );
}
