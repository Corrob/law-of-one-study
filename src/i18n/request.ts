import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';
import { type AvailableLanguage } from '@/lib/language-config';

/**
 * Server-side request configuration for next-intl.
 *
 * This is called for each request to determine the locale and load messages.
 * The locale is extracted from the URL by the middleware.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  // Get locale from request (set by middleware based on URL)
  let locale = await requestLocale;

  // Validate locale, fall back to default if invalid
  if (!locale || !routing.locales.includes(locale as AvailableLanguage)) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}/common.json`)).default,
  };
});
