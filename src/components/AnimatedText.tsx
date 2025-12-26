"use client";

import { useState, useEffect, useRef } from "react";

interface AnimatedTextProps {
  content: string;
  onComplete: () => void;
  speed?: number; // ms per word
}

export default function AnimatedText({ content, onComplete, speed = 50 }: AnimatedTextProps) {
  const [visibleCount, setVisibleCount] = useState(0);
  const hasCompletedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);

  // Keep onComplete ref updated
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    // Reset state for new content
    hasCompletedRef.current = false;
    setVisibleCount(0);

    // Split into words (keeping whitespace attached)
    const words = content.match(/\S+\s*/g) || [];
    if (words.length === 0) {
      // Empty content - complete immediately
      onCompleteRef.current();
      return;
    }

    let index = 0;

    const interval = setInterval(() => {
      if (index < words.length) {
        index++;
        setVisibleCount(index);
      } else {
        clearInterval(interval);
        if (!hasCompletedRef.current) {
          hasCompletedRef.current = true;
          onCompleteRef.current();
        }
      }
    }, speed);

    return () => clearInterval(interval);
  }, [content, speed]);

  // Split content into words for rendering
  const words = content.match(/\S+\s*/g) || [];

  return (
    <>
      {words.map((word, index) => (
        <span
          key={index}
          style={{
            opacity: index < visibleCount ? 1 : 0,
            transition: "opacity 150ms ease-in",
          }}
        >
          {word}
        </span>
      ))}
    </>
  );
}
