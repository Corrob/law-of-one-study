"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  ReactNode,
} from "react";

// Store the actual DOM element, not a ref (refs can go stale on re-render)
interface PopoverState {
  id: string;
  triggerRect: DOMRect; // Store the position at time of opening
  data?: Record<string, unknown>; // Optional data for the popover content
}

interface PopoverContextType {
  openPopover: PopoverState | null;
  open: (id: string, triggerElement: HTMLElement, data?: Record<string, unknown>) => void;
  close: () => void;
  requestClose: () => void; // Delayed close that can be cancelled
  cancelClose: () => void;
  isAnyOpen: () => boolean;
  setHoveringPopover: (hovering: boolean) => void;
}

const PopoverContext = createContext<PopoverContextType | undefined>(undefined);

export function PopoverProvider({ children }: { children: ReactNode }) {
  const [openPopover, setOpenPopover] = useState<PopoverState | null>(null);
  const isHoveringPopoverRef = useRef(false);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const cancelClose = useCallback(() => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  }, []);

  const open = useCallback((id: string, triggerElement: HTMLElement, data?: Record<string, unknown>) => {
    cancelClose();
    const triggerRect = triggerElement.getBoundingClientRect();
    setOpenPopover({ id, triggerRect, data });
  }, [cancelClose]);

  const close = useCallback(() => {
    cancelClose();
    setOpenPopover(null);
    isHoveringPopoverRef.current = false;
  }, [cancelClose]);

  // Request close with delay - allows cancellation if mouse moves to popover
  const requestClose = useCallback(() => {
    cancelClose();
    closeTimeoutRef.current = setTimeout(() => {
      if (!isHoveringPopoverRef.current) {
        setOpenPopover(null);
      }
    }, 150);
  }, [cancelClose]);

  const isAnyOpen = useCallback(() => openPopover !== null, [openPopover]);

  const setHoveringPopover = useCallback((hovering: boolean) => {
    isHoveringPopoverRef.current = hovering;
    if (hovering) {
      cancelClose();
    } else {
      requestClose();
    }
  }, [cancelClose, requestClose]);

  return (
    <PopoverContext.Provider
      value={{ openPopover, open, close, requestClose, cancelClose, isAnyOpen, setHoveringPopover }}
    >
      {children}
    </PopoverContext.Provider>
  );
}

export function usePopoverContext() {
  const context = useContext(PopoverContext);
  if (context === undefined) {
    throw new Error("usePopoverContext must be used within a PopoverProvider");
  }
  return context;
}
