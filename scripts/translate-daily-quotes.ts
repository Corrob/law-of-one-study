/**
 * Script to generate bilingual daily quotes by matching English excerpts
 * to their Spanish translations in the Ra Material source files.
 *
 * Usage: npx tsx scripts/translate-daily-quotes.ts
 *
 * This script:
 * 1. Reads each daily quote and its reference (e.g., "Ra 1.7")
 * 2. Loads the full English and Spanish text from public/sections/{lang}/{session}.json
 * 3. Finds where the English excerpt appears in the full text
 * 4. Extracts the corresponding Spanish sentences
 * 5. Outputs the bilingual data for verification and manual review
 */

import * as fs from "fs";
import * as path from "path";

interface OriginalDailyQuote {
  text: string;
  reference: string;
  url: string;
}

interface BilingualQuote {
  reference: string;
  text: {
    en: string;
    es: string;
  };
}

interface MatchResult {
  quote: OriginalDailyQuote;
  spanishText: string | null;
  matchMethod: "exact" | "fuzzy" | "sentence-range" | "not-found";
  confidence: "high" | "medium" | "low";
  notes?: string;
}

// Load original daily quotes
function loadOriginalQuotes(): OriginalDailyQuote[] {
  const quotesPath = path.join(
    __dirname,
    "../src/data/daily-quotes.ts"
  );
  const content = fs.readFileSync(quotesPath, "utf-8");

  // Extract quotes array from TypeScript file
  const quotesMatch = content.match(
    /export const dailyQuotes: DailyQuote\[\] = \[([\s\S]*?)\];/
  );
  if (!quotesMatch) {
    throw new Error("Could not parse daily quotes file");
  }

  // Parse the quotes - this is a simplified parser
  const quotes: OriginalDailyQuote[] = [];
  const quoteRegex = /\{\s*text:\s*"((?:[^"\\]|\\.)*)"\s*,\s*reference:\s*"([^"]+)"\s*,\s*url:\s*"([^"]+)"\s*,?\s*\}/g;

  let match;
  while ((match = quoteRegex.exec(quotesMatch[1])) !== null) {
    quotes.push({
      text: match[1].replace(/\\"/g, '"').replace(/\\n/g, "\n"),
      reference: match[2],
      url: match[3],
    });
  }

  return quotes;
}

// Load section file for a given language and session
function loadSection(
  language: "en" | "es",
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
  // Remove speaker prefixes at the start
  let cleaned = text
    .replace(/^(Ra:|Questioner:|Interrogador:|Cuestionador:)\s*/i, "")
    .replace(/^Soy Ra\.\s*/i, "")
    .replace(/^I am Ra\.\s*/i, "");

  // Add space before Spanish opening punctuation if missing (for proper splitting)
  cleaned = cleaned.replace(/([.!?])([¿¡])/g, "$1 $2");

  // Split on sentence boundaries
  // Handle both English (ends with .!?) and Spanish (starts with ¿¡)
  const sentences = cleaned
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  return sentences;
}

// Count sentences in a text (for matching)
function countSentences(text: string): number {
  return splitIntoSentences(text).length;
}

