# Adding a New Language

This guide explains how to add a new language to the Law of One Study Tool.

## Overview

Adding a language requires:
1. **Ra Material translations** (106 session files) - Scrape from L/L Research
2. **Language configuration** (language-config.ts) - Manual updates
3. **UI translations** (3 message files) - Claude Code translation
4. **Study paths** (3 JSON files per language) - GPT-5-mini script
5. **Concept graph translations** - GPT-5-mini + sentence matching
6. **Daily quotes translations** - Sentence matching from Ra Material
7. **E2E tests** - Based on existing locale tests

**Estimated time:** 2-4 hours with AI assistance

## Translation Methods

| Content | Method | Tool |
|---------|--------|------|
| Ra Material (106 sessions) | Scrape L/L Research | `scripts/scrape-llresearch-translations.ts` |
| UI translations (3 files) | Direct translation | Claude Code |
| Study paths (3 files) | LLM translation | `scripts/translate-study-paths.ts` + GPT-5-mini |
| Concept graph terms/definitions | LLM translation | `scripts/add-language-concept-graph.ts` + GPT-5-mini |
| Concept graph excerpts | Sentence matching | Script matches to Ra Material source |
| Daily quotes | Sentence matching | `scripts/add-language-daily-quotes.ts` |
| E2E tests | Adapt from existing | Based on `e2e/spanish-locale.spec.ts` |

## Important Policies

### Strict Quote Requirement

**All Ra Material quotes MUST be extracted via sentence matching from the source translations, never translated by LLM.**

This ensures:
- Quotes match the official L/L Research translations exactly
- No semantic drift from LLM paraphrasing
- Links to source material are accurate
- Terminology consistency with official translations

Scripts that use sentence matching for quotes:
- `add-language-daily-quotes.ts` - Daily quotes
- `add-language-concept-graph.ts` - Key passage excerpts
- `fix-all-missing-excerpts.ts` - Fill in missing excerpt translations

If sentence matching fails for a quote, investigate the source material rather than falling back to LLM translation. Common causes:
1. The Ra Material translation is missing that passage (gap in L/L Research translation)
2. The reference is incorrect
3. The quote has unusual formatting

For genuine gaps in L/L Research translations (rare), you may use GPT to translate the English passage directly, then add it to both the Ra Material source files and the concept graph.

### All Translations Required

All supported languages must have complete translations - **no fallbacks to English**. The schemas enforce this at build time.

When adding a new language:
1. Complete ALL translations before merging
2. Run `npm run build` to verify schema validation passes
3. Use `fix-all-missing-excerpts.ts` to fill any gaps from sentence matching

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

If the language is available on L/L Research, use the scrape script:

```bash
# Example: Scrape German translations (all 106 sessions)
npx tsx scripts/scrape-llresearch-translations.ts --lang de --all

# Or scrape a specific session
npx tsx scripts/scrape-llresearch-translations.ts --lang de --session 1
```

**Note:** All 106 sessions should be scraped (1-106).

The script:
1. Reads the English source files from `public/sections/en/`
2. Fetches the translated version from L/L Research
3. Writes JSON files to `public/sections/{lang}/`

---

## Step 2: Add Language Configuration

Before adding translations, configure the language in the codebase.

### Edit `src/lib/language-config.ts`

Add the language to all configuration maps. See Step 3 in the original flow for details.

---

## Step 3: Add UI Translations

UI translations are best done with Claude Code, which can translate the structured JSON files directly.

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

Study paths are guided lessons through the Ra Material. Use the translation script with GPT-5-mini.

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

Use the translation script which calls GPT-5-mini:

```bash
# Translate study paths using GPT-5-mini
npx tsx scripts/translate-study-paths.ts --language de
```

The script:
1. Reads English study path files
2. Sends content to GPT-5-mini with a Ra Material terminology glossary
3. Writes translated files to `src/data/study-paths/{lang}/`

**Note:** The script includes terminology glossaries for Spanish and German. For other languages, add a glossary to the script first.

### Update Study Paths Loader

After translation, edit `src/lib/study-paths.ts` to import your new language:

