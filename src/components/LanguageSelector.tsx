"use client";

import { useState, useRef, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { AVAILABLE_LANGUAGES, LANGUAGE_DISPLAY_NAMES, type AvailableLanguage } from "@/lib/language-config";

interface LanguageSelectorProps {
  /** Callback when language changes (e.g., to close menu) */
  onLanguageChange?: () => void;
}

// Language codes to display in the button
const LANGUAGE_CODES: Record<AvailableLanguage, string> = {
  en: "EN",
  es: "ES",
  de: "DE",
  fr: "FR",
};

/**
 * Beautiful dropdown selector for choosing the app language.
 * Designed to scale to multiple languages.
 */
export function LanguageSelector({ onLanguageChange }: LanguageSelectorProps) {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen]);

  const handleSelect = (lang: AvailableLanguage) => {
    if (lang !== language) {
      setLanguage(lang);
      onLanguageChange?.();
    }
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-lg
          bg-[var(--lo1-indigo)]/50 border transition-all duration-200 cursor-pointer
          ${isOpen
            ? "border-[var(--lo1-gold)]/50 shadow-[0_0_15px_rgba(212,168,83,0.15)]"
            : "border-[var(--lo1-celestial)]/30 hover:border-[var(--lo1-gold)]/40"
          }
        `}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label="Select language"
      >
        {/* Globe Icon */}
        <svg
          className="w-4 h-4 text-[var(--lo1-gold)]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418"
          />
        </svg>

        {/* Current Language Code */}
        <span className="text-sm font-medium text-[var(--lo1-starlight)]">
          {LANGUAGE_CODES[language]}
        </span>

        {/* Chevron */}
        <svg
          className={`w-3.5 h-3.5 text-[var(--lo1-stardust)] transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 min-w-[160px] py-1 rounded-lg
                     bg-[var(--lo1-indigo)]/95 backdrop-blur-md
                     border border-[var(--lo1-celestial)]/30
                     shadow-[0_4px_20px_rgba(0,0,0,0.3),0_0_30px_rgba(212,168,83,0.1)]
                     z-50 animate-in fade-in slide-in-from-top-2 duration-200"
          role="listbox"
          aria-label="Available languages"
        >
          {AVAILABLE_LANGUAGES.map((lang) => {
            const isActive = lang === language;
            return (
              <button
                key={lang}
                onClick={() => handleSelect(lang)}
                role="option"
                aria-selected={isActive}
                className={`
                  w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors cursor-pointer
                  ${isActive
                    ? "bg-[var(--lo1-gold)]/15 text-[var(--lo1-gold)]"
                    : "text-[var(--lo1-starlight)] hover:bg-[var(--lo1-celestial)]/10"
                  }
                `}
              >
                {/* Language Code Badge */}
                <span className={`
                  w-7 h-7 flex items-center justify-center rounded-md text-xs font-bold
                  ${isActive
                    ? "bg-[var(--lo1-gold)]/20 text-[var(--lo1-gold)]"
                    : "bg-[var(--lo1-celestial)]/20 text-[var(--lo1-stardust)]"
                  }
                `}>
                  {LANGUAGE_CODES[lang]}
                </span>

                {/* Language Name */}
                <span className="text-sm font-medium">
                  {LANGUAGE_DISPLAY_NAMES[lang]}
                </span>

                {/* Checkmark for active */}
                {isActive && (
                  <svg
                    className="w-4 h-4 ml-auto text-[var(--lo1-gold)]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
