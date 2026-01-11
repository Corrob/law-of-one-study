/**
 * Shared Framer Motion animation variants for consistent animations across the app.
 * Design philosophy: Calm, fade-only animations appropriate for contemplative content.
 */

/**
 * Simple fade animation variants.
 * Use with motion components: initial="hidden" animate="visible"
 */
export const fadeVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: "easeOut" as const,
    },
  },
};

/**
 * Fade with custom delay.
 * Usage: variants={fadeWithDelay(0.1)}
 */
export const fadeWithDelay = (delay: number) => ({
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.3,
      delay,
      ease: "easeOut" as const,
    },
  },
});

/**
 * Container variant that staggers its children.
 * Use on parent: variants={staggerContainer}
 * Use on children: variants={fadeVariants}
 */
export const staggerContainer = (staggerDelay = 0.05) => ({
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: staggerDelay,
    },
  },
});

/**
 * Child variant for use with staggerContainer.
 * Fades in with the stagger timing from parent.
 */
export const staggerChild = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: "easeOut" as const,
    },
  },
};

/**
 * Page title animation - slightly longer duration for prominence.
 */
export const titleVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.4,
      ease: "easeOut" as const,
    },
  },
};
