"use client";

import { useState, useRef, useCallback, type KeyboardEvent } from "react";
import { useTranslations } from "next-intl";
import { SparkleIcon } from "@/components/icons";

interface AskComposerProps {
  onSend: (message: string) => void;
  disabled: boolean;
}

/**
 * The message input for the Ask feature: an auto-growing textarea with a send
 * button. Enter sends; Shift+Enter inserts a newline.
 */
export default function AskComposer({ onSend, disabled }: AskComposerProps) {
  const t = useTranslations("ask");
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const submit = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [value, disabled, onSend]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const handleInput = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  };

  return (
    <div className="flex items-end gap-2 rounded-2xl border border-[var(--lo1-gold)]/25 bg-[var(--lo1-indigo)]/60 backdrop-blur-sm p-2 focus-within:border-[var(--lo1-gold)]/50 transition-colors">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        rows={1}
        placeholder={t("placeholder")}
        aria-label={t("inputLabel")}
        className="flex-1 resize-none bg-transparent px-2 py-1.5 text-[var(--lo1-starlight)] placeholder:text-[var(--lo1-stardust)]/50 focus:outline-none max-h-40"
      />
      <button
        type="button"
        onClick={submit}
        disabled={disabled || value.trim().length === 0}
        aria-label={t("send")}
        className="flex items-center justify-center w-10 h-10 rounded-xl bg-[var(--lo1-gold)]/20 text-[var(--lo1-gold)]
                   hover:bg-[var(--lo1-gold)]/30 disabled:opacity-40 disabled:cursor-not-allowed
                   transition-colors cursor-pointer flex-shrink-0"
      >
        <SparkleIcon className="w-5 h-5" />
      </button>
    </div>
  );
}
