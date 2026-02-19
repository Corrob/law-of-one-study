"use client";

import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { UnityIcon, MenuIcon, BackIcon, PlusIcon, DownloadIcon } from "./icons";

interface HeaderProps {
  onMenuClick: () => void;
  onNewChat?: () => void;
  showNewChat?: boolean;
  onNewSearch?: () => void;
  showNewSearch?: boolean;
  onExportChat?: () => void;
  showExportChat?: boolean;
  disableExportChat?: boolean;
}

// Map paths to translation keys
const PAGE_TITLE_KEYS: Record<string, string> = {
  "/chat": "seek",
  "/explore": "explore",
  "/paths": "study",
  "/search": "search",
  "/meditate": "meditate",
  "/about": "about",
  "/donate": "support",
  "/app": "install",
};

export default function Header({ onMenuClick, onNewChat, showNewChat, onNewSearch, showNewSearch, onExportChat, showExportChat, disableExportChat }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isDashboard = pathname === "/";
  const t = useTranslations();

  // Get page title for non-dashboard pages
  const pageTitleKey = PAGE_TITLE_KEYS[pathname] ||
    (pathname.startsWith("/paths/") ? "study" : "");
  const pageTitle = pageTitleKey ? t(`nav.${pageTitleKey}`) : "";

  return (
    <header className="light-header relative z-10 bg-[var(--lo1-indigo)]/80 backdrop-blur-sm text-white py-3 px-4 border-b border-[var(--lo1-gold)]/20">
      <div className="flex items-center justify-between gap-3">
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
                <h1 className="text-lg font-semibold tracking-wide">{t("header.appTitle")}</h1>
                <p className="text-xs text-[var(--lo1-stardust)] tracking-wider uppercase hidden sm:block">
                  {t("header.subtitle")}
                </p>
              </div>
            </Link>
          ) : (
            // Feature page: Show home button and page title
            <>
              <button
                onClick={() => router.push("/")}
                className="flex items-center justify-center w-10 h-10 -ml-2 rounded-lg hover:bg-[var(--lo1-gold)]/10 transition-colors cursor-pointer"
                aria-label={t("header.goToHome")}
              >
                <BackIcon className="w-5 h-5 text-[var(--lo1-gold)]" />
              </button>
              <h1 className="text-lg font-semibold tracking-wide">{pageTitle}</h1>
            </>
          )}
        </div>

        {/* Right side: Actions */}
        <div className="flex items-center gap-1">
          {/* Export Chat button (only on /chat when conversation active) */}
          {pathname === "/chat" && showExportChat && onExportChat && (
            <button
              onClick={onExportChat}
              disabled={disableExportChat}
              className={`flex items-center gap-1.5 transition-colors text-sm px-3 py-2 rounded-lg ${
                disableExportChat
                  ? "text-[var(--lo1-gold)]/40 cursor-not-allowed"
                  : "text-[var(--lo1-gold)] hover:text-[var(--lo1-gold)]/80 hover:bg-[var(--lo1-gold)]/10 cursor-pointer"
              }`}
              aria-label={t("header.exportChat")}
            >
              <DownloadIcon className="w-4 h-4" />
              <span className="hidden sm:inline">{t("buttons.export")}</span>
            </button>
          )}

          {/* New Chat button (only on /chat when conversation active) */}
          {pathname === "/chat" && showNewChat && onNewChat && (
            <button
              onClick={onNewChat}
              className="flex items-center gap-1.5 text-[var(--lo1-gold)] hover:text-[var(--lo1-gold)]/80 transition-colors text-sm px-3 py-2 rounded-lg hover:bg-[var(--lo1-gold)]/10 cursor-pointer"
              aria-label={t("header.startNewConversation")}
            >
              <PlusIcon className="w-4 h-4" />
              <span className="hidden sm:inline">{t("buttons.new")}</span>
            </button>
          )}

          {/* New Search button (only on /search when results showing) */}
          {pathname === "/search" && showNewSearch && onNewSearch && (
            <button
              onClick={onNewSearch}
              className="flex items-center gap-1.5 text-[var(--lo1-gold)] hover:text-[var(--lo1-gold)]/80 transition-colors text-sm px-3 py-2 rounded-lg hover:bg-[var(--lo1-gold)]/10 cursor-pointer"
              aria-label={t("header.startNewSearch")}
            >
              <PlusIcon className="w-4 h-4" />
              <span className="hidden sm:inline">{t("buttons.new")}</span>
            </button>
          )}

          {/* Burger menu button */}
          <button
            onClick={onMenuClick}
            className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-[var(--lo1-gold)]/10 transition-colors cursor-pointer"
            aria-label={t("header.openMenu")}
            aria-expanded="false"
          >
            <MenuIcon className="w-5 h-5 text-[var(--lo1-gold)]" />
          </button>
        </div>
      </div>
    </header>
  );
}
