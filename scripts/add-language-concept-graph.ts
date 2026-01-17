#!/usr/bin/env npx tsx
/**
 * Add translations to concept graph:
 * - Key passage excerpts: Matched from Ra Material source files (sentence matching)
 * - Terms, definitions, aliases, context: Translated via GPT-5-mini
 *
 * Usage: npx tsx scripts/add-language-concept-graph.ts --lang de
 *        npx tsx scripts/add-language-concept-graph.ts --lang fr
 */

import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config({ path: path.join(__dirname, "../.env.local") });

// Parse command line arguments
const args = process.argv.slice(2);
const langIndex = args.findIndex((arg) => arg === "--lang" || arg === "--language");
const TARGET_LANG = langIndex !== -1 && args[langIndex + 1] ? args[langIndex + 1] : null;

if (!TARGET_LANG) {
  console.error("Usage: npx tsx scripts/add-language-concept-graph.ts --lang <language-code>");
  console.error("Example: npx tsx scripts/add-language-concept-graph.ts --lang de");
  process.exit(1);
}

const openai = new OpenAI();

// Language-specific configuration
interface LanguageConfig {
  speakerPrefixes: string[];
  iAmRa: string[];
  name: string;
  glossary: string;
}

const LANGUAGE_CONFIGS: Record<string, LanguageConfig> = {
  de: {
    speakerPrefixes: ["Fragesteller:"],
    iAmRa: ["Ich bin Ra."],
    name: "German",
    glossary: `
## Ra Material Terminology (English → German)
- Law of One → Gesetz des Einen
- density → Dichte / Dichtestufe
- harvest → Ernte
- catalyst → Katalysator
- distortion → Verzerrung
- polarity → Polarität
- service to others → Dienst an anderen
- service to self → Dienst am Selbst
- mind/body/spirit complex → Geist/Körper/Seele-Komplex
- social memory complex → sozialer Gedächtniskomplex
- wanderer → Wanderer
- higher self → Höheres Selbst
- intelligent infinity → intelligente Unendlichkeit
- intelligent energy → intelligente Energie
- love/light → Liebe/Licht
- light/love → Licht/Liebe
- Logos → Logos
- sub-Logos → Sub-Logos
- chakra → Chakra
- energy center → Energiezentrum
- red ray → roter Strahl
- orange ray → orangefarbener Strahl
- yellow ray → gelber Strahl
- green ray → grüner Strahl
- blue ray → blauer Strahl
- indigo ray → indigofarbener Strahl
- violet ray → violetter Strahl
- archetypical mind → archetypischer Verstand
- veil of forgetting → Schleier des Vergessens
- incarnation → Inkarnation
- the One Infinite Creator → der Eine Unendliche Schöpfer
- free will → freier Wille
- Ra → Ra
- Confederation → Konföderation
- Questioner → Fragesteller
- other-self → Anderes-Selbst
- space/time → Raum/Zeit
- time/space → Zeit/Raum
`,
  },
  es: {
    speakerPrefixes: ["Interrogador:", "Cuestionador:"],
    iAmRa: ["Soy Ra."],
    name: "Spanish",
    glossary: `
## Ra Material Terminology (English → Spanish)
- Law of One → Ley del Uno
- density → densidad
- harvest → cosecha
- catalyst → catalizador
- distortion → distorsión
- polarity → polaridad
- service to others → servicio a otros
- service to self → servicio al yo
- mind/body/spirit complex → complejo mente/cuerpo/espíritu
- social memory complex → complejo de memoria social
- wanderer → errante
- higher self → yo superior
- intelligent infinity → infinito inteligente
- intelligent energy → energía inteligente
- love/light → amor/luz
- light/love → luz/amor
- Logos → Logos
- sub-Logos → sub-Logos
- chakra → chakra
- energy center → centro de energía
- archetypical mind → mente arquetípica
- veil of forgetting → velo del olvido
- incarnation → encarnación
- the One Infinite Creator → el Creador Infinito Único
- free will → libre albedrío
- Ra → Ra
- Confederation → Confederación
`,
  },
  fr: {
    speakerPrefixes: ["Questionneur:"],
    iAmRa: ["Je suis Ra."],
    name: "French",
    glossary: `
## Ra Material Terminology (English → French)
- Law of One → Loi de l'Un
- density → densité
- harvest → moisson
- catalyst → catalyseur
- distortion → distorsion
- polarity → polarité
- service to others → service d'autrui
- service to self → service de soi
- mind/body/spirit complex → complexe mental/corps/esprit
- social memory complex → complexe mémoriel sociétal
- wanderer → errant
- higher self → soi supérieur
- intelligent infinity → infini intelligent
- intelligent energy → énergie intelligente
- love/light → amour/lumière
- light/love → lumière/amour
- Logos → Logos
- sub-Logos → sous-Logos
- chakra → chakra
- energy center → centre énergétique
- archetypical mind → mental archétypal
- veil of forgetting → voile de l'oubli
- incarnation → incarnation
- the One Infinite Creator → l'Un Créateur Infini
- free will → libre arbitre
- Ra → Ra
- Confederation → Confédération
`,
  },
};

