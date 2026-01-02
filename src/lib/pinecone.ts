import { Pinecone } from "@pinecone-database/pinecone";
import { PineconeMetadata } from "./types";
import { SessionQuestionRef } from "./quote-utils";

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
}

export async function searchRaMaterial(
  embedding: number[],
  options: SearchOptions = {}
): Promise<PineconeMetadata[]> {
  const { topK = 10, sessionFilter } = options;
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
    console.log("[Pinecone] Using metadata filter:", JSON.stringify(filter));
  }

  const results = await index.query({
    vector: embedding,
    topK: sessionFilter ? Math.max(topK, 20) : topK, // Get more results when filtering by session
    includeMetadata: true,
    filter,
  });

  return (
    results.matches
      ?.filter((match) => match.metadata)
      .map((match) => {
        const metadata = match.metadata as unknown as PineconeMetadata;
        // Ensure URL is correct format
        if (metadata.session && metadata.question !== undefined) {
          metadata.url = `https://lawofone.info/s/${metadata.session}#${metadata.question}`;
        }
        return metadata;
      }) || []
  );
}

export { INDEX_NAME };
export const pinecone = { get: getPineconeClient };
