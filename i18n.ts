/**
 * next-intl server configuration.
 *
 * Re-exports from src/i18n/request.ts for Next.js App Router.
 * The middleware handles locale detection from URLs.
 */
export { default } from './src/i18n/request';
export { AVAILABLE_LANGUAGES, type AvailableLanguage } from '@/lib/language-config';
