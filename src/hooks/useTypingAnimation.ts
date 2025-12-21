'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface UseTypingAnimationOptions {
  speed?: number; // ms per word (Claude-like is ~40ms)
  onComplete?: () => void;
}

// Hook for animating text word-by-word
export function useTypingAnimation(
  targetText: string,
  options: UseTypingAnimationOptions = {}
) {
  const { speed = 40, onComplete } = options;
  const [displayedText, setDisplayedText] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const wordsRef = useRef<string[]>([]);
  const indexRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Split text into words while preserving whitespace
  const splitIntoWords = useCallback((text: string): string[] => {
    // Split by word boundaries but keep spaces attached
    return text.match(/\S+\s*/g) || [];
  }, []);

  useEffect(() => {
    if (!targetText) {
      setDisplayedText('');
      return;
    }

    const newWords = splitIntoWords(targetText);

    // If we already have some words displayed, only animate new ones
    const currentWordCount = wordsRef.current.length;

    if (newWords.length > currentWordCount) {
      wordsRef.current = newWords;

      if (!intervalRef.current) {
        setIsAnimating(true);
        intervalRef.current = setInterval(() => {
          if (indexRef.current < wordsRef.current.length) {
            indexRef.current++;
            setDisplayedText(wordsRef.current.slice(0, indexRef.current).join(''));
          } else {
            // Caught up with available words
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            setIsAnimating(false);
          }
        }, speed);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [targetText, speed, splitIntoWords]);

  // Reset function for new messages
  const reset = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    wordsRef.current = [];
    indexRef.current = 0;
    setDisplayedText('');
    setIsAnimating(false);
  }, []);

  // Complete animation instantly
  const complete = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setDisplayedText(targetText);
    indexRef.current = wordsRef.current.length;
    setIsAnimating(false);
    onComplete?.();
  }, [targetText, onComplete]);

  return {
    displayedText,
    isAnimating,
    isComplete: displayedText === targetText,
    reset,
    complete,
  };
}

// Hook for quote animation (word-by-word to match text speed)
export function useQuoteAnimation(
  text: string,
  options: { speed?: number; startDelay?: number; onComplete?: () => void } = {}
) {
  const { speed = 50, startDelay = 0, onComplete } = options;
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const onCompleteRef = useRef(onComplete);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Keep onComplete ref updated
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    // Clear any existing timers
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (!text) {
      setDisplayedText('');
      setIsComplete(false);
      return;
    }

    setDisplayedText('');
    setIsComplete(false);

    // Split into words (same as text animation)
    const words = text.match(/\S+\s*/g) || [];

    timeoutRef.current = setTimeout(() => {
      let index = 0;
      intervalRef.current = setInterval(() => {
        if (index < words.length) {
          index++;
          setDisplayedText(words.slice(0, index).join(''));
        } else {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          setIsComplete(true);
          onCompleteRef.current?.();
        }
      }, speed);
    }, startDelay);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [text, speed, startDelay]);

  return { displayedText, isComplete };
}
