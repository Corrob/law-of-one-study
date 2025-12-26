'use client';

import { useState, useEffect, useRef } from 'react';

interface AnimatedTextProps {
  content: string;
  onComplete: () => void;
  speed?: number; // ms per word
}

export default function AnimatedText({ content, onComplete, speed = 50 }: AnimatedTextProps) {
  const [displayedText, setDisplayedText] = useState('');
  const hasCompletedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);

  // Keep onComplete ref updated
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    // Reset state for new content
    hasCompletedRef.current = false;
    setDisplayedText('');

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
        setDisplayedText(words.slice(0, index).join(''));
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

  return (
    <span
      style={{
        whiteSpace: 'pre-wrap',
        wordWrap: 'break-word',
        display: 'inline'
      }}
    >
      {displayedText}
    </span>
  );
}
