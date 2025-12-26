/**
 * ACIM Content Indexing Script
 *
 * This script reads sentences.json, groups sentences into paragraphs,
 * creates embeddings using OpenAI, and uploads them to Pinecone.
 *
 * Usage:
 *   npx ts-node scripts/index-acim.ts sentences.json
 *
 * Expected JSON structure:
 * {
 *   "sentences": {
 *     "053#1:1": "There is no order of difficulty in miracles.",
 *     "053#1:2": "One is not \"harder\" or \"bigger\" than another.",
 *     ...
 *   },
 *   "annotations": {
 *     "053": "T-1.I",
 *     "054": "T-1.II",
 *     ...
 *   }
 * }
 */

import { Pinecone } from "@pinecone-database/pinecone";
import OpenAI from "openai";
import * as fs from "fs";
import * as path from "path";

// Load environment variables
require("dotenv").config({ path: ".env.local" });

const BATCH_SIZE = 100; // Pinecone batch upsert limit
const EMBEDDING_MODEL = "text-embedding-3-small";

interface Paragraph {
  id: string;
  text: string;
  reference: string;
  section_id: string;
  paragraph: number;
  book: string;
  url: string;
}

interface SentencesJSON {
  sentences: Record<string, string>;
  annotations: Record<string, string>;
}

function getBookType(annotation: string): string {
  if (annotation.startsWith("T-")) return "text";
  if (annotation.startsWith("W-")) return "workbook";
  if (annotation.startsWith("M-")) return "manual";
  if (annotation.startsWith("C-")) return "clarification";
  if (annotation.startsWith("P-")) return "psychotherapy";
  if (annotation.toLowerCase().includes("preface")) return "preface";
  if (annotation.startsWith("Suppl")) return "supplement";
  return "other";
}

function buildReference(annotation: string, paragraphNum: number): string {
  // For references like T-1.I, append paragraph number: T-1.I.1
  // For workbook lessons like W-96, append paragraph: W-96.1
  return `${annotation}.${paragraphNum}`;
}

function buildURL(sectionId: string, paragraphNum: number): string {
  // Remove leading zeros from section ID
  const cleanId = parseInt(sectionId, 10).toString();
  return `https://acim.org/acim/en/s/${cleanId}#${paragraphNum}`;
}

function cleanText(text: string): string {
  // Remove pipe characters used for italics markers |...|
  return text.replace(/\|/g, "");
}

function parseACIMData(jsonPath: string): Paragraph[] {
  console.log(`Reading ACIM data from: ${jsonPath}`);

  const rawData = fs.readFileSync(jsonPath, "utf-8");
  const data: SentencesJSON = JSON.parse(rawData);

  const { sentences, annotations } = data;

  // Group sentences by (section_id, paragraph_num)
  const paragraphGroups = new Map<
    string,
    { sectionId: string; paraNum: number; sentences: Array<{ sentNum: number; text: string }> }
  >();

  for (const [key, text] of Object.entries(sentences)) {
    // Parse key format: "053#1:1" -> section=053, para=1, sent=1
    const match = key.match(/^(\d+)#(\d+):(\d+)$/);
    if (!match) {
      console.warn(`Skipping invalid key format: ${key}`);
      continue;
    }

    const [, sectionId, paraNumStr, sentNumStr] = match;
    const paraNum = parseInt(paraNumStr, 10);
    const sentNum = parseInt(sentNumStr, 10);

    const groupKey = `${sectionId}#${paraNum}`;

    if (!paragraphGroups.has(groupKey)) {
      paragraphGroups.set(groupKey, {
        sectionId,
        paraNum,
        sentences: [],
      });
    }

    paragraphGroups.get(groupKey)!.sentences.push({ sentNum, text });
  }

  // Convert groups to paragraphs
  const paragraphs: Paragraph[] = [];

  for (const [, group] of paragraphGroups) {
    const { sectionId, paraNum, sentences: sents } = group;

    // Sort sentences by sentence number and join
    sents.sort((a, b) => a.sentNum - b.sentNum);
    const fullText = sents.map((s) => cleanText(s.text)).join(" ");

    // Get annotation for this section
    const annotation = annotations[sectionId] || `Section ${sectionId}`;
    const book = getBookType(annotation);
    const reference = buildReference(annotation, paraNum);
    const url = buildURL(sectionId, paraNum);

    paragraphs.push({
      id: `${sectionId}-${paraNum}`,
      text: fullText,
      reference,
      section_id: sectionId,
      paragraph: paraNum,
      book,
      url,
    });
  }

  // Sort paragraphs by section ID then paragraph number for consistent ordering
  paragraphs.sort((a, b) => {
    const sectionCompare = a.section_id.localeCompare(b.section_id);
    if (sectionCompare !== 0) return sectionCompare;
    return a.paragraph - b.paragraph;
  });

  console.log(
    `Parsed ${paragraphs.length} paragraphs from ${Object.keys(annotations).length} sections`
  );
  console.log(`Total sentences processed: ${Object.keys(sentences).length}`);

  return paragraphs;
}

async function createEmbeddings(openai: OpenAI, texts: string[]): Promise<number[][]> {
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: texts,
  });

  return response.data.map((d) => d.embedding);
}

