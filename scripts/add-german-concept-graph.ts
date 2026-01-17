#!/usr/bin/env npx tsx
/**
 * Add German translations to concept graph:
 * - Key passage excerpts: Matched from German Ra Material source files
 * - Terms, definitions, aliases, context: Translated via GPT-5-mini
 *
 * Usage: npx tsx scripts/add-german-concept-graph.ts
 */

import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config({ path: path.join(__dirname, "../.env.local") });

const openai = new OpenAI();

// Types
interface BilingualText {
  en: string;
  es: string;
  de?: string;
}

interface BilingualAliases {
  en: string[];
  es: string[];
  de?: string[];
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

// German terminology glossary for consistent translations
const GERMAN_GLOSSARY = `
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
- first density → erste Dichte
- second density → zweite Dichte
- third density → dritte Dichte
- fourth density → vierte Dichte
- fifth density → fünfte Dichte
- sixth density → sechste Dichte
- seventh density → siebte Dichte
- octave → Oktave
- the One Infinite Creator → der Eine Unendliche Schöpfer
- free will → freier Wille
- Ra → Ra
- Confederation → Konföderation
- Questioner → Fragesteller
- other-self → Anderes-Selbst
- space/time → Raum/Zeit
- time/space → Zeit/Raum
- adept → Adept
- seeking → Suche
- balancing → Ausbalancieren
- meditation → Meditation
`;

// Load section file
function loadSection(
  language: "en" | "es" | "de",
  session: number
): Record<string, string> | null {
  const sectionPath = path.join(
    __dirname,
    `../public/sections/${language}/${session}.json`
  );
  try {
    return JSON.parse(fs.readFileSync(sectionPath, "utf-8"));
  } catch {
    return null;
  }
}

// Parse reference like "1.7" to { session: 1, question: 7 }
function parseReference(
  reference: string
): { session: number; question: number } | null {
  const match = reference.match(/^(\d+)\.(\d+)$/);
  if (!match) return null;
  return {
    session: parseInt(match[1], 10),
    question: parseInt(match[2], 10),
  };
}

// Split text into sentences
function splitIntoSentences(text: string): string[] {
  const cleaned = text
    .replace(/^(Ra:|Questioner:|Fragesteller:)\s*/i, "")
    .replace(/^Ich bin Ra\.\s*/i, "")
    .replace(/^I am Ra\.\s*/i, "");

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
    .replace(/[""„"]/g, '"')
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
      for (
        let j = 0;
        j < excerptSentences.length && i + j < fullSentences.length;
        j++
      ) {
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

// Find German excerpt from Ra Material
function findGermanExcerpt(
  englishExcerpt: string,
  reference: string
): string | null {
  const ref = parseReference(reference);
  if (!ref) return null;

  const englishSection = loadSection("en", ref.session);
  const germanSection = loadSection("de", ref.session);

  if (!englishSection || !germanSection) return null;

  const key = `${ref.session}.${ref.question}`;
  const englishFull = englishSection[key];
  const germanFull = germanSection[key];

  if (!englishFull || !germanFull) return null;

  const range = findSentenceRange(englishExcerpt, englishFull);
  if (!range) return null;

  const excerptSentenceCount = countSentences(englishExcerpt);
  const germanSentences = splitIntoSentences(germanFull);
  const endIndex = Math.min(
    range.start + excerptSentenceCount - 1,
    germanSentences.length - 1
  );

  return germanSentences.slice(range.start, endIndex + 1).join(" ");
}

// Translate text using GPT-5-mini
async function translateWithGPT(
  texts: { key: string; text: string }[]
): Promise<Record<string, string>> {
  if (texts.length === 0) return {};

  const prompt = `Translate the following English texts to German. These are from the Ra Material (Law of One), a spiritual text. Use the terminology glossary for consistent translations.

${GERMAN_GLOSSARY}

Translate each text naturally and accurately. Return a JSON object with the same keys and German translations as values.

Texts to translate:
${JSON.stringify(
  Object.fromEntries(texts.map((t) => [t.key, t.text])),
  null,
  2
)}

Return ONLY the JSON object with German translations, no other text.`;

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
  console.log("=== Add German Concept Graph Translations ===\n");

  // Load concept graph
  const graphPath = path.join(__dirname, "../src/data/concept-graph.json");
  const graph: ConceptGraph = JSON.parse(fs.readFileSync(graphPath, "utf-8"));

  const conceptIds = Object.keys(graph.concepts);
  console.log(`Processing ${conceptIds.length} concepts...\n`);

  let passagesMatched = 0;
  let passagesFailed = 0;

  // Process concepts in batches for GPT translations
  const BATCH_SIZE = 10;

  for (let i = 0; i < conceptIds.length; i += BATCH_SIZE) {
    const batch = conceptIds.slice(i, i + BATCH_SIZE);
    console.log(
      `\nBatch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(conceptIds.length / BATCH_SIZE)}`
    );

    // Collect texts to translate for this batch
    const textsToTranslate: { key: string; text: string }[] = [];

    for (const id of batch) {
      const concept = graph.concepts[id];

      // Add term if no German yet
      if (!concept.term.de) {
        textsToTranslate.push({ key: `${id}.term`, text: concept.term.en });
      }

      // Add definition if no German yet
      if (!concept.definition.de) {
        textsToTranslate.push({
          key: `${id}.definition`,
          text: concept.definition.en,
        });
      }

      // Add extended definition if no German yet
      if (!concept.extendedDefinition.de) {
        textsToTranslate.push({
          key: `${id}.extendedDefinition`,
          text: concept.extendedDefinition.en,
        });
      }

      // Add key passage contexts if no German yet
      for (let j = 0; j < concept.keyPassages.length; j++) {
        const passage = concept.keyPassages[j];
        if (!passage.context.de) {
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

      // Apply GPT translations
      if (translations[`${id}.term`]) {
        concept.term.de = translations[`${id}.term`];
      }
      if (translations[`${id}.definition`]) {
        concept.definition.de = translations[`${id}.definition`];
      }
      if (translations[`${id}.extendedDefinition`]) {
        concept.extendedDefinition.de = translations[`${id}.extendedDefinition`];
      }

      // Translate aliases (derive from term if simple)
      if (!concept.aliases.de) {
        concept.aliases.de = concept.aliases.en.map((alias) => {
          // Try to find in translations or lowercase the term
          const termDe = concept.term.de || concept.term.en;
          if (alias.toLowerCase() === concept.term.en.toLowerCase()) {
            return termDe.toLowerCase();
          }
          return alias; // Keep English as fallback
        });
      }

      // Match key passage excerpts from German Ra Material
      for (let j = 0; j < concept.keyPassages.length; j++) {
        const passage = concept.keyPassages[j];

        // Match excerpt from source
        if (!passage.excerpt.de) {
          const germanExcerpt = findGermanExcerpt(
            passage.excerpt.en,
            passage.reference
          );
          if (germanExcerpt) {
            passage.excerpt.de = germanExcerpt;
            passagesMatched++;
          } else {
            passagesFailed++;
          }
        }

        // Apply GPT context translation
        if (translations[`${id}.passage.${j}.context`]) {
          passage.context.de = translations[`${id}.passage.${j}.context`];
        }
      }

      console.log(`  ${id}: ${concept.term.de || concept.term.en}`);
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
    if (!cat.name.de) {
      categoryTexts.push({ key: `cat.${catId}.name`, text: cat.name.en });
    }
    if (!cat.description.de) {
      categoryTexts.push({
        key: `cat.${catId}.description`,
        text: cat.description.en,
      });
    }
  }

  if (categoryTexts.length > 0) {
    const catTranslations = await translateWithGPT(categoryTexts);
    for (const [catId, cat] of Object.entries(graph.categories)) {
      if (catTranslations[`cat.${catId}.name`]) {
        cat.name.de = catTranslations[`cat.${catId}.name`];
      }
      if (catTranslations[`cat.${catId}.description`]) {
        cat.description.de = catTranslations[`cat.${catId}.description`];
      }
    }
  }

  // Update version and date
  graph.version = "2.0-trilingual";
  graph.generated = new Date().toISOString().split("T")[0];

  // Write output
  fs.writeFileSync(graphPath, JSON.stringify(graph, null, 2));

  console.log("\n=== Summary ===");
  console.log(`Concepts processed: ${conceptIds.length}`);
  console.log(`Key passages matched: ${passagesMatched}`);
  console.log(`Key passages not matched: ${passagesFailed}`);
  console.log(`\nUpdated: ${graphPath}`);
}

main().catch(console.error);
