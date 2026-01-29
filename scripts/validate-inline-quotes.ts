#!/usr/bin/env npx tsx
/**
 * Validate inline quotes against actual Ra material
 *
 * Finds patterns like:
 * - "quote text" (91.20)
 * - Ra says "quote text"
 * - Ra states "quote text"
 *
 * And verifies the quoted text exists in the referenced passage
 */

import * as fs from 'fs';
import * as path from 'path';

const archetypesDir = path.join(__dirname, '../src/data/study-paths/archetypes');
const sectionsDir = path.join(__dirname, '../public/sections/en');

// Load all Ra material sections
const sections: Record<string, Record<string, string>> = {};

function loadSections() {
  const files = fs.readdirSync(sectionsDir).filter(f => f.endsWith('.json'));
  for (const file of files) {
    const sessionNum = file.replace('.json', '');
    const content = JSON.parse(fs.readFileSync(path.join(sectionsDir, file), 'utf-8'));
    sections[sessionNum] = content;
  }
}

function getPassage(reference: string): string | null {
  const [session] = reference.split('.');
  if (!sections[session]) return null;
  return sections[session][reference] || null;
}

// Normalize text for comparison
function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[""'']/g, '"')
    .replace(/…/g, '...')
    .replace(/[.,;:!?]/g, '')
    .trim();
}

// Extract key words from a quote (for fuzzy matching)
function extractKeyWords(text: string): string[] {
  return normalize(text)
    .split(' ')
    .filter(w => w.length > 3)
    .filter(w => !['that', 'this', 'with', 'from', 'which', 'have', 'been', 'being', 'will', 'shall', 'would', 'could', 'there', 'their', 'they', 'were', 'more', 'into', 'than'].includes(w));
}

// Check if quote appears in passage
function quoteExistsInPassage(quote: string, passage: string): { valid: boolean; confidence: string } {
  const normalizedQuote = normalize(quote);
  const normalizedPassage = normalize(passage);

  // Direct inclusion check
  if (normalizedPassage.includes(normalizedQuote)) {
    return { valid: true, confidence: 'exact' };
  }

  // If quote contains ..., check each substantial part
  if (quote.includes('...')) {
    const parts = normalizedQuote.split('...').map(p => p.trim()).filter(p => p.length > 10);
    if (parts.length > 0 && parts.every(part => normalizedPassage.includes(part))) {
      return { valid: true, confidence: 'partial' };
    }
  }

  // Key word matching (for paraphrased or slightly modified quotes)
  const quoteKeyWords = extractKeyWords(quote);
  if (quoteKeyWords.length >= 3) {
    const matchedWords = quoteKeyWords.filter(w => normalizedPassage.includes(w));
    const matchRatio = matchedWords.length / quoteKeyWords.length;
    if (matchRatio >= 0.8) {
      return { valid: true, confidence: 'keywords-high' };
    }
    if (matchRatio >= 0.6) {
      return { valid: true, confidence: 'keywords-medium' };
    }
  }

  return { valid: false, confidence: 'no-match' };
}

interface QuoteMatch {
  file: string;
  line: number;
  quote: string;
  reference: string;
  context: string;
}

interface ValidationResult {
  match: QuoteMatch;
  passage: string | null;
  valid: boolean;
  confidence?: string;
  reason?: string;
}

