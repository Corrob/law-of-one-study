/**
 * Validate daily quotes against the actual Ra Material.
 *
 * This script reads the local section JSON files and compares
 * stored quotes to the actual text to ensure accuracy.
 *
 * Usage:
 *   npx tsx scripts/validate-quotes.ts
 *   npx tsx scripts/validate-quotes.ts --verbose
 *   npx tsx scripts/validate-quotes.ts --fix  # Output corrected quotes
 */

import * as fs from "fs";
import * as path from "path";
import { dailyQuotes, type DailyQuote } from "../src/data/daily-quotes";

const VERBOSE = process.argv.includes("--verbose");
const FIX_MODE = process.argv.includes("--fix");

const SECTIONS_DIR = path.join(__dirname, "../public/sections");

interface ValidationResult {
  quote: DailyQuote;
  status: "valid" | "mismatch" | "not_found" | "error";
  actualText?: string;
  similarity?: number;
  error?: string;
}

/**
 * Fetch the actual quote text from local section files
 */
function fetchQuoteFromLocal(reference: string): string | null {
  // Parse reference like "Ra 1.7" -> session 1, question 7
  const match = reference.match(/Ra (\d+)\.(\d+)/);
  if (!match) {
    console.error(`Invalid reference format: ${reference}`);
    return null;
  }

  const session = match[1];
  const question = match[2];
  const key = `${session}.${question}`;

  const filePath = path.join(SECTIONS_DIR, `${session}.json`);

  try {
    if (!fs.existsSync(filePath)) {
      console.error(`Section file not found: ${filePath}`);
      return null;
    }

    const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));

    if (data[key]) {
      return data[key];
    }

    // Try without leading zeros
    const altKey = `${parseInt(session)}.${parseInt(question)}`;
    if (data[altKey]) {
      return data[altKey];
    }

    console.error(`Key ${key} not found in ${filePath}`);
    return null;
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return null;
  }
}

/**
 * Normalize text for comparison
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[""'']/g, '"')     // Normalize quotes
    .replace(/[—–]/g, "-")       // Normalize dashes
    .replace(/\.\.\./g, "…")     // Normalize ellipsis
    .replace(/\s+/g, " ")        // Normalize whitespace
    .replace(/\bi am ra\b/gi, "") // Remove "I am Ra" prefix variations
    .replace(/^ra:\s*/i, "")     // Remove "Ra:" prefix
    .trim();
}

/**
 * Check if our stored quote text appears in the source text
 * Returns a similarity score (0-1)
 */
function calculateSimilarity(stored: string, source: string): number {
  const normalizedStored = normalizeText(stored);
  const normalizedSource = normalizeText(source);

  // Check if stored text is a substring of source (exact match)
  if (normalizedSource.includes(normalizedStored)) {
    return 1.0;
  }

  // Check if most words from stored appear in source
  const storedWords = normalizedStored.split(/\s+/).filter(w => w.length > 3);
  const sourceWords = new Set(normalizedSource.split(/\s+/));

  let matchCount = 0;
  for (const word of storedWords) {
    if (sourceWords.has(word)) {
      matchCount++;
    }
  }

  const wordSimilarity = storedWords.length > 0 ? matchCount / storedWords.length : 0;

  // Also check for key phrases (consecutive words)
  const storedPhrases = extractPhrases(normalizedStored, 3);
  const sourcePhrases = extractPhrases(normalizedSource, 3);

  let phraseMatchCount = 0;
  for (const phrase of storedPhrases) {
    if (sourcePhrases.has(phrase)) {
      phraseMatchCount++;
    }
  }

  const phraseSimilarity = storedPhrases.size > 0 ? phraseMatchCount / storedPhrases.size : 0;

  // Weight phrase similarity higher (more reliable indicator)
  return phraseSimilarity * 0.7 + wordSimilarity * 0.3;
}

/**
 * Extract n-word phrases from text
 */
