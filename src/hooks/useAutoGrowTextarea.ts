"use client";

import { useRef, useEffect, useState, RefObject } from "react";

// Tailwind sm breakpoint
const SM_BREAKPOINT = 640;

interface UseAutoGrowTextareaOptions {
  /** Max height on mobile (< 640px). Default: 220 */
  maxHeightMobile?: number;
  /** Max height on desktop (>= 640px). Default: 300 */
  maxHeightDesktop?: number;
  /** The current input value - triggers resize on change */
  value: string;
}

interface UseAutoGrowTextareaReturn {
  /** Ref to attach to the textarea */
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  /** Current max height based on viewport */
  maxHeight: number;
}

/**
 * Hook to manage auto-growing textarea behavior.
 * Handles responsive max height and auto-resize based on content.
 */
export function useAutoGrowTextarea({
  maxHeightMobile = 220,
  maxHeightDesktop = 300,
  value,
}: UseAutoGrowTextareaOptions): UseAutoGrowTextareaReturn {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [maxHeight, setMaxHeight] = useState(maxHeightDesktop);

  // Responsive max height
  useEffect(() => {
    const updateMaxHeight = () => {
      setMaxHeight(window.innerWidth < SM_BREAKPOINT ? maxHeightMobile : maxHeightDesktop);
    };
    updateMaxHeight();
    window.addEventListener("resize", updateMaxHeight);
    return () => window.removeEventListener("resize", updateMaxHeight);
  }, [maxHeightMobile, maxHeightDesktop]);

  // Auto-resize textarea based on content
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      // Reset height to auto to get accurate scrollHeight
      textarea.style.height = "auto";
      // Set to scrollHeight, capped by maxHeight via CSS
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [value, maxHeight]);

  return { textareaRef, maxHeight };
}
