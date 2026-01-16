"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import {
  AVAILABLE_LANGUAGES,
  LANGUAGE_DISPLAY_NAMES,
  type AvailableLanguage,
} from "@/lib/language-config";

// Re-export for convenience
export { AVAILABLE_LANGUAGES, LANGUAGE_DISPLAY_NAMES, type AvailableLanguage };

/**
 * Hook to access the current language and change it.
 *
 * Language is determined by the URL path:
 * - /chat -> English
 * - /es/chat -> Spanish
 *
 * setLanguage navigates to the same page with the new locale.
 */
export function useLanguage() {
  const locale = useLocale() as AvailableLanguage;
  const router = useRouter();
  const pathname = usePathname();

  const setLanguage = (lang: AvailableLanguage) => {
    router.replace(pathname, { locale: lang });
  };

  return {
    language: locale,
    setLanguage,
  };
}
