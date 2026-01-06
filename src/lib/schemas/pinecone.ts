/**
 * Zod schemas for Pinecone API response validation.
 *
 * Provides runtime validation for Pinecone metadata to replace
 * unsafe type assertions with proper validation.
 */

import { z } from "zod";

/**
 * Schema for Ra Material metadata stored in Pinecone.
 * Validates the structure returned from vector search queries.
 */
export const PineconeMetadataSchema = z.object({
  text: z.string(),
  reference: z.string(),
  session: z.number(),
  question: z.number(),
  url: z.string().optional(), // URL is regenerated from session/question in pinecone.ts
});

export type ValidatedPineconeMetadata = z.infer<typeof PineconeMetadataSchema>;

/**
 * Schema for concept metadata in the concepts namespace.
 */
export const ConceptMetadataSchema = z.object({
  term: z.string(),
  category: z.string(),
});

export type ValidatedConceptMetadata = z.infer<typeof ConceptMetadataSchema>;

/**
 * Safely parse Pinecone metadata with validation.
 *
 * @param data - Raw metadata from Pinecone response
 * @returns Validated metadata or null if invalid
 */
export function parsePineconeMetadata(
  data: unknown
): ValidatedPineconeMetadata | null {
  const result = PineconeMetadataSchema.safeParse(data);
  return result.success ? result.data : null;
}

/**
 * Safely parse concept metadata with validation.
 *
 * @param data - Raw metadata from Pinecone concepts namespace
 * @returns Validated concept metadata or null if invalid
 */
export function parseConceptMetadata(
  data: unknown
): ValidatedConceptMetadata | null {
  const result = ConceptMetadataSchema.safeParse(data);
  return result.success ? result.data : null;
}
