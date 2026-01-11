/**
 * Zod schemas for sentence-level search metadata.
 *
 * Sentences are indexed in the "sentences" Pinecone namespace
 * for precise quote recall with sentence-level granularity.
 */

import { z } from "zod";

/**
 * Speaker types in Ra Material.
 */
export const SpeakerSchema = z.enum(["ra", "questioner", "text"]);
export type Speaker = z.infer<typeof SpeakerSchema>;

/**
 * Schema for sentence metadata stored in Pinecone.
 */
export const SentenceMetadataSchema = z.object({
  text: z.string(),
  session: z.number(),
  question: z.number(),
  sentenceIndex: z.number(),
  speaker: SpeakerSchema,
  parentPassageId: z.string(),
  reference: z.string(),
  url: z.string(),
});

export type ValidatedSentenceMetadata = z.infer<typeof SentenceMetadataSchema>;

/**
 * Schema for sentence search result (includes score from Pinecone).
 */
export const SentenceSearchResultSchema = z.object({
  sentence: z.string(),
  session: z.number(),
  question: z.number(),
  sentenceIndex: z.number(),
  speaker: SpeakerSchema,
  reference: z.string(),
  url: z.string(),
  score: z.number(),
});

export type SentenceSearchResult = z.infer<typeof SentenceSearchResultSchema>;

/**
 * Safely parse sentence metadata with validation.
 *
 * @param data - Raw metadata from Pinecone response
 * @returns Validated metadata or null if invalid
 */
export function parseSentenceMetadata(
  data: unknown
): ValidatedSentenceMetadata | null {
  const result = SentenceMetadataSchema.safeParse(data);
  return result.success ? result.data : null;
}
