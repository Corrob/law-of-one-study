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
import { MODEL_CONFIG } from "@/lib/config";

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
          reasoning_effort: MODEL_CONFIG.reasoningEffort,
        }),
      { maxRetries: 2, initialDelayMs: 500 }
    );

    const content = response.choices[0]?.message?.content || "";
    const parsed = JSON.parse(content);

    const intent: QueryIntent = VALID_INTENTS.includes(parsed.intent)
      ? parsed.intent
      : "conceptual";

    const confidence: IntentConfidence = VALID_CONFIDENCES.includes(parsed.confidence)
      ? parsed.confidence
      : "medium";

    return {
      intent,
      augmentedQuery: parsed.augmented_query || message,
      confidence,
    };
  } catch (error) {
    console.error("[API] Query augmentation failed, using original message:", error);
    return { intent: "conceptual", augmentedQuery: message, confidence: "low" };
  }
}
