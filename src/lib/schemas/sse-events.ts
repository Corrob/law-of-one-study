/**
 * Zod schemas for SSE (Server-Sent Events) validation.
 *
 * Provides runtime validation for SSE event data to replace
 * unsafe type assertions in client-side code.
 */

import { z } from "zod";

/**
 * Schema for text chunk data in SSE stream.
 */
export const TextChunkDataSchema = z.object({
  type: z.literal("text"),
  content: z.string(),
});

/**
 * Schema for quote chunk data in SSE stream.
 */
export const QuoteChunkDataSchema = z.object({
  type: z.literal("quote"),
  text: z.string(),
  reference: z.string(),
  url: z.string(),
});

/**
 * Schema for chunk event data (text or quote).
 */
export const ChunkDataSchema = z.discriminatedUnion("type", [
  TextChunkDataSchema,
  QuoteChunkDataSchema,
]);

export type ValidatedChunkData = z.infer<typeof ChunkDataSchema>;

/**
 * Schema for suggestions event data.
 */
export const SuggestionsEventDataSchema = z.object({
  items: z.array(z.string()),
});

export type ValidatedSuggestionsEventData = z.infer<typeof SuggestionsEventDataSchema>;

/**
 * Schema for error event data.
 */
export const ErrorEventDataSchema = z.object({
  code: z.string().optional(),
  message: z.string().optional(),
  retryable: z.boolean().optional(),
});

export type ValidatedErrorEventData = z.infer<typeof ErrorEventDataSchema>;

/**
 * Schema for meta event data (quote metadata and intent).
 */
export const MetaEventDataSchema = z.object({
  quotes: z.array(
    z.object({
      text: z.string(),
      reference: z.string(),
      url: z.string(),
    })
  ),
  intent: z.string(),
  confidence: z.string(),
  concepts: z.array(z.string()).optional(),
});

export type ValidatedMetaEventData = z.infer<typeof MetaEventDataSchema>;

/**
 * Safely parse chunk event data with validation.
 *
 * @param data - Raw event data from SSE stream
 * @returns Validated chunk data or null if invalid
 */
export function parseChunkData(data: unknown): ValidatedChunkData | null {
  const result = ChunkDataSchema.safeParse(data);
  return result.success ? result.data : null;
}

/**
 * Safely parse suggestions event data with validation.
 *
 * @param data - Raw event data from SSE stream
 * @returns Validated suggestions data or null if invalid
 */
export function parseSuggestionsEventData(
  data: unknown
): ValidatedSuggestionsEventData | null {
  const result = SuggestionsEventDataSchema.safeParse(data);
  return result.success ? result.data : null;
}

/**
 * Safely parse error event data with validation.
 *
 * @param data - Raw event data from SSE stream
 * @returns Validated error data or null if invalid
 */
export function parseErrorEventData(
  data: unknown
): ValidatedErrorEventData | null {
  const result = ErrorEventDataSchema.safeParse(data);
  return result.success ? result.data : null;
}

/**
 * Safely parse meta event data with validation.
 *
 * @param data - Raw event data from SSE stream
 * @returns Validated meta data or null if invalid
 */
export function parseMetaEventData(
  data: unknown
): ValidatedMetaEventData | null {
  const result = MetaEventDataSchema.safeParse(data);
  return result.success ? result.data : null;
}
