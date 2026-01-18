#!/usr/bin/env npx tsx
/**
 * Translate study path quotes by matching excerpts to Ra Material source files.
 * Uses proportional sentence positioning for accurate cross-language matching.
 *
 * Usage: npx tsx scripts/translate-study-path-quotes.ts --lang de
 *        npx tsx scripts/translate-study-path-quotes.ts --lang es --force
 */

import * as fs from "fs";
import * as path from "path";

// Parse command line arguments
const args = process.argv.slice(2);
const langIndex = args.findIndex((arg) => arg === "--lang" || arg === "--language");
const TARGET_LANG = langIndex !== -1 && args[langIndex + 1] ? args[langIndex + 1] : null;
const FORCE = args.includes("--force");

if (!TARGET_LANG) {
  console.error("Usage: npx tsx scripts/translate-study-path-quotes.ts --lang <language-code> [--force]");
  console.error("Example: npx tsx scripts/translate-study-path-quotes.ts --lang de");
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
  process.exit(1);
}

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

// Paths
const STUDY_PATHS_DIR = path.join(__dirname, "../src/data/study-paths");
const SECTIONS_DIR = path.join(__dirname, "../public/sections");

// Load section file for a given language and session
function loadSection(language: string, session: number): Record<string, string> | null {
  const sectionPath = path.join(SECTIONS_DIR, language, `${session}.json`);
  try {
    return JSON.parse(fs.readFileSync(sectionPath, "utf-8"));
  } catch {
    return null;
  }
}

// Parse reference like "16.51" to { session: 16, question: 51 }
function parseReference(reference: string): { session: number; question: number } | null {
  const match = reference.match(/^(\d+)\.(\d+)$/);
  if (!match) return null;
  return {
    session: parseInt(match[1], 10),
    question: parseInt(match[2], 10),
  };
}

