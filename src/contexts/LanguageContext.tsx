"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { NextIntlClientProvider, AbstractIntlMessages } from "next-intl";
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

// Cache for loaded messages to avoid re-fetching
const messagesCache: Record<string, AbstractIntlMessages> = {};

async function loadMessages(locale: AvailableLanguage): Promise<AbstractIntlMessages> {
  if (messagesCache[locale]) {
    return messagesCache[locale];
  }

  try {
    const messages = await import(`../../messages/${locale}/common.json`);
    messagesCache[locale] = messages.default;
    return messages.default;
  } catch {
    // Fall back to English if locale messages not found
    if (locale !== 'en' && !messagesCache['en']) {
      const fallback = await import('../../messages/en/common.json');
      messagesCache['en'] = fallback.default;
    }
    return messagesCache['en'] || {};
  }
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<AvailableLanguage>("en");
  const [messages, setMessages] = useState<AbstractIntlMessages | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load saved language from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && isLanguageAvailable(saved)) {
      setLanguageState(saved);
    }
    setIsHydrated(true);
  }, []);

  // Load messages when language changes
  useEffect(() => {
    loadMessages(language).then(setMessages);
  }, [language]);

  // Save language to localStorage when it changes
  const setLanguage = (lang: AvailableLanguage) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEY, lang);
  };

  // Don't render children until hydrated and messages are loaded
  if (!isHydrated || !messages) {
    return null;
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      <NextIntlClientProvider locale={language} messages={messages}>
        {children}
      </NextIntlClientProvider>
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
