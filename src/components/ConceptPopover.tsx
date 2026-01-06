"use client";

import { memo, useRef, useEffect, useCallback, useState } from "react";
import { usePopoverContext } from "@/contexts/PopoverContext";

interface ConceptPopoverProps {
  term: string;
  displayText: string;
  onSearch: (query: string) => void;
}

/**
 * Interactive concept link that shows a popover with definition on hover/click.
 *
 * Ra Material terms are automatically detected and wrapped with this component
 * to provide contextual definitions and quick search access.
 *
 * Memoized to prevent re-renders during message streaming.
 */
const ConceptPopover = memo(function ConceptPopover({ term, displayText, onSearch }: ConceptPopoverProps) {
  const popoverId = `concept-${term.toLowerCase().replace(/\s+/g, "-")}`;
  const { openPopover, open, close, requestClose, cancelClose } = usePopoverContext();
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isOpen = openPopover?.id === popoverId;

  // Detect touch device on mount
  useEffect(() => {
    setIsTouchDevice("ontouchstart" in window || navigator.maxTouchPoints > 0);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  const handleMouseEnter = useCallback(() => {
    if (isTouchDevice) return;

    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    cancelClose(); // Cancel any pending close from leaving another trigger
    hoverTimeoutRef.current = setTimeout(() => {
      if (triggerRef.current) {
        open(popoverId, triggerRef.current, { term, onSearch });
      }
    }, 200);
  }, [isTouchDevice, open, cancelClose, popoverId, term, onSearch]);

  const handleMouseLeave = useCallback(() => {
    if (isTouchDevice) return;

    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    // Use requestClose instead of close - allows time for mouse to move to popover
    requestClose();
  }, [isTouchDevice, requestClose]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (triggerRef.current) {
      if (isOpen) {
        close();
      } else {
        open(popoverId, triggerRef.current, { term, onSearch });
      }
    }
  }, [isOpen, open, close, popoverId, term, onSearch]);

  return (
    <span
      className="concept-popover-wrapper"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        ref={triggerRef}
        onClick={handleClick}
        className="concept-link"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        {displayText}
      </button>
    </span>
  );
});

export default ConceptPopover;