// Split text into sentences (handling Ra Material formatting)
function splitIntoSentences(text: string): string[] {
  const cleaned = text.replace(speakerPrefixRegex, "").replace(iAmRaRegex, "");
  // Add spaces after periods/colons followed directly by capital letters
  const normalized = cleaned
    .replace(/\.([A-Z])/g, ". $1")
    .replace(/:([A-Z])/g, ": $1");
  return normalized
    .split(/(?<=[.!?:])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

// Normalize text for comparison
function normalizeForComparison(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[""„"«»]/g, '"')
    .replace(/[''‚']/g, "'")
    .trim();
}

// Remove footnote markers from translated text
function removeFootnotes(text: string): string {
  return text
    .replace(/^(\d{1,2})\s+/g, "") // Remove footnotes at start of text
    .replace(/(\w)\s+(\d{1,2})(?=\s|[.,;:!?]|$)/g, "$1") // "word 1." -> "word."
    .replace(/(\w)(\d{1,2})(?=\s|[.,;:!?]|$)/g, "$1") // "word1." -> "word."
    .replace(/\s+/g, " ")
    .trim();
}

// Find translation using proportional sentence positioning
function findTranslation(
  englishExcerpt: string,
  englishFull: string,
  targetFull: string
): string | null {
  const cleanedTargetFull = removeFootnotes(targetFull);

  const isContentSentence = (s: string) =>
    s.length >= 10 && !s.match(/^(Ra:\s*)?(I am Ra|Ich bin Ra|Soy Ra|Je suis Ra)\.?$/i);

  const englishFullSentences = splitIntoSentences(englishFull).filter(isContentSentence);
  const excerptSentences = splitIntoSentences(englishExcerpt).filter(isContentSentence);
  const targetSentences = splitIntoSentences(cleanedTargetFull).filter(isContentSentence);

  if (excerptSentences.length === 0 || targetSentences.length === 0) {
    return null;
  }

  // Find which sentence in the full English text matches the first sentence of the excerpt
  const normalizedFirstExcerpt = normalizeForComparison(excerptSentences[0]);
  let englishStartIndex = -1;

  for (let i = 0; i < englishFullSentences.length; i++) {
    const normalizedSentence = normalizeForComparison(englishFullSentences[i]);
    const excerptStart = normalizedFirstExcerpt.slice(0, 30);
    const sentenceStart = normalizedSentence.slice(0, 30);
    if (
      normalizedSentence.includes(normalizedFirstExcerpt.slice(0, 40)) ||
      excerptStart === sentenceStart
    ) {
      englishStartIndex = i;
      break;
    }
  }

  if (englishStartIndex === -1) {
    return null;
  }

  // Use proportional positioning
  const relativeStartPosition = englishStartIndex / Math.max(englishFullSentences.length, 1);
  const targetStartIndex = Math.min(
    Math.round(relativeStartPosition * targetSentences.length),
    targetSentences.length - 1
  );

  const relativeExcerptLength = excerptSentences.length / Math.max(englishFullSentences.length, 1);
  const targetSentenceCount = Math.max(
    1,
    Math.round(relativeExcerptLength * targetSentences.length)
  );
  const finalSentenceCount = Math.min(targetSentenceCount, excerptSentences.length + 1);

  const targetEndIndex = Math.min(
    targetStartIndex + finalSentenceCount - 1,
    targetSentences.length - 1
  );

  const result = targetSentences.slice(targetStartIndex, targetEndIndex + 1).join(" ");
  return removeFootnotes(result);
}

// Study path types
interface StudyPathSection {
  type: string;
  reference?: string;
  text?: string;
  [key: string]: unknown;
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

// Main function
async function main() {
  console.log(`=== Translate Study Path Quotes to ${config.name} ===\n`);

  const targetDir = path.join(STUDY_PATHS_DIR, LANG);
  if (!fs.existsSync(targetDir)) {
    console.error(`Target directory does not exist: ${targetDir}`);
    console.error("Run translate-study-paths.ts first to create the base translations.");
    process.exit(1);
  }

  const stats = { translated: 0, notFound: 0, skipped: 0 };

  // Get all JSON files in the target language directory
  const files = fs.readdirSync(targetDir).filter((f) => f.endsWith(".json"));

  for (const filename of files) {
    console.log(`\nProcessing: ${filename}`);
    const targetFilePath = path.join(targetDir, filename);
    const englishFilePath = path.join(STUDY_PATHS_DIR, filename);

    // Load both English (source of truth for quote text) and target
    const studyPath: StudyPath = JSON.parse(fs.readFileSync(targetFilePath, "utf-8"));
    const englishStudyPath: StudyPath = JSON.parse(fs.readFileSync(englishFilePath, "utf-8"));

    let modified = false;

    for (let lessonIdx = 0; lessonIdx < studyPath.lessons.length; lessonIdx++) {
      const lesson = studyPath.lessons[lessonIdx];
      const englishLesson = englishStudyPath.lessons[lessonIdx];

      for (let sectionIdx = 0; sectionIdx < lesson.sections.length; sectionIdx++) {
        const section = lesson.sections[sectionIdx];
        const englishSectionData = englishLesson?.sections[sectionIdx];

        if (section.type !== "quote" || !section.reference) {
          continue;
        }

        // Get the ENGLISH quote text (source of truth)
        const englishQuoteText = englishSectionData?.text as string | undefined;
        if (!englishQuoteText) {
          console.log(`  ⚠ No English source for ${section.reference}`);
          stats.notFound++;
          continue;
        }

        // Check if already translated by comparing to English
        if (section.text !== englishQuoteText && !FORCE) {
          stats.skipped++;
          continue;
        }

        const ref = parseReference(section.reference);
        if (!ref) {
          console.log(`  ⚠ Invalid reference: ${section.reference}`);
          stats.notFound++;
          continue;
        }

        const englishSection = loadSection("en", ref.session);
        const targetSection = loadSection(LANG, ref.session);

        if (!englishSection || !targetSection) {
          console.log(`  ⚠ Missing section files for session ${ref.session}`);
          stats.notFound++;
          continue;
        }

        const key = `${ref.session}.${ref.question}`;
        const englishFull = englishSection[key];
        const targetFull = targetSection[key];

        if (!englishFull || !targetFull) {
          console.log(`  ⚠ Missing Q&A ${key}`);
          stats.notFound++;
          continue;
        }

        // Always use English quote text for matching
        const translation = findTranslation(englishQuoteText, englishFull, targetFull);

        if (translation) {
          section.text = translation;
          stats.translated++;
          console.log(`  ✓ ${section.reference}: translated`);
          modified = true;
        } else {
          console.log(`  ✗ ${section.reference}: not found`);
          stats.notFound++;
        }
      }
    }

    if (modified) {
      fs.writeFileSync(targetFilePath, JSON.stringify(studyPath, null, 2));
      console.log(`  Saved: ${filename}`);
    }
  }

  console.log("\n=== Summary ===");
  console.log(`Translated: ${stats.translated}`);
  console.log(`Not found: ${stats.notFound}`);
  console.log(`Skipped (already translated): ${stats.skipped}`);
}

main().catch(console.error);
