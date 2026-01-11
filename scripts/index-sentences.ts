/**
 * Sentence-Level Indexing Script
 *
 * This script reads all Ra Material passages from the sections/ directory,
 * splits them into individual sentences with speaker attribution,
 * creates embeddings, and uploads them to Pinecone in the "sentences" namespace.
 *
 * This enables precise quote recall by matching at the sentence level.
 *
 * Usage:
 *   npx ts-node scripts/index-sentences.ts
 */

import { Pinecone } from "@pinecone-database/pinecone";
import OpenAI from "openai";
import * as fs from "fs";
import * as path from "path";

// Load environment variables
require("dotenv").config({ path: ".env.local" });

const EMBEDDING_MODEL = "text-embedding-3-small";
const SECTIONS_PATH = "public/sections";
const NAMESPACE = "sentences";
const BATCH_SIZE = 100;
const RATE_LIMIT_DELAY_MS = 200;

type Speaker = "ra" | "questioner" | "text";

interface SentenceForIndexing {
  id: string;
  text: string;
  session: number;
  question: number;
  sentenceIndex: number;
  speaker: Speaker;
  parentPassageId: string;
  reference: string;
  url: string;
}

interface Paragraph {
  type: Speaker;
  content: string;
  sentences: string[];
}

/**
 * Split text into sentences (handles Ra Material formatting).
 * Mirrors the logic from quote-utils.ts.
 */
function splitIntoSentences(text: string): string[] {
  // Fix periods without spaces first (same normalization)
  const normalized = text.replace(/\.(?=[A-Z])/g, ". ");

  // Split on period followed by space or newline, question mark, or exclamation
  const sentences: string[] = [];
  const parts = normalized.split(/(?<=[.!?])\s+/);

  for (const part of parts) {
    if (part.trim()) {
      sentences.push(part.trim());
    }
  }

  return sentences;
}

/**
 * Parse Ra material text into paragraphs with speaker attribution.
 * Simplified version of parseIntoParagraphs from quote-utils.ts.
 */
function parseIntoParagraphs(text: string): Paragraph[] {
  // Split by speaker changes (Questioner: and Ra:)
  const parts = text.split(/(?=\s(?:Questioner:|Ra:))/);

  const paragraphs: Paragraph[] = [];

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    // Determine speaker type
    let type: Speaker = "text";
    let content = trimmed;

    if (trimmed.startsWith("Questioner:")) {
      type = "questioner";
      content = trimmed.substring("Questioner:".length).trim();
    } else if (trimmed.startsWith("Ra:")) {
      type = "ra";
      content = trimmed.substring("Ra:".length).trim();
    }

    // Split into sentences
    const sentences = splitIntoSentences(content);

    if (sentences.length > 0) {
      paragraphs.push({
        type,
        content,
        sentences,
      });
    }
  }

  return paragraphs;
}

/**
 * Load and parse all passages from session JSON files.
 */
function loadAllSentences(): SentenceForIndexing[] {
  console.log(`Reading sessions from: ${SECTIONS_PATH}`);

  const sentences: SentenceForIndexing[] = [];
  const files = fs.readdirSync(SECTIONS_PATH).filter((f) => f.endsWith(".json"));

  console.log(`Found ${files.length} session files`);

  for (const file of files) {
    const sessionNumber = parseInt(file.replace(".json", ""), 10);
    if (isNaN(sessionNumber)) continue;

    const filePath = path.join(SECTIONS_PATH, file);
    const rawData = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(rawData);

    for (const [key, text] of Object.entries(data)) {
      if (typeof text !== "string") continue;

      // Parse session.question from key (e.g., "50.7")
      const [sessionStr, questionStr] = key.split(".");
      const session = parseInt(sessionStr, 10);
      const question = parseInt(questionStr, 10);

      if (isNaN(session) || isNaN(question)) continue;

      const parentPassageId = `ra-${session}-${question}`;
      const reference = `Ra ${session}.${question}`;
      const url = `https://lawofone.info/s/${session}#${question}`;

      // Parse into paragraphs and extract sentences with speaker attribution
      const paragraphs = parseIntoParagraphs(text);

      let sentenceIndex = 0;
      for (const paragraph of paragraphs) {
        for (const sentenceText of paragraph.sentences) {
          // Skip very short sentences that are just fragments
          if (sentenceText.length < 10) continue;

          sentences.push({
            id: `${parentPassageId}-s${sentenceIndex}`,
            text: sentenceText,
            session,
            question,
            sentenceIndex,
            speaker: paragraph.type,
            parentPassageId,
            reference,
            url,
          });

          sentenceIndex++;
        }
      }
    }
  }

  console.log(`Loaded ${sentences.length} sentences from ${files.length} sessions`);
  return sentences;
}

