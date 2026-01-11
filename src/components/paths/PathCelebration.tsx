"use client";

import { memo, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import type { StudyPath } from "@/lib/schemas/study-paths";

interface PathCelebrationProps {
  path: StudyPath;
  onClose: () => void;
}

/**
 * Generates random particles for the celebration effect.
 */
function generateParticles(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100, // percentage position
    delay: Math.random() * 2,
    duration: 3 + Math.random() * 2,
    size: 4 + Math.random() * 8,
  }));
}

/**
 * Full-screen celebration overlay when a study path is completed.
 * Features animated starburst, floating particles, and staggered text.
 */
const PathCelebration = memo(function PathCelebration({
  path,
  onClose,
}: PathCelebrationProps) {
  const [particles] = useState(() => generateParticles(20));
  const [isVisible, setIsVisible] = useState(false);

  // Trigger entrance animation
  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-[var(--lo1-space)]/95 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Starburst effect */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="absolute w-[500px] h-[500px] rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(212,175,55,0.3) 0%, rgba(212,175,55,0.1) 40%, transparent 70%)",
            }}
          />

          {/* Secondary glow pulse */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: [0.8, 1.2, 1], opacity: [0, 0.5, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
            className="absolute w-[300px] h-[300px] rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(212,175,55,0.4) 0%, transparent 60%)",
            }}
          />

          {/* Floating particles */}
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: -400, opacity: [0, 1, 1, 0] }}
              transition={{
                duration: particle.duration,
                delay: particle.delay,
                repeat: Infinity,
                ease: "easeOut",
              }}
              className="absolute rounded-full bg-[var(--lo1-gold)]"
              style={{
                left: `${particle.x}%`,
                bottom: "30%",
                width: particle.size,
                height: particle.size,
                boxShadow: "0 0 10px rgba(212,175,55,0.5)",
              }}
            />
          ))}

          {/* Content */}
          <div className="relative z-10 text-center px-6 max-w-lg">
            {/* Checkmark icon */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.3, duration: 0.5, type: "spring" }}
              className="w-20 h-20 mx-auto mb-6 rounded-full bg-[var(--lo1-gold)] flex items-center justify-center"
            >
              <svg
                className="w-10 h-10 text-[var(--lo1-space)]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <motion.path
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </motion.div>

            {/* Title */}
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="text-3xl font-semibold text-[var(--lo1-starlight)] mb-2"
            >
              Path Complete!
            </motion.h2>

            {/* Path name */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="text-lg text-[var(--lo1-gold)] mb-6"
            >
              {path.title}
            </motion.p>

            {/* Completion reflection */}
            {path.completionReflection && (
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.5 }}
                className="text-[var(--lo1-text-light)]/80 mb-8 leading-relaxed"
              >
                {path.completionReflection}
              </motion.p>
            )}

            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.5 }}
            >
              <Link
                href="/paths"
                onClick={onClose}
                className="inline-block px-8 py-3 rounded-lg font-medium bg-[var(--lo1-gold)] text-[var(--lo1-space)] hover:bg-[var(--lo1-gold-light)] transition-colors cursor-pointer"
              >
                Explore More Paths
              </Link>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

export default PathCelebration;
