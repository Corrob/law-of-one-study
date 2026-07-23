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

  // Load all message files and merge them. Note: `channeling` is loaded for
  // every locale even though the channeling page is English-only (it 404s
  // elsewhere) — this loader imports one file per namespace per locale, so the
  // es/de/fr channeling.json files exist as English copies purely to satisfy
  // it. If the channeling material is ever translated, replace those copies.
  const [common, about, donate, installApp, pwaPrompt, music, ask, channeling] =
    await Promise.all([
      import(`../../messages/${locale}/common.json`),
      import(`../../messages/${locale}/about.json`),
      import(`../../messages/${locale}/donate.json`),
      import(`../../messages/${locale}/install-app.json`),
      import(`../../messages/${locale}/pwa-prompt.json`),
      import(`../../messages/${locale}/music.json`),
      import(`../../messages/${locale}/ask.json`),
      import(`../../messages/${locale}/channeling.json`),
    ]);

  return {
    locale,
    messages: {
      ...common.default,
      about: about.default,
      donate: donate.default,
      installApp: installApp.default,
      pwaPrompt: pwaPrompt.default,
      music: music.default,
      ask: ask.default,
      channeling: channeling.default,
    },
  };
});
