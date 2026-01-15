"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { usePopoverContext } from "@/contexts/PopoverContext";
import { useTranslations } from "next-intl";

const POPOVER_ID = "ai-companion-badge";

function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M12 0L13.5 8.5L22 10L13.5 11.5L12 20L10.5 11.5L2 10L10.5 8.5L12 0Z" />
      <circle cx="20" cy="4" r="1.5" />
      <circle cx="4" cy="18" r="1" />
    </svg>
  );
}

export default function AICompanionBadge() {
  const t = useTranslations("aiCompanion");
  const { openPopover, open, close, requestClose, cancelClose } = usePopoverContext();
  const [canHover, setCanHover] = useState(false);
  const badgeRef = useRef<HTMLButtonElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isOpen = openPopover?.id === POPOVER_ID;

  // Detect if device supports hover (desktop vs touch)
  useEffect(() => {
    const mediaQuery = window.matchMedia("(hover: hover)");
    setCanHover(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setCanHover(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  // Cleanup hover timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  const handleMouseEnter = useCallback(() => {
    if (!canHover) return;
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    cancelClose(); // Cancel any pending close
    hoverTimeoutRef.current = setTimeout(() => {
      if (badgeRef.current) {
        open(POPOVER_ID, badgeRef.current);
      }
    }, 100);
  }, [canHover, open, cancelClose]);

  const handleMouseLeave = useCallback(() => {
    if (!canHover) return;
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    // Use requestClose to allow time for mouse to move to popover
    requestClose();
  }, [canHover, requestClose]);

  const handleClick = useCallback(() => {
    if (!canHover && badgeRef.current) {
      if (isOpen) {
        close();
      } else {
        open(POPOVER_ID, badgeRef.current);
      }
    }
  }, [canHover, isOpen, open, close]);

  return (
    <div
      className="relative inline-flex mb-3"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        ref={badgeRef}
        onClick={handleClick}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full
                   bg-[var(--lo1-gold)]/10 border border-[var(--lo1-gold)]/30
                   hover:bg-[var(--lo1-gold)]/20 hover:border-[var(--lo1-gold)]/50
                   transition-all duration-200 cursor-pointer text-xs"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        <SparkleIcon className="w-3.5 h-3.5 text-[var(--lo1-gold)]" />
        <span className="text-[var(--lo1-gold)] uppercase tracking-wide font-medium">
          {t("badge")}
        </span>
        <span className="text-[var(--lo1-stardust)]">·</span>
        <span className="text-[var(--lo1-stardust)] italic">
          {t("trustResonance")}
        </span>
      </button>
    </div>
  );
}
