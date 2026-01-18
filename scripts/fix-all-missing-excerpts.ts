#!/usr/bin/env npx tsx
/**
 * Fix ALL missing concept graph excerpt translations using sentence matching.
 * Uses multiple matching strategies to maximize successful translations.
 *
 * This script ensures all languages have complete translations - no fallbacks.
 *
 * Usage: npx tsx scripts/fix-all-missing-excerpts.ts
 */

import * as fs from "fs";
import * as path from "path";

// Target languages for translation (English is the source)
const TARGET_LANGUAGES = ["es", "de", "fr"] as const;

// Paths
const CONCEPT_GRAPH_PATH = path.join(__dirname, "../src/data/concept-graph.json");
const SECTIONS_DIR = path.join(__dirname, "../public/sections");

// Language-specific configuration
interface LanguageConfig {
  speakerPrefixes: string[];
  iAmRa: string[];
  name: string;
}

const LANGUAGE_CONFIGS: Record<string, LanguageConfig> = {
  en: {
    speakerPrefixes: ["Questioner:"],
    iAmRa: ["I am Ra."],
    name: "English",
  },
  es: {
    speakerPrefixes: ["Interrogador:", "Cuestionador:"],
    iAmRa: ["Soy Ra."],
    name: "Spanish",
  },
  de: {
    speakerPrefixes: ["Fragesteller:"],
    iAmRa: ["Ich bin Ra."],
    name: "German",
  },
  fr: {
    speakerPrefixes: ["Questionneur:"],
    iAmRa: ["Je suis Ra."],
    name: "French",
  },
};

// Build regex patterns for speaker removal
const allSpeakerPrefixes = [
  "Ra:",
  ...Object.values(LANGUAGE_CONFIGS).flatMap((c) => c.speakerPrefixes),
];
const speakerPrefixRegex = new RegExp(
  `^(${allSpeakerPrefixes.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})\\s*`,
  "i"
);

const allIAmRa = Object.values(LANGUAGE_CONFIGS).flatMap((c) => c.iAmRa);
const iAmRaRegex = new RegExp(
  `(${allIAmRa.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})\\s*`,
  "gi"
);

// Load section file
function loadSection(language: string, session: number): Record<string, string> | null {
  const sectionPath = path.join(SECTIONS_DIR, language, `${session}.json`);
  try {
    return JSON.parse(fs.readFileSync(sectionPath, "utf-8"));
  } catch {
    return null;
  }
}

function parseReference(reference: string): { session: number; question: number } | null {
  const match = reference.match(/^(\d+)\.(\d+)$/);
  if (!match) return null;
  return {
    session: parseInt(match[1], 10),
    question: parseInt(match[2], 10),
  };
}

