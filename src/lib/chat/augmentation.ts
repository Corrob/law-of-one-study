/**
 * Query augmentation for semantic search enhancement
 *
 * Uses LLM to:
 * 1. Classify user intent (quote-search, conceptual, practical, etc.)
 * 2. Expand query with Ra-specific terminology for better vector search
 * 3. Assess confidence in the classification
 */

import { openai } from "@/lib/openai";
import { QUERY_AUGMENTATION_PROMPT } from "@/lib/prompts";
import { QueryIntent, IntentConfidence } from "@/lib/types";
import { withRetry } from "@/lib/retry";
import { MODEL_CONFIG, RETRY_CONFIG } from "@/lib/config";
import { createChatError } from "@/lib/chat/errors";
import { trackEvent } from "@/lib/posthog-server";
import { parseAugmentationResponse } from "@/lib/schemas";

/** Valid intent types for query classification */
export const VALID_INTENTS: QueryIntent[] = [
  "quote-search",
  "conceptual",
  "practical",
  "personal",
  "comparative",
  "meta",
  "off-topic",
];

/** Valid confidence levels */
export const VALID_CONFIDENCES: IntentConfidence[] = ["high", "medium", "low"];

/** Result of query augmentation */
export interface AugmentationResult {
  intent: QueryIntent;
  augmentedQuery: string;
  confidence: IntentConfidence;
}

/** Optional conversation context for better intent detection */
export interface AugmentationContext {
  recentTopics?: string[];
  previousIntent?: QueryIntent;
}

/**
 * Augment a user query with Ra Material terminology and detect intent.
 */
export async function augmentQuery(
  message: string,
  context?: AugmentationContext
): Promise<AugmentationResult> {
  try {
    const contextBlock =
      context?.recentTopics?.length || context?.previousIntent
        ? `CONVERSATION CONTEXT:\n- Recent topics: ${context.recentTopics?.slice(-2).join(", ") || "none"}\n- Previous intent: ${context.previousIntent || "none"}\n\n`
        : "";

    const userContent = `${contextBlock}MESSAGE: ${message}`;

    const response = await withRetry(
      () =>
        openai.chat.completions.create({
          model: MODEL_CONFIG.chatModel,
          messages: [
            { role: "system", content: QUERY_AUGMENTATION_PROMPT },
            { role: "user", content: userContent },
          ],
          reasoning_effort: MODEL_CONFIG.utilityReasoningEffort,
        }),
      RETRY_CONFIG.augmentation
    );

    const content = response.choices[0]?.message?.content || "";

    // Parse and validate response with Zod
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      throw new Error("Invalid JSON response from augmentation");
    }

    const validated = parseAugmentationResponse(parsed);
    if (!validated) {
      throw new Error("Response did not match expected schema");
    }

    const intent: QueryIntent = VALID_INTENTS.includes(validated.intent as QueryIntent)
      ? (validated.intent as QueryIntent)
      : "conceptual";

    const confidence: IntentConfidence = VALID_CONFIDENCES.includes(
      validated.confidence as IntentConfidence
    )
      ? (validated.confidence as IntentConfidence)
      : "medium";

    return {
      intent,
      augmentedQuery: validated.augmented_query || message,
      confidence,
    };
  } catch (error) {
    // Create typed error for logging
    const chatError = createChatError(
      "AUGMENTATION_FAILED",
      error instanceof Error ? error : new Error(String(error))
    );

    // Log with context
    console.error("[API] Query augmentation failed:", {
      code: chatError.code,
      message: chatError.message,
      originalMessage: message.substring(0, 100),
    });

    // Track to PostHog for monitoring
    trackEvent({
      distinctId: "system",
      event: "augmentation_error",
      properties: {
        error_code: chatError.code,
        error_message: chatError.message,
        is_retryable: chatError.retryable,
      },
    });

    // Return graceful fallback (preserve existing graceful degradation behavior)
    return { intent: "conceptual", augmentedQuery: message, confidence: "low" };
  }
}
