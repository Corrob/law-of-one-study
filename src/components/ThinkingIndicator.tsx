"use client";

import { useEffect, useState } from "react";

const thinkingMessages = [
  // Channeling & Communication
  "Scanning the cosmic records...",
  "Tuning the instrument...",
  "Opening the narrow-band...",
  "Adjusting the vibrational frequency...",
  "Preparing the channel...",
  "Clearing the distortions...",
  "Aligning with the contact...",
  "Establishing the link...",
  "Synchronizing the vibrations...",

  // Confederation & Ra
  "Consulting the Confederation...",
  "Channeling the Law of One...",
  "Accessing Ra's wisdom...",
  "Connecting to the social memory complex...",
  "Reaching the sixth density...",
  "Communing with those of Ra...",
  "Invoking the Confederation's aid...",

  // Seeking & Searching
  "Seeking in the infinite...",
  "Searching the Akashic records...",
  "Exploring the inner planes...",
  "Navigating the densities...",
  "Traversing time/space...",
  "Scanning the cosmic library...",
  "Following the thread of seeking...",
  "Illuminating the path...",

  // Polarity & Balance
  "Harmonizing polarities...",
  "Balancing love and wisdom...",
  "Integrating the shadow...",
  "Aligning service to others...",
  "Polarizing in consciousness...",
  "Bridging the paths...",
  "Unifying the opposites...",

  // Energy & Light/Love
  "Gathering light/love energy...",
  "Weaving love/light patterns...",
  "Opening the energy centers...",
  "Activating the violet ray...",
  "Channeling intelligent infinity...",
  "Amplifying the heart chakra...",
  "Radiating green-ray energy...",
  "Flowing through the indigo ray...",

  // Creation & Unity
  "Accessing the One Infinite Creator...",
  "Recognizing the unity...",
  "Perceiving the original thought...",
  "Dancing in the illusion...",
  "Honoring the free will...",
  "Embracing the paradox...",
  "Dissolving separation...",
  "Witnessing the hologram...",

  // Concepts & Teachings
  "Decoding the catalyst...",
  "Processing the experience...",
  "Transmuting the distortion...",
  "Understanding the archetypes...",
  "Contemplating the harvest...",
  "Recognizing the wanderer...",
  "Studying the densities...",
  "Exploring the octave...",
  "Examining the veil...",
  "Comprehending the choice...",

  // Meditation & Inner Work
  "Entering the silence...",
  "Balancing the mind/body/spirit...",
  "Centering in the present...",
  "Opening to guidance...",
  "Quieting the distraction...",
  "Deepening the meditation...",

  // Mystical & Poetic
  "Listening to the stars...",
  "Reading the Book of Souls...",
  "Consulting the infinite intelligence...",
  "Attuning to the cosmic rhythm...",
  "Spiraling through the densities...",
  "Unveiling the mystery...",
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
