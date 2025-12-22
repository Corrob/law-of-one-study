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

  // Calculate position when opening
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;

      setPosition(spaceBelow < 200 && spaceAbove > spaceBelow ? 'above' : 'below');
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

  const handleSearch = () => {
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
