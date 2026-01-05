/**
 * Concept Graph Indexing Script
 *
 * This script reads all concepts from concept-graph.json,
 * creates embeddings using OpenAI, and uploads them to Pinecone
 * in the "concepts" namespace for semantic concept detection.
 *
 * Usage:
 *   npx ts-node scripts/index-concepts.ts
 */

import { Pinecone } from "@pinecone-database/pinecone";
import OpenAI from "openai";
import * as fs from "fs";

// Load environment variables
require("dotenv").config({ path: ".env.local" });

const EMBEDDING_MODEL = "text-embedding-3-small";
const CONCEPT_GRAPH_PATH = "src/data/concept-graph.json";
const NAMESPACE = "concepts";

interface ConceptForIndexing {
  id: string;
  term: string;
  category: string;
  definition: string;
  extendedDefinition: string;
  searchTerms: string[];
}

function loadConcepts(): ConceptForIndexing[] {
  console.log(`Reading concepts from: ${CONCEPT_GRAPH_PATH}`);

  const rawData = fs.readFileSync(CONCEPT_GRAPH_PATH, "utf-8");
  const graph = JSON.parse(rawData);

  const concepts: ConceptForIndexing[] = [];

  for (const [id, concept] of Object.entries(graph.concepts)) {
    const c = concept as {
      term: string;
      category: string;
      definition: string;
      extendedDefinition: string;
      searchTerms: string[];
    };

    concepts.push({
      id,
      term: c.term,
      category: c.category,
      definition: c.definition,
      extendedDefinition: c.extendedDefinition || "",
      searchTerms: c.searchTerms || [],
    });
  }

  console.log(`Loaded ${concepts.length} concepts`);
  return concepts;
}

function buildEmbeddingText(concept: ConceptForIndexing): string {
  // Combine term, definition, extended definition, and search terms
  // for a rich semantic representation
  const parts = [
    concept.term,
    concept.definition,
    concept.extendedDefinition,
    ...concept.searchTerms,
  ].filter((p) => p && p.trim().length > 0);

  return parts.join(". ");
}

async function createEmbedding(openai: OpenAI, text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text,
  });

  return response.data[0].embedding;
}

async function indexConcepts() {
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

  // Load concepts
  const concepts = loadConcepts();

  // Show sample for verification
  console.log("\nSample concepts:");
  for (const c of concepts.slice(0, 3)) {
    const embText = buildEmbeddingText(c);
    console.log(`  ${c.term} (${c.category}):`);
    console.log(`    "${embText.slice(0, 100)}..."`);
  }
  console.log();

  // Get index and namespace
  const index = pinecone.index(indexName);
  const namespace = index.namespace(NAMESPACE);

  // Delete existing concept vectors (clean slate)
  console.log(`Clearing existing vectors in "${NAMESPACE}" namespace...`);
  try {
    await namespace.deleteAll();
    console.log("  Cleared existing vectors");
  } catch {
    // Namespace might not exist yet, that's fine
    console.log("  No existing vectors to clear");
  }

  // Process concepts one by one (they're small, no batching needed)
  console.log(`\nIndexing ${concepts.length} concepts...`);

  const vectors: {
    id: string;
    values: number[];
    metadata: { term: string; category: string; definition: string };
  }[] = [];

  for (let i = 0; i < concepts.length; i++) {
    const concept = concepts[i];
    const embeddingText = buildEmbeddingText(concept);

    process.stdout.write(`\r  Processing ${i + 1}/${concepts.length}: ${concept.term.padEnd(30)}`);

    const embedding = await createEmbedding(openai, embeddingText);

    vectors.push({
      id: concept.id,
      values: embedding,
      metadata: {
        term: concept.term,
        category: concept.category,
        definition: concept.definition,
      },
    });

    // Small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  console.log("\n\nUpserting vectors to Pinecone...");

  // Upsert all at once (99 vectors is well under the limit)
  await namespace.upsert(vectors);

  console.log("\n✓ Indexing complete!");
  console.log(`  Total concepts indexed: ${concepts.length}`);
  console.log(`  Index: ${indexName}`);
  console.log(`  Namespace: ${NAMESPACE}`);
}

// Main execution
indexConcepts().catch((error) => {
  console.error("\nIndexing failed:", error);
  process.exit(1);
});
