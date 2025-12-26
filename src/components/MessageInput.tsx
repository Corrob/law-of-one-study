"use client";

import { useState, KeyboardEvent, useRef, useEffect } from "react";
import { useSearchMode } from "@/contexts/SearchModeContext";

interface MessageInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

const MAX_MESSAGE_LENGTH = 5000;

export default function MessageInput({ onSend, disabled, placeholder }: MessageInputProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { mode, toggleMode } = useSearchMode();

  const characterCount = input.length;
  const isNearLimit = characterCount > MAX_MESSAGE_LENGTH * 0.8; // Show warning at 80%
  const isOverLimit = characterCount > MAX_MESSAGE_LENGTH;

  // Mode-specific placeholders
  const modePlaceholder =
    mode === "quote"
      ? 'Search quotes: "wanderer", "veil of forgetting"...'
      : placeholder || "Ask about the Ra Material...";

  const handleSend = () => {
    const trimmed = input.trim();
    if (trimmed && !disabled && !isOverLimit) {
      onSend(trimmed);
      setInput("");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Scroll textarea into view when focused (for mobile keyboard)
  const handleFocus = () => {
    // Use setTimeout to ensure the keyboard has started to appear
    setTimeout(() => {
      textareaRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 300);
  };

  // Also handle when keyboard appears on mobile
  useEffect(() => {
    const handleResize = () => {
      if (document.activeElement === textareaRef.current) {
        setTimeout(() => {
          textareaRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }, 100);
      }
    };

    // Listen for viewport resize (keyboard appearance)
    window.visualViewport?.addEventListener("resize", handleResize);

    return () => {
      window.visualViewport?.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div className="flex flex-col gap-2">
      {/* Mode Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => toggleMode()}
          disabled={disabled}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200
                     ${
                       mode === "chat"
                         ? "bg-[var(--lo1-gold)]/20 text-[var(--lo1-gold)] border border-[var(--lo1-gold)]/40"
                         : "bg-[var(--lo1-indigo)]/40 text-[var(--lo1-stardust)] border border-[var(--lo1-celestial)]/20 hover:border-[var(--lo1-celestial)]/40"
                     }
                     disabled:opacity-50 disabled:cursor-not-allowed`}
          title={mode === "chat" ? "Currently in Chat Mode" : "Switch to Chat Mode"}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-4 h-4"
          >
            <path
              fillRule="evenodd"
              d="M10 2c-2.236 0-4.43.18-6.57.524C1.993 2.755 1 4.014 1 5.426v5.148c0 1.413.993 2.67 2.43 2.902.848.137 1.705.248 2.57.331v3.443a.75.75 0 001.28.53l3.58-3.579a.78.78 0 01.527-.224 41.202 41.202 0 005.183-.5c1.437-.232 2.43-1.49 2.43-2.903V5.426c0-1.413-.993-2.67-2.43-2.902A41.289 41.289 0 0010 2zm0 7a1 1 0 100-2 1 1 0 000 2zM8 8a1 1 0 11-2 0 1 1 0 012 0zm5 1a1 1 0 100-2 1 1 0 000 2z"
              clipRule="evenodd"
            />
          </svg>
          Chat
        </button>
        <button
          onClick={() => toggleMode()}
          disabled={disabled}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200
                     ${
                       mode === "quote"
                         ? "bg-[var(--lo1-gold)]/20 text-[var(--lo1-gold)] border border-[var(--lo1-gold)]/40"
                         : "bg-[var(--lo1-indigo)]/40 text-[var(--lo1-stardust)] border border-[var(--lo1-celestial)]/20 hover:border-[var(--lo1-celestial)]/40"
                     }
                     disabled:opacity-50 disabled:cursor-not-allowed`}
          title={mode === "quote" ? "Currently in Quote Search Mode" : "Switch to Quote Search Mode"}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-4 h-4"
          >
            <path
              fillRule="evenodd"
              d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
              clipRule="evenodd"
            />
          </svg>
          Quote Search
        </button>
        {mode === "quote" && (
          <div className="flex items-center gap-1.5 px-2 text-xs text-[var(--lo1-stardust)]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-3.5 h-3.5"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
                clipRule="evenodd"
              />
            </svg>
            Search the Ra Material directly
          </div>
        )}
      </div>

      <div className="flex gap-3 items-end">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          placeholder={modePlaceholder}
          disabled={disabled}
          rows={2}
          className="flex-1 resize-none rounded-xl border border-[var(--lo1-celestial)]/30 px-4 py-3
                     focus:outline-none focus:ring-2 focus:ring-[var(--lo1-gold)] focus:border-transparent
                     disabled:opacity-50 disabled:cursor-not-allowed
                     bg-[var(--lo1-deep-space)]/80 text-[var(--lo1-starlight)]
                     placeholder:text-[var(--lo1-stardust)]
                     sm:rows-1"
          style={{ minHeight: "56px", maxHeight: "120px" }}
        />
        <button
          onClick={handleSend}
          disabled={disabled || !input.trim() || isOverLimit}
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

      {/* Character counter - only show when user is typing and near/over limit */}
      {characterCount > 0 && isNearLimit && (
        <div className="text-xs text-right px-1">
          <span className={isOverLimit ? "text-[var(--lo1-error)]" : "text-[var(--lo1-stardust)]"}>
            {characterCount.toLocaleString()} / {MAX_MESSAGE_LENGTH.toLocaleString()} characters
            {isOverLimit && " (over limit)"}
          </span>
        </div>
      )}
    </div>
  );
}
