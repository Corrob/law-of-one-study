#!/usr/bin/env npx tsx
/**
 * Split a study path JSON file into individual lesson files.
 *
 * This script takes a monolithic study path JSON and splits it into:
 * - _metadata.json: Path-level metadata (id, title, description, etc.)
 * - NN-lesson-id.json: Individual lesson files with zero-padded numbers
 *
 * This makes editing individual lessons easier and creates a better
 * diff experience in version control.
 *
 * Usage:
 *   npx tsx scripts/split-study-path.ts archetypes
 *   npx tsx scripts/split-study-path.ts --path archetypes
 */

import * as fs from "fs";
import * as path from "path";
import { StudyPathSchema } from "../src/lib/schemas/study-paths";

// Parse command line arguments
const args = process.argv.slice(2);
let pathName = args.find((arg) => !arg.startsWith("--"));
const pathIndex = args.findIndex((arg) => arg === "--path");
if (pathIndex !== -1 && args[pathIndex + 1]) {
  pathName = args[pathIndex + 1];
}

if (!pathName) {
  console.error("Usage: npx tsx scripts/split-study-path.ts <path-name>");
  console.error("Example: npx tsx scripts/split-study-path.ts archetypes");
  process.exit(1);
}

// Configuration
const SOURCE_DIR = path.join(__dirname, "../src/data/study-paths");
const SOURCE_FILE = path.join(SOURCE_DIR, `${pathName}.json`);
const OUTPUT_DIR = path.join(SOURCE_DIR, pathName);

// Check source file exists
if (!fs.existsSync(SOURCE_FILE)) {
  console.error(`Source file not found: ${SOURCE_FILE}`);
  process.exit(1);
}

// Read and validate the source file
console.log(`Reading ${SOURCE_FILE}...`);
const rawData = JSON.parse(fs.readFileSync(SOURCE_FILE, "utf-8"));
const parseResult = StudyPathSchema.safeParse(rawData);

if (!parseResult.success) {
  console.error("Invalid study path data:");
  console.error(parseResult.error.issues);
  process.exit(1);
}

const studyPath = parseResult.data;

// Create output directory
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log(`Created directory: ${OUTPUT_DIR}`);
} else {
  console.log(`Output directory exists: ${OUTPUT_DIR}`);
}

// Extract metadata (everything except lessons)
interface StudyPathMetadata {
  id: string;
  title: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedMinutes: number;
  concepts: string[];
  recommendedPaths?: string[];
  completionReflection?: string;
  lessonOrder: string[]; // Preserve lesson order for recombining
}

const metadata: StudyPathMetadata = {
  id: studyPath.id,
  title: studyPath.title,
  description: studyPath.description,
  difficulty: studyPath.difficulty,
  estimatedMinutes: studyPath.estimatedMinutes,
  concepts: studyPath.concepts,
  lessonOrder: studyPath.lessons.map((l) => l.id),
};

if (studyPath.recommendedPaths) {
  metadata.recommendedPaths = studyPath.recommendedPaths;
}
if (studyPath.completionReflection) {
  metadata.completionReflection = studyPath.completionReflection;
}

// Write metadata file
const metadataFile = path.join(OUTPUT_DIR, "_metadata.json");
fs.writeFileSync(metadataFile, JSON.stringify(metadata, null, 2) + "\n");
console.log(`Wrote: _metadata.json`);

// Write individual lesson files
studyPath.lessons.forEach((lesson, index) => {
  const paddedIndex = String(index).padStart(2, "0");
  const filename = `${paddedIndex}-${lesson.id}.json`;
  const filepath = path.join(OUTPUT_DIR, filename);

  fs.writeFileSync(filepath, JSON.stringify(lesson, null, 2) + "\n");
  console.log(`Wrote: ${filename}`);
});

// Summary
console.log(`\nSplit complete!`);
console.log(`- Metadata: ${metadataFile}`);
console.log(`- Lessons: ${studyPath.lessons.length} files in ${OUTPUT_DIR}`);
console.log(`\nTo recombine: npx tsx scripts/combine-study-path.ts ${pathName}`);