if (!TARGET_LANG) {
  console.error("Usage: npx tsx scripts/add-language-concept-graph.ts --lang <language-code>");
  console.error("Example: npx tsx scripts/add-language-concept-graph.ts --lang de");
  process.exit(1);
}

const config = LANGUAGE_CONFIGS[TARGET_LANG];
if (!config) {
  console.error(`Language "${TARGET_LANG}" not configured.`);
  console.error(`Available languages: ${Object.keys(LANGUAGE_CONFIGS).join(", ")}`);
  console.error("\nTo add a new language, add its config (including glossary) to LANGUAGE_CONFIGS.");
  process.exit(1);
}

// After validation, TARGET_LANG is definitely a valid string
const LANG = TARGET_LANG;

// Build regex patterns for speaker removal
const allSpeakerPrefixes = [
  "Ra:",
  "Questioner:",
  ...Object.values(LANGUAGE_CONFIGS).flatMap((c) => c.speakerPrefixes),
];
const speakerPrefixRegex = new RegExp(
  `^(${allSpeakerPrefixes.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})\\s*`,
  "i"
);

const allIAmRa = ["I am Ra.", ...Object.values(LANGUAGE_CONFIGS).flatMap((c) => c.iAmRa)];
const iAmRaRegex = new RegExp(
  `^(${allIAmRa.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})\\s*`,
  "i"
);

// Types
interface BilingualText {
  en: string;
  es: string;
  [key: string]: string | undefined;
}

interface BilingualAliases {
  en: string[];
  es: string[];
  [key: string]: string[] | undefined;
}

interface BilingualKeyPassage {
  reference: string;
  excerpt: BilingualText;
  context: BilingualText;
}

interface BilingualConcept {
  id: string;
  term: BilingualText;
  aliases: BilingualAliases;
  category: string;
  subcategory?: string;
  definition: BilingualText;
  extendedDefinition: BilingualText;
  relationships: Record<string, string[]>;
  sessions: { primary: number[]; secondary: number[] };
  keyPassages: BilingualKeyPassage[];
  searchTerms: string[];
  teachingLevel: string;
}

interface BilingualCategoryInfo {
  name: BilingualText;
  description: BilingualText;
  concepts: string[];
}

interface ConceptGraph {
  version: string;
  generated: string;
  concepts: Record<string, BilingualConcept>;
  categories: Record<string, BilingualCategoryInfo>;
}

// Load section file
function loadSection(language: string, session: number): Record<string, string> | null {
  const sectionPath = path.join(__dirname, `../public/sections/${language}/${session}.json`);
  try {
    return JSON.parse(fs.readFileSync(sectionPath, "utf-8"));
  } catch {
    return null;
  }
}

// Parse reference like "1.7" to { session: 1, question: 7 }
function parseReference(reference: string): { session: number; question: number } | null {
  const match = reference.match(/^(\d+)\.(\d+)$/);
  if (!match) return null;
  return {
    session: parseInt(match[1], 10),
    question: parseInt(match[2], 10),
  };
}

