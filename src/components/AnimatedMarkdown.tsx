"use client";

import { useState, useEffect, useRef } from "react";
import ReactMarkdown, { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface AnimatedMarkdownProps {
  content: string;
  onComplete: () => void;
  speed?: number; // ms delay before showing content
}

export default function AnimatedMarkdown({ content, onComplete, speed = 50 }: AnimatedMarkdownProps) {
  const reducedMotion = useReducedMotion();
  const [isVisible, setIsVisible] = useState(false);
  const hasCompletedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);

  // Keep onComplete ref updated
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    // Reset state for new content
    hasCompletedRef.current = false;
    setIsVisible(false);

    if (!content) {
      // Empty content - complete immediately
      onCompleteRef.current();
      return;
    }

    // Skip animation for reduced motion — show immediately
    if (reducedMotion) {
      setIsVisible(true);
      if (!hasCompletedRef.current) {
        hasCompletedRef.current = true;
        onCompleteRef.current();
      }
      return;
    }

    // Small delay before showing, then fade in
    const showTimeout = setTimeout(() => {
      setIsVisible(true);
    }, speed);

    // Complete after fade-in transition
    const completeTimeout = setTimeout(() => {
      if (!hasCompletedRef.current) {
        hasCompletedRef.current = true;
        onCompleteRef.current();
      }
    }, speed + 300); // 300ms for fade transition

    return () => {
      clearTimeout(showTimeout);
      clearTimeout(completeTimeout);
    };
  }, [content, speed, reducedMotion]);

  // Custom components with consistent styling
  const markdownComponents: Components = {
    p: ({ children, ...props }) => (
      <p className="mb-3 last:mb-0" {...props}>{children}</p>
    ),
    ul: ({ children, ...props }) => (
      <ul className="list-disc list-outside mb-3 space-y-2 pl-5" {...props}>{children}</ul>
    ),
    ol: ({ children, ...props }) => (
      <ol className="list-decimal list-outside mb-3 space-y-2 pl-5" {...props}>{children}</ol>
    ),
    li: ({ children, ...props }) => (
      <li {...props}>{children}</li>
    ),
    strong: ({ children, ...props }) => (
      <strong className="font-semibold text-[var(--lo1-starlight)]" {...props}>{children}</strong>
    ),
    em: ({ children, ...props }) => (
      <em className="italic" {...props}>{children}</em>
    ),
  };

  return (
    <div
      style={{
        opacity: isVisible ? 1 : 0,
        transition: "opacity 300ms ease-in",
      }}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