```typescript
// Add import for your language
import densitiesDataDe from "@/data/study-paths/de/densities.json";
import polarityDataDe from "@/data/study-paths/de/polarity.json";
import energyCentersDataDe from "@/data/study-paths/de/energy-centers.json";

// Add to STUDY_PATHS_BY_LANGUAGE
const STUDY_PATHS_BY_LANGUAGE: Record<string, unknown[]> = {
  en: [densitiesDataEn, polarityDataEn, energyCentersDataEn],
  es: [densitiesDataEs, polarityDataEs, energyCentersDataEs],
  de: [densitiesDataDe, polarityDataDe, energyCentersDataDe],  // Add this
};
```

---

## Step 6: Add Concept Graph Translations

The concept graph uses a **trilingual inline format**. Translation uses a hybrid approach:
- **Terms, definitions, aliases, context**: GPT-5-mini translation
- **Key passage excerpts**: Sentence matching from Ra Material source files

### File Location

`src/data/concept-graph.json`

### Translation Process

Use the generalized translation script:

```bash
# Add concept graph translations for your language
npx tsx scripts/add-language-concept-graph.ts --lang de
```

The script supports: `de`, `es`, `fr` (add more in `LANGUAGE_CONFIGS`).

The script:
1. **GPT-5-mini translation** for:
   - `term` - Concept names
   - `aliases` - Alternative names
   - `definition` - Short definitions
   - `extendedDefinition` - Detailed explanations
   - `keyPassages[].context` - Context descriptions
   - Category names and descriptions

2. **Sentence matching** for `keyPassages[].excerpt`:
   - Finds the English excerpt in the full English Q&A
   - Identifies sentence positions (e.g., sentences 3-5)
   - Extracts the same sentences from your Ra Material translation
   - Ensures quotes match the actual translated Ra Material

### Why Sentence Matching for Excerpts?

Key passage excerpts must match the actual Ra Material translations exactly. Using sentence matching ensures:
- Quotes display correctly when users click to source
- No drift between displayed quotes and linked content
- Consistent terminology with official translations

### Trilingual Format Example

```json
{
  "term": {
    "en": "Law of One",
    "es": "Ley del Uno",
    "de": "Gesetz des Einen"
  },
  "keyPassages": [
    {
      "reference": "1.0",
      "excerpt": {
        "en": "All things, all of life, all of the creation is part of one original thought.",
        "es": "Todas las cosas, toda la vida, toda la creación es parte del Pensamiento Original Único.",
        "de": "Alle Dinge, alles Leben, die gesamte Schöpfung ist Teil eines ursprünglichen Gedankens."
      }
    }
  ]
}
```

### Fields to NOT Translate

Keep these unchanged:
- `id`
- `category`
- `relationships`
- `sessions`
- `keyPassages[].reference`
- `searchTerms` (English only for search)

### Update Zod Validation Schema

**CRITICAL:** Update the Zod schema in `src/lib/schemas/concept-graph.ts` to include your new language as **required**. Without this, the build will fail.

Add your language to both schema definitions:

```typescript
// BilingualTextSchema - for text fields (ALL languages required)
export const BilingualTextSchema = z.object({
  en: z.string(),
  es: z.string(),
  de: z.string(),
  fr: z.string(),
  {lang}: z.string(),  // Add your language as required
});

// BilingualAliasesSchema - for alias arrays (ALL languages required)
export const BilingualAliasesSchema = z.object({
  en: z.array(z.string()),
  es: z.array(z.string()),
  de: z.array(z.string()),
  fr: z.array(z.string()),
  {lang}: z.array(z.string()),  // Add your language as required
});
```

**Why required:** All translations must be complete before merging. The build will fail if any language field is missing.

Also update `src/lib/types-graph.ts` to match:

```typescript
export interface BilingualText {
  en: string;
  es: string;
  de: string;
  fr: string;
  {lang}: string;  // Add your language
}
```

### Grammatical Variations (Optional)

For languages with grammatical cases that change adjective/noun endings (like German), manually add declined form aliases to the concept graph. This ensures concept detection works when the AI uses different grammatical cases (e.g., "dritte Dichte" vs "dritten Dichte" vs "dritter Dichte").

---

## Step 7: Add Daily Quotes Translations

Daily quotes use **sentence matching** to extract translations from your Ra Material source files.

### File Location

`src/data/daily-quotes.ts`

### Translation Process

Use the generalized translation script:

