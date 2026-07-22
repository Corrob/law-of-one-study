"use client";

import { useState, useEffect, useCallback, useMemo, type KeyboardEvent } from "react";
import { useTranslations } from "next-intl";
import { SparkleIcon } from "@/components/icons";
import { useAutoGrowTextarea } from "@/hooks/useAutoGrowTextarea";
import { ASK_MAX_MESSAGE_LENGTH } from "@/lib/ask/config";

interface AskComposerProps {
  onSend: (message: string) => void;
  disabled: boolean;
  /** Selected source library — picks Ra vs conscious-channeling placeholders. */
  source?: "ra" | "channeling";
}

/**
 * The message input for the Ask feature: an auto-growing textarea with a send
 * button. Enter sends; Shift+Enter inserts a newline. Includes mobile-keyboard
 * handling (keeps the box visible above the on-screen keyboard), a character
 * counter near the limit, and gently rotating placeholder hints.
 */
export default function AskComposer({ onSend, disabled, source = "ra" }: AskComposerProps) {
  const t = useTranslations("ask");
  const [value, setValue] = useState("");
  const { textareaRef, maxHeight } = useAutoGrowTextarea({ value });

  const characterCount = value.length;
  const isNearLimit = characterCount > ASK_MAX_MESSAGE_LENGTH * 0.8;
  const isOverLimit = characterCount > ASK_MAX_MESSAGE_LENGTH;
  const canSend = value.trim().length > 0 && !disabled && !isOverLimit;

  // Rotating placeholder hints. Start deterministic (avoids hydration mismatch),
  // randomize on mount, then advance slowly only while the field is empty.
  const placeholders = useMemo(() => {
    const key = source === "channeling" ? "channelingPlaceholders" : "placeholders";
    const fallbackKey = source === "channeling" ? "channelingPlaceholder" : "placeholder";
    const raw = t.raw(key);
    return Array.isArray(raw) && raw.length > 0 ? (raw as string[]) : [t(fallbackKey)];
  }, [t, source]);
  const [phIndex, setPhIndex] = useState(0);
  useEffect(() => {
    setPhIndex(Math.floor(Math.random() * placeholders.length));
  }, [placeholders.length]);
  useEffect(() => {
    if (value.trim().length > 0) return; // don't rotate mid-typing
    const id = setInterval(() => setPhIndex((i) => (i + 1) % placeholders.length), 5000);
    return () => clearInterval(id);
  }, [value, placeholders.length]);

  const submit = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled || trimmed.length > ASK_MAX_MESSAGE_LENGTH) return;
    onSend(trimmed);
    setValue("");
    // Dismiss the mobile keyboard so the answer isn't hidden behind it —
    // but keep focus on keyboard/mouse devices so the next question can be
    // typed without re-tabbing to the input.
    if (window.matchMedia("(pointer: coarse)").matches) {
      textareaRef.current?.blur();
    }
  }, [value, disabled, onSend, textareaRef]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  // Keep the input centered above the mobile on-screen keyboard.
  const scrollIntoView = useCallback(() => {
    textareaRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [textareaRef]);

  const handleFocus = () => {
    // Delay so the keyboard has begun to appear before we scroll.
    setTimeout(scrollIntoView, 300);
  };

  useEffect(() => {
    const handleResize = () => {
      if (document.activeElement === textareaRef.current) {
        setTimeout(scrollIntoView, 100);
      }
    };
    window.visualViewport?.addEventListener("resize", handleResize);
    return () => window.visualViewport?.removeEventListener("resize", handleResize);
  }, [textareaRef, scrollIntoView]);

  const counterId = "ask-composer-counter";

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-end gap-2 rounded-2xl border border-[var(--lo1-gold)]/25 bg-[var(--lo1-indigo)]/60 backdrop-blur-sm p-2 focus-within:border-[var(--lo1-gold)]/50 transition-colors">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          rows={1}
          placeholder={placeholders[phIndex] ?? t("placeholder")}
          aria-label={t("inputLabel")}
          aria-describedby={isNearLimit ? counterId : undefined}
          aria-invalid={isOverLimit}
          // text-base (16px) prevents iOS Safari from auto-zooming on focus.
          className="flex-1 resize-none bg-transparent px-2 py-1.5 text-base text-[var(--lo1-starlight)] placeholder:text-[var(--lo1-stardust)]/50 focus:outline-none"
          style={{ maxHeight: `${maxHeight}px`, overflowY: "auto" }}
        />
        <button
          type="button"
          onClick={submit}
          disabled={!canSend}
          aria-label={t("send")}
          className="flex items-center justify-center w-10 h-10 rounded-xl bg-[var(--lo1-gold)]/20 text-[var(--lo1-gold)]
                     hover:bg-[var(--lo1-gold)]/30 disabled:opacity-40 disabled:cursor-not-allowed
                     transition-colors cursor-pointer flex-shrink-0"
        >
          <SparkleIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Character counter — only as the user nears the limit. */}
      {characterCount > 0 && isNearLimit && (
        <div
          id={counterId}
          className="px-1 text-right text-[11px]"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          <span className={isOverLimit ? "text-red-300" : "text-[var(--lo1-stardust)]/70"}>
            {t("characterCount", { count: characterCount, max: ASK_MAX_MESSAGE_LENGTH })}
            {isOverLimit && ` ${t("overLimit")}`}
          </span>
        </div>
      )}
    </div>
  );
}
