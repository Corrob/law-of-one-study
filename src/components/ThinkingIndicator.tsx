"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";

// Total number of thinking messages in translations
const THINKING_MESSAGE_COUNT = 69;

export default function ThinkingIndicator() {
  const t = useTranslations("thinking");
  const [messageKey, setMessageKey] = useState(() =>
    String(Math.floor(Math.random() * THINKING_MESSAGE_COUNT) + 1)
  );

  // Track if we're mounted to avoid state updates after unmount
  const mountedRef = useRef(true);

  const getRandomKey = useCallback(() => {
    return String(Math.floor(Math.random() * THINKING_MESSAGE_COUNT) + 1);
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    // Pick a random message every 3.5 seconds for variety
    const interval = setInterval(() => {
      if (mountedRef.current) {
        setMessageKey(getRandomKey());
      }
    }, 3500);

    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, [getRandomKey]);

  const currentMessage = t(messageKey);

  return (
    <div className="mb-6" data-testid="thinking-indicator">
      {/* Random Ra-themed message */}
      <div
        className="text-sm text-[var(--lo1-stardust)] italic transition-opacity duration-500"
        key={currentMessage}
      >
        {currentMessage}
      </div>
    </div>
  );
}
