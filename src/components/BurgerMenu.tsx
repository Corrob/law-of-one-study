"use client";

import { useEffect, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  CloseIcon,
  HomeIcon,
  ChatIcon,
  ExploreIcon,
  BookIcon,
  SearchIcon,
  InfoIcon,
} from "./icons";
import { ThemeToggle } from "./ThemeToggle";

interface BurgerMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Home", icon: HomeIcon },
  { href: "/chat", label: "Seek", icon: ChatIcon },
  { href: "/explore", label: "Explore", icon: ExploreIcon },
  { href: "/paths", label: "Study", icon: BookIcon },
  { href: "/search", label: "Search", icon: SearchIcon },
];

const SECONDARY_ITEMS: NavItem[] = [
  { href: "/about", label: "About", icon: InfoIcon },
];

export default function BurgerMenu({ isOpen, onClose }: BurgerMenuProps) {
  const pathname = usePathname();

  // Close on escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  // Handle escape key and body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleKeyDown]);

  // Close menu when route changes (but not on initial mount)
  const previousPathname = useRef(pathname);
  useEffect(() => {
    if (previousPathname.current !== pathname) {
      previousPathname.current = pathname;
      onClose();
    }
  }, [pathname, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-72 max-w-[80vw] bg-[var(--lo1-void)] border-l border-[var(--lo1-gold)]/20 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--lo1-gold)]/20">
              <span className="text-lg font-semibold text-[var(--lo1-starlight)]">
                Menu
              </span>
              <button
                onClick={onClose}
                className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-[var(--lo1-gold)]/10 transition-colors cursor-pointer"
                aria-label="Close menu"
              >
                <CloseIcon className="w-5 h-5 text-[var(--lo1-gold)]" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="p-4">
              <ul className="space-y-1" role="menu">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href ||
                    (item.href !== "/" && pathname.startsWith(item.href));

                  return (
                    <li key={item.href} role="none">
                      <Link
                        href={item.href}
                        role="menuitem"
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                          isActive
                            ? "bg-[var(--lo1-gold)]/20 text-[var(--lo1-gold)]"
                            : "text-[var(--lo1-text-light)] hover:bg-[var(--lo1-gold)]/10 hover:text-[var(--lo1-starlight)]"
                        }`}
                        aria-current={isActive ? "page" : undefined}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="font-medium">{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>

              {/* Divider */}
              <div className="my-4 border-t border-[var(--lo1-gold)]/20" />

              {/* Secondary items */}
              <ul className="space-y-1" role="menu">
                {SECONDARY_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;

                  return (
                    <li key={item.href} role="none">
                      <Link
                        href={item.href}
                        role="menuitem"
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                          isActive
                            ? "bg-[var(--lo1-gold)]/20 text-[var(--lo1-gold)]"
                            : "text-[var(--lo1-text-light)] hover:bg-[var(--lo1-gold)]/10 hover:text-[var(--lo1-starlight)]"
                        }`}
                        aria-current={isActive ? "page" : undefined}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="font-medium">{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>

              {/* Theme toggle */}
              <div className="mt-4 px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--lo1-text-light)] font-medium">Theme</span>
                  <ThemeToggle />
                </div>
              </div>
            </nav>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
