"use client";

import { useEffect, useState } from "react";

const thinkingMessages = [
  "Scanning the cosmic records...",
  "Consulting the Confederation...",
  "Accessing the Akashic library...",
  "Distilling the distortion...",
  "Tuning the instrument...",
  "Channeling the Law of One...",
  "Seeking in the infinite...",
  "Harmonizing polarities...",
  "Opening the narrow-band...",
];

export default function ThinkingIndicator() {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    // Rotate messages every 2.5 seconds
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % thinkingMessages.length);
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="mb-6">
      {/* Bouncing dots */}
      <div className="flex gap-1 mb-2">
        <span
          className="w-2 h-2 bg-[var(--lo1-gold)] rounded-full animate-bounce"
          style={{ animationDelay: "0ms" }}
        ></span>
        <span
          className="w-2 h-2 bg-[var(--lo1-gold)] rounded-full animate-bounce"
          style={{ animationDelay: "150ms" }}
        ></span>
        <span
          className="w-2 h-2 bg-[var(--lo1-gold)] rounded-full animate-bounce"
          style={{ animationDelay: "300ms" }}
        ></span>
      </div>

      {/* Rotating message */}
      <div
        className="text-sm text-[var(--lo1-stardust)] italic transition-opacity duration-500"
        key={messageIndex}
      >
        {thinkingMessages[messageIndex]}
      </div>
    </div>
  );
}
