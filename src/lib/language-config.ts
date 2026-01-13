/**
 * Centralized language configuration for multilingual support.
 *
 * When adding a new language:
 * 1. Add the language code to AVAILABLE_LANGUAGES
 * 2. Add speaker prefixes to SPEAKER_PREFIXES
 * 3. Add UI labels to UI_LABELS
 * 4. Add display name to LANGUAGE_DISPLAY_NAMES
 * 5. Scrape/translate the Ra Material to public/sections/{lang}/
 */

// Languages that have Ra Material translations available
// Only add languages here once their data is in public/sections/{lang}/
export const AVAILABLE_LANGUAGES = ['en', 'es'] as const;
export type AvailableLanguage = typeof AVAILABLE_LANGUAGES[number];

// Display names for language selector UI
export const LANGUAGE_DISPLAY_NAMES: Record<AvailableLanguage, string> = {
  en: 'English',
  es: 'Español',
};

// Full language names for LLM prompts
export const LANGUAGE_NAMES_FOR_PROMPTS: Record<AvailableLanguage, string> = {
  en: 'English',
  es: 'Spanish',
};

// Speaker prefixes used in Ra Material by language
// These are the labels that appear before speaker text in the source material
export const SPEAKER_PREFIXES: Record<AvailableLanguage, {
  questioner: string[];  // All possible questioner prefixes (for parsing)
  ra: string[];          // All possible Ra prefixes (for parsing)
}> = {
  en: {
    questioner: ['Questioner:'],
    ra: ['Ra:'],
  },
  es: {
    questioner: ['Interrogador:', 'Cuestionador:'],
    ra: ['Ra:'],
  },
};

// UI labels by language
export const UI_LABELS: Record<AvailableLanguage, {
  questioner: string;
  collapse: string;
  expand: string;
  loading: string;
  showEnglishOriginal: string;
  hideEnglishOriginal: string;
  englishOriginal: string;
  translationUnavailable: string;
}> = {
  en: {
    questioner: 'Questioner',
    collapse: 'Collapse',
    expand: 'Show more',
    loading: 'Loading...',
    showEnglishOriginal: 'Show English original',
    hideEnglishOriginal: 'Hide English original',
    englishOriginal: 'English Original',
    translationUnavailable: 'Translation unavailable',
  },
  es: {
    questioner: 'Interrogador',
    collapse: 'Colapsar',
    expand: 'Mostrar más',
    loading: 'Cargando...',
    showEnglishOriginal: 'Mostrar original en inglés',
    hideEnglishOriginal: 'Ocultar original en inglés',
    englishOriginal: 'Original en Inglés',
    translationUnavailable: 'Traducción no disponible',
  },
};

/**
 * Build a regex pattern that matches all questioner prefixes across all languages.
 * Used for parsing Ra Material text into segments.
 */
export function buildSpeakerPrefixPattern(): RegExp {
  const allPrefixes: string[] = [];

  for (const lang of AVAILABLE_LANGUAGES) {
    allPrefixes.push(...SPEAKER_PREFIXES[lang].questioner);
    allPrefixes.push(...SPEAKER_PREFIXES[lang].ra);
  }

  // Escape special regex characters and join with |
  const escaped = allPrefixes.map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return new RegExp(`(${escaped.join('|')})`, 'g');
}

/**
 * Check if a string is a questioner prefix in any language.
 */
export function isQuestionerPrefix(text: string): boolean {
  for (const lang of AVAILABLE_LANGUAGES) {
    if (SPEAKER_PREFIXES[lang].questioner.includes(text)) {
      return true;
    }
  }
  return false;
}

/**
 * Check if a string is a Ra prefix in any language.
 */
export function isRaPrefix(text: string): boolean {
  for (const lang of AVAILABLE_LANGUAGES) {
    if (SPEAKER_PREFIXES[lang].ra.includes(text)) {
      return true;
    }
  }
  return false;
}

/**
 * Get UI labels for a language, falling back to English if not available.
 */
export function getUILabels(language: string): typeof UI_LABELS['en'] {
  if (language in UI_LABELS) {
    return UI_LABELS[language as AvailableLanguage];
  }
  return UI_LABELS.en;
}

/**
 * Check if a language is available (has Ra Material translations).
 */
export function isLanguageAvailable(language: string): language is AvailableLanguage {
  return AVAILABLE_LANGUAGES.includes(language as AvailableLanguage);
}
