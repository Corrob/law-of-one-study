/**
 * Zod schemas for search API request/response validation.
 */

import { z } from "zod";
import { SpeakerSchema } from "./sentence";
import { AvailableLanguageSchema } from "@/lib/language-config";

/**
 * Schema for search mode.
 */
export const SearchModeSchema = z.enum(["sentence", "passage"]);
export type SearchMode = z.infer<typeof SearchModeSchema>;

/**
 * Schema for search source type (which corpus a result came from).
 */
export const SearchSourceSchema = z.enum(["ra", "confederation"]);
export type SearchSource = z.infer<typeof SearchSourceSchema>;

/**
 * Schema for source filter in search requests.
 */
export const SourceFilterSchema = z.enum(["all", "ra", "confederation"]);
export type SourceFilter = z.infer<typeof SourceFilterSchema>;

/**
 * Schema for search request body.
 */
export const SearchRequestSchema = z.object({
  query: z
    .string()
    .min(2, "Search query must be at least 2 characters")
    .max(500, "Search query must be at most 500 characters"),
  limit: z.number().int().min(1).max(50).optional().default(20),
  mode: SearchModeSchema.optional().default("passage"),
  source: SourceFilterSchema.optional().default("all"),
  language: AvailableLanguageSchema.optional().default("en"),
});

export type ValidatedSearchRequest = z.infer<typeof SearchRequestSchema>;

/**
 * Schema for hybrid search result.
 * Combines passage and sentence data — each result may have either or both.
 * Supports both Ra Material and Confederation sources.
 */
export const HybridSearchResultSchema = z.object({
  // Passage data (from passage search)
  text: z.string().optional(),
  // Sentence data (from sentence search)
  sentence: z.string().optional(),
  sentenceIndex: z.number().optional(),
  speaker: SpeakerSchema.optional(),
  // Common fields (always present)
  reference: z.string(),
  url: z.string(),
  score: z.number(),
  // Source discriminator
  source: SearchSourceSchema.optional(), // "ra" | "confederation" (optional for backwards compat)
  // Ra-specific fields (optional when source is confederation)
  session: z.number().optional(),
  question: z.number().optional(),
  // Confederation-specific fields
  entity: z.string().optional(),
  date: z.string().optional(),
  transcriptId: z.string().optional(),
  chunkIndex: z.number().optional(),
});

export type HybridSearchResult = z.infer<typeof HybridSearchResultSchema>;

// Alias for backwards compatibility
export const SearchResultSchema = HybridSearchResultSchema;
export type SearchResult = HybridSearchResult;

/**
 * Schema for search response.
 */
export const SearchResponseSchema = z.object({
  results: z.array(HybridSearchResultSchema),
  query: z.string(),
  totalResults: z.number(),
  mode: SearchModeSchema.optional(),
});

export type SearchResponse = z.infer<typeof SearchResponseSchema>;

/**
 * Parse and validate search request.
 */
export function parseSearchRequest(
  data: unknown
): { success: true; data: ValidatedSearchRequest } | { success: false; error: string } {
  const result = SearchRequestSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error.issues[0]?.message || "Invalid request" };
}