```bash
# Add daily quotes translations for your language
npx tsx scripts/add-language-daily-quotes.ts --lang de
```

The script supports: `de`, `es`, `fr`, `pt`, `it`, `nl`, `pl`, `ru` (add more in `LANGUAGE_CONFIGS`).

The script:
1. Reads each quote's reference (e.g., "Ra 1.7")
2. Loads the full English and translated Q&A from session files
3. Finds where the English excerpt appears using sentence matching
4. Extracts the corresponding sentences from your translation
5. Updates `daily-quotes.ts` with the matched translations

### Why Sentence Matching?

Daily quotes are excerpts from the Ra Material. Using sentence matching:
- Ensures quotes match the official translations exactly
- Avoids LLM "drift" where paraphrasing changes meaning
- Maintains consistency with what users see in source links

### Expected Results

For German, 89/92 quotes matched successfully:
- 77 high confidence (exact sentence boundary match)
- 12 medium confidence (position-based match)
- 3 not found (very short or unusual formatting)

Unmatched quotes can be translated manually or left as English fallback.

### Trilingual Format

```typescript
export const dailyQuotes: DailyQuote[] = [
  {
    reference: "Ra 1.7",
    text: {
      en: "You are every thing, every being, every emotion...",
      es: "Eres todo, cada ser, cada emoción...",
      de: "Du bist jedes Ding, jedes Wesen, jede Emotion...",
    },
  },
];
```

**Note:** Your Ra Material translations must be complete before running this script.

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

### Add E2E Smoke Tests

Create `e2e/{lang}-locale.spec.ts` following the pattern in `e2e/german-locale.spec.ts` or `e2e/spanish-locale.spec.ts`:

```bash
# Copy the German test file as a template
cp e2e/german-locale.spec.ts e2e/{lang}-locale.spec.ts
```

Update the test file:
1. Change mock response text to your language
2. Update navigation link names (e.g., "Suchen" → your translation of "Seek")
3. Update content assertions to match your translations

The tests cover:
- Homepage displays translated UI
- Chat interface in target language
- Search with translated labels
- Study paths page
- Explore page
- Locale persistence across navigation

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
- [ ] `e2e/{lang}-locale.spec.ts` - E2E smoke tests

### Configuration Updates

- [ ] `src/lib/language-config.ts`:
  - [ ] `AVAILABLE_LANGUAGES`
  - [ ] `LANGUAGE_DISPLAY_NAMES`
  - [ ] `LANGUAGE_NAMES_FOR_PROMPTS`
  - [ ] `SPEAKER_PREFIXES`
  - [ ] `UI_LABELS`
- [ ] `src/i18n/routing.ts` - Add locale to `locales` array (automatic if using `AVAILABLE_LANGUAGES`)
- [ ] `src/components/LanguageSelector.tsx` - Add language code to `LANGUAGE_CODES`

### Study Paths

- [ ] `src/data/study-paths/{lang}/densities.json`
- [ ] `src/data/study-paths/{lang}/polarity.json`
- [ ] `src/data/study-paths/{lang}/energy-centers.json`
- [ ] `src/lib/study-paths.ts` - Add imports and update `STUDY_PATHS_BY_LANGUAGE`

### Multilingual Data (add language key to existing files)

- [ ] `src/data/concept-graph.json` - Add `{lang}` key to ALL bilingual fields (required)
- [ ] `src/data/daily-quotes.ts` - Add `{lang}` key to ALL quote `text` objects (required)
- [ ] `src/lib/types-graph.ts` - Add `{lang}: string` to `BilingualText` interface (required, not optional)

### Schema Updates (CRITICAL)

- [ ] `src/lib/schemas/concept-graph.ts` - Add `{lang}` to both (as required):
  - [ ] `BilingualTextSchema` - e.g., `pt: z.string()`
  - [ ] `BilingualAliasesSchema` - e.g., `pt: z.array(z.string())`

### Type Updates (ALL languages required)

Update these interfaces to add your language as required (not optional):
- [ ] `src/lib/types-graph.ts` - `BilingualText` and `BilingualAliases` interfaces
- [ ] `src/data/daily-quotes.ts` - `DailyQuote` interface `text` field

### Verification

- [ ] All tests pass (`npm test`)
- [ ] Build passes (`npm run build`)
- [ ] Lint passes (`npm run lint`)
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

