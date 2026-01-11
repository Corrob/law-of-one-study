import { useEffect, useRef, RefObject } from "react";

/**
 * Hook to track scroll progress and update a progress bar element.
 * Uses requestAnimationFrame for smooth, performant updates.
 *
 * @param containerRef - Ref to the scrollable container element
 * @param resetDependency - Optional dependency that resets the progress bar when changed
 * @returns Ref to attach to the progress bar element
 *
 * @example
 * ```tsx
 * const scrollContainerRef = useRef<HTMLDivElement>(null);
 * const progressBarRef = useScrollProgress(scrollContainerRef, currentLessonIndex);
 *
 * return (
 *   <>
 *     <div ref={progressBarRef} className="h-1 bg-gold" />
 *     <div ref={scrollContainerRef} className="overflow-auto">
 *       {content}
 *     </div>
 *   </>
 * );
 * ```
 */
export function useScrollProgress<T extends HTMLElement = HTMLDivElement>(
  containerRef: RefObject<T | null>,
  resetDependency?: unknown
): RefObject<HTMLDivElement | null> {
  const progressBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const progressBar = progressBarRef.current;
    if (!container || !progressBar) return;

    let ticking = false;

    const updateProgress = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const maxScroll = scrollHeight - clientHeight;
      const progress =
        maxScroll <= 0 ? 100 : Math.min(100, Math.max(0, (scrollTop / maxScroll) * 100));
      progressBar.style.width = `${progress}%`;
      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(updateProgress);
        ticking = true;
      }
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    updateProgress(); // Initial update

    return () => container.removeEventListener("scroll", handleScroll);
  }, [containerRef, resetDependency]);

  return progressBarRef;
}