// Normalize text for comparison (remove extra whitespace, lowercase)
function normalizeForComparison(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
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

  // Try to find the first sentence of the excerpt in the full text
  const normalizedFirst = normalizeForComparison(excerptSentences[0]);

  for (let i = 0; i < fullSentences.length; i++) {
    const normalizedFull = normalizeForComparison(fullSentences[i]);

    // Check if this sentence matches (allowing some flexibility)
    if (
      normalizedFull.includes(normalizedFirst.slice(0, 50)) ||
      normalizedFirst.includes(normalizedFull.slice(0, 50))
    ) {
      // Found potential start, verify the match continues
      let matchLength = 0;
      for (let j = 0; j < excerptSentences.length && i + j < fullSentences.length; j++) {
        const excerptNorm = normalizeForComparison(excerptSentences[j]);
        const fullNorm = normalizeForComparison(fullSentences[i + j]);

        // Check if sentences are similar enough
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

      // If we matched most sentences, consider it a match
      if (matchLength >= excerptSentences.length * 0.8) {
        return { start: i, end: i + excerptSentences.length - 1 };
      }
    }
  }

  return null;
}

// Extract sentences by range from text (utility for manual verification)
function _extractSentenceRange(
  text: string,
  start: number,
  end: number
): string {
  const sentences = splitIntoSentences(text);
  return sentences.slice(start, end + 1).join(" ");
}

// Find Spanish translation for an English excerpt
function findSpanishTranslation(
  englishExcerpt: string,
  englishFull: string,
  spanishFull: string
): { text: string; method: "exact" | "fuzzy" | "sentence-range" | "not-found"; confidence: "high" | "medium" | "low" } {
  const excerptSentenceCount = countSentences(englishExcerpt);

  // Method 1: Try sentence range matching
  const range = findSentenceRange(englishExcerpt, englishFull);

  if (range) {
    // Extract exactly the same number of sentences as the excerpt
    const spanishSentences = splitIntoSentences(spanishFull);
    const endIndex = Math.min(range.start + excerptSentenceCount - 1, spanishSentences.length - 1);
    const spanishText = spanishSentences.slice(range.start, endIndex + 1).join(" ");

    if (spanishText.length > 0) {
      return {
        text: spanishText,
        method: "sentence-range",
        confidence: "high",
      };
    }
  }

  // Method 2: Try fuzzy matching based on position
  // Calculate approximate position in English text
  const normalizedExcerpt = normalizeForComparison(englishExcerpt);
  const normalizedFull = normalizeForComparison(englishFull);
  const position = normalizedFull.indexOf(normalizedExcerpt.slice(0, 50));

  if (position !== -1) {
    // Calculate percentage position
    const percentPosition = position / normalizedFull.length;
    const spanishSentences = splitIntoSentences(spanishFull);

    // Estimate starting sentence in Spanish
    const estimatedStart = Math.floor(percentPosition * spanishSentences.length);

    if (estimatedStart < spanishSentences.length) {
      const endIndex = Math.min(estimatedStart + excerptSentenceCount - 1, spanishSentences.length - 1);
      const spanishText = spanishSentences
        .slice(estimatedStart, endIndex + 1)
        .join(" ");

      return {
        text: spanishText,
        method: "fuzzy",
        confidence: "medium",
      };
    }
  }

  return {
    text: "",
    method: "not-found",
    confidence: "low",
  };
}

// Process all quotes
function processQuotes(): MatchResult[] {
  const quotes = loadOriginalQuotes();
  const results: MatchResult[] = [];

  console.log(`Processing ${quotes.length} quotes...\n`);

  for (const quote of quotes) {
    const ref = parseReference(quote.reference);

    if (!ref) {
      results.push({
        quote,
        spanishText: null,
        matchMethod: "not-found",
        confidence: "low",
        notes: "Could not parse reference",
      });
      continue;
    }

    const englishSection = loadSection("en", ref.session);
    const spanishSection = loadSection("es", ref.session);

    if (!englishSection || !spanishSection) {
      results.push({
        quote,
        spanishText: null,
        matchMethod: "not-found",
        confidence: "low",
        notes: `Missing section file for session ${ref.session}`,
      });
      continue;
    }

    const key = `${ref.session}.${ref.question}`;
    const englishFull = englishSection[key];
    const spanishFull = spanishSection[key];

    if (!englishFull || !spanishFull) {
      results.push({
        quote,
        spanishText: null,
        matchMethod: "not-found",
        confidence: "low",
        notes: `Missing Q&A ${key}`,
      });
      continue;
    }

    const translation = findSpanishTranslation(
      quote.text,
      englishFull,
      spanishFull
    );

    results.push({
      quote,
      spanishText: translation.text || null,
      matchMethod: translation.method,
      confidence: translation.confidence,
    });
  }

  return results;
}

// Generate output in the new format
function generateBilingualQuotes(results: MatchResult[]): BilingualQuote[] {
  return results.map((result) => ({
    reference: result.quote.reference,
    text: {
      en: result.quote.text,
      es: result.spanishText || result.quote.text, // Fallback to English if no translation
    },
  }));
}

// Generate TypeScript output
function generateTypeScriptOutput(quotes: BilingualQuote[]): string {
  const quotesJson = quotes
    .map((q) => {
      const enText = q.text.en.replace(/"/g, '\\"');
      const esText = q.text.es.replace(/"/g, '\\"');
      return `  {
    reference: "${q.reference}",
    text: {
      en: "${enText}",
      es: "${esText}",
    },
  }`;
    })
    .join(",\n");

  return `/**
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
}

// Main execution
function main() {
  console.log("=== Daily Quotes Translation Script ===\n");

  const results = processQuotes();

  // Summary stats
  const stats = {
    total: results.length,
    highConfidence: results.filter((r) => r.confidence === "high").length,
    mediumConfidence: results.filter((r) => r.confidence === "medium").length,
    lowConfidence: results.filter((r) => r.confidence === "low").length,
    notFound: results.filter((r) => r.matchMethod === "not-found").length,
  };

  console.log("\n=== Summary ===");
  console.log(`Total quotes: ${stats.total}`);
  console.log(`High confidence matches: ${stats.highConfidence}`);
  console.log(`Medium confidence matches: ${stats.mediumConfidence}`);
  console.log(`Low confidence/not found: ${stats.lowConfidence}`);

  // Show samples of each confidence level
  console.log("\n=== Sample Matches ===\n");

  const highConfSample = results.find((r) => r.confidence === "high");
  if (highConfSample) {
    console.log("HIGH CONFIDENCE EXAMPLE:");
    console.log(`Reference: ${highConfSample.quote.reference}`);
    console.log(`English: ${highConfSample.quote.text.slice(0, 100)}...`);
    console.log(`Spanish: ${highConfSample.spanishText?.slice(0, 100)}...`);
    console.log();
  }

  const medConfSample = results.find((r) => r.confidence === "medium");
  if (medConfSample) {
    console.log("MEDIUM CONFIDENCE EXAMPLE:");
    console.log(`Reference: ${medConfSample.quote.reference}`);
    console.log(`English: ${medConfSample.quote.text.slice(0, 100)}...`);
    console.log(`Spanish: ${medConfSample.spanishText?.slice(0, 100)}...`);
    console.log();
  }

  // Generate and write output
  const bilingualQuotes = generateBilingualQuotes(results);
  const outputTs = generateTypeScriptOutput(bilingualQuotes);

  const outputPath = path.join(
    __dirname,
    "../src/data/daily-quotes-bilingual.ts"
  );
  fs.writeFileSync(outputPath, outputTs);
  console.log(`\nOutput written to: ${outputPath}`);

  // Also write a JSON report for manual review
  const reportPath = path.join(__dirname, "../daily-quotes-translation-report.json");
  const report = results.map((r) => ({
    reference: r.quote.reference,
    method: r.matchMethod,
    confidence: r.confidence,
    english: r.quote.text,
    spanish: r.spanishText,
    notes: r.notes,
  }));
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`Report written to: ${reportPath}`);

  // Show items that need manual review
  const needsReview = results.filter(
    (r) => r.confidence !== "high" || !r.spanishText
  );
  if (needsReview.length > 0) {
    console.log(`\n⚠️  ${needsReview.length} quotes need manual review`);
    console.log("Check the report file for details.");
  }
}

main();
