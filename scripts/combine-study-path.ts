#!/usr/bin/env npx tsx
/**
 * Combine split lesson files back into a single study path JSON.
 *
 * This script reads individual lesson files from a directory and
 * combines them into a single study path JSON file.
 *
 * Expected directory structure:
 * - _metadata.json: Path-level metadata with lessonOrder
 * - NN-lesson-id.json: Individual lesson files
 *
 * Usage:
 *   npx tsx scripts/combine-study-path.ts archetypes
 *   npx tsx scripts/combine-study-path.ts --path archetypes
 */

import * as fs from "fs";
import * as path from "path";
import {
  StudyPathSchema,
  LessonSchema,
  type Lesson,
} from "../src/lib/schemas/study-paths";
import { z } from "zod";

// Parse command line arguments
const args = process.argv.slice(2);
let pathName = args.find((arg) => !arg.startsWith("--"));
const pathIndex = args.findIndex((arg) => arg === "--path");
if (pathIndex !== -1 && args[pathIndex + 1]) {
  pathName = args[pathIndex + 1];
}

if (!pathName) {
  console.error("Usage: npx tsx scripts/combine-study-path.ts <path-name>");
  console.error("Example: npx tsx scripts/combine-study-path.ts archetypes");
  process.exit(1);
}

// Configuration
const SOURCE_DIR = path.join(__dirname, "../src/data/study-paths");
const INPUT_DIR = path.join(SOURCE_DIR, pathName);
const OUTPUT_FILE = path.join(SOURCE_DIR, `${pathName}.json`);

// Check input directory exists
if (!fs.existsSync(INPUT_DIR)) {
  console.error(`Input directory not found: ${INPUT_DIR}`);
  process.exit(1);
}

// Metadata schema
const MetadataSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  estimatedMinutes: z.number(),
  concepts: z.array(z.string()),
  recommendedPaths: z.array(z.string()).optional(),
  completionReflection: z.string().optional(),
  lessonOrder: z.array(z.string()),
});

// Read metadata
const metadataFile = path.join(INPUT_DIR, "_metadata.json");
if (!fs.existsSync(metadataFile)) {
  console.error(`Metadata file not found: ${metadataFile}`);
  process.exit(1);
}

console.log(`Reading metadata from ${metadataFile}...`);
const rawMetadata = JSON.parse(fs.readFileSync(metadataFile, "utf-8"));
const metadataResult = MetadataSchema.safeParse(rawMetadata);

if (!metadataResult.success) {
  console.error("Invalid metadata:");
  console.error(metadataResult.error.issues);
  process.exit(1);
}

const metadata = metadataResult.data;

// Read lesson files
console.log(`\nReading lessons from ${INPUT_DIR}...`);

// Get all lesson files (NN-*.json, excluding _metadata.json)
const files = fs.readdirSync(INPUT_DIR).filter((f) => {
  return f.endsWith(".json") && !f.startsWith("_") && /^\d{2}-/.test(f);
});

// Build lesson map by ID
const lessonMap = new Map<string, Lesson>();

for (const file of files) {
  const filepath = path.join(INPUT_DIR, file);
  const rawLesson = JSON.parse(fs.readFileSync(filepath, "utf-8"));
  const lessonResult = LessonSchema.safeParse(rawLesson);

  if (!lessonResult.success) {
    console.error(`Invalid lesson in ${file}:`);
    console.error(lessonResult.error.issues);
    process.exit(1);
  }

  const lesson = lessonResult.data;
  lessonMap.set(lesson.id, lesson);
  console.log(`  Loaded: ${file} (${lesson.title})`);
}

// Order lessons according to lessonOrder from metadata
const orderedLessons: Lesson[] = [];
const missingLessons: string[] = [];

for (const lessonId of metadata.lessonOrder) {
  const lesson = lessonMap.get(lessonId);
  if (lesson) {
    orderedLessons.push(lesson);
  } else {
    missingLessons.push(lessonId);
  }
}

if (missingLessons.length > 0) {
  console.error(`\nMissing lessons specified in lessonOrder:`);
  missingLessons.forEach((id) => console.error(`  - ${id}`));
  process.exit(1);
}

// Check for lessons not in order (extra lessons in directory)
const extraLessons = Array.from(lessonMap.keys()).filter(
  (id) => !metadata.lessonOrder.includes(id)
);

if (extraLessons.length > 0) {
  console.warn(`\nWarning: Found lessons not in lessonOrder:`);
  extraLessons.forEach((id) => console.warn(`  - ${id}`));
  console.warn(`These lessons will be appended at the end.`);
  extraLessons.forEach((id) => {
    const lesson = lessonMap.get(id);
    if (lesson) orderedLessons.push(lesson);
  });
}

// Build the combined study path
const studyPath = {
  id: metadata.id,
  title: metadata.title,
  description: metadata.description,
  difficulty: metadata.difficulty,
  estimatedMinutes: metadata.estimatedMinutes,
  concepts: metadata.concepts,
  ...(metadata.recommendedPaths && { recommendedPaths: metadata.recommendedPaths }),
  lessons: orderedLessons,
  ...(metadata.completionReflection && {
    completionReflection: metadata.completionReflection,
  }),
};

// Validate the combined study path
const parseResult = StudyPathSchema.safeParse(studyPath);

if (!parseResult.success) {
  console.error("\nCombined study path validation failed:");
  console.error(parseResult.error.issues);
  process.exit(1);
}

// Write output file
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(parseResult.data, null, 2) + "\n");

// Summary
console.log(`\nCombine complete!`);
console.log(`- Output: ${OUTPUT_FILE}`);
console.log(`- Lessons: ${orderedLessons.length}`);
console.log(`\nRun 'npm run build' to verify the output.`);
