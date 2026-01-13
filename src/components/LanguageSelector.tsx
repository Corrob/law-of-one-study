"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { AVAILABLE_LANGUAGES, LANGUAGE_DISPLAY_NAMES, type AvailableLanguage } from "@/lib/language-config";

interface LanguageSelectorProps {
  /** Callback when language changes (e.g., to close menu) */
  onLanguageChange?: () => void;
}

/**
 * Dropdown selector for choosing the app language.
 * Shows available languages with their native names.
 */
export function LanguageSelector({ onLanguageChange }: LanguageSelectorProps) {
  const { language, setLanguage } = useLanguage();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value as AvailableLanguage;
    setLanguage(newLang);
    onLanguageChange?.();
  };

  return (
    <select
      value={language}
      onChange={handleChange}
      className="bg-[var(--lo1-indigo)]/50 border border-[var(--lo1-gold)]/30 rounded-lg px-3 py-1.5 text-sm
                 text-[var(--lo1-starlight)] cursor-pointer
                 hover:border-[var(--lo1-gold)]/50 focus:outline-none focus:border-[var(--lo1-gold)]
                 transition-colors"
      aria-label="Select language"
    >
      {AVAILABLE_LANGUAGES.map((lang) => (
        <option key={lang} value={lang}>
          {LANGUAGE_DISPLAY_NAMES[lang]}
        </option>
      ))}
    </select>
  );
}
