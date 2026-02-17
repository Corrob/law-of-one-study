/**
 * Confederation Library Indexing Script
 *
 * Reads scraped Confederation transcripts from data/confederation/,
 * creates embeddings using OpenAI, and uploads them to Pinecone
 * in separate namespaces for passages and sentences.
 *
 * Usage:
 *   npx tsx scripts/index-confederation.ts --passages        # Index passages only
 *   npx tsx scripts/index-confederation.ts --sentences       # Index sentences only
 *   npx tsx scripts/index-confederation.ts --all             # Index both
 *   npx tsx scripts/index-confederation.ts --all --dry-run   # Count vectors without upserting
 *   npx tsx scripts/index-confederation.ts --all --years 2024,2023
 *   npx tsx scripts/index-confederation.ts --delete          # Delete all confederation vectors
 */

import { Pinecone } from "@pinecone-database/pinecone";
import OpenAI from "openai";
import * as fs from "fs";
import * as path from "path";

// Load environment variables
require("dotenv").config({ path: ".env.local" });

// =============================================================================
// Configuration
// =============================================================================

const EMBEDDING_MODEL = "text-embedding-3-small";
const BATCH_SIZE = 100;
const RATE_LIMIT_DELAY_MS = 200;
const DATA_DIR = "data/confederation";
const PASSAGE_NAMESPACE = "confederation";
const SENTENCE_NAMESPACE = "confederation-sentences";
const MIN_CHUNK_WORDS = 50;
const MAX_CHUNK_WORDS = 500;
const TARGET_SPLIT_WORDS = 250;
const MIN_SENTENCE_WORDS = 5;

