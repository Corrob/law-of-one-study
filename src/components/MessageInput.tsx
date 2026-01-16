"use client";

import { useState, KeyboardEvent, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useAutoGrowTextarea } from "@/hooks/useAutoGrowTextarea";

interface MessageInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

const MAX_MESSAGE_LENGTH = 5000;

export default function MessageInput({ onSend, disabled, placeholder }: MessageInputProps) {
  const t = useTranslations("chat");
  const [input, setInput] = useState("");
  const { textareaRef, maxHeight } = useAutoGrowTextarea({ value: input });

  const characterCount = input.length;
  const isNearLimit = characterCount > MAX_MESSAGE_LENGTH * 0.8; // Show warning at 80%
  const isOverLimit = characterCount > MAX_MESSAGE_LENGTH;

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

  // Handle when keyboard appears on mobile
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
  }, [textareaRef]);

  const hasContent = input.trim().length > 0;
  const canSend = hasContent && !disabled && !isOverLimit;

  // IDs for accessibility
  const inputId = "message-input";
  const counterId = "message-counter";

  return (
    <div className="flex flex-col gap-1">
      {/* Unified input container */}
      <div
        className="light-input relative flex items-end rounded-2xl border border-[var(--lo1-celestial)]/30
                   bg-[var(--lo1-deep-space)]/80
                   focus-within:ring-2 focus-within:ring-[var(--lo1-gold)] focus-within:border-transparent
                   transition-all duration-200"
      >
        <textarea
          id={inputId}
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          placeholder={placeholder || t("placeholder")}
          disabled={disabled}
          rows={1}
          aria-label={t("messageInput")}
          aria-describedby={isNearLimit ? counterId : undefined}
          aria-invalid={isOverLimit}
          className="flex-1 resize-none bg-transparent px-3 sm:px-4 py-4 pr-12 sm:pr-14
                     text-[var(--lo1-starlight)] placeholder:text-[var(--lo1-stardust)]
                     focus:outline-none
                     disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ minHeight: "56px", maxHeight: `${maxHeight}px`, overflowY: "auto" }}
        />

        {/* Send button - positioned inside input, smaller on mobile */}
        <button
          onClick={handleSend}
          disabled={!canSend}
          className={`absolute right-1.5 sm:right-2 bottom-2 w-9 h-9 sm:w-10 sm:h-10 rounded-full
                     flex items-center justify-center
                     transition-all duration-200
                     ${canSend
                       ? "bg-[var(--lo1-gold)] text-[var(--lo1-deep-space)] hover:bg-[var(--lo1-gold-light)] hover:shadow-[0_0_20px_rgba(212,168,83,0.4)] cursor-pointer"
                       : "bg-[var(--lo1-celestial)]/20 text-[var(--lo1-stardust)]/50 cursor-not-allowed"
                     }`}
          aria-label={t("sendMessage")}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-4 h-4 sm:w-5 sm:h-5"
          >
            <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
          </svg>
        </button>
      </div>

      {/* Character counter - only show when user is typing and near/over limit */}
      {characterCount > 0 && isNearLimit && (
        <div
          id={counterId}
          className="text-xs text-right px-1"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          <span className={isOverLimit ? "text-[var(--lo1-error)]" : "text-[var(--lo1-stardust)]"}>
            {t("characterCount", { count: characterCount.toLocaleString(), max: MAX_MESSAGE_LENGTH.toLocaleString() })}
            {isOverLimit && ` ${t("overLimit")}`}
          </span>
        </div>
      )}
    </div>
  );
}