/**
 * Build embedding text with context prefix.
 * Format: [Session X.Y] [Speaker:] {sentence text}
 */
function buildEmbeddingText(sentence: SentenceForIndexing): string {
  const speakerLabel =
    sentence.speaker === "ra"
      ? "Ra:"
      : sentence.speaker === "questioner"
        ? "Questioner:"
        : "";

  return `[Session ${sentence.session}.${sentence.question}] [${speakerLabel}] ${sentence.text}`;
}

/**
 * Create embeddings for a batch of sentences.
 */
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

/**
 * Main indexing function.
 */
async function indexSentences() {
  // Validate environment
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Missing OPENAI_API_KEY in .env.local");
  }
  if (!process.env.PINECONE_API_KEY) {
    throw new Error("Missing PINECONE_API_KEY in .env.local");
  }

  const indexName = process.env.PINECONE_INDEX || "law-of-one";

  // Initialize clients
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });

  // Load all sentences
  const sentences = loadAllSentences();

  // Show sample for verification
  console.log("\nSample sentences:");
  for (const s of sentences.slice(0, 5)) {
    const embText = buildEmbeddingText(s);
    console.log(`  ${s.id} (${s.speaker}):`);
    console.log(`    "${embText.slice(0, 100)}..."`);
  }
  console.log();

  // Get index and namespace
  const index = pinecone.index(indexName);
  const namespace = index.namespace(NAMESPACE);

  // Delete existing sentence vectors (clean slate)
  console.log(`Clearing existing vectors in "${NAMESPACE}" namespace...`);
  try {
    await namespace.deleteAll();
    console.log("  Cleared existing vectors");
  } catch {
    // Namespace might not exist yet, that's fine
    console.log("  No existing vectors to clear");
  }

  // Process in batches
  console.log(`\nIndexing ${sentences.length} sentences in batches of ${BATCH_SIZE}...`);

  let totalIndexed = 0;

  for (let i = 0; i < sentences.length; i += BATCH_SIZE) {
    const batch = sentences.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(sentences.length / BATCH_SIZE);

    process.stdout.write(`\r  Processing batch ${batchNum}/${totalBatches} (${totalIndexed + batch.length}/${sentences.length} sentences)`);

    // Build embedding texts for batch
    const embeddingTexts = batch.map(buildEmbeddingText);

    // Create embeddings in batch
    const embeddings = await createEmbeddingsBatch(openai, embeddingTexts);

    // Build vectors for Pinecone
    const vectors = batch.map((sentence, idx) => ({
      id: sentence.id,
      values: embeddings[idx],
      metadata: {
        text: sentence.text,
        session: sentence.session,
        question: sentence.question,
        sentenceIndex: sentence.sentenceIndex,
        speaker: sentence.speaker,
        parentPassageId: sentence.parentPassageId,
        reference: sentence.reference,
        url: sentence.url,
      },
    }));

    // Upsert batch to Pinecone
    await namespace.upsert(vectors);
    totalIndexed += batch.length;

    // Rate limit delay
    await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_DELAY_MS));
  }

  console.log("\n\nIndexing complete!");
  console.log(`  Total sentences indexed: ${totalIndexed}`);
  console.log(`  Index: ${indexName}`);
  console.log(`  Namespace: ${NAMESPACE}`);

  // Show speaker distribution
  const speakerCounts = sentences.reduce(
    (acc, s) => {
      acc[s.speaker] = (acc[s.speaker] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );
  console.log("\n  Speaker distribution:");
  for (const [speaker, count] of Object.entries(speakerCounts)) {
    console.log(`    ${speaker}: ${count} sentences`);
  }
}

// Main execution
indexSentences().catch((error) => {
  console.error("\nIndexing failed:", error);
  process.exit(1);
});
