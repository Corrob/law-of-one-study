#!/usr/bin/env npx tsx
/**
 * Add German translations to daily quotes by matching excerpts
 * to the German Ra Material source files.
 *
 * Usage: npx tsx scripts/add-german-daily-quotes.ts
 */

import * as fs from "fs";
import * as path from "path";

interface BilingualQuote {
  reference: string;
  text: {
    en: string;
    es: string;
    de?: string;
  };
}

// Load section file for a given language and session
function loadSection(
  language: "en" | "es" | "de",
  session: number
): Record<string, string> | null {
  const sectionPath = path.join(
    __dirname,
    `../public/sections/${language}/${session}.json`
  );

  try {
    const content = fs.readFileSync(sectionPath, "utf-8");
    return JSON.parse(content);
  } catch {
    return null;
  }
}

// Parse reference like "Ra 1.7" to { session: 1, question: 7 }
function parseReference(
  reference: string
): { session: number; question: number } | null {
  const match = reference.match(/Ra\s+(\d+)\.(\d+)/i);
  if (!match) return null;
  return {
    session: parseInt(match[1], 10),
    question: parseInt(match[2], 10),
  };
}

// Split text into sentences (handling Ra Material formatting)
function splitIntoSentences(text: string): string[] {
  // Remove speaker prefixes at the start
  const cleaned = text
    .replace(/^(Ra:|Questioner:|Fragesteller:)\s*/i, "")
    .replace(/^Ich bin Ra\.\s*/i, "")
    .replace(/^I am Ra\.\s*/i, "");

  // Split on sentence boundaries
  const sentences = cleaned
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  return sentences;
}

// Count sentences in a text
function countSentences(text: string): number {
  return splitIntoSentences(text).length;
}

// Normalize text for comparison
function normalizeForComparison(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[""„"]/g, '"')
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

// Find German translation for an English excerpt
function findGermanTranslation(
  englishExcerpt: string,
  englishFull: string,
  germanFull: string
): { text: string; confidence: "high" | "medium" | "low" } {
  const excerptSentenceCount = countSentences(englishExcerpt);

  // Try sentence range matching
  const range = findSentenceRange(englishExcerpt, englishFull);

  if (range) {
    const germanSentences = splitIntoSentences(germanFull);
    const endIndex = Math.min(
      range.start + excerptSentenceCount - 1,
      germanSentences.length - 1
    );
    const germanText = germanSentences.slice(range.start, endIndex + 1).join(" ");

    if (germanText.length > 0) {
      return { text: germanText, confidence: "high" };
    }
  }

  // Fallback: try fuzzy matching based on position
  const normalizedExcerpt = normalizeForComparison(englishExcerpt);
  const normalizedFull = normalizeForComparison(englishFull);
  const position = normalizedFull.indexOf(normalizedExcerpt.slice(0, 50));

  if (position !== -1) {
    const percentPosition = position / normalizedFull.length;
    const germanSentences = splitIntoSentences(germanFull);
    const estimatedStart = Math.floor(percentPosition * germanSentences.length);

    if (estimatedStart < germanSentences.length) {
      const endIndex = Math.min(
        estimatedStart + excerptSentenceCount - 1,
        germanSentences.length - 1
      );
      const germanText = germanSentences
        .slice(estimatedStart, endIndex + 1)
        .join(" ");

      return { text: germanText, confidence: "medium" };
    }
  }

  return { text: "", confidence: "low" };
}

// Main function
async function main() {
  console.log("=== Add German Daily Quotes ===\n");

  // Read current daily quotes file
  const quotesPath = path.join(__dirname, "../src/data/daily-quotes.ts");
  const content = fs.readFileSync(quotesPath, "utf-8");

  // Parse the existing quotes
  const quotesMatch = content.match(
    /export const dailyQuotes: DailyQuote\[\] = \[([\s\S]*?)\];/
  );
  if (!quotesMatch) {
    throw new Error("Could not parse daily quotes file");
  }

  // Extract individual quote objects
  const quoteBlocks = quotesMatch[1].split(/\},\s*\{/).map((block, i, arr) => {
    if (i === 0) return block + "}";
    if (i === arr.length - 1) return "{" + block;
    return "{" + block + "}";
  });

  const quotes: BilingualQuote[] = [];
  for (const block of quoteBlocks) {
    const refMatch = block.match(/reference:\s*"([^"]+)"/);
    const enMatch = block.match(/en:\s*"((?:[^"\\]|\\.)*)"/);
    const esMatch = block.match(/es:\s*"((?:[^"\\]|\\.)*)"/);

    if (refMatch && enMatch) {
      quotes.push({
        reference: refMatch[1],
        text: {
          en: enMatch[1].replace(/\\"/g, '"').replace(/\\n/g, "\n"),
          es: esMatch
            ? esMatch[1].replace(/\\"/g, '"').replace(/\\n/g, "\n")
            : "",
        },
      });
    }
  }

  console.log(`Found ${quotes.length} quotes to process\n`);

  // Process each quote
  const stats = { high: 0, medium: 0, low: 0 };

  for (const quote of quotes) {
    const ref = parseReference(quote.reference);
    if (!ref) {
      console.log(`  Could not parse reference: ${quote.reference}`);
      stats.low++;
      continue;
    }

    const englishSection = loadSection("en", ref.session);
    const germanSection = loadSection("de", ref.session);

    if (!englishSection || !germanSection) {
      console.log(`  Missing section files for session ${ref.session}`);
      stats.low++;
      continue;
    }

    const key = `${ref.session}.${ref.question}`;
    const englishFull = englishSection[key];
    const germanFull = germanSection[key];

    if (!englishFull || !germanFull) {
      console.log(`  Missing Q&A ${key}`);
      stats.low++;
      continue;
    }

    const translation = findGermanTranslation(
      quote.text.en,
      englishFull,
      germanFull
    );

    if (translation.text) {
      quote.text.de = translation.text;
      stats[translation.confidence]++;
      console.log(`  ${quote.reference}: ${translation.confidence} confidence`);
    } else {
      stats.low++;
      console.log(`  ${quote.reference}: not found`);
    }
  }

  // Generate output
  const quotesJson = quotes
    .map((q) => {
      const enText = q.text.en.replace(/"/g, '\\"');
      const esText = q.text.es.replace(/"/g, '\\"');
      const deText = q.text.de ? q.text.de.replace(/"/g, '\\"') : null;

      const deEntry = deText ? `\n      de: "${deText}",` : "";

      return `  {
    reference: "${q.reference}",
    text: {
      en: "${enText}",
      es: "${esText}",${deEntry}
    },
  }`;
    })
    .join(",\n");

  const output = `/**
 * Daily quotes from the Ra Material (Law of One).
 * All quotes are verified against the source material.
 * Each quote is self-contained wisdom that doesn't require additional context.
 *
 * Bilingual format - URLs are generated dynamically based on locale.
 */

export interface DailyQuote {
  reference: string;
  text: {
    en: string;
    es: string;
    de?: string; // Optional - falls back to English
  };
}

export const dailyQuotes: DailyQuote[] = [
${quotesJson}
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
  console.log(`\nUpdated: ${quotesPath}`);
}

main().catch(console.error);