// Greeting patterns to skip during sentence indexing
const GREETING_PATTERNS = [
  /^I am [\w']+[\s,.]*/i,
  /^We are those of [\w']+/i,
  /^We are [\w']+/i,
  /^Adonai/i,
];

// =============================================================================
// Types
// =============================================================================

interface ManifestTranscript {
  id: string;
  date: string;
  year: number;
  type: string;
  topics: string[];
  url: string;
  wordCount: number;
  chunkCount: number;
  entity: string;
}

interface Manifest {
  scrapedAt: string;
  totalTranscripts: number;
  transcripts: ManifestTranscript[];
}

interface TranscriptChunk {
  index: number;
  speaker: string;
  text: string;
  type: string;
}

interface TranscriptFile {
  id: string;
  date: string;
  entity: string;
  type: string;
  topics: string[];
  url: string;
  chunks: TranscriptChunk[];
}

interface PassageForIndexing {
  id: string;
  text: string;
  embeddingText: string;
  reference: string;
  entity: string;
  date: string;
  transcriptId: string;
  chunkIndex: number;
  speaker: string;
  url: string;
}

interface SentenceForIndexing {
  id: string;
  text: string;
  embeddingText: string;
  reference: string;
  entity: string;
  date: string;
  transcriptId: string;
  chunkIndex: number;
  sentenceIndex: number;
  speaker: string;
  url: string;
}

// =============================================================================
// CLI Argument Parsing
// =============================================================================

interface CLIArgs {
  passages: boolean;
  sentences: boolean;
  dryRun: boolean;
  delete: boolean;
  years: number[] | null;
}

function parseArgs(): CLIArgs {
  const args = process.argv.slice(2);
  const result: CLIArgs = {
    passages: false,
    sentences: false,
    dryRun: false,
    delete: false,
    years: null,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--passages":
        result.passages = true;
        break;
      case "--sentences":
        result.sentences = true;
        break;
      case "--all":
        result.passages = true;
        result.sentences = true;
        break;
      case "--dry-run":
        result.dryRun = true;
        break;
      case "--delete":
        result.delete = true;
        break;
      case "--years":
        if (i + 1 < args.length) {
          result.years = args[++i].split(",").map((y) => parseInt(y.trim(), 10));
        }
        break;
    }
  }

  return result;
}

// =============================================================================
// Data Loading
// =============================================================================

function loadManifest(): Manifest {
  const manifestPath = path.join(DATA_DIR, "manifest.json");
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Manifest not found at ${manifestPath}. Run the scraping script first.`);
  }
  return JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
}

function loadTranscript(transcript: ManifestTranscript): TranscriptFile | null {
  const year = transcript.id.substring(0, 4);
  const mmdd = transcript.id.substring(5);
  const filePath = path.join(DATA_DIR, year, `${mmdd}.json`);

  if (!fs.existsSync(filePath)) {
    console.warn(`  Warning: File not found for ${transcript.id}: ${filePath}`);
    return null;
  }

  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function filterTranscripts(manifest: Manifest, years: number[] | null): ManifestTranscript[] {
  if (!years) return manifest.transcripts;
  return manifest.transcripts.filter((t) => years.includes(t.year));
}

// =============================================================================
// Text Processing
// =============================================================================

function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function splitIntoSentences(text: string): string[] {
  const normalized = text.replace(/\.(?=[A-Z])/g, ". ");
  return normalized
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function isGreeting(sentence: string): boolean {
  return GREETING_PATTERNS.some((pattern) => pattern.test(sentence.trim()));
}

function mapSpeakerType(speaker: string, chunkType: string): string {
  if (chunkType === "question") return "questioner";
  if (chunkType === "comment") return "comment";
  return "channeling";
}

/**
 * Split a long chunk into sub-chunks of ~TARGET_SPLIT_WORDS words each,
 * breaking at sentence boundaries.
 */
function splitLongChunk(text: string): string[] {
  const words = wordCount(text);
  if (words <= MAX_CHUNK_WORDS) return [text];

  const sentences = splitIntoSentences(text);
  const subChunks: string[] = [];
  let current: string[] = [];
  let currentWords = 0;

  for (const sentence of sentences) {
    const sentenceWords = wordCount(sentence);
    if (currentWords + sentenceWords > TARGET_SPLIT_WORDS && current.length > 0) {
      subChunks.push(current.join(" "));
      current = [];
      currentWords = 0;
    }
    current.push(sentence);
    currentWords += sentenceWords;
  }

  if (current.length > 0) {
    subChunks.push(current.join(" "));
  }

  return subChunks;
}

// =============================================================================
// Passage Preparation
// =============================================================================

function preparePassages(transcripts: ManifestTranscript[]): PassageForIndexing[] {
  const passages: PassageForIndexing[] = [];

  for (const manifest of transcripts) {
    const transcript = loadTranscript(manifest);
    if (!transcript) continue;

    for (const chunk of transcript.chunks) {
      if (wordCount(chunk.text) < MIN_CHUNK_WORDS) continue;

      const speaker = mapSpeakerType(chunk.speaker, chunk.type);
      const subChunks = splitLongChunk(chunk.text);

      for (let subIdx = 0; subIdx < subChunks.length; subIdx++) {
        const subText = subChunks[subIdx];
        const chunkId = subChunks.length > 1
          ? `confed-${manifest.id}-${chunk.index}-${subIdx}`
          : `confed-${manifest.id}-${chunk.index}`;

        passages.push({
          id: chunkId,
          text: subText,
          embeddingText: `[${manifest.entity}, ${manifest.date}] ${subText}`,
          reference: `${manifest.entity}, ${manifest.date}`,
          entity: manifest.entity,
          date: manifest.date,
          transcriptId: manifest.id,
          chunkIndex: chunk.index,
          speaker,
          url: manifest.url,
        });
      }
    }
  }

  return passages;
}

// =============================================================================
// Sentence Preparation
// =============================================================================

function prepareSentences(transcripts: ManifestTranscript[]): SentenceForIndexing[] {
  const sentences: SentenceForIndexing[] = [];

  for (const manifest of transcripts) {
    const transcript = loadTranscript(manifest);
    if (!transcript) continue;

    for (const chunk of transcript.chunks) {
      // Only index channeling and question chunks
      if (chunk.type !== "channeling" && chunk.type !== "question") continue;

      const speaker = mapSpeakerType(chunk.speaker, chunk.type);
      const chunkSentences = splitIntoSentences(chunk.text);

      let sentenceIndex = 0;
      for (const sentence of chunkSentences) {
        if (wordCount(sentence) < MIN_SENTENCE_WORDS) continue;
        if (isGreeting(sentence)) continue;

        const speakerLabel = speaker === "questioner" ? "Questioner:" : `${manifest.entity}:`;

        sentences.push({
          id: `confed-${manifest.id}-${chunk.index}-s${sentenceIndex}`,
          text: sentence,
          embeddingText: `[${manifest.entity}, ${manifest.date}] [${speakerLabel}] ${sentence}`,
          reference: `${manifest.entity}, ${manifest.date}`,
          entity: manifest.entity,
          date: manifest.date,
          transcriptId: manifest.id,
          chunkIndex: chunk.index,
          sentenceIndex,
          speaker,
          url: manifest.url,
        });

        sentenceIndex++;
      }
    }
  }

  return sentences;
}

// =============================================================================
// Embedding & Indexing
// =============================================================================

async function createEmbeddingsBatch(
  openai: OpenAI,
  texts: string[]
): Promise<number[][]> {
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: texts,
  });
  return response.data.map((d) => d.embedding);
}

function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

async function indexVectors(
  openai: OpenAI,
  pinecone: Pinecone,
  indexName: string,
  namespaceName: string,
  items: { id: string; embeddingText: string; metadata: Record<string, string | number> }[],
  dryRun: boolean
): Promise<void> {
  if (dryRun) {
    console.log(`\n  [DRY RUN] Would index ${items.length} vectors to "${namespaceName}" namespace`);
    // Estimate storage: ~1536 floats * 4 bytes + ~500 bytes metadata per vector
    const estimatedBytes = items.length * (1536 * 4 + 500);
    const estimatedMB = (estimatedBytes / (1024 * 1024)).toFixed(1);
    console.log(`  [DRY RUN] Estimated storage: ~${estimatedMB} MB`);
    return;
  }

  const index = pinecone.index(indexName);
  const namespace = index.namespace(namespaceName);

  console.log(`\n  Indexing ${items.length} vectors to "${namespaceName}" namespace...`);

  let totalIndexed = 0;
  const startTime = Date.now();

  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(items.length / BATCH_SIZE);

    // Create embeddings
    const embeddingTexts = batch.map((item) => item.embeddingText);
    const embeddings = await createEmbeddingsBatch(openai, embeddingTexts);

    // Build vectors
    const vectors = batch.map((item, idx) => ({
      id: item.id,
      values: embeddings[idx],
      metadata: item.metadata,
    }));

    // Upsert
    await namespace.upsert(vectors);
    totalIndexed += batch.length;

    // Progress
    const elapsed = Date.now() - startTime;
    const rate = totalIndexed / (elapsed / 1000);
    const remaining = ((items.length - totalIndexed) / rate) * 1000;
    process.stdout.write(
      `\r  Batch ${batchNum}/${totalBatches} | ${totalIndexed}/${items.length} vectors | ${formatTime(elapsed)} elapsed | ~${formatTime(remaining)} remaining`
    );

    // Rate limit
    await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_DELAY_MS));
  }

  const totalTime = Date.now() - startTime;
  console.log(`\n  Done! ${totalIndexed} vectors in ${formatTime(totalTime)}`);
}

// =============================================================================
// Delete
// =============================================================================

async function deleteConfederationVectors(pinecone: Pinecone, indexName: string): Promise<void> {
  const index = pinecone.index(indexName);

  for (const ns of [PASSAGE_NAMESPACE, SENTENCE_NAMESPACE]) {
    console.log(`Deleting all vectors in "${ns}" namespace...`);
    try {
      await index.namespace(ns).deleteAll();
      console.log(`  Cleared "${ns}"`);
    } catch {
      console.log(`  No existing vectors in "${ns}"`);
    }
  }
}

// =============================================================================
// Main
// =============================================================================

async function main() {
  const args = parseArgs();

  if (!args.passages && !args.sentences && !args.delete) {
    console.log("Usage:");
    console.log("  npx tsx scripts/index-confederation.ts --passages");
    console.log("  npx tsx scripts/index-confederation.ts --sentences");
    console.log("  npx tsx scripts/index-confederation.ts --all");
    console.log("  npx tsx scripts/index-confederation.ts --all --dry-run");
    console.log("  npx tsx scripts/index-confederation.ts --all --years 2024,2023");
    console.log("  npx tsx scripts/index-confederation.ts --delete");
    process.exit(0);
  }

  // Validate environment
  if (!args.dryRun && !args.delete) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("Missing OPENAI_API_KEY in .env.local");
    }
  }
  if (!process.env.PINECONE_API_KEY) {
    throw new Error("Missing PINECONE_API_KEY in .env.local");
  }

  const indexName = process.env.PINECONE_INDEX || "law-of-one";
  const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });

  // Handle delete
  if (args.delete) {
    await deleteConfederationVectors(pinecone, indexName);
    console.log("\nDeletion complete!");
    return;
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  // Load manifest
  const manifest = loadManifest();
  const transcripts = filterTranscripts(manifest, args.years);

  console.log(`Confederation Library Indexing`);
  console.log(`  Total transcripts in manifest: ${manifest.totalTranscripts}`);
  console.log(`  Selected transcripts: ${transcripts.length}`);
  if (args.years) console.log(`  Year filter: ${args.years.join(", ")}`);
  if (args.dryRun) console.log(`  Mode: DRY RUN`);

  // Index passages
  if (args.passages) {
    console.log(`\n--- Passages ---`);
    const passages = preparePassages(transcripts);
    console.log(`  Prepared ${passages.length} passage vectors`);

    // Show sample
    if (passages.length > 0) {
      console.log(`\n  Sample passages:`);
      for (const p of passages.slice(0, 3)) {
        console.log(`    ${p.id}: [${p.entity}, ${p.date}] "${p.text.slice(0, 80)}..."`);
      }
    }

    // Show entity distribution
    const entityCounts: Record<string, number> = {};
    for (const p of passages) {
      entityCounts[p.entity] = (entityCounts[p.entity] || 0) + 1;
    }
    console.log(`\n  Entity distribution:`);
    const sorted = Object.entries(entityCounts).sort((a, b) => b[1] - a[1]);
    for (const [entity, count] of sorted.slice(0, 10)) {
      console.log(`    ${entity}: ${count} passages`);
    }

    const items = passages.map((p) => ({
      id: p.id,
      embeddingText: p.embeddingText,
      metadata: {
        text: p.text,
        reference: p.reference,
        entity: p.entity,
        date: p.date,
        transcriptId: p.transcriptId,
        chunkIndex: p.chunkIndex,
        speaker: p.speaker,
        url: p.url,
      },
    }));

    await indexVectors(openai, pinecone, indexName, PASSAGE_NAMESPACE, items, args.dryRun);
  }

  // Index sentences
  if (args.sentences) {
    console.log(`\n--- Sentences ---`);
    const sentences = prepareSentences(transcripts);
    console.log(`  Prepared ${sentences.length} sentence vectors`);

    // Show sample
    if (sentences.length > 0) {
      console.log(`\n  Sample sentences:`);
      for (const s of sentences.slice(0, 3)) {
        console.log(`    ${s.id}: "${s.text.slice(0, 80)}..."`);
      }
    }

    // Show speaker distribution
    const speakerCounts: Record<string, number> = {};
    for (const s of sentences) {
      speakerCounts[s.speaker] = (speakerCounts[s.speaker] || 0) + 1;
    }
    console.log(`\n  Speaker distribution:`);
    for (const [speaker, count] of Object.entries(speakerCounts)) {
      console.log(`    ${speaker}: ${count} sentences`);
    }

    const items = sentences.map((s) => ({
      id: s.id,
      embeddingText: s.embeddingText,
      metadata: {
        text: s.text,
        reference: s.reference,
        entity: s.entity,
        date: s.date,
        transcriptId: s.transcriptId,
        chunkIndex: s.chunkIndex,
        sentenceIndex: s.sentenceIndex,
        speaker: s.speaker,
        url: s.url,
      },
    }));

    await indexVectors(openai, pinecone, indexName, SENTENCE_NAMESPACE, items, args.dryRun);
  }

  console.log("\nIndexing complete!");
}

main().catch((error) => {
  console.error("\nIndexing failed:", error);
  process.exit(1);
});
