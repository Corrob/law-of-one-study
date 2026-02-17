import { Pinecone } from "@pinecone-database/pinecone";
import { PineconeMetadata } from "./types";
import { SessionQuestionRef, getRaMaterialUrl } from "./quote-utils";
import { debug } from "@/lib/debug";
import {
  parsePineconeMetadata,
  parseConceptMetadata,
  parseSentenceMetadata,
  parseConfederationPassageMetadata,
  parseConfederationSentenceMetadata,
  type SentenceSearchResult,
} from "@/lib/schemas";
import { type AvailableLanguage, DEFAULT_LOCALE } from "./language-config";

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
  const { topK = 10, sessionFilter, language = DEFAULT_LOCALE } = options;
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

// =============================================================================
// Confederation Search
// =============================================================================

/** Result type for Confederation passage search */
export interface ConfederationPassageResult {
  text: string;
  reference: string;
  entity: string;
  date: string;
  transcriptId: string;
  chunkIndex: number;
  speaker: string;
  url: string;
  score: number;
}

/** Result type for Confederation sentence search */
export interface ConfederationSentenceResult {
  sentence: string;
  reference: string;
  entity: string;
  date: string;
  transcriptId: string;
  chunkIndex: number;
  sentenceIndex: number;
  speaker: string;
  url: string;
  score: number;
}

/**
 * Search Confederation passages by semantic similarity.
 * Uses the "confederation" namespace.
 */
export async function searchConfederationPassages(
  embedding: number[],
  topK: number = 10
): Promise<ConfederationPassageResult[]> {
  const pinecone = getPineconeClient();
  const index = pinecone.index(INDEX_NAME);
  const namespace = index.namespace("confederation");

  const results = await namespace.query({
    vector: embedding,
    topK,
    includeMetadata: true,
  });

  return (
    results.matches
      ?.map((m) => {
        const metadata = parseConfederationPassageMetadata(m.metadata);
        if (!metadata) {
          debug.log("[Pinecone] Invalid confederation passage metadata, skipping:", m.id);
          return null;
        }
        return {
          ...metadata,
          score: m.score ?? 0,
        };
      })
      .filter((r): r is ConfederationPassageResult => r !== null) ?? []
  );
}

/**
 * Search Confederation sentences by semantic similarity.
 * Uses the "confederation-sentences" namespace.
 */
export async function searchConfederationSentences(
  embedding: number[],
  topK: number = 10
): Promise<ConfederationSentenceResult[]> {
  const pinecone = getPineconeClient();
  const index = pinecone.index(INDEX_NAME);
  const namespace = index.namespace("confederation-sentences");

  const results = await namespace.query({
    vector: embedding,
    topK,
    includeMetadata: true,
  });

  return (
    results.matches
      ?.map((m) => {
        const metadata = parseConfederationSentenceMetadata(m.metadata);
        if (!metadata) {
          debug.log("[Pinecone] Invalid confederation sentence metadata, skipping:", m.id);
          return null;
        }
        return {
          sentence: metadata.text,
          reference: metadata.reference,
          entity: metadata.entity,
          date: metadata.date,
          transcriptId: metadata.transcriptId,
          chunkIndex: metadata.chunkIndex,
          sentenceIndex: metadata.sentenceIndex,
          speaker: metadata.speaker,
          url: metadata.url,
          score: m.score ?? 0,
        };
      })
      .filter((r): r is ConfederationSentenceResult => r !== null) ?? []
  );
}

/**
 * Fetch a Confederation passage by transcriptId and chunkIndex.
 * Uses Pinecone's fetch API (by ID, no embedding needed).
 * Handles both simple chunks and sub-chunks from long passage splitting.
 */
export async function fetchConfederationPassage(
  transcriptId: string,
  chunkIndex: number
): Promise<ConfederationPassageResult | null> {
  const pinecone = getPineconeClient();
  const index = pinecone.index(INDEX_NAME);
  const namespace = index.namespace("confederation");

  // Try the simple ID first, then sub-chunk IDs (long chunks get split during indexing).
  // Some chunks split into 15+ sub-chunks (~250 words each), so we check up to 30.
  const ids = [
    `confed-${transcriptId}-${chunkIndex}`,
    ...Array.from({ length: 30 }, (_, i) => `confed-${transcriptId}-${chunkIndex}-${i}`),
  ];

  const result = await namespace.fetch(ids);

  // Collect all matching sub-chunks, sorted by ID to preserve order
  const records = Object.entries(result.records || {})
    .sort(([a], [b]) => a.localeCompare(b));

  if (records.length === 0) return null;

  // Concatenate text from all sub-chunks (or use single chunk text)
  const texts: string[] = [];
  let firstMetadata: ReturnType<typeof parseConfederationPassageMetadata> = null;

  for (const [, record] of records) {
    const metadata = parseConfederationPassageMetadata(record.metadata);
    if (!metadata) continue;
    if (!firstMetadata) firstMetadata = metadata;
    texts.push(metadata.text);
  }

  if (!firstMetadata || texts.length === 0) return null;

  return {
    ...firstMetadata,
    text: texts.join(" "),
    score: 0,
  };
}

/**
 * Search all chunks of a Confederation transcript for one containing a sentence.
 * Uses a single batch fetch of chunks 0-19 (plus sub-chunks) to find the right passage.
 * Returns the matching chunk's text, or null if not found.
 */
export async function findConfederationChunkBySentence(
  transcriptId: string,
  sentence: string
): Promise<string | null> {
  const pinecone = getPineconeClient();
  const index = pinecone.index(INDEX_NAME);
  const namespace = index.namespace("confederation");

  // Build IDs for chunks 0-19, each with up to 30 sub-chunks
  const MAX_CHUNKS = 20;
  const MAX_SUB = 30;
  const ids: string[] = [];
  for (let c = 0; c < MAX_CHUNKS; c++) {
    ids.push(`confed-${transcriptId}-${c}`);
    for (let s = 0; s < MAX_SUB; s++) {
      ids.push(`confed-${transcriptId}-${c}-${s}`);
    }
  }

  const result = await namespace.fetch(ids);
  if (!result.records) return null;

  // Group records by chunk index, storing ID for sort order
  const chunkRecords = new Map<number, { id: string; text: string }[]>();
  for (const [id, record] of Object.entries(result.records)) {
    const metadata = parseConfederationPassageMetadata(record.metadata);
    if (!metadata) continue;
    // Extract chunk index from ID: confed-{id}-{chunk} or confed-{id}-{chunk}-{sub}
    const parts = id.replace(`confed-${transcriptId}-`, "").split("-");
    const chunkIdx = parseInt(parts[0], 10);
    if (isNaN(chunkIdx)) continue;
    if (!chunkRecords.has(chunkIdx)) chunkRecords.set(chunkIdx, []);
    chunkRecords.get(chunkIdx)!.push({ id, text: metadata.text });
  }

  // Check each chunk's combined text for the sentence
  const anchor = sentence.slice(0, 60).toLowerCase();
  for (const [, records] of [...chunkRecords.entries()].sort(([a], [b]) => a - b)) {
    // Sort sub-chunks by ID to preserve text order (e.g., confed-id-0-0 before confed-id-0-1)
    const combined = records
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((r) => r.text)
      .join(" ");
    if (combined.toLowerCase().includes(anchor)) {
      return combined;
    }
  }

  return null;
}

export { INDEX_NAME };
export const pinecone = { get: getPineconeClient };