- **Check Zod schema first**: Ensure `src/lib/schemas/concept-graph.ts` includes your language in both `BilingualTextSchema` and `BilingualAliasesSchema`. Zod strips unknown fields during validation.
- Verify your language key exists in ALL bilingual fields
- Check that `term`, `aliases`, `definition`, `extendedDefinition` all have your language
- Verify `keyPassages[].excerpt` and `keyPassages[].context` have translations

### Concept popovers show English content but German UI labels

This symptom indicates Zod validation is stripping your translations:
- UI labels come from next-intl (working correctly)
- Content comes from concept-graph.json after Zod validation (being stripped)
- **Fix**: Add your language to the Zod schemas in `src/lib/schemas/concept-graph.ts`

### Daily quotes showing English

- Verify your language key exists in the `text` object for each quote
- Check that the quote text matches your Ra Material translations

---

## Available Translation Scripts

### Recommended Scripts

| Script | Purpose | Method |
|--------|---------|--------|
| `scrape-llresearch-translations.ts` | Scrape Ra Material from L/L Research | Web scraping |
| `translate-study-paths.ts` | Translate study path lessons | GPT-5-mini |
| `translate-study-path-quotes.ts` | Translate study path Ra quotes | Sentence matching |
| `add-language-concept-graph.ts` | Add translations to concept graph | GPT-5-mini + sentence matching |
| `add-language-daily-quotes.ts` | Add translations to daily quotes | Sentence matching |
| `validate-quotes.ts` | Validate quotes match Ra Material source | Comparison |
| `fix-all-missing-excerpts.ts` | Fill missing excerpt translations | Sentence matching |

**Usage:**
```bash
# Scrape Ra Material (all 106 sessions)
npx tsx scripts/scrape-llresearch-translations.ts --lang de --all

# Translate study paths (UI content via GPT-5-mini)
npx tsx scripts/translate-study-paths.ts --language de

# Translate study path quotes (Ra Material excerpts via sentence matching)
npx tsx scripts/translate-study-path-quotes.ts --lang de

# Add concept graph translations
npx tsx scripts/add-language-concept-graph.ts --lang de

# Add daily quotes translations
npx tsx scripts/add-language-daily-quotes.ts --lang de

# Validate all quotes match source material
npx tsx scripts/validate-quotes.ts --lang de

# Fix any missing excerpt translations
npx tsx scripts/fix-all-missing-excerpts.ts
```

### Adding Support for a New Language

The generalized scripts have language configs built-in. To add a new language:

1. **For daily quotes** (`add-language-daily-quotes.ts`):
   - Add entry to `LANGUAGE_CONFIGS` with speaker prefixes and "I am Ra" equivalent

2. **For concept graph** (`add-language-concept-graph.ts`):
   - Add entry to `LANGUAGE_CONFIGS` with speaker prefixes, "I am Ra", and terminology glossary

Example config:
```typescript
fr: {
  speakerPrefixes: ["Questionneur:"],
  iAmRa: ["Je suis Ra."],
  name: "French",
  glossary: `
## Ra Material Terminology (English → French)
- Law of One → Loi de l'Un
- density → densité
...
`,
}
```

### Legacy Scripts (Spanish-only)

These older scripts were designed for Spanish and may need adaptation:

| Script | Purpose |
|--------|---------|
| `translate-concept-graph.ts` | Original bilingual concept graph script |
| `translate-daily-quotes.ts` | Original bilingual daily quotes script |

**Note:** Ra Material translations must be complete before running excerpt-matching scripts.

---

## Resources

- [next-intl documentation](https://next-intl-docs.vercel.app/)
- [L/L Research translations](https://www.llresearch.org/library/the-ra-contact-sessions-in-other-languages)
- [Multilingual implementation plan](./multilingual-implementation-plan.md)

### Reference Implementations

- [German locale E2E tests](../e2e/german-locale.spec.ts) - Latest reference
- [Spanish locale E2E tests](../e2e/spanish-locale.spec.ts) - Alternative reference
- [Concept graph translation script](../scripts/add-language-concept-graph.ts) - GPT + sentence matching
- [Daily quotes translation script](../scripts/add-language-daily-quotes.ts) - Sentence matching
