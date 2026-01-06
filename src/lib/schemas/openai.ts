/**
 * Zod schemas for OpenAI/LLM response validation.
 *
 * Validates structured responses from LLM calls like
 * query augmentation and suggestion generation.
 */

import { z } from "zod";

/**
 * Schema for query augmentation LLM response.
 * Used in augmentation.ts to validate JSON output.
 */
export const AugmentationResponseSchema = z.object({
  intent: z.string(),
  augmented_query: z.string(),
  confidence: z.string(),
});

export type ValidatedAugmentationResponse = z.infer<
  typeof AugmentationResponseSchema
>;

/**
 * Schema for suggestion generation LLM response.
 * Used in suggestions.ts to validate JSON output.
 */
export const SuggestionResponseSchema = z.object({
  suggestions: z.array(z.string()),
});

export type ValidatedSuggestionResponse = z.infer<
  typeof SuggestionResponseSchema
>;

/**
 * Safely parse augmentation response with validation.
 *
 * @param data - Parsed JSON from LLM response
 * @returns Validated response or null if invalid
 */
export function parseAugmentationResponse(
  data: unknown
): ValidatedAugmentationResponse | null {
  const result = AugmentationResponseSchema.safeParse(data);
  return result.success ? result.data : null;
}

/**
 * Safely parse suggestion response with validation.
 *
 * @param data - Parsed JSON from LLM response
 * @returns Validated response or null if invalid
 */
export function parseSuggestionResponse(
  data: unknown
): ValidatedSuggestionResponse | null {
  const result = SuggestionResponseSchema.safeParse(data);
  return result.success ? result.data : null;
}
