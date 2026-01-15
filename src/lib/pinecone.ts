import { Pinecone } from "@pinecone-database/pinecone";
import { PineconeMetadata } from "./types";
import { SessionQuestionRef, getRaMaterialUrl } from "./quote-utils";
import { debug } from "@/lib/debug";
import {
  parsePineconeMetadata,
  parseConceptMetadata,
  parseSentenceMetadata,
  type SentenceSearchResult,
} from "@/lib/schemas";
import { type AvailableLanguage } from "./language-config";

let pineconeClient: Pinecone | null = null;

function getPineconeClient(): Pinecone {
  if (!pineconeClient) {
    if (!process.env.PINECONE_API_KEY) {
      throw new Error("Missing PINECONE_API_KEY environment variable");
    }
    pineconeClient = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });
  }
  return pineconeClient;
}

const INDEX_NAME = process.env.PINECONE_INDEX || "law-of-one";

export interface SearchOptions {
  topK?: number;
  sessionFilter?: SessionQuestionRef;
  language?: AvailableLanguage;
}

export async function searchRaMaterial(
  embedding: number[],
  options: SearchOptions = {}
): Promise<PineconeMetadata[]> {
  const { topK = 10, sessionFilter, language = "en" } = options;
  const pinecone = getPineconeClient();
  const index = pinecone.index(INDEX_NAME);

  // Build Pinecone filter if session/question reference provided
  let filter: Record<string, unknown> | undefined;
  if (sessionFilter) {
    if (sessionFilter.question !== undefined) {
      // Filter by exact session AND question
      filter = {
        $and: [
          { session: { $eq: sessionFilter.session } },
          { question: { $eq: sessionFilter.question } },
        ],
      };
    } else {
      // Filter by session only (get multiple questions from that session)
      filter = { session: { $eq: sessionFilter.session } };
    }
    debug.log("[Pinecone] Using metadata filter:", JSON.stringify(filter));
  }

  const results = await index.query({
    vector: embedding,
    topK: sessionFilter ? Math.max(topK, 20) : topK, // Get more results when filtering by session
    includeMetadata: true,
    filter,
  });

  return (
    results.matches
      ?.map((match) => {
        const metadata = parsePineconeMetadata(match.metadata);
        if (!metadata) {
          debug.log("[Pinecone] Invalid metadata structure, skipping:", match.id);
          return null;
        }
        // Generate URL at runtime to support multiple locales without re-indexing Pinecone
        if (metadata.session && metadata.question !== undefined) {
          return {
            ...metadata,
            url: getRaMaterialUrl(metadata.session, metadata.question, language),
          };
        }
        return metadata;
      })
      .filter((m): m is PineconeMetadata => m !== null) || []
  );
}

// Concept search result type
export interface ConceptSearchResult {
  id: string;
  score: number | undefined;
  term: string;
  category: string;
}

/**
 * Search for semantically similar concepts using embedding
 */
export async function searchConcepts(
  embedding: number[],
  topK: number = 5
): Promise<ConceptSearchResult[]> {
  const pinecone = getPineconeClient();
  const index = pinecone.index(INDEX_NAME);
  const namespace = index.namespace("concepts");

  const results = await namespace.query({
    vector: embedding,
    topK,
    includeMetadata: true,
  });

  return (
    results.matches
      ?.map((m) => {
        const metadata = parseConceptMetadata(m.metadata);
        return {
          id: m.id,
          score: m.score,
          term: metadata?.term || "",
          category: metadata?.category || "",
        };
      }) ?? []
  );
}

/**
 * Search for sentences by semantic similarity.
 * Uses the "sentences" namespace for fine-grained quote matching.
 */
export async function searchSentences(
  embedding: number[],
  topK: number = 10,
  language: AvailableLanguage = "en"
): Promise<SentenceSearchResult[]> {
  const pinecone = getPineconeClient();
  const index = pinecone.index(INDEX_NAME);
  const namespace = index.namespace("sentences");

  const results = await namespace.query({
    vector: embedding,
    topK,
    includeMetadata: true,
  });

  return (
    results.matches
      ?.map((m) => {
        const metadata = parseSentenceMetadata(m.metadata);
        if (!metadata) {
          debug.log("[Pinecone] Invalid sentence metadata, skipping:", m.id);
          return null;
        }
        return {
          sentence: metadata.text,
          session: metadata.session,
          question: metadata.question,
          sentenceIndex: metadata.sentenceIndex,
          speaker: metadata.speaker,
          reference: metadata.reference,
          // Generate URL at runtime to support multiple locales without re-indexing Pinecone
          url: getRaMaterialUrl(metadata.session, metadata.question, language),
          score: m.score ?? 0,
        };
      })
      .filter((r): r is SentenceSearchResult => r !== null) ?? []
  );
}

export { INDEX_NAME };
export const pinecone = { get: getPineconeClient };
