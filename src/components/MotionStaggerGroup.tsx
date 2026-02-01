"use client";

import { motion } from "framer-motion";
import { staggerContainer, staggerChild } from "@/lib/animations";

interface MotionStaggerGroupProps {
  children: React.ReactNode;
  className?: string;
  /** Delay between each child animation */
  staggerDelay?: number;
}

interface MotionStaggerItemProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Client wrapper for staggered child animations.
 * Wrap the parent in MotionStaggerGroup and each child in MotionStaggerItem.
 */
export function MotionStaggerGroup({
  children,
  className,
  staggerDelay = 0.1,
}: MotionStaggerGroupProps) {
  return (
    <motion.div
      className={className}
      variants={staggerContainer(staggerDelay)}
      initial="hidden"
      animate="visible"
    >
      {children}
    </motion.div>
  );
}

export function MotionStaggerItem({ children, className }: MotionStaggerItemProps) {
  return (
    <motion.div variants={staggerChild} className={className}>
      {children}
    </motion.div>
  );
}