function findInlineQuotes(content: string, filename: string): QuoteMatch[] {
  const matches: QuoteMatch[] = [];
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // Skip markdown content lines (headers, image analysis sections)
    if (line.includes('"markdown"') && line.length > 500) continue;

    // Pattern: Ra says/states/asks "quote" - look for substantial quotes
    const raSaysPattern = /Ra\s+(?:says|states|asks|explicitly\s+states|explicitly\s+says|describes|explains|confirms|notes)[:\s]+\\"([^"]{15,}?)\\"/gi;
    let match;
    while ((match = raSaysPattern.exec(line)) !== null) {
      const quote = match[1];

      // Skip if quote looks like markdown content (contains ** or \n\n)
      if (quote.includes('**') || quote.includes('\\n\\n') || quote.includes('###')) continue;

      // Find reference in nearby lines
      let reference = '';
      for (let j = Math.max(0, i - 3); j < Math.min(lines.length, i + 8); j++) {
        const refMatch = lines[j].match(/"relatedPassage":\s*"(\d+\.\d+)"/);
        if (refMatch) {
          reference = refMatch[1];
          break;
        }
      }

      // Also check for inline reference like (91.20)
      const inlineRef = line.match(/\((\d+\.\d+)\)/);
      if (inlineRef && !reference) {
        reference = inlineRef[1];
      }

      if (reference && quote.length > 15) {
        matches.push({
          file: filename,
          line: lineNum,
          quote: quote,
          reference: reference,
          context: `Ra says/states: "${quote.substring(0, 50)}..."`
        });
      }
    }

    // Pattern: quoted text followed by (reference) - for direct citations
    const quotedWithRef = /\\"([^"]{20,}?)\\"[^(]{0,30}\((\d+\.\d+)\)/g;
    while ((match = quotedWithRef.exec(line)) !== null) {
      const quote = match[1];
      const ref = match[2];

      // Skip markdown content
      if (quote.includes('**') || quote.includes('\\n') || quote.includes('###')) continue;

      // Avoid duplicates
      const isDuplicate = matches.some(m =>
        m.file === filename && m.reference === ref && normalize(m.quote) === normalize(quote)
      );

      if (!isDuplicate && quote.length > 20) {
        matches.push({
          file: filename,
          line: lineNum,
          quote: quote,
          reference: ref,
          context: line.substring(Math.max(0, match.index - 10), match.index + Math.min(match[0].length + 10, 80))
        });
      }
    }
  }

  // Deduplicate
  const seen = new Set<string>();
  return matches.filter(m => {
    const key = `${m.file}:${m.reference}:${normalize(m.quote).substring(0, 50)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function validateQuotes(): ValidationResult[] {
  const results: ValidationResult[] = [];
  const files = fs.readdirSync(archetypesDir).filter(f => f.endsWith('.json') && !f.startsWith('_'));

  for (const file of files) {
    const filePath = path.join(archetypesDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const quotes = findInlineQuotes(content, file);

    for (const quote of quotes) {
      const passage = getPassage(quote.reference);

      if (!passage) {
        results.push({
          match: quote,
          passage: null,
          valid: false,
          reason: `Reference ${quote.reference} not found`
        });
        continue;
      }

      const { valid, confidence } = quoteExistsInPassage(quote.quote, passage);
      results.push({
        match: quote,
        passage: passage.substring(0, 300) + '...',
        valid,
        confidence,
        reason: valid ? undefined : 'Quote text not found in passage'
      });
    }
  }

  return results;
}

// Main execution
console.log('Loading Ra material sections...');
loadSections();
console.log(`Loaded ${Object.keys(sections).length} sessions\n`);

console.log('Validating inline quotes...\n');
const results = validateQuotes();

const exact = results.filter(r => r.confidence === 'exact');
const partial = results.filter(r => r.confidence === 'partial');
const keywordsHigh = results.filter(r => r.confidence === 'keywords-high');
const keywordsMedium = results.filter(r => r.confidence === 'keywords-medium');
const invalid = results.filter(r => !r.valid);

console.log(`\n${'='.repeat(60)}`);
console.log(`SUMMARY`);
console.log(`${'='.repeat(60)}`);
console.log(`Total quotes found: ${results.length}`);
console.log(`  Exact match: ${exact.length}`);
console.log(`  Partial match (with ...): ${partial.length}`);
console.log(`  Keywords match (high): ${keywordsHigh.length}`);
console.log(`  Keywords match (medium): ${keywordsMedium.length}`);
console.log(`  Invalid/Not found: ${invalid.length}`);

if (keywordsMedium.length > 0) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`MEDIUM CONFIDENCE (may need review)`);
  console.log(`${'='.repeat(60)}\n`);

  for (const result of keywordsMedium) {
    console.log(`File: ${result.match.file}:${result.match.line}`);
    console.log(`Reference: ${result.match.reference}`);
    console.log(`Quote: "${result.match.quote.substring(0, 100)}${result.match.quote.length > 100 ? '...' : ''}"`);
    console.log('-'.repeat(40));
  }
}

if (invalid.length > 0) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`INVALID QUOTES (need correction)`);
  console.log(`${'='.repeat(60)}\n`);

  for (const result of invalid) {
    console.log(`File: ${result.match.file}:${result.match.line}`);
    console.log(`Reference: ${result.match.reference}`);
    console.log(`Quote: "${result.match.quote.substring(0, 100)}${result.match.quote.length > 100 ? '...' : ''}"`);
    console.log(`Reason: ${result.reason}`);
    if (result.passage) {
      console.log(`Passage: ${result.passage.substring(0, 200)}...`);
    }
    console.log('-'.repeat(40));
  }
}

if (process.argv.includes('--verbose')) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`ALL VALID QUOTES`);
  console.log(`${'='.repeat(60)}\n`);

  for (const result of results.filter(r => r.valid)) {
    console.log(`✓ [${result.confidence}] ${result.match.file}:${result.match.line} - ${result.match.reference}`);
    console.log(`  "${result.match.quote.substring(0, 60)}${result.match.quote.length > 60 ? '...' : ''}"`);
  }
}

process.exit(invalid.length > 0 ? 1 : 0);