function extractPhrases(text: string, n: number): Set<string> {
  const words = text.split(/\s+/);
  const phrases = new Set<string>();

  for (let i = 0; i <= words.length - n; i++) {
    phrases.add(words.slice(i, i + n).join(" "));
  }

  return phrases;
}

/**
 * Validate a single quote
 */
function validateQuote(quote: DailyQuote): ValidationResult {
  const actualText = fetchQuoteFromLocal(quote.reference);

  if (actualText === null) {
    return {
      quote,
      status: "not_found",
      error: "Could not find in local section files",
    };
  }

  const similarity = calculateSimilarity(quote.text, actualText);

  // 70% threshold - accounts for partial quotes and minor variations
  if (similarity >= 0.7) {
    return {
      quote,
      status: "valid",
      actualText,
      similarity,
    };
  }

  return {
    quote,
    status: "mismatch",
    actualText,
    similarity,
  };
}

/**
 * Main validation function
 */
function main() {
  console.log(`\nValidating ${dailyQuotes.length} daily quotes...\n`);
  console.log(`Reading from: ${SECTIONS_DIR}\n`);

  const results: ValidationResult[] = [];
  let validCount = 0;
  let mismatchCount = 0;
  let notFoundCount = 0;
  let errorCount = 0;

  for (const quote of dailyQuotes) {
    try {
      const result = validateQuote(quote);
      results.push(result);

      switch (result.status) {
        case "valid":
          validCount++;
          if (VERBOSE) {
            console.log(`✓ ${quote.reference} - Valid (${Math.round((result.similarity || 0) * 100)}% match)`);
          }
          break;
        case "mismatch":
          mismatchCount++;
          console.log(`✗ ${quote.reference} - MISMATCH (${Math.round((result.similarity || 0) * 100)}% match)`);
          console.log(`  Stored: "${quote.text.slice(0, 80)}..."`);
          console.log(`  Actual: "${result.actualText?.slice(0, 80)}..."`);
          console.log();
          break;
        case "not_found":
          notFoundCount++;
          console.log(`? ${quote.reference} - Not found in local files`);
          break;
        case "error":
          errorCount++;
          console.log(`! ${quote.reference} - Error: ${result.error}`);
          break;
      }
    } catch (error) {
      errorCount++;
      results.push({
        quote,
        status: "error",
        error: String(error),
      });
      console.log(`! ${quote.reference} - Error: ${error}`);
    }
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("VALIDATION SUMMARY");
  console.log("=".repeat(60));
  console.log(`Total quotes:    ${dailyQuotes.length}`);
  console.log(`Valid:           ${validCount} (${Math.round(validCount / dailyQuotes.length * 100)}%)`);
  console.log(`Mismatches:      ${mismatchCount}`);
  console.log(`Not found:       ${notFoundCount}`);
  console.log(`Errors:          ${errorCount}`);
  console.log("=".repeat(60));

  // If fix mode, output corrected quotes
  if (FIX_MODE && mismatchCount > 0) {
    console.log("\n\nCORRECTED QUOTES (copy these to fix mismatches):\n");
    for (const result of results) {
      if (result.status === "mismatch" && result.actualText) {
        // Clean up the actual text for use as a quote
        const cleanText = result.actualText
          .replace(/^Ra: I am Ra\.\s*/i, "")
          .replace(/^I am Ra\.\s*/i, "")
          .trim();

        console.log(`  {`);
        console.log(`    text: "${cleanText.replace(/"/g, '\\"').replace(/\n/g, "\\n")}",`);
        console.log(`    reference: "${result.quote.reference}",`);
        console.log(`    url: "${result.quote.url}",`);
        console.log(`  },`);
        console.log();
      }
    }
  }

  // Exit with error code if there are issues
  if (mismatchCount > 0 || notFoundCount > 0 || errorCount > 0) {
    process.exit(1);
  }

  console.log("\n✓ All quotes validated successfully!\n");
}

main();
