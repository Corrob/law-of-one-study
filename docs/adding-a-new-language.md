# Adding a New Language

This guide explains how to add a new language to the Law of One Study Tool.

## Overview

Adding a language requires:
1. **Ra Material translations** (106 session files)
2. **UI translations** (3 message files)
3. **Configuration updates** (language-config.ts)
4. **Study paths** (3 JSON files per language)
5. **Concept graph** (add translations to bilingual format)
6. **Daily quotes** (add translations to bilingual format)

**Estimated time:** 4-8 hours (excluding Ra Material translation)

---

## Prerequisites

Before starting, you need:
- Ra Material translated into the target language (see [Ra Material Sources](#ra-material-sources))
- Basic knowledge of JSON file editing
- Familiarity with the project structure

---

## Step 1: Add Ra Material Translations

### File Structure

Create session files in `public/sections/{lang}/`:

```
public/sections/
├── en/           # English (existing)
│   ├── 1.json
│   ├── 2.json
│   └── ...106.json
├── es/           # Spanish (existing)
│   ├── 1.json
│   └── ...
└── {lang}/       # Your new language
    ├── 1.json
    ├── 2.json
    └── ...106.json
```

### File Format

Each session file is a JSON object mapping `session.question` to the full Q&A text:

```json
{
  "1.0": "Ra: I am Ra. I have not spoken through this instrument before...",
  "1.1": "Questioner: It seems members of the Confederation have a specific purpose...",
  "1.2": "Questioner: Yes, it does. Thank you. Ra: We appreciate your vibration..."
}
```

**Important:**
- Keys are `{session}.{question}` (e.g., "50.7", "1.0")
- Values contain the full Q&A text with speaker prefixes
- Speaker prefixes must match what you configure in Step 3

### Ra Material Sources

| Source | Languages | Quality | Cost |
|--------|-----------|---------|------|
| [L/L Research](https://www.llresearch.org/library/the-ra-contact-sessions-in-other-languages) | 26 languages | Excellent (human-translated) | Free |
| LLM batch translation | Any language | Good | ~$0.26/language |
| Manual translation | Any language | Varies | Time-intensive |

**Available from L/L Research:** Arabic, Bulgarian, Chinese (Simplified/Traditional), Czech, Dutch, Farsi, Finnish, French, German, Greek, Hebrew, Hindi, Hungarian, Indonesian, Italian, Korean, Polish, Portuguese, Romanian, Russian, Serbian, Spanish, Swedish, Turkish, Ukrainian

### Scraping L/L Research

If the language is available on L/L Research, you can adapt the existing scrape script:

```bash
# Example: Scrape French translations
npx tsx scripts/scrape-llresearch.ts --language fr
```

---

## Step 2: Add UI Translations

### Message Files

Create three JSON files in `messages/{lang}/`:

```
messages/
├── en/
│   ├── common.json    # UI strings, navigation, chat
│   ├── about.json     # About page content
│   └── donate.json    # Donation page content
├── es/
│   └── ...
└── {lang}/
    ├── common.json
    ├── about.json
    └── donate.json
```

### Translating common.json

Copy `messages/en/common.json` and translate all values. This file contains:

| Section | Description |
|---------|-------------|
| `quote` | Quote card labels (Questioner, Ra, Show more, etc.) |
| `buttons` | Common button text (Send, Cancel, Copy, etc.) |
| `labels` | Generic labels (Menu, Language, Loading) |
| `nav` | Navigation items (Home, Seek, Explore, Study, Search) |
| `header` | Header text and accessibility labels |
| `welcome` | Welcome screen greetings and disclaimer |
| `dashboard` | Daily wisdom section |
| `features` | Feature card titles and descriptions |
| `thinkingMode` | Thinking mode toggle labels |
| `chat` | Chat interface placeholders and labels |
| `starters` | 46 conversation starter questions |
| `search` | Search interface labels |
| `searchSuggestions` | 52 passage + 52 sentence search suggestions |
| `studyPaths` | Study paths UI labels |
| `aiCompanion` | AI companion badge and disclaimer |
| `concept` | Concept explorer labels |
| `categories` | 8 concept category names |
| `thinking` | 69 "thinking" indicator messages |

**Example translation (Spanish):**

```json
{
  "quote": {
    "questioner": "Interrogador",
    "ra": "Ra",
    "collapse": "Colapsar",
    "expand": "Mostrar más",
    "loading": "Cargando...",
    "showEnglishOriginal": "Mostrar original en inglés",
    "hideEnglishOriginal": "Ocultar original en inglés"
  }
}
```

### Translating about.json and donate.json

These contain longer-form content for the About and Donate pages. Copy from English and translate.

---

## Step 3: Update Language Configuration

### Edit `src/lib/language-config.ts`

#### 1. Add to AVAILABLE_LANGUAGES

```typescript
export const AVAILABLE_LANGUAGES = ['en', 'es', 'fr'] as const;  // Add your language
```

#### 2. Add display name

```typescript
export const LANGUAGE_DISPLAY_NAMES: Record<AvailableLanguage, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français',  // Add native name
};
```

#### 3. Add LLM prompt name

```typescript
export const LANGUAGE_NAMES_FOR_PROMPTS: Record<AvailableLanguage, string> = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',  // Add English name for LLM prompts
};
```

#### 4. Add speaker prefixes

These are the prefixes that appear before speaker text in your Ra Material translations:

```typescript
export const SPEAKER_PREFIXES: Record<AvailableLanguage, {
  questioner: string[];
  ra: string[];
}> = {
  en: {
    questioner: ['Questioner:'],
    ra: ['Ra:'],
  },
  es: {
    questioner: ['Interrogador:', 'Cuestionador:'],
    ra: ['Ra:'],
  },
  fr: {
    questioner: ['Questionneur:'],  // Check actual translation
    ra: ['Ra:'],
  },
};
```

#### 5. Add UI labels (legacy support)

```typescript
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
  // ... existing languages ...
  fr: {
    questioner: 'Questionneur',
    collapse: 'Réduire',
    expand: 'Afficher plus',
    loading: 'Chargement...',
    showEnglishOriginal: 'Afficher l\'original en anglais',
    hideEnglishOriginal: 'Masquer l\'original en anglais',
    englishOriginal: 'Original en anglais',
    translationUnavailable: 'Traduction non disponible',
  },
};
```

---

## Step 4: Add next-intl Locale Routing

### Edit `src/i18n/routing.ts`

Add your locale to the routing configuration:

```typescript
export const routing = defineRouting({
  locales: ['en', 'es', 'fr'],  // Add your language
  defaultLocale: 'en',
});
```

### Edit `src/i18n/request.ts`

The locale loading should work automatically if you've added message files.

---

## Step 5: Add Study Paths

Study paths are guided lessons through the Ra Material. Each language needs its own set of translated lesson files.

### File Structure

```
src/data/study-paths/
├── densities.json        # English (default)
├── polarity.json
├── energy-centers.json
└── {lang}/               # Your new language
    ├── densities.json
    ├── polarity.json
    └── energy-centers.json
```

### Translation Process

1. Copy the English JSON files to `src/data/study-paths/{lang}/`
2. Translate all text content (titles, descriptions, lesson content)
3. Keep the structure and IDs identical to English

**Important:** Do NOT translate:
- `id` fields
- `pathId` fields
- `reference` fields (e.g., "Ra 13.23")
- JSON keys

### Update Study Paths Loader

Edit `src/lib/study-paths.ts` to import your new language:

```typescript
// Add import for your language
import densitiesDataFr from "@/data/study-paths/fr/densities.json";
import polarityDataFr from "@/data/study-paths/fr/polarity.json";
import energyCentersDataFr from "@/data/study-paths/fr/energy-centers.json";

// Add to STUDY_PATHS_BY_LANGUAGE
const STUDY_PATHS_BY_LANGUAGE: Record<string, unknown[]> = {
  en: [densitiesDataEn, polarityDataEn, energyCentersDataEn],
  es: [densitiesDataEs, polarityDataEs, energyCentersDataEs],
  fr: [densitiesDataFr, polarityDataFr, energyCentersDataFr],  // Add this
};
```

### Using Translation Scripts

You can use the existing translation script as a starting point:

```bash
# Translate study paths using LLM
npx tsx scripts/translate-study-paths.ts --language fr
```

---

## Step 6: Add Concept Graph Translations

The concept graph uses a **bilingual inline format** where each text field contains translations for all languages in a single file.

### File Location

`src/data/concept-graph.json`

### Bilingual Format

Each text field is an object with language keys:

```json
{
  "concepts": {
    "law-of-one": {
      "id": "law-of-one",
      "term": {
        "en": "Law of One",
        "es": "Ley del Uno",
        "fr": "Loi de Un"
      },
      "aliases": {
        "en": ["law of one", "the law of one"],
        "es": ["ley del uno", "la ley del uno"],
        "fr": ["loi de un", "la loi de un"]
      },
      "definition": {
        "en": "The fundamental truth that all things are one...",
        "es": "La verdad fundamental de que todas las cosas son una...",
        "fr": "La vérité fondamentale que toutes les choses sont une..."
      },
      "extendedDefinition": {
        "en": "...",
        "es": "...",
        "fr": "..."
      },
      "keyPassages": [
        {
          "reference": "1.0",
          "excerpt": {
            "en": "All things, all of life, all of the creation is part of one original thought.",
            "es": "Todas las cosas, toda la vida, toda la creación es parte del Pensamiento Original Único.",
            "fr": "Toutes les choses, toute la vie, toute la création fait partie d'une pensée originale."
          },
          "context": {
            "en": "Ra's first statement of the Law of One",
            "es": "La primera declaración de Ra sobre la Ley del Uno",
            "fr": "La première déclaration de Ra sur la Loi de Un"
          }
        }
      ]
    }
  }
}
```

### Fields to Translate

For each concept, add your language to:
- `term` - The concept name
- `aliases` - Alternative names/spellings (array)
- `definition` - Short definition
- `extendedDefinition` - Detailed explanation
- `keyPassages[].excerpt` - Quote excerpts
- `keyPassages[].context` - Context descriptions

### Fields to NOT Translate

Keep these unchanged:
- `id`
- `category`
- `relationships`
- `sessions`
- `keyPassages[].reference`

### Using Translation Scripts

```bash
# Translate concept graph using LLM
npx tsx scripts/translate-concept-graph.ts --language fr
```

---

## Step 7: Add Daily Quotes Translations

Daily quotes also use a **bilingual inline format**.

### File Location

`src/data/daily-quotes.ts`

### Bilingual Format

```typescript
export const dailyQuotes: DailyQuote[] = [
  {
    reference: "Ra 1.7",
    text: {
      en: "You are every thing, every being, every emotion...",
      es: "Eres todo, cada ser, cada emoción...",
      fr: "Tu es chaque chose, chaque être, chaque émotion...",
    },
  },
  // ... more quotes
];
```

### Translation Process

1. Open `src/data/daily-quotes.ts`
2. For each quote in the `dailyQuotes` array, add your language key to the `text` object
3. Match excerpts to your Ra Material translations in `public/sections/{lang}/`

### Using Translation Scripts

```bash
# Translate daily quotes by matching to Ra Material
npx tsx scripts/translate-daily-quotes.ts --language fr
```

**Note:** The script matches English excerpts to the corresponding Spanish text in the session files, so your Ra Material translations must be complete first.

---

## Step 8: Testing

### Run Tests

```bash
# Run all tests
npm test

# Run E2E tests
npm run test:e2e
```

### Manual Testing Checklist

1. **Language selector** - New language appears in dropdown
2. **URL routing** - `/{lang}/chat`, `/{lang}/search` work
3. **Navigation** - All nav items display correctly
4. **Homepage**
   - Daily wisdom quote shows in target language
   - "Show English original" toggle works
   - Feature cards translated
5. **Chat interface**
   - Welcome screen shows translated greetings
   - Starters display in target language
   - Responses stream correctly
   - Quote cards show translated text with "Show English original" toggle
6. **Search interface**
   - Mode selection labels translated
   - Search suggestions in target language
   - Results show translated quotes with bilingual toggle
7. **Study paths**
   - Path cards show translated titles/descriptions
   - Lesson content displays in target language
   - Quiz questions and answers translated
8. **Concept explorer** (`/explore`)
   - Concept names display in target language
   - Clicking concept shows translated definition
   - Key passages show translated excerpts
9. **About/Donate pages** - Content displays correctly
10. **Locale persistence** - Language persists across navigation

### Add E2E Smoke Tests (Optional)

Create `e2e/{lang}-locale.spec.ts` following the pattern in `e2e/spanish-locale.spec.ts`:

```typescript
test.describe("French Locale Smoke Tests", () => {
  test("should display French UI on homepage", async ({ page }) => {
    await page.goto("/fr");
    // Add assertions for French navigation
  });
  // ... more tests
});
```

---

## Step 9: Build and Deploy

```bash
# Verify build passes
npm run build

# Verify linting
npm run lint

# If all passes, commit changes
git add .
git commit -m "Add French language support"
```

---

## File Checklist

Before submitting a PR, ensure you have:

### Required Files

- [ ] `public/sections/{lang}/1.json` through `106.json` (106 files)
- [ ] `messages/{lang}/common.json`
- [ ] `messages/{lang}/about.json`
- [ ] `messages/{lang}/donate.json`

### Configuration Updates

- [ ] `src/lib/language-config.ts`:
  - [ ] `AVAILABLE_LANGUAGES`
  - [ ] `LANGUAGE_DISPLAY_NAMES`
  - [ ] `LANGUAGE_NAMES_FOR_PROMPTS`
  - [ ] `SPEAKER_PREFIXES`
  - [ ] `UI_LABELS`
- [ ] `src/i18n/routing.ts` - Add locale to `locales` array

### Study Paths

- [ ] `src/data/study-paths/{lang}/densities.json`
- [ ] `src/data/study-paths/{lang}/polarity.json`
- [ ] `src/data/study-paths/{lang}/energy-centers.json`
- [ ] `src/lib/study-paths.ts` - Add imports and update `STUDY_PATHS_BY_LANGUAGE`

### Bilingual Data (add language key to existing files)

- [ ] `src/data/concept-graph.json` - Add `{lang}` key to all bilingual fields
- [ ] `src/data/daily-quotes.ts` - Add `{lang}` key to all quote `text` objects

### Verification

- [ ] All tests pass (`npm test`)
- [ ] Build passes (`npm run build`)
- [ ] E2E tests pass (`npm run test:e2e`)
- [ ] Manual testing complete

---

## Troubleshooting

### "Quote not found" errors

- Verify session files exist in `public/sections/{lang}/`
- Check JSON format matches expected structure
- Ensure keys use format `session.question` (e.g., "50.7")

### Speaker labels not showing

- Verify `SPEAKER_PREFIXES` contains the exact prefixes used in your translations
- Check for trailing colons (e.g., "Questioner:" not "Questioner")

### Hydration errors

- Ensure no dynamic content differs between server and client
- Check that locale detection is consistent

### Missing translations fallback

- English is used as fallback if a translation key is missing
- Check browser console for missing key warnings

### Study paths not loading

- Verify imports are added to `src/lib/study-paths.ts`
- Check that `STUDY_PATHS_BY_LANGUAGE` includes your language
- Ensure JSON files have valid syntax (use a JSON validator)

### Concept graph not showing translations

- Verify your language key exists in ALL bilingual fields
- Check that `term`, `aliases`, `definition`, `extendedDefinition` all have your language
- Verify `keyPassages[].excerpt` and `keyPassages[].context` have translations

### Daily quotes showing English

- Verify your language key exists in the `text` object for each quote
- Check that the quote text matches your Ra Material translations

---

## Available Translation Scripts

The following scripts in `scripts/` can help automate translations:

| Script | Purpose |
|--------|---------|
| `translate-study-paths.ts` | Translate study path lesson content |
| `translate-study-path-quotes.ts` | Match study path quotes to Ra Material |
| `translate-concept-graph.ts` | Translate all concept graph fields |
| `translate-concept-terms.ts` | Translate concept terms only |
| `translate-concept-definitions.ts` | Translate concept definitions |
| `translate-concept-aliases.ts` | Translate concept aliases |
| `translate-daily-quotes.ts` | Match daily quotes to Ra Material |

**Usage:**
```bash
npx tsx scripts/{script-name}.ts --language {lang}
```

**Note:** Most scripts require the Ra Material translations to be complete first, as they match excerpts to the translated session files.

---

## Resources

- [next-intl documentation](https://next-intl-docs.vercel.app/)
- [L/L Research translations](https://www.llresearch.org/library/the-ra-contact-sessions-in-other-languages)
- [Multilingual implementation plan](./multilingual-implementation-plan.md)
- [Spanish locale E2E tests](../e2e/spanish-locale.spec.ts) - Reference implementation
