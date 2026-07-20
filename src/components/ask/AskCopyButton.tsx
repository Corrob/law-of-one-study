"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";

interface AskCopyButtonProps {
  /** The text placed on the clipboard (Markdown with citation links). */
  text: string;
}

/** Small copy-to-clipboard affordance shown under a completed answer. */
export default function AskCopyButton({ text }: AskCopyButtonProps) {
  const t = useTranslations("ask");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(id);
  }, [copied]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      // Clipboard unavailable (permissions/insecure context) — quietly do nothing.
    }
  }, [text]);

  return (
    <button
      type="button"
      data-testid="ask-copy"
      onClick={handleCopy}
      aria-label={t("copy")}
      className="mt-2 inline-flex items-center gap-1.5 text-xs text-[var(--lo1-stardust)]/60
                 hover:text-[var(--lo1-starlight)] transition-colors cursor-pointer"
    >
      {copied ? (
        <>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {t("copied")}
        </>
      ) : (
        <>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          {t("copy")}
        </>
      )}
    </button>
  );
}
