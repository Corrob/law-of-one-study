/**
 * Zod schemas for search API request/response validation.
 */

import { z } from "zod";

/**
 * Schema for search request body.
 */
export const SearchRequestSchema = z.object({
  query: z
    .string()
    .min(2, "Search query must be at least 2 characters")
    .max(500, "Search query must be at most 500 characters"),
  limit: z.number().int().min(1).max(50).optional().default(20),
});

export type ValidatedSearchRequest = z.infer<typeof SearchRequestSchema>;

/**
 * Schema for individual search result.
 */
export const SearchResultSchema = z.object({
  text: z.string(),
  reference: z.string(),
  session: z.number(),
  question: z.number(),
  url: z.string(),
  score: z.number().optional(),
});

export type SearchResult = z.infer<typeof SearchResultSchema>;

/**
 * Schema for search response.
 */
export const SearchResponseSchema = z.object({
  results: z.array(SearchResultSchema),
  query: z.string(),
  totalResults: z.number(),
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