async function indexACIM(jsonPath: string) {
  // Validate environment
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Missing OPENAI_API_KEY in .env.local");
  }
  if (!process.env.PINECONE_API_KEY) {
    throw new Error("Missing PINECONE_API_KEY in .env.local");
  }

  const indexName = process.env.PINECONE_INDEX || "acim-content";

  // Initialize clients
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });

  // Parse ACIM data
  const paragraphs = parseACIMData(jsonPath);

  // Show sample for verification
  console.log("\nSample paragraphs:");
  for (const p of paragraphs.slice(0, 3)) {
    console.log(`  ${p.reference}: "${p.text.slice(0, 60)}..."`);
    console.log(`    URL: ${p.url}`);
  }
  console.log();

  // Check if index exists, create if not
  console.log(`Checking Pinecone index: ${indexName}`);
  const indexList = await pinecone.listIndexes();
  const indexExists = indexList.indexes?.some((idx) => idx.name === indexName);

  if (!indexExists) {
    console.log(`Creating index: ${indexName}`);
    await pinecone.createIndex({
      name: indexName,
      dimension: 1536, // text-embedding-3-small dimension
      metric: "cosine",
      spec: {
        serverless: {
          cloud: "aws",
          region: "us-east-1",
        },
      },
    });

    // Wait for index to be ready
    console.log("Waiting for index to be ready (60s)...");
    await new Promise((resolve) => setTimeout(resolve, 60000));
  }

  const index = pinecone.index(indexName);

  // Process in batches
  console.log(`Processing ${paragraphs.length} paragraphs in batches of ${BATCH_SIZE}...`);

  let totalUploaded = 0;
  for (let i = 0; i < paragraphs.length; i += BATCH_SIZE) {
    const batch = paragraphs.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(paragraphs.length / BATCH_SIZE);

    console.log(`Processing batch ${batchNum}/${totalBatches}...`);

    // Create embeddings
    const texts = batch.map((p) => p.text);
    const embeddings = await createEmbeddings(openai, texts);

    // Prepare vectors for upsert
    const vectors = batch.map((para, idx) => ({
      id: para.id,
      values: embeddings[idx],
      metadata: {
        text: para.text,
        reference: para.reference,
        section_id: para.section_id,
        paragraph: para.paragraph,
        book: para.book,
        url: para.url,
      },
    }));

    // Upsert to Pinecone
    await index.upsert(vectors);
    totalUploaded += vectors.length;

    console.log(`  Uploaded ${vectors.length} vectors (total: ${totalUploaded})`);

    // Rate limiting - be nice to the APIs
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  console.log("\n✓ Indexing complete!");
  console.log(`  Total paragraphs indexed: ${paragraphs.length}`);
  console.log(`  Index name: ${indexName}`);
}

// Main execution
const jsonPath = process.argv[2];

if (!jsonPath) {
  console.log(`
ACIM Content Indexing Script

Usage:
  npx ts-node scripts/index-acim.ts <path-to-sentences-json>

Example:
  npx ts-node scripts/index-acim.ts sentences.json

Make sure you have:
1. Created a .env.local file with OPENAI_API_KEY and PINECONE_API_KEY
2. Your sentences.json file ready

Expected JSON format:
{
  "sentences": {
    "053#1:1": "There is no order of difficulty in miracles.",
    "053#1:2": "One is not \\"harder\\" or \\"bigger\\" than another.",
    ...
  },
  "annotations": {
    "053": "T-1.I",
    "054": "T-1.II",
    ...
  }
}
`);
  process.exit(1);
}

indexACIM(path.resolve(jsonPath)).catch((error) => {
  console.error("Indexing failed:", error);
  process.exit(1);
});