// Split text into sentences
function splitIntoSentences(text: string): string[] {
  const cleaned = text.replace(speakerPrefixRegex, "").replace(iAmRaRegex, "");
  return cleaned
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function countSentences(text: string): number {
  return splitIntoSentences(text).length;
}

function normalizeForComparison(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[""„"«»]/g, '"')
    .replace(/[''‚']/g, "'")
    .trim();
}

function findSentenceRange(
  excerpt: string,
  fullText: string
): { start: number; end: number } | null {
  const excerptSentences = splitIntoSentences(excerpt);
  const fullSentences = splitIntoSentences(fullText);

  if (excerptSentences.length === 0 || fullSentences.length === 0) {
    return null;
  }

  const normalizedFirst = normalizeForComparison(excerptSentences[0]);

  for (let i = 0; i < fullSentences.length; i++) {
    const normalizedFull = normalizeForComparison(fullSentences[i]);

    if (
      normalizedFull.includes(normalizedFirst.slice(0, 50)) ||
      normalizedFirst.includes(normalizedFull.slice(0, 50))
    ) {
      let matchLength = 0;
      for (let j = 0; j < excerptSentences.length && i + j < fullSentences.length; j++) {
        const excerptNorm = normalizeForComparison(excerptSentences[j]);
        const fullNorm = normalizeForComparison(fullSentences[i + j]);

        if (
          excerptNorm.slice(0, 30) === fullNorm.slice(0, 30) ||
          fullNorm.includes(excerptNorm.slice(0, 40)) ||
          excerptNorm.includes(fullNorm.slice(0, 40))
        ) {
          matchLength++;
        } else {
          break;
        }
      }

      if (matchLength >= excerptSentences.length * 0.8) {
        return { start: i, end: i + excerptSentences.length - 1 };
      }
    }
  }

  return null;
}

// Find excerpt from Ra Material using sentence matching
function findExcerpt(englishExcerpt: string, reference: string): string | null {
  const ref = parseReference(reference);
  if (!ref) return null;

  const englishSection = loadSection("en", ref.session);
  const targetSection = loadSection(LANG, ref.session);

  if (!englishSection || !targetSection) return null;

  const key = `${ref.session}.${ref.question}`;
  const englishFull = englishSection[key];
  const targetFull = targetSection[key];

  if (!englishFull || !targetFull) return null;

  const range = findSentenceRange(englishExcerpt, englishFull);
  if (!range) return null;

  const excerptSentenceCount = countSentences(englishExcerpt);
  const targetSentences = splitIntoSentences(targetFull);
  const endIndex = Math.min(range.start + excerptSentenceCount - 1, targetSentences.length - 1);

  return targetSentences.slice(range.start, endIndex + 1).join(" ");
}

// Translate text using GPT-5-mini
async function translateWithGPT(
  texts: { key: string; text: string }[]
): Promise<Record<string, string>> {
  if (texts.length === 0) return {};

  const prompt = `Translate the following English texts to ${config.name}. These are from the Ra Material (Law of One), a spiritual text. Use the terminology glossary for consistent translations.

${config.glossary}

Translate each text naturally and accurately. Return a JSON object with the same keys and ${config.name} translations as values.

Texts to translate:
${JSON.stringify(Object.fromEntries(texts.map((t) => [t.key, t.text])), null, 2)}

Return ONLY the JSON object with ${config.name} translations, no other text.`;

  const response = await openai.chat.completions.create({
    model: "gpt-5-mini",
    messages: [{ role: "user", content: prompt }],
  });

  const content = response.choices[0]?.message?.content || "{}";

  // Extract JSON from response
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return {};

  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    console.error("Failed to parse GPT response");
    return {};
  }
}

// Main function
async function main() {
  console.log(`=== Add ${config.name} Concept Graph Translations ===\n`);

  // Load concept graph
  const graphPath = path.join(__dirname, "../src/data/concept-graph.json");
  const graph: ConceptGraph = JSON.parse(fs.readFileSync(graphPath, "utf-8"));

  const conceptIds = Object.keys(graph.concepts);
  console.log(`Processing ${conceptIds.length} concepts...\n`);

  let passagesMatched = 0;
  let passagesFailed = 0;
  let skipped = 0;

  // Process concepts in batches for GPT translations
  const BATCH_SIZE = 10;

  for (let i = 0; i < conceptIds.length; i += BATCH_SIZE) {
    const batch = conceptIds.slice(i, i + BATCH_SIZE);
    console.log(`\nBatch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(conceptIds.length / BATCH_SIZE)}`);

    // Collect texts to translate for this batch
    const textsToTranslate: { key: string; text: string }[] = [];

    for (const id of batch) {
      const concept = graph.concepts[id];

      // Skip if already has this language
      if (concept.term[LANG]) {
        skipped++;
        continue;
      }

      // Add term
      textsToTranslate.push({ key: `${id}.term`, text: concept.term.en });

      // Add definition
      textsToTranslate.push({ key: `${id}.definition`, text: concept.definition.en });

      // Add extended definition
      textsToTranslate.push({
        key: `${id}.extendedDefinition`,
        text: concept.extendedDefinition.en,
      });

      // Add key passage contexts
      for (let j = 0; j < concept.keyPassages.length; j++) {
        const passage = concept.keyPassages[j];
        if (!passage.context[LANG]) {
          textsToTranslate.push({
            key: `${id}.passage.${j}.context`,
            text: passage.context.en,
          });
        }
      }
    }

    // Translate via GPT
    let translations: Record<string, string> = {};
    if (textsToTranslate.length > 0) {
      console.log(`  Translating ${textsToTranslate.length} texts via GPT...`);
      translations = await translateWithGPT(textsToTranslate);
    }

    // Apply translations and match excerpts
    for (const id of batch) {
      const concept = graph.concepts[id];

      // Skip if already has this language
      if (concept.term[LANG]) {
        continue;
      }

      // Apply GPT translations
      if (translations[`${id}.term`]) {
        concept.term[LANG] = translations[`${id}.term`];
      }
      if (translations[`${id}.definition`]) {
        concept.definition[LANG] = translations[`${id}.definition`];
      }
      if (translations[`${id}.extendedDefinition`]) {
        concept.extendedDefinition[LANG] = translations[`${id}.extendedDefinition`];
      }

      // Translate aliases (derive from term if simple)
      if (!concept.aliases[LANG]) {
        concept.aliases[LANG] = concept.aliases.en.map((alias) => {
          const termTarget = concept.term[LANG] || concept.term.en;
          if (alias.toLowerCase() === concept.term.en.toLowerCase()) {
            return termTarget.toLowerCase();
          }
          return alias; // Keep English as fallback
        });
      }

      // Match key passage excerpts from Ra Material
      for (let j = 0; j < concept.keyPassages.length; j++) {
        const passage = concept.keyPassages[j];

        // Match excerpt from source
        if (!passage.excerpt[LANG]) {
          const excerpt = findExcerpt(passage.excerpt.en, passage.reference);
          if (excerpt) {
            passage.excerpt[LANG] = excerpt;
            passagesMatched++;
          } else {
            passagesFailed++;
          }
        }

        // Apply GPT context translation
        if (translations[`${id}.passage.${j}.context`]) {
          passage.context[LANG] = translations[`${id}.passage.${j}.context`];
        }
      }

      console.log(`  ${id}: ${concept.term[LANG] || concept.term.en}`);
    }

    // Small delay between batches to avoid rate limits
    if (i + BATCH_SIZE < conceptIds.length) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  // Translate categories
  console.log("\nTranslating categories...");
  const categoryTexts: { key: string; text: string }[] = [];

  for (const [catId, cat] of Object.entries(graph.categories)) {
    if (!cat.name[LANG]) {
      categoryTexts.push({ key: `cat.${catId}.name`, text: cat.name.en });
    }
    if (!cat.description[LANG]) {
      categoryTexts.push({ key: `cat.${catId}.description`, text: cat.description.en });
    }
  }

  if (categoryTexts.length > 0) {
    const catTranslations = await translateWithGPT(categoryTexts);
    for (const [catId, cat] of Object.entries(graph.categories)) {
      if (catTranslations[`cat.${catId}.name`]) {
        cat.name[LANG] = catTranslations[`cat.${catId}.name`];
      }
      if (catTranslations[`cat.${catId}.description`]) {
        cat.description[LANG] = catTranslations[`cat.${catId}.description`];
      }
    }
  }

  // Update version and date
  graph.version = "2.0-multilingual";
  graph.generated = new Date().toISOString().split("T")[0];

  // Write output
  fs.writeFileSync(graphPath, JSON.stringify(graph, null, 2));

  console.log("\n=== Summary ===");
  console.log(`Concepts processed: ${conceptIds.length - skipped}`);
  if (skipped > 0) {
    console.log(`Concepts skipped (already translated): ${skipped}`);
  }
  console.log(`Key passages matched: ${passagesMatched}`);
  console.log(`Key passages not matched: ${passagesFailed}`);
  console.log(`\nUpdated: ${graphPath}`);
}

main().catch(console.error);
