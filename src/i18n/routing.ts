import { defineRouting } from 'next-intl/routing';
import { AVAILABLE_LANGUAGES } from '@/lib/language-config';

/**
 * Routing configuration for next-intl.
 *
 * - Default locale (en) uses unprefixed paths: /chat, /paths, etc.
 * - Other locales use prefixed paths: /es/chat, /es/paths, etc.
 */
export const routing = defineRouting({
  locales: AVAILABLE_LANGUAGES,
  defaultLocale: 'en',
  // Use 'as-needed' to hide the default locale from URLs
  // English: /chat, Spanish: /es/chat
  localePrefix: 'as-needed',
});
