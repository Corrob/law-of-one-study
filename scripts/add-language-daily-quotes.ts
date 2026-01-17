#!/usr/bin/env npx tsx
/**
 * Add translations to daily quotes by matching excerpts
 * to Ra Material source files using sentence matching.
 *
 * Usage: npx tsx scripts/add-language-daily-quotes.ts --lang de
 *        npx tsx scripts/add-language-daily-quotes.ts --lang fr
 */

import * as fs from "fs";
import * as path from "path";

// Parse command line arguments
const args = process.argv.slice(2);
const langIndex = args.findIndex((arg) => arg === "--lang" || arg === "--language");
const TARGET_LANG = langIndex !== -1 && args[langIndex + 1] ? args[langIndex + 1] : null;

if (!TARGET_LANG) {
  console.error("Usage: npx tsx scripts/add-language-daily-quotes.ts --lang <language-code>");
  console.error("Example: npx tsx scripts/add-language-daily-quotes.ts --lang de");
  process.exit(1);
}

// Language-specific configuration
interface LanguageConfig {
  speakerPrefixes: string[];
  iAmRa: string[];
  name: string;
}

const LANGUAGE_CONFIGS: Record<string, LanguageConfig> = {
  de: {
    speakerPrefixes: ["Fragesteller:"],
    iAmRa: ["Ich bin Ra."],
    name: "German",
  },
  es: {
    speakerPrefixes: ["Interrogador:", "Cuestionador:"],
    iAmRa: ["Soy Ra."],
    name: "Spanish",
  },
  fr: {
    speakerPrefixes: ["Questionneur:"],
    iAmRa: ["Je suis Ra."],
    name: "French",
  },
  pt: {
    speakerPrefixes: ["Questionador:"],
    iAmRa: ["Eu sou Ra."],
    name: "Portuguese",
  },
  it: {
    speakerPrefixes: ["Interrogante:"],
    iAmRa: ["Io sono Ra."],
    name: "Italian",
  },
  nl: {
    speakerPrefixes: ["Vraagsteller:"],
    iAmRa: ["Ik ben Ra."],
    name: "Dutch",
  },
  pl: {
    speakerPrefixes: ["Pytający:"],
    iAmRa: ["Jestem Ra."],
    name: "Polish",
  },
  ru: {
    speakerPrefixes: ["Вопрошающий:"],
    iAmRa: ["Я есть Ра."],
    name: "Russian",
  },
};

const config = LANGUAGE_CONFIGS[TARGET_LANG];
if (!config) {
  console.error(`Language "${TARGET_LANG}" not configured.`);
  console.error(`Available languages: ${Object.keys(LANGUAGE_CONFIGS).join(", ")}`);
  console.error("\nTo add a new language, add its config to LANGUAGE_CONFIGS in this script.");
  process.exit(1);
}

// After validation, TARGET_LANG is definitely a valid string
const LANG = TARGET_LANG as string;

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

const allIAmRa = [
  "I am Ra.",
  ...Object.values(LANGUAGE_CONFIGS).flatMap((c) => c.iAmRa),
];
const iAmRaRegex = new RegExp(
  `^(${allIAmRa.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})\\s*`,
  "i"
);

// Load section file for a given language and session
function loadSection(language: string, session: number): Record<string, string> | null {
  const sectionPath = path.join(__dirname, `../public/sections/${language}/${session}.json`);
  try {
    return JSON.parse(fs.readFileSync(sectionPath, "utf-8"));
  } catch {
    return null;
  }
}

// Parse reference like "Ra 1.7" to { session: 1, question: 7 }
function parseReference(reference: string): { session: number; question: number } | null {
  const match = reference.match(/Ra\s+(\d+)\.(\d+)/i);
  if (!match) return null;
  return {
    session: parseInt(match[1], 10),
    question: parseInt(match[2], 10),
  };
}

