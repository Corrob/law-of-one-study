'use client';

import { useState, KeyboardEvent } from 'react';

interface MessageInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function MessageInput({ onSend, disabled, placeholder }: MessageInputProps) {
  const [input, setInput] = useState('');

  const handleSend = () => {
    const trimmed = input.trim();
    if (trimmed && !disabled) {
      onSend(trimmed);
      setInput('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex gap-3 items-end">
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder || "Ask about the Ra Material..."}
        disabled={disabled}
        rows={1}
        className="flex-1 resize-none rounded-xl border border-[var(--lo1-celestial)]/30 px-4 py-3
                   focus:outline-none focus:ring-2 focus:ring-[var(--lo1-gold)] focus:border-transparent
                   disabled:opacity-50 disabled:cursor-not-allowed
                   bg-[var(--lo1-deep-space)]/80 text-[var(--lo1-starlight)]
                   placeholder:text-[var(--lo1-stardust)]"
        style={{ minHeight: '48px', maxHeight: '120px' }}
      />
      <button
        onClick={handleSend}
        disabled={disabled || !input.trim()}
        className="rounded-xl bg-[var(--lo1-gold)] hover:bg-[var(--lo1-gold-light)]
                   text-[var(--lo1-deep-space)] font-medium px-5 py-3
                   disabled:opacity-50 disabled:cursor-not-allowed
                   hover:shadow-[0_0_20px_rgba(212,168,83,0.4)]
                   transition-all duration-200 cursor-pointer"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-5 h-5"
        >
          <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
        </svg>
      </button>
    </div>
  );
}
