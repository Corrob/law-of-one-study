"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UnityIcon, MenuIcon, BackIcon, PlusIcon } from "./icons";

interface HeaderProps {
  onMenuClick: () => void;
  onNewChat?: () => void;
  showNewChat?: boolean;
}

// Page titles for feature pages
const PAGE_TITLES: Record<string, string> = {
  "/chat": "Seek",
  "/explore": "Explore",
  "/paths": "Study",
  "/search": "Search",
  "/support": "About",
};

export default function Header({ onMenuClick, onNewChat, showNewChat }: HeaderProps) {
  const pathname = usePathname();
  const isDashboard = pathname === "/";

  // Get page title for non-dashboard pages
  const pageTitle = PAGE_TITLES[pathname] ||
    (pathname.startsWith("/paths/") ? "Study" : "");

  return (
    <header className="light-header relative z-10 bg-[var(--lo1-indigo)]/80 backdrop-blur-sm text-white py-3 px-4 border-b border-[var(--lo1-gold)]/20">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
        {/* Left side: Logo/Title or Back button */}
        <div className="flex items-center gap-3">
          {isDashboard ? (
            // Dashboard: Show logo and title
            <Link
              href="/"
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <UnityIcon className="w-8 h-8 text-[var(--lo1-gold)] starburst" />
              <div className="text-left">
                <h1 className="text-lg font-semibold tracking-wide">Law of One Study</h1>
                <p className="text-xs text-[var(--lo1-stardust)] tracking-wider uppercase hidden sm:block">
                  The Ra Material
                </p>
              </div>
            </Link>
          ) : (
            // Feature page: Show back button and page title
            <>
              <Link
                href="/"
                className="flex items-center justify-center w-10 h-10 -ml-2 rounded-lg hover:bg-[var(--lo1-gold)]/10 transition-colors"
                aria-label="Back to home"
              >
                <BackIcon className="w-5 h-5 text-[var(--lo1-gold)]" />
              </Link>
              <h1 className="text-lg font-semibold tracking-wide">{pageTitle}</h1>
            </>
          )}
        </div>

        {/* Right side: Actions */}
        <div className="flex items-center gap-1">
          {/* New Chat button (only on /chat when conversation active) */}
          {pathname === "/chat" && showNewChat && onNewChat && (
            <button
              onClick={onNewChat}
              className="flex items-center gap-1.5 text-[var(--lo1-gold)] hover:text-[var(--lo1-gold)]/80 transition-colors text-sm px-3 py-2 rounded-lg hover:bg-[var(--lo1-gold)]/10 cursor-pointer"
              aria-label="Start new conversation"
            >
              <PlusIcon className="w-4 h-4" />
              <span className="hidden sm:inline">New</span>
            </button>
          )}

          {/* Burger menu button */}
          <button
            onClick={onMenuClick}
            className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-[var(--lo1-gold)]/10 transition-colors cursor-pointer"
            aria-label="Open menu"
            aria-expanded="false"
          >
            <MenuIcon className="w-5 h-5 text-[var(--lo1-gold)]" />
          </button>
        </div>
      </div>
    </header>
  );
}
