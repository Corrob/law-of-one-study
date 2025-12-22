'use client';

import { useRef } from 'react';
import ChatInterface, { ChatInterfaceRef } from '@/components/ChatInterface';

// Spiral/Unity icon for Law of One
function UnityIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
    >
      {/* Spiral representing unity/infinity */}
      <path
        d="M50 20
           C70 20, 80 35, 80 50
           C80 65, 65 75, 50 75
           C35 75, 25 62, 25 50
           C25 38, 35 30, 50 30
           C60 30, 68 40, 68 50
           C68 60, 58 67, 50 67
           C42 67, 35 58, 35 50
           C35 42, 43 37, 50 37"
        strokeLinecap="round"
      />
      {/* Central point */}
      <circle cx="50" cy="50" r="4" fill="currentColor" stroke="none" />
    </svg>
  );
}

export default function Home() {
  const chatRef = useRef<ChatInterfaceRef>(null);

  const handleHeaderClick = () => {
    chatRef.current?.reset();
  };

  return (
    <main className="h-screen flex flex-col cosmic-bg relative">
      {/* Header */}
      <header className="relative z-10 bg-[var(--lo1-indigo)]/80 backdrop-blur-sm text-white py-4 px-6 border-b border-[var(--lo1-gold)]/20">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <button
            onClick={handleHeaderClick}
            className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
          >
            <UnityIcon className="w-8 h-8 text-[var(--lo1-gold)] starburst" />
            <div className="text-left">
              <h1 className="text-lg font-semibold tracking-wide">
                Law of One Study Companion
              </h1>
              <p className="text-xs text-[var(--lo1-stardust)] tracking-wider uppercase">
                The Ra Material
              </p>
            </div>
          </button>
        </div>
      </header>

      {/* Chat Interface */}
      <div className="flex-1 overflow-hidden relative z-10">
        <ChatInterface ref={chatRef} />
      </div>
    </main>
  );
}