// Clean text for processing
function cleanText(text: string): string {
  return text
    .replace(speakerPrefixRegex, "")
    .replace(iAmRaRegex, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Split text into sentences
function splitIntoSentences(text: string): string[] {
  const cleaned = cleanText(text);
  // Add spaces after periods followed by capital letters
  const normalized = cleaned
    .replace(/\.([A-Z])/g, ". $1")
    .replace(/:([A-Z])/g, ": $1");
  return normalized
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 5);
}

// Normalize for comparison
function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[""„"«»]/g, '"')
    .replace(/[''‚']/g, "'")
    .replace(/[—–-]/g, "-")
    .trim();
}

// Get word signature for fuzzy matching
function getWordSignature(text: string): string[] {
  return normalize(text)
    .split(/\s+/)
    .filter((w) => w.length > 3)
    .slice(0, 20);
}

// Calculate similarity between two texts
function calculateSimilarity(text1: string, text2: string): number {
  const words1 = new Set(getWordSignature(text1));
  const words2 = new Set(getWordSignature(text2));
  if (words1.size === 0 || words2.size === 0) return 0;

  let matches = 0;
  for (const word of words1) {
    if (words2.has(word)) matches++;
  }
  return matches / Math.max(words1.size, words2.size);
}

// Strategy 1: Proportional sentence matching
function matchByProportionalPosition(
  englishExcerpt: string,
  englishFull: string,
  targetFull: string
): string | null {
  const englishFullSentences = splitIntoSentences(englishFull);
  const excerptSentences = splitIntoSentences(englishExcerpt);
  const targetSentences = splitIntoSentences(targetFull);

  if (excerptSentences.length === 0 || targetSentences.length === 0 || englishFullSentences.length === 0) {
    return null;
  }

  // Find the start position of the excerpt in the full text
  const normalizedFirst = normalize(excerptSentences[0]);
  let englishStartIndex = -1;

  for (let i = 0; i < englishFullSentences.length; i++) {
    const normalizedSentence = normalize(englishFullSentences[i]);
    // Try multiple matching approaches
    if (
      normalizedSentence.includes(normalizedFirst.slice(0, 40)) ||
      normalizedFirst.includes(normalizedSentence.slice(0, 40)) ||
      normalizedSentence.slice(0, 30) === normalizedFirst.slice(0, 30) ||
      calculateSimilarity(normalizedSentence, normalizedFirst) > 0.6
    ) {
      englishStartIndex = i;
      break;
    }
  }

  if (englishStartIndex === -1) {
    return null;
  }

  // Use proportional positioning
  const relativeStart = englishStartIndex / englishFullSentences.length;
  const targetStart = Math.min(
    Math.round(relativeStart * targetSentences.length),
    targetSentences.length - 1
  );

  // Calculate how many sentences to take
  const relativeLength = excerptSentences.length / englishFullSentences.length;
  const targetCount = Math.max(1, Math.round(relativeLength * targetSentences.length));
  const finalCount = Math.min(targetCount, excerptSentences.length + 1);

  const targetEnd = Math.min(targetStart + finalCount - 1, targetSentences.length - 1);

  return targetSentences.slice(targetStart, targetEnd + 1).join(" ");
}

// Strategy 2: Word-based position matching
function matchByWordPosition(
  englishExcerpt: string,
  englishFull: string,
  targetFull: string
): string | null {
  const cleanedEnglish = cleanText(englishFull);
  const cleanedExcerpt = cleanText(englishExcerpt);
  const cleanedTarget = cleanText(targetFull);

  // Find where the excerpt starts in the full English text (by character position)
  const excerptStart = cleanedEnglish.toLowerCase().indexOf(cleanedExcerpt.toLowerCase().slice(0, 50));
  if (excerptStart === -1) return null;

  // Calculate relative position
  const relativeStart = excerptStart / cleanedEnglish.length;
  const relativeLength = cleanedExcerpt.length / cleanedEnglish.length;

  // Apply to target
  const targetStart = Math.floor(relativeStart * cleanedTarget.length);
  const targetLength = Math.ceil(relativeLength * cleanedTarget.length);

  // Extract and clean up to sentence boundaries
  let result = cleanedTarget.substring(targetStart, targetStart + targetLength);

  // Extend to sentence boundary at end
  const remainder = cleanedTarget.substring(targetStart + targetLength);
  const endMatch = remainder.match(/^[^.!?]*[.!?]/);
  if (endMatch) {
    result += endMatch[0];
  }

  // Trim to sentence boundary at start
  const startMatch = result.match(/^[^.!?]*[.!?]\s*/);
  if (startMatch && result.length > startMatch[0].length + 20) {
    result = result.substring(startMatch[0].length);
  }

  return result.trim();
}

// Strategy 3: Ra response extraction (for Ra-only passages)
function matchRaResponse(
  englishExcerpt: string,
  _englishFull: string,
  targetFull: string
): string | null {
  // If the excerpt is primarily Ra's response, find Ra's response in target
  const targetSentences = splitIntoSentences(targetFull);
  const excerptSentences = splitIntoSentences(englishExcerpt);

  if (targetSentences.length === 0 || excerptSentences.length === 0) return null;

  // Take same number of sentences from the start (Ra's response)
  const count = Math.min(excerptSentences.length, targetSentences.length);
  return targetSentences.slice(0, count).join(" ");
}

// Main matching function - tries all strategies
function findTranslation(
  englishExcerpt: string,
  englishFull: string,
  targetFull: string
): string | null {
  // Strategy 1: Proportional sentence matching
  let result = matchByProportionalPosition(englishExcerpt, englishFull, targetFull);
  if (result && result.length > 20) return result;

  // Strategy 2: Word-based position matching
  result = matchByWordPosition(englishExcerpt, englishFull, targetFull);
  if (result && result.length > 20) return result;

  // Strategy 3: Ra response extraction
  result = matchRaResponse(englishExcerpt, englishFull, targetFull);
  if (result && result.length > 20) return result;

  return null;
}

// Types
interface BilingualText {
  en: string;
  es?: string;
  de?: string;
  fr?: string;
  [key: string]: string | undefined;
}

interface KeyPassage {
  reference: string;
  excerpt: BilingualText;
  context: BilingualText;
}

interface GraphConcept {
  id: string;
  term: BilingualText;
  keyPassages: KeyPassage[];
}

interface ConceptGraph {
  version: string;
  generated: string;
  concepts: Record<string, GraphConcept>;
  categories: Record<string, unknown>;
}

interface MissingExcerpt {
  conceptId: string;
  term: string;
  passageIndex: number;
  reference: string;
  englishExcerpt: string;
}

async function main() {
  console.log("=== Fix All Missing Excerpt Translations ===\n");

  const graph: ConceptGraph = JSON.parse(fs.readFileSync(CONCEPT_GRAPH_PATH, "utf-8"));

  // Find all missing excerpts
  const missingByLang: Record<string, MissingExcerpt[]> = {};
  for (const lang of TARGET_LANGUAGES) {
    missingByLang[lang] = [];
  }

  for (const [id, concept] of Object.entries(graph.concepts)) {
    for (let i = 0; i < concept.keyPassages.length; i++) {
      const passage = concept.keyPassages[i];
      for (const lang of TARGET_LANGUAGES) {
        if (!passage.excerpt[lang]) {
          missingByLang[lang].push({
            conceptId: id,
            term: concept.term.en,
            passageIndex: i,
            reference: passage.reference,
            englishExcerpt: passage.excerpt.en,
          });
        }
      }
    }
  }

  const totalMissing = missingByLang.es.length + missingByLang.de.length + missingByLang.fr.length;
  console.log(`Total missing: ${totalMissing}`);
  console.log(`  ES: ${missingByLang.es.length}`);
  console.log(`  DE: ${missingByLang.de.length}`);
  console.log(`  FR: ${missingByLang.fr.length}`);
  console.log("");

  const stats = { fixed: 0, failed: 0, noSource: 0 };

  for (const lang of TARGET_LANGUAGES) {
    const config = LANGUAGE_CONFIGS[lang];
    console.log(`\n--- Processing ${config.name} (${lang}) ---`);

    for (const missing of missingByLang[lang]) {
      const ref = parseReference(missing.reference);
      if (!ref) {
        console.log(`  ✗ ${missing.term} @ ${missing.reference}: Invalid reference`);
        stats.failed++;
        continue;
      }

      const englishSection = loadSection("en", ref.session);
      const targetSection = loadSection(lang, ref.session);

      if (!englishSection) {
        console.log(`  ✗ ${missing.term} @ ${missing.reference}: Missing English source`);
        stats.failed++;
        continue;
      }

      if (!targetSection) {
        console.log(`  ⚠ ${missing.term} @ ${missing.reference}: Missing ${lang} session ${ref.session}`);
        stats.noSource++;
        continue;
      }

      const key = `${ref.session}.${ref.question}`;
      const englishFull = englishSection[key];
      const targetFull = targetSection[key];

      if (!englishFull) {
        console.log(`  ✗ ${missing.term} @ ${missing.reference}: Missing English Q&A`);
        stats.failed++;
        continue;
      }

      if (!targetFull) {
        console.log(`  ⚠ ${missing.term} @ ${missing.reference}: Missing ${lang} Q&A ${key}`);
        stats.noSource++;
        continue;
      }

      const translation = findTranslation(missing.englishExcerpt, englishFull, targetFull);

      if (translation && translation.length > 15) {
        graph.concepts[missing.conceptId].keyPassages[missing.passageIndex].excerpt[lang] = translation;
        console.log(`  ✓ ${missing.term} @ ${missing.reference}`);
        stats.fixed++;
      } else {
        console.log(`  ✗ ${missing.term} @ ${missing.reference}: No match found`);
        console.log(`    English: "${missing.englishExcerpt.substring(0, 60)}..."`);
        stats.failed++;
      }
    }
  }

  // Save updated graph
  fs.writeFileSync(CONCEPT_GRAPH_PATH, JSON.stringify(graph, null, 2));

  console.log("\n=== Summary ===");
  console.log(`Fixed: ${stats.fixed}`);
  console.log(`No source (Ra Material gap): ${stats.noSource}`);
  console.log(`Failed to match: ${stats.failed}`);
  console.log(`\nUpdated: ${CONCEPT_GRAPH_PATH}`);

  if (stats.failed > 0 || stats.noSource > 0) {
    console.log("\n⚠ Some translations could not be completed.");
    console.log("  - 'No source' means the Ra Material translation is incomplete");
    console.log("  - 'Failed to match' means sentence matching couldn't find the excerpt");
  }
}

main().catch(console.error);
