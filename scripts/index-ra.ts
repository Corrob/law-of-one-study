/**
 * Ra Material (Law of One) Indexing Script
 *
 * This script reads all session JSON files from sections/,
 * creates embeddings using OpenAI, and uploads them to Pinecone.
 *
 * Usage:
 *   npx ts-node scripts/index-ra.ts
 *
 * Expected JSON structure (per session file):
 * {
 *   "1.0": "Ra: I am Ra...",
 *   "1.1": "Questioner: ...",
 *   ...
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
const SECTIONS_DIR = "public/sections";

interface RaPassage {
  id: string;
  text: string;
  reference: string;
  session: number;
  question: number;
  url: string;
}

function buildURL(session: number, question: number): string {
  return `https://lawofone.info/s/${session}#${question}`;
}

function buildReference(session: number, question: number): string {
  return `Ra ${session}.${question}`;
}

function parseRaData(sectionsDir: string): RaPassage[] {
  console.log(`Reading Ra material from: ${sectionsDir}`);

  const passages: RaPassage[] = [];

  // Get all JSON files in sections directory
  const files = fs
    .readdirSync(sectionsDir)
    .filter((f) => f.endsWith(".json"))
    .sort((a, b) => {
      // Sort numerically by session number
      const numA = parseInt(a.replace(".json", ""), 10);
      const numB = parseInt(b.replace(".json", ""), 10);
      return numA - numB;
    });

  console.log(`Found ${files.length} session files`);

  for (const file of files) {
    const filePath = path.join(sectionsDir, file);
    const rawData = fs.readFileSync(filePath, "utf-8");
    const sessionData: Record<string, string> = JSON.parse(rawData);

    for (const [key, text] of Object.entries(sessionData)) {
      // Parse key format: "1.0" -> session=1, question=0
      const [sessionStr, questionStr] = key.split(".");
      const session = parseInt(sessionStr, 10);
      const question = parseInt(questionStr, 10);

      if (isNaN(session) || isNaN(question)) {
        console.warn(`Skipping invalid key format: ${key} in ${file}`);
        continue;
      }

      passages.push({
        id: `ra-${session}-${question}`,
        text,
        reference: buildReference(session, question),
        session,
        question,
        url: buildURL(session, question),
      });
    }
  }

  // Sort by session then question
  passages.sort((a, b) => {
    if (a.session !== b.session) return a.session - b.session;
    return a.question - b.question;
  });

  console.log(`Parsed ${passages.length} passages from ${files.length} sessions`);

  return passages;
}

async function createEmbeddings(openai: OpenAI, texts: string[]): Promise<number[][]> {
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: texts,
  });

  return response.data.map((d) => d.embedding);
}

async function indexRaMaterial() {
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

  // Parse Ra material
  const passages = parseRaData(SECTIONS_DIR);

  // Show sample for verification
  console.log("\nSample passages:");
  for (const p of passages.slice(0, 3)) {
    console.log(`  ${p.reference}: "${p.text.slice(0, 80)}..."`);
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
  console.log(`Processing ${passages.length} passages in batches of ${BATCH_SIZE}...`);

  let totalUploaded = 0;
  for (let i = 0; i < passages.length; i += BATCH_SIZE) {
    const batch = passages.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(passages.length / BATCH_SIZE);

    console.log(`Processing batch ${batchNum}/${totalBatches}...`);

    // Create embeddings with session/reference prefix for searchability
    const texts = batch.map(
      (p) => `Session ${p.session}, Reference ${p.reference}: ${p.text}`
    );
    const embeddings = await createEmbeddings(openai, texts);

    // Prepare vectors for upsert
    const vectors = batch.map((passage, idx) => ({
      id: passage.id,
      values: embeddings[idx],
      metadata: {
        text: passage.text,
        reference: passage.reference,
        session: passage.session,
        question: passage.question,
        url: passage.url,
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
  console.log(`  Total passages indexed: ${passages.length}`);
  console.log(`  Index name: ${indexName}`);
}

// Main execution
indexRaMaterial().catch((error) => {
  console.error("Indexing failed:", error);
  process.exit(1);
});
