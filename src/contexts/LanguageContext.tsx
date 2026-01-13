"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import {
  AVAILABLE_LANGUAGES,
  LANGUAGE_DISPLAY_NAMES,
  isLanguageAvailable,
  type AvailableLanguage,
} from "@/lib/language-config";

// Re-export for convenience
export { AVAILABLE_LANGUAGES, LANGUAGE_DISPLAY_NAMES, type AvailableLanguage };

const STORAGE_KEY = "lo1-language";

interface LanguageContextType {
  language: AvailableLanguage;
  setLanguage: (lang: AvailableLanguage) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<AvailableLanguage>("en");
  const [isHydrated, setIsHydrated] = useState(false);

  // Load saved language from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && isLanguageAvailable(saved)) {
      setLanguageState(saved);
    }
    setIsHydrated(true);
  }, []);

  // Save language to localStorage when it changes
  const setLanguage = (lang: AvailableLanguage) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEY, lang);
  };

  // Don't render children until hydrated to prevent mismatch
  if (!isHydrated) {
    return null;
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

/**
 * Hook to access the current language setting.
 */
export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
