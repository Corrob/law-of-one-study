/**
 * Validate that all quotes in the concept graph and study paths reference real Ra Material quotes.
 *
 * Run with: npm run validate:quotes
 */

import * as fs from "fs";
import * as path from "path";

interface KeyPassage {
  reference: string;
  excerpt: string;
  context: string;
}

interface GraphConcept {
  id: string;
  term: string;
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

// Load paths
const conceptGraphPath = path.join(__dirname, "../src/data/concept-graph.json");
const studyPathsDir = path.join(__dirname, "../src/data/study-paths");
const sectionsDir = path.join(__dirname, "../public/sections");

function loadConceptGraph(): ConceptGraph {
  const data = fs.readFileSync(conceptGraphPath, "utf-8");
  return JSON.parse(data);
}

function loadStudyPaths(): StudyPath[] {
  const paths: StudyPath[] = [];
  if (!fs.existsSync(studyPathsDir)) {
    return paths;
  }
  const files = fs.readdirSync(studyPathsDir).filter(f => f.endsWith(".json"));
  for (const file of files) {
    const filePath = path.join(studyPathsDir, file);
    const data = fs.readFileSync(filePath, "utf-8");
    paths.push(JSON.parse(data));
  }
  return paths;
}

function loadSession(sessionNum: number): Record<string, string> | null {
  const filePath = path.join(sectionsDir, `${sessionNum}.json`);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  const data = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(data);
}

// Load all sessions
function loadAllSessions(): Map<string, string> {
  const allText = new Map<string, string>();
  for (let i = 1; i <= 106; i++) {
    const session = loadSession(i);
    if (session) {
      for (const [key, text] of Object.entries(session)) {
        allText.set(key, text);
      }
    }
  }
  return allText;
}

function parseReference(reference: string): { session: number; question: number } | null {
  // Handle formats like "16.51", "1.0", "82.10"
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
  // Normalize for comparison: lowercase, remove extra whitespace, punctuation variations
  return text
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
    .replace(/…/g, "...")
    .replace(/—/g, "-")
    .replace(/\[.*?\]/g, "") // Remove bracketed editorial notes
    .trim();
}

function getExcerptSignature(excerpt: string): string[] {
  // Get key phrases from the excerpt for matching
  const normalized = normalizeText(excerpt);
  // Get unique significant words (>4 chars)
  const words = normalized.split(" ").filter(w => w.length > 4);
  return words.slice(0, 15);
}

function excerptExistsInText(excerpt: string, fullText: string): boolean {
  const normalizedFull = normalizeText(fullText);

  // Check for key phrase matches
  const signature = getExcerptSignature(excerpt);
  if (signature.length === 0) return false;

  let matchCount = 0;
  for (const word of signature) {
    if (normalizedFull.includes(word)) {
      matchCount++;
    }
  }

  const matchRatio = matchCount / signature.length;

  // Need at least 80% of signature words to match
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
  source: "concept-graph" | "study-path";
  sourceId: string;
  sourceName: string;
  reference: string;
  excerpt: string;
  status: "valid" | "invalid_reference" | "quote_not_found" | "wrong_reference" | "session_not_found";
  suggestedReference?: string;
  actualText?: string;
}

function validateQuote(
  source: "concept-graph" | "study-path",
  sourceId: string,
  sourceName: string,
  reference: string,
  excerpt: string,
  sessionCache: Map<number, Record<string, string> | null>,
  allSessions: Map<string, string>
): ValidationResult {
  const parsed = parseReference(reference);

  if (!parsed) {
    return {
      source,
      sourceId,
      sourceName,
      reference,
      excerpt,
      status: "invalid_reference",
    };
  }

  // Load session (with caching)
  if (!sessionCache.has(parsed.session)) {
    sessionCache.set(parsed.session, loadSession(parsed.session));
  }
  const session = sessionCache.get(parsed.session);

  if (!session) {
    return {
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

  // Check if quote exists at the stated reference
  if (actualText && excerptExistsInText(excerpt, actualText)) {
    return {
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
      source,
      sourceId,
      sourceName,
      reference,
      excerpt,
      status: "quote_not_found",
      actualText: actualText ? actualText.substring(0, 150) + "..." : "Reference not found",
    };
  } else {
    return {
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
  const sessionCache = new Map<number, Record<string, string> | null>();
  const allSessions = loadAllSessions();

  // Validate concept graph quotes
  const graph = loadConceptGraph();
  for (const [conceptId, concept] of Object.entries(graph.concepts)) {
    for (const passage of concept.keyPassages) {
      results.push(
        validateQuote(
          "concept-graph",
          conceptId,
          concept.term,
          passage.reference,
          passage.excerpt,
          sessionCache,
          allSessions
        )
      );
    }
  }

  // Validate study path quotes
  const studyPaths = loadStudyPaths();
  for (const studyPath of studyPaths) {
    for (const lesson of studyPath.lessons) {
      for (const section of lesson.sections) {
        if (section.type === "quote" && section.reference && section.text) {
          results.push(
            validateQuote(
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

  return results;
}

// Run validation
console.log("Validating quotes against Ra Material...\n");
console.log("Loading all 106 sessions...");

const results = validateAllQuotes();

// Separate by source
const conceptGraphResults = results.filter(r => r.source === "concept-graph");
const studyPathResults = results.filter(r => r.source === "study-path");

// Calculate stats for concept graph
const cgValid = conceptGraphResults.filter(r => r.status === "valid");
const cgWrongRef = conceptGraphResults.filter(r => r.status === "wrong_reference");
const cgNotFound = conceptGraphResults.filter(r => r.status === "quote_not_found");
const cgInvalidRef = conceptGraphResults.filter(r => r.status === "invalid_reference");

// Calculate stats for study paths
const spValid = studyPathResults.filter(r => r.status === "valid");
const spWrongRef = studyPathResults.filter(r => r.status === "wrong_reference");
const spNotFound = studyPathResults.filter(r => r.status === "quote_not_found");
const spInvalidRef = studyPathResults.filter(r => r.status === "invalid_reference");

console.log(`\n=== CONCEPT GRAPH ===`);
console.log(`Total passages checked: ${conceptGraphResults.length}`);
console.log(`  Valid: ${cgValid.length}`);
console.log(`  Wrong reference (fixable): ${cgWrongRef.length}`);
console.log(`  Not found anywhere (fabricated?): ${cgNotFound.length}`);
console.log(`  Invalid reference format: ${cgInvalidRef.length}`);

console.log(`\n=== STUDY PATHS ===`);
console.log(`Total quotes checked: ${studyPathResults.length}`);
console.log(`  Valid: ${spValid.length}`);
console.log(`  Wrong reference (fixable): ${spWrongRef.length}`);
console.log(`  Not found anywhere (fabricated?): ${spNotFound.length}`);
console.log(`  Invalid reference format: ${spInvalidRef.length}`);

const allWrongRef = [...cgWrongRef, ...spWrongRef];
const allNotFound = [...cgNotFound, ...spNotFound];
const allInvalidRef = [...cgInvalidRef, ...spInvalidRef];

if (allWrongRef.length > 0) {
  console.log("\n=== WRONG REFERENCE (quote exists but at different location) ===\n");
  for (const result of allWrongRef) {
    const prefix = result.source === "concept-graph" ? "Concept" : "Study Path";
    console.log(`${prefix}: ${result.sourceName}`);
    console.log(`  Stated ref: ${result.reference} -> Should be: ${result.suggestedReference}`);
    console.log(`  Excerpt: "${result.excerpt.substring(0, 80)}..."`);
    console.log("");
  }
}

if (allNotFound.length > 0) {
  console.log("=== NOT FOUND (possibly fabricated) ===\n");
  for (const result of allNotFound) {
    const prefix = result.source === "concept-graph" ? "Concept" : "Study Path";
    console.log(`${prefix}: ${result.sourceName} (${result.sourceId})`);
    console.log(`  Stated ref: ${result.reference}`);
    console.log(`  Excerpt: "${result.excerpt.substring(0, 80)}..."`);
    if (result.actualText) {
      console.log(`  Actual at ref: "${result.actualText.substring(0, 80)}..."`);
    }
    console.log("");
  }
}

if (allInvalidRef.length > 0) {
  console.log("=== INVALID REFERENCE FORMAT ===\n");
  for (const result of allInvalidRef) {
    const prefix = result.source === "concept-graph" ? "Concept" : "Study Path";
    console.log(`${prefix}: ${result.sourceName} - Reference: ${result.reference}`);
  }
}

const hasErrors = allNotFound.length > 0 || allInvalidRef.length > 0;
console.log(`\n=== SUMMARY ===`);
console.log(`Total quotes validated: ${results.length}`);
console.log(`  Concept Graph: ${conceptGraphResults.length}`);
console.log(`  Study Paths: ${studyPathResults.length}`);
console.log(`Status: ${hasErrors ? "FAILED - Issues found" : "PASSED - All quotes valid"}`);

process.exit(hasErrors ? 1 : 0);
