"use client";

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
 * Uses CSS animations instead of framer-motion for lighter bundle.
 */
export default function MotionFadeIn({
  children,
  className,
  variant = "default",
  delay,
}: MotionFadeInProps) {
  const duration = variant === "title" ? 0.4 : 0.3;

  return (
    <div
      className={className}
      style={{
        animation: `opacity-fade-in ${duration}s ease-out ${delay ?? 0}s both`,
      }}
    >
      {children}
    </div>
  );
}
