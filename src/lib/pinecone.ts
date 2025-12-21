import { Pinecone } from '@pinecone-database/pinecone';
import { PineconeMetadata } from './types';

let pineconeClient: Pinecone | null = null;

function getPineconeClient(): Pinecone {
  if (!pineconeClient) {
    if (!process.env.PINECONE_API_KEY) {
      throw new Error('Missing PINECONE_API_KEY environment variable');
    }
    pineconeClient = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });
  }
  return pineconeClient;
}

const INDEX_NAME = process.env.PINECONE_INDEX || 'law-of-one';

export async function searchRaMaterial(
  embedding: number[],
  topK: number = 10
): Promise<PineconeMetadata[]> {
  const pinecone = getPineconeClient();
  const index = pinecone.index(INDEX_NAME);

  const results = await index.query({
    vector: embedding,
    topK,
    includeMetadata: true,
  });

  return results.matches
    ?.filter((match) => match.metadata)
    .map((match) => {
      const metadata = match.metadata as unknown as PineconeMetadata;
      // Ensure URL is correct format
      if (metadata.session && metadata.question !== undefined) {
        metadata.url = `https://lawofone.info/s/${metadata.session}#${metadata.question}`;
      }
      return metadata;
    }) || [];
}

export { INDEX_NAME };
export const pinecone = { get: getPineconeClient };
