"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const STORAGE_KEY = "lo1-onboarded";

// Staggered entrance animation variants
const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.4, ease: "easeOut" as const },
  },
};

function InfinityIcon({ className }: { className?: string }) {
  // Twinkle animation for stars with staggered delays
  const getTwinkleTransition = (delay: number) => ({
    duration: 2,
    repeat: Infinity,
    ease: "easeInOut" as const,
    delay,
  });

  const twinkleAnimate = {
    opacity: [0.4, 1, 0.4],
    scale: [0.8, 1.2, 0.8],
  };

  return (
    <svg viewBox="0 0 80 32" className={className} fill="none">
      {/* Infinity symbol */}
      <path
        d="M20 16c0-6 4.5-10 10-10s10 4 10 10-4.5 10-10 10-10-4-10-10z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M40 16c0-6 4.5-10 10-10s10 4 10 10-4.5 10-10 10-10-4-10-10z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Twinkling stars */}
      <motion.circle
        cx="8" cy="8" r="1.5" fill="currentColor"
        animate={twinkleAnimate}
        transition={getTwinkleTransition(0)}
      />
      <motion.circle
        cx="72" cy="8" r="1.5" fill="currentColor"
        animate={twinkleAnimate}
        transition={getTwinkleTransition(0.5)}
      />
      <motion.circle
        cx="40" cy="4" r="1" fill="currentColor"
        animate={twinkleAnimate}
        transition={getTwinkleTransition(1)}
      />
      <motion.circle
        cx="12" cy="24" r="1" fill="currentColor"
        animate={twinkleAnimate}
        transition={getTwinkleTransition(1.5)}
      />
      <motion.circle
        cx="68" cy="24" r="1" fill="currentColor"
        animate={twinkleAnimate}
        transition={getTwinkleTransition(0.8)}
      />
    </svg>
  );
}

export default function OnboardingModal() {
  const [isOpen, setIsOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  const handleDismiss = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, "true");
    setIsOpen(false);
  }, []);

  // Check localStorage on mount (with 300ms delay)
  useEffect(() => {
    const hasOnboarded = localStorage.getItem(STORAGE_KEY);
    if (!hasOnboarded) {
      const timer = setTimeout(() => setIsOpen(true), 300);
      return () => clearTimeout(timer);
    }
  }, []);

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleDismiss();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, handleDismiss]);

  // Focus trap
  useEffect(() => {
    if (!isOpen) return;

    const modal = modalRef.current;
    if (!modal) return;

    const focusableSelector =
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      const focusableElements =
        modal.querySelectorAll<HTMLElement>(focusableSelector);
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);


  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={handleDismiss}
        >
          <motion.div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="onboarding-title"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="relative bg-[var(--lo1-indigo)] border border-[var(--lo1-celestial)]/30 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* X Close Button */}
            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 p-2 text-[var(--lo1-stardust)] hover:text-[var(--lo1-starlight)] transition-colors rounded-lg hover:bg-white/5 cursor-pointer"
              aria-label="Close"
            >
              <svg
                viewBox="0 0 24 24"
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>

            {/* Staggered content container */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {/* Icon with glow pulse */}
              <motion.div
                variants={itemVariants}
                className="flex justify-center mb-6"
              >
                <motion.div
                  animate={{
                    filter: [
                      "drop-shadow(0 0 8px rgba(212,168,83,0.3))",
                      "drop-shadow(0 0 16px rgba(212,168,83,0.6))",
                      "drop-shadow(0 0 8px rgba(212,168,83,0.3))",
                    ],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <InfinityIcon className="w-20 h-8 text-[var(--lo1-gold)]" />
                </motion.div>
              </motion.div>

              <motion.h2
                variants={itemVariants}
                id="onboarding-title"
                className="font-[family-name:var(--font-cormorant)] text-2xl text-[var(--lo1-starlight)] mb-8 text-center"
              >
                Welcome, seeker.
              </motion.h2>

              <motion.div
                variants={itemVariants}
                className="text-[var(--lo1-text-light)] space-y-5 mb-8 leading-relaxed"
              >
                <p>
                  I&apos;m an AI companion for exploring the Ra Material. I can
                  search across all 106 sessions, surface relevant quotes, and
                  help you understand concepts like density, catalyst, and the Law
                  of One.
                </p>
                <p>
                  I&apos;m a tool, not an oracle &mdash; I can occasionally
                  misunderstand or oversimplify. Take what resonates. Leave what
                  doesn&apos;t. Your discernment is the only authority here.
                </p>
              </motion.div>

              <motion.button
                variants={itemVariants}
                onClick={handleDismiss}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3 px-6 rounded-xl bg-[var(--lo1-gold)] text-[var(--lo1-deep-space)] font-medium hover:bg-[var(--lo1-gold-light)] hover:shadow-[0_0_24px_rgba(212,168,83,0.5)] transition-all duration-200 cursor-pointer"
              >
                Begin Exploring
              </motion.button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
