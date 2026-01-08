"use client";

import { useState, useCallback } from "react";
import { CopyIcon, CheckIcon } from "./icons";

interface CopyButtonProps {
  /** The text to copy to clipboard */
  textToCopy: string;
  /** Optional callback after successful copy */
  onCopy?: () => void;
  /** Size variant */
  size?: "sm" | "md";
  /** Additional CSS classes */
  className?: string;
}

/**
 * Reusable copy-to-clipboard button with success feedback.
 * Shows a copy icon that transforms to a checkmark on success.
 */
export default function CopyButton({
  textToCopy,
  onCopy,
  size = "sm",
  className = "",
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation(); // Prevent triggering parent click handlers
      try {
        await navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        onCopy?.();
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error("Failed to copy to clipboard:", error);
      }
    },
    [textToCopy, onCopy]
  );

  const iconSize = size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4";

  return (
    <>
      <button
        onClick={handleCopy}
        className={`p-1.5 rounded hover:bg-[var(--lo1-celestial)]/20 transition-colors cursor-pointer group ${className}`}
        title={copied ? "Copied!" : "Copy quote"}
        aria-label={copied ? "Copied to clipboard" : "Copy quote to clipboard"}
      >
        {copied ? (
          <CheckIcon className={`${iconSize} text-[var(--lo1-gold)]`} />
        ) : (
          <CopyIcon
            className={`${iconSize} text-[var(--lo1-celestial)] group-hover:text-[var(--lo1-gold)] transition-colors`}
          />
        )}
      </button>
      {/* Hidden live region for screen reader feedback */}
      <span role="status" aria-live="polite" className="sr-only">
        {copied ? "Quote copied to clipboard" : ""}
      </span>
    </>
  );
}