// Split text into sentences (handling Ra Material formatting)
function splitIntoSentences(text: string): string[] {
  // Remove speaker prefixes and "I am Ra" equivalents
  const cleaned = text.replace(speakerPrefixRegex, "").replace(iAmRaRegex, "");

  // Split on sentence boundaries
  return cleaned
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function countSentences(text: string): number {
  return splitIntoSentences(text).length;
}

// Normalize text for comparison (handle various quotation marks)
function normalizeForComparison(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[""„"«»]/g, '"')
    .replace(/[''‚']/g, "'")
    .trim();
}

// Find which sentence indices in the full text match the excerpt
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

// Find translation for an English excerpt
function findTranslation(
  englishExcerpt: string,
  englishFull: string,
  targetFull: string
): { text: string; confidence: "high" | "medium" | "low" } {
  const excerptSentenceCount = countSentences(englishExcerpt);

  // Try sentence range matching
  const range = findSentenceRange(englishExcerpt, englishFull);

  if (range) {
    const targetSentences = splitIntoSentences(targetFull);
    const endIndex = Math.min(
      range.start + excerptSentenceCount - 1,
      targetSentences.length - 1
    );
    const targetText = targetSentences.slice(range.start, endIndex + 1).join(" ");

    if (targetText.length > 0) {
      return { text: targetText, confidence: "high" };
    }
  }

  // Fallback: try fuzzy matching based on position
  const normalizedExcerpt = normalizeForComparison(englishExcerpt);
  const normalizedFull = normalizeForComparison(englishFull);
  const position = normalizedFull.indexOf(normalizedExcerpt.slice(0, 50));

  if (position !== -1) {
    const percentPosition = position / normalizedFull.length;
    const targetSentences = splitIntoSentences(targetFull);
    const estimatedStart = Math.floor(percentPosition * targetSentences.length);

    if (estimatedStart < targetSentences.length) {
      const endIndex = Math.min(
        estimatedStart + excerptSentenceCount - 1,
        targetSentences.length - 1
      );
      const targetText = targetSentences.slice(estimatedStart, endIndex + 1).join(" ");

      return { text: targetText, confidence: "medium" };
    }
  }

  return { text: "", confidence: "low" };
}

// Main function
async function main() {
  console.log(`=== Add ${config.name} Daily Quotes ===\n`);

  // Read current daily quotes file
  const quotesPath = path.join(__dirname, "../src/data/daily-quotes.ts");
  const content = fs.readFileSync(quotesPath, "utf-8");

  // Check if language already exists in interface
  if (!content.includes(`${LANG}?:`)) {
    console.log(`Note: You may need to add "${LANG}?: string" to the DailyQuote interface.`);
  }

  // Parse existing quotes - extract the array content
  const quotesMatch = content.match(/export const dailyQuotes: DailyQuote\[\] = \[([\s\S]*?)\];/);
  if (!quotesMatch) {
    throw new Error("Could not parse daily quotes file");
  }

  // Parse each quote object
  interface Quote {
    reference: string;
    text: Record<string, string>;
  }

  const quotes: Quote[] = [];
  const quoteRegex = /\{\s*reference:\s*"([^"]+)",\s*text:\s*\{([^}]+)\}/g;
  let match;

  while ((match = quoteRegex.exec(quotesMatch[1])) !== null) {
    const reference = match[1];
    const textContent = match[2];
    const text: Record<string, string> = {};

    // Extract each language's text
    const langRegex = /(\w+):\s*"((?:[^"\\]|\\.)*)"/g;
    let langMatch;
    while ((langMatch = langRegex.exec(textContent)) !== null) {
      text[langMatch[1]] = langMatch[2].replace(/\\"/g, '"').replace(/\\n/g, "\n");
    }

    quotes.push({ reference, text });
  }

  console.log(`Found ${quotes.length} quotes to process\n`);

  // Process each quote
  const stats = { high: 0, medium: 0, low: 0, skipped: 0 };

  for (const quote of quotes) {
    // Skip if already has this language
    if (quote.text[LANG]) {
      stats.skipped++;
      continue;
    }

    const ref = parseReference(quote.reference);
    if (!ref) {
      console.log(`  Could not parse reference: ${quote.reference}`);
      stats.low++;
      continue;
    }

    const englishSection = loadSection("en", ref.session);
    const targetSection = loadSection(LANG, ref.session);

    if (!englishSection || !targetSection) {
      console.log(`  Missing section files for session ${ref.session}`);
      stats.low++;
      continue;
    }

    const key = `${ref.session}.${ref.question}`;
    const englishFull = englishSection[key];
    const targetFull = targetSection[key];

    if (!englishFull || !targetFull) {
      console.log(`  Missing Q&A ${key}`);
      stats.low++;
      continue;
    }

    const translation = findTranslation(quote.text.en, englishFull, targetFull);

    if (translation.text) {
      quote.text[LANG] = translation.text;
      stats[translation.confidence]++;
      console.log(`  ${quote.reference}: ${translation.confidence} confidence`);
    } else {
      stats.low++;
      console.log(`  ${quote.reference}: not found`);
    }
  }

  // Generate output - preserve existing languages and add new one
  const existingLangs = new Set<string>();
  quotes.forEach((q) => Object.keys(q.text).forEach((lang) => existingLangs.add(lang)));
  const allLangs = Array.from(existingLangs).sort();

  // Ensure standard order: en, es, then others alphabetically
  const langOrder = ["en", "es", ...allLangs.filter((l) => l !== "en" && l !== "es").sort()];

  const quotesJson = quotes
    .map((q) => {
      const textEntries = langOrder
        .filter((lang) => q.text[lang])
        .map((lang) => {
          const text = q.text[lang].replace(/"/g, '\\"');
          return `      ${lang}: "${text}"`;
        })
        .join(",\n");

      return `  {
    reference: "${q.reference}",
    text: {
${textEntries},
    },
  }`;
    })
    .join(",\n");

  // Build interface with all languages
  const interfaceLangs = langOrder
    .map((lang) => {
      if (lang === "en" || lang === "es") {
        return `    ${lang}: string;`;
      }
      return `    ${lang}?: string;`;
    })
    .join("\n");

  const output = `/**
 * Daily quotes from the Ra Material (Law of One).
 * All quotes are verified against the source material.
 * Each quote is self-contained wisdom that doesn't require additional context.
 *
 * Multilingual format - URLs are generated dynamically based on locale.
 */

export interface DailyQuote {
  reference: string;
  text: {
${interfaceLangs}
  };
}

export const dailyQuotes: DailyQuote[] = [
${quotesJson},
];

/**
 * Get a random quote from the daily quotes pool.
 */
export function getRandomDailyQuote(): DailyQuote {
  return dailyQuotes[Math.floor(Math.random() * dailyQuotes.length)];
}
`;

  fs.writeFileSync(quotesPath, output);

  console.log("\n=== Summary ===");
  console.log(`High confidence: ${stats.high}`);
  console.log(`Medium confidence: ${stats.medium}`);
  console.log(`Low/not found: ${stats.low}`);
  if (stats.skipped > 0) {
    console.log(`Skipped (already translated): ${stats.skipped}`);
  }
  console.log(`\nUpdated: ${quotesPath}`);
}

main().catch(console.error);
