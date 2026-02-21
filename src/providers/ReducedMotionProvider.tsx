"use client";

import { MotionConfig } from "framer-motion";

/**
 * Tells Framer Motion to respect the user's OS-level
 * prefers-reduced-motion setting. When enabled, all framer-motion
 * animations are instantly resolved (no movement).
 */
export default function ReducedMotionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
