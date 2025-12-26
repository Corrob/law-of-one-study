'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { getConceptDefinition } from '@/data/concepts';

interface ConceptPopoverProps {
  term: string;
  displayText: string;
  onSearch: (query: string) => void;
}

export default function ConceptPopover({ term, displayText, onSearch }: ConceptPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPinned, setIsPinned] = useState(false); // Clicked to stay open
  const [position, setPosition] = useState<'above' | 'below'>('below');
  const [horizontalOffset, setHorizontalOffset] = useState(0);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const definition = getConceptDefinition(term);

  const closePopover = useCallback(() => {
    setIsOpen(false);
    setIsPinned(false);
  }, []);

  // Close popover when clicking outside (only if pinned)
  useEffect(() => {
    if (!isPinned) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        closePopover();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closePopover();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isPinned, closePopover]);

  // Calculate position when opening - prevent off-screen rendering
  useEffect(() => {
    if (isOpen && triggerRef.current && popoverRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;

      // Vertical positioning
      setPosition(spaceBelow < 200 && spaceAbove > spaceBelow ? 'above' : 'below');

      // Horizontal positioning - prevent overflow
      // Popover is 280px wide (max-width: 90vw)
      const popoverWidth = Math.min(280, window.innerWidth * 0.9);
      const triggerCenter = rect.left + rect.width / 2;
      const popoverLeft = triggerCenter - popoverWidth / 2;
      const popoverRight = triggerCenter + popoverWidth / 2;

      let offset = 0;
      if (popoverLeft < 10) {
        // Too far left, shift right
        offset = 10 - popoverLeft;
      } else if (popoverRight > window.innerWidth - 10) {
        // Too far right, shift left
        offset = window.innerWidth - 10 - popoverRight;
      }

      setHorizontalOffset(offset);
    }
  }, [isOpen]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    // Small delay to prevent accidental triggers
    hoverTimeoutRef.current = setTimeout(() => {
      setIsOpen(true);
    }, 200);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    // Don't close if pinned
    if (!isPinned) {
      hoverTimeoutRef.current = setTimeout(() => {
        setIsOpen(false);
      }, 150);
    }
  };

  const handleClick = () => {
    // Click pins/unpins the popover
    if (isPinned) {
      closePopover();
    } else {
      setIsOpen(true);
      setIsPinned(true);
    }
  };

  const handleSearch = (e: React.MouseEvent) => {
    e.stopPropagation();
    closePopover();
    onSearch(`Please help me understand ${term}`);
  };

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

      {isOpen && (
        <div
          ref={popoverRef}
          role="dialog"
          aria-label={`Definition of ${term}`}
          className={`concept-popover ${position === 'above' ? 'concept-popover-above' : 'concept-popover-below'}`}
          style={{ transform: `translateX(calc(-50% + ${horizontalOffset}px))` }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="concept-popover-content">
            <div className="concept-popover-header">
              <span className="concept-popover-term">{term}</span>
            </div>
            {definition && (
              <p className="concept-popover-definition">{definition}</p>
            )}
            <button
              onClick={handleSearch}
              className="concept-popover-search-btn"
            >
              Explore this concept
            </button>
          </div>
        </div>
      )}
    </span>
  );
}
