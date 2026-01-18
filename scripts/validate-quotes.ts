/**
 * Validate that all quotes in the concept graph and study paths reference real Ra Material quotes.
 * Supports all available languages (en, es, de, fr).
 *
 * Run with: npm run validate:quotes
 *           npm run validate:quotes -- --lang fr
 *           npm run validate:quotes -- --fix
 */

import * as fs from "fs";
import * as path from "path";

// Available languages - keep in sync with language-config.ts
const AVAILABLE_LANGUAGES = ["en", "es", "de", "fr"] as const;
type AvailableLanguage = (typeof AVAILABLE_LANGUAGES)[number];

// Parse command line arguments
const args = process.argv.slice(2);
const langIndex = args.findIndex((arg) => arg === "--lang" || arg === "--language");
const SPECIFIC_LANG = langIndex !== -1 ? args[langIndex + 1] : null;
const FIX_MODE = args.includes("--fix");

// Validate specific language if provided
if (SPECIFIC_LANG && !AVAILABLE_LANGUAGES.includes(SPECIFIC_LANG as AvailableLanguage)) {
  console.error(`Invalid language: ${SPECIFIC_LANG}`);
  console.error(`Available languages: ${AVAILABLE_LANGUAGES.join(", ")}`);
  process.exit(1);
}

const LANGUAGES_TO_CHECK = SPECIFIC_LANG
  ? [SPECIFIC_LANG as AvailableLanguage]
  : [...AVAILABLE_LANGUAGES];

// Paths
const conceptGraphPath = path.join(__dirname, "../src/data/concept-graph.json");
const studyPathsDir = path.join(__dirname, "../src/data/study-paths");
const sectionsDir = path.join(__dirname, "../public/sections");

// Types for multilingual concept graph
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
  concepts: Record<string, GraphConcept>;
}

// Study path types
interface StudyPathSection {
  type: string;
  reference?: string;
  text?: string;
}

interface StudyPathLesson {
  id: string;
  title: string;
  sections: StudyPathSection[];
}

interface StudyPath {
  id: string;
  title: string;
  lessons: StudyPathLesson[];
}

// Load concept graph
function loadConceptGraph(): ConceptGraph {
  const data = fs.readFileSync(conceptGraphPath, "utf-8");
  return JSON.parse(data);
}

// Load study paths for a language
function loadStudyPaths(language: AvailableLanguage): StudyPath[] {
  const paths: StudyPath[] = [];
  const langDir =
    language === "en" ? studyPathsDir : path.join(studyPathsDir, language);

  if (!fs.existsSync(langDir)) {
    return paths;
  }

  const files = fs.readdirSync(langDir).filter((f) => f.endsWith(".json"));
  for (const file of files) {
    const filePath = path.join(langDir, file);
    const data = fs.readFileSync(filePath, "utf-8");
    paths.push(JSON.parse(data));
  }
  return paths;
}

// Load session file for a specific language
function loadSession(
  language: AvailableLanguage,
  sessionNum: number
): Record<string, string> | null {
  const filePath = path.join(sectionsDir, language, `${sessionNum}.json`);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  const data = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(data);
}

// Load all sessions for a language
function loadAllSessions(language: AvailableLanguage): Map<string, string> {
  const allText = new Map<string, string>();
  for (let i = 1; i <= 106; i++) {
    const session = loadSession(language, i);
    if (session) {
      for (const [key, text] of Object.entries(session)) {
        allText.set(key, text);
      }
    }
  }
  return allText;
}

