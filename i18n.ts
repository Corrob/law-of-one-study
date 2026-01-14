import { getRequestConfig } from 'next-intl/server';
import { AVAILABLE_LANGUAGES, type AvailableLanguage } from '@/lib/language-config';

/**
 * next-intl server configuration.
 *
 * Note: We use client-side language switching (localStorage) rather than URL-based routing.
 * This config provides the server-side fallback and type safety.
 */
export default getRequestConfig(async () => {
  // Default to English for server-side rendering
  // Client-side language is handled by LanguageContext + NextIntlClientProvider
  const locale: AvailableLanguage = 'en';

  return {
    locale,
    messages: (await import(`./messages/${locale}/common.json`)).default
  };
});

export { AVAILABLE_LANGUAGES, type AvailableLanguage };
