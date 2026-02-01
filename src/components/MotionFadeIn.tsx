"use client";

import { motion } from "framer-motion";
import { titleVariants, fadeWithDelay } from "@/lib/animations";

interface MotionFadeInProps {
  children: React.ReactNode;
  className?: string;
  /** Use the title variant (slightly longer duration) */
  variant?: "title" | "default";
  /** Custom delay in seconds */
  delay?: number;
}

/**
 * Thin client wrapper for fade-in animations.
 * Use this to add framer-motion animations to server-rendered content.
 */
export default function MotionFadeIn({
  children,
  className,
  variant = "default",
  delay,
}: MotionFadeInProps) {
  const variants =
    delay !== undefined
      ? fadeWithDelay(delay)
      : variant === "title"
        ? titleVariants
        : fadeWithDelay(0);

  return (
    <motion.div
      className={className}
      variants={variants}
      initial="hidden"
      animate="visible"
    >
      {children}
    </motion.div>
  );
}