function parseReference(reference: string): { session: number; question: number } | null {
  const match = reference.match(/^(\d+)\.(\d+)$/);
  if (match) {
    return {
      session: parseInt(match[1], 10),
      question: parseInt(match[2], 10),
    };
  }
  return null;
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[""„"«»]/g, '"')
    .replace(/[''‚']/g, "'")
    .replace(/…/g, "...")
    .replace(/—/g, "-")
    .replace(/\[.*?\]/g, "") // Remove bracketed editorial notes
    .trim();
}

function getExcerptSignature(excerpt: string): string[] {
  const normalized = normalizeText(excerpt);
  const words = normalized.split(" ").filter((w) => w.length > 4);
  return words.slice(0, 15);
}

function excerptExistsInText(excerpt: string, fullText: string): boolean {
  const normalizedFull = normalizeText(fullText);
  const signature = getExcerptSignature(excerpt);
  if (signature.length === 0) return false;

  let matchCount = 0;
  for (const word of signature) {
    if (normalizedFull.includes(word)) {
      matchCount++;
    }
  }

  const matchRatio = matchCount / signature.length;
  return matchRatio >= 0.8;
}

function findQuoteInAllSessions(
  excerpt: string,
  allSessions: Map<string, string>
): string | null {
  const signature = getExcerptSignature(excerpt);
  if (signature.length === 0) return null;

  let bestMatch: { ref: string; score: number } | null = null;

  for (const [ref, text] of allSessions) {
    const normalizedText = normalizeText(text);
    let matchCount = 0;
    for (const word of signature) {
      if (normalizedText.includes(word)) {
        matchCount++;
      }
    }
    const score = matchCount / signature.length;
    if (score >= 0.8 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { ref, score };
    }
  }

  return bestMatch?.ref || null;
}

interface ValidationResult {
  language: AvailableLanguage;
  source: "concept-graph" | "study-path";
  sourceId: string;
  sourceName: string;
  reference: string;
  excerpt: string;
  status:
    | "valid"
    | "invalid_reference"
    | "quote_not_found"
    | "wrong_reference"
    | "session_not_found"
    | "missing_translation";
  suggestedReference?: string;
  actualText?: string;
}

function validateQuote(
  language: AvailableLanguage,
  source: "concept-graph" | "study-path",
  sourceId: string,
  sourceName: string,
  reference: string,
  excerpt: string | undefined,
  sessionCache: Map<string, Record<string, string> | null>,
  allSessions: Map<string, string>
): ValidationResult {
  // Check if translation exists
  if (!excerpt) {
    return {
      language,
      source,
      sourceId,
      sourceName,
      reference,
      excerpt: "(missing)",
      status: "missing_translation",
    };
  }

  const parsed = parseReference(reference);

  if (!parsed) {
    return {
      language,
      source,
      sourceId,
      sourceName,
      reference,
      excerpt,
      status: "invalid_reference",
    };
  }

  // Load session (with caching by language-session)
  const cacheKey = `${language}-${parsed.session}`;
  if (!sessionCache.has(cacheKey)) {
    sessionCache.set(cacheKey, loadSession(language, parsed.session));
  }
  const session = sessionCache.get(cacheKey);

  if (!session) {
    return {
      language,
      source,
      sourceId,
      sourceName,
      reference,
      excerpt,
      status: "session_not_found",
    };
  }

  const questionKey = `${parsed.session}.${parsed.question}`;
  const actualText = session[questionKey];

  if (actualText && excerptExistsInText(excerpt, actualText)) {
    return {
      language,
      source,
      sourceId,
      sourceName,
      reference,
      excerpt,
      status: "valid",
    };
  }

  // Quote not found at stated reference - search all sessions
  const foundRef = findQuoteInAllSessions(excerpt, allSessions);

  if (foundRef && foundRef !== questionKey) {
    return {
      language,
      source,
      sourceId,
      sourceName,
      reference,
      excerpt,
      status: "wrong_reference",
      suggestedReference: foundRef,
      actualText: allSessions.get(foundRef)?.substring(0, 150) + "...",
    };
  } else if (!foundRef) {
    return {
      language,
      source,
      sourceId,
      sourceName,
      reference,
      excerpt,
      status: "quote_not_found",
      actualText: actualText
        ? actualText.substring(0, 150) + "..."
        : "Reference not found",
    };
  } else {
    return {
      language,
      source,
      sourceId,
      sourceName,
      reference,
      excerpt,
      status: "valid",
    };
  }
}

function validateAllQuotes(): ValidationResult[] {
  const results: ValidationResult[] = [];
  const sessionCache = new Map<string, Record<string, string> | null>();
  const graph = loadConceptGraph();

  for (const language of LANGUAGES_TO_CHECK) {
    console.log(`\nValidating ${language.toUpperCase()}...`);

    const allSessions = loadAllSessions(language);
    console.log(`  Loaded ${allSessions.size} Q&A pairs from Ra Material`);

    // Validate concept graph quotes for this language
    for (const [conceptId, concept] of Object.entries(graph.concepts)) {
      for (const passage of concept.keyPassages) {
        const excerpt = passage.excerpt[language];
        const term = concept.term[language] || concept.term.en;

        results.push(
          validateQuote(
            language,
            "concept-graph",
            conceptId,
            term,
            passage.reference,
            excerpt,
            sessionCache,
            allSessions
          )
        );
      }
    }

    // Validate study path quotes for this language
    const studyPaths = loadStudyPaths(language);
    for (const studyPath of studyPaths) {
      for (const lesson of studyPath.lessons) {
        for (const section of lesson.sections) {
          if (section.type === "quote" && section.reference && section.text) {
            results.push(
              validateQuote(
                language,
                "study-path",
                `${studyPath.id}/${lesson.id}`,
                `${studyPath.title} > ${lesson.title}`,
                section.reference,
                section.text,
                sessionCache,
                allSessions
              )
            );
          }
        }
      }
    }
  }

  return results;
}

// Run validation
console.log("=== Multilingual Quote Validation ===");
console.log(`Languages: ${LANGUAGES_TO_CHECK.join(", ")}`);
if (FIX_MODE) {
  console.log("Fix mode: ON (will attempt to fix wrong references)");
}

const results = validateAllQuotes();

// Group by language and source
const byLanguage: Record<string, ValidationResult[]> = {};
for (const r of results) {
  if (!byLanguage[r.language]) byLanguage[r.language] = [];
  byLanguage[r.language].push(r);
}

// Print results by language
let totalErrors = 0;

for (const language of LANGUAGES_TO_CHECK) {
  const langResults = byLanguage[language] || [];
  const cgResults = langResults.filter((r) => r.source === "concept-graph");
  const spResults = langResults.filter((r) => r.source === "study-path");

  const cgValid = cgResults.filter((r) => r.status === "valid");
  const cgWrongRef = cgResults.filter((r) => r.status === "wrong_reference");
  const cgNotFound = cgResults.filter((r) => r.status === "quote_not_found");
  const cgMissing = cgResults.filter((r) => r.status === "missing_translation");
  const cgInvalidRef = cgResults.filter((r) => r.status === "invalid_reference");

  const spValid = spResults.filter((r) => r.status === "valid");
  const spWrongRef = spResults.filter((r) => r.status === "wrong_reference");
  const spNotFound = spResults.filter((r) => r.status === "quote_not_found");
  const spInvalidRef = spResults.filter((r) => r.status === "invalid_reference");

  console.log(`\n${"=".repeat(50)}`);
  console.log(`LANGUAGE: ${language.toUpperCase()}`);
  console.log(`${"=".repeat(50)}`);

  console.log(`\nConcept Graph (${cgResults.length} passages):`);
  console.log(`  ✓ Valid: ${cgValid.length}`);
  if (cgWrongRef.length > 0) console.log(`  ⚠ Wrong reference: ${cgWrongRef.length}`);
  if (cgNotFound.length > 0) console.log(`  ✗ Not found: ${cgNotFound.length}`);
  if (cgMissing.length > 0) console.log(`  ○ Missing translation: ${cgMissing.length}`);
  if (cgInvalidRef.length > 0) console.log(`  ! Invalid reference: ${cgInvalidRef.length}`);

  console.log(`\nStudy Paths (${spResults.length} quotes):`);
  console.log(`  ✓ Valid: ${spValid.length}`);
  if (spWrongRef.length > 0) console.log(`  ⚠ Wrong reference: ${spWrongRef.length}`);
  if (spNotFound.length > 0) console.log(`  ✗ Not found: ${spNotFound.length}`);
  if (spInvalidRef.length > 0) console.log(`  ! Invalid reference: ${spInvalidRef.length}`);

  // Track errors (missing translations don't count as errors for non-English)
  const langErrors =
    cgNotFound.length +
    cgInvalidRef.length +
    spNotFound.length +
    spInvalidRef.length +
    (language === "en" ? cgMissing.length : 0);
  totalErrors += langErrors;

  // Show details for issues
  const allWrongRef = [...cgWrongRef, ...spWrongRef];
  const allNotFound = [...cgNotFound, ...spNotFound];

  if (allWrongRef.length > 0) {
    console.log(`\n  WRONG REFERENCE (quote exists at different location):`);
    for (const result of allWrongRef.slice(0, 5)) {
      const prefix = result.source === "concept-graph" ? "CG" : "SP";
      console.log(`    [${prefix}] ${result.sourceName}`);
      console.log(`      Stated: ${result.reference} -> Should be: ${result.suggestedReference}`);
    }
    if (allWrongRef.length > 5) {
      console.log(`    ... and ${allWrongRef.length - 5} more`);
    }
  }

  if (allNotFound.length > 0) {
    console.log(`\n  NOT FOUND (possibly fabricated):`);
    for (const result of allNotFound.slice(0, 5)) {
      const prefix = result.source === "concept-graph" ? "CG" : "SP";
      console.log(`    [${prefix}] ${result.sourceName} @ ${result.reference}`);
      console.log(`      "${result.excerpt.substring(0, 60)}..."`);
    }
    if (allNotFound.length > 5) {
      console.log(`    ... and ${allNotFound.length - 5} more`);
    }
  }
}

// Final summary
console.log(`\n${"=".repeat(50)}`);
console.log("SUMMARY");
console.log(`${"=".repeat(50)}`);
console.log(`Total quotes validated: ${results.length}`);
console.log(`Languages checked: ${LANGUAGES_TO_CHECK.join(", ")}`);

const allValid = results.filter((r) => r.status === "valid").length;
const allWrongRef = results.filter((r) => r.status === "wrong_reference").length;
const allNotFound = results.filter((r) => r.status === "quote_not_found").length;
const allMissing = results.filter((r) => r.status === "missing_translation").length;

console.log(`\n  Valid: ${allValid}`);
console.log(`  Wrong reference: ${allWrongRef}`);
console.log(`  Not found: ${allNotFound}`);
console.log(`  Missing translation: ${allMissing}`);

console.log(
  `\nStatus: ${totalErrors === 0 ? "✓ PASSED" : `✗ FAILED (${totalErrors} errors)`}`
);

process.exit(totalErrors === 0 ? 0 : 1);
