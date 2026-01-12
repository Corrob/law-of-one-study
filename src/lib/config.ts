/**
 * Application configuration constants.
 *
 * Centralizes magic numbers and configuration values that were previously
 * scattered across the codebase. This makes it easier to:
 * - Find and update configuration values
 * - Understand system limits at a glance
 * - Maintain consistency across the application
 */

// =============================================================================
// API & MODEL CONFIGURATION
// =============================================================================

/** OpenAI model configuration */
export const MODEL_CONFIG = {
  /** Primary model for chat responses */
  chatModel: "gpt-5-mini" as const,
  /** Reasoning effort for main chat responses (quote selection, citations) */
  chatReasoningEffort: "medium" as const,
  /** Reasoning effort for simpler tasks (augmentation, suggestions) */
  utilityReasoningEffort: "low" as const,
} as const;

/** OpenAI API pricing (per 1M tokens, as of Dec 2025) */
export const MODEL_PRICING = {
  /** Input token cost per 1M tokens */
  inputCostPer1M: 0.25,
  /** Output token cost per 1M tokens */
  outputCostPer1M: 2.0,
} as const;

// =============================================================================
// RATE LIMITING
// =============================================================================

/** Rate limiting configuration */
export const RATE_LIMIT_CONFIG = {
  /** Maximum requests per time window */
  maxRequests: 10,
  /** Time window in milliseconds (1 minute) */
  windowMs: 60 * 1000,
} as const;

// =============================================================================
// INPUT VALIDATION
// =============================================================================

/** Input validation limits */
export const VALIDATION_LIMITS = {
  /** Maximum characters in a user message */
  maxMessageLength: 5000,
  /** Maximum messages in conversation history */
  maxHistoryLength: 20,
  /** Maximum characters per history message */
  maxHistoryMessageLength: 10000,
} as const;

// =============================================================================
// CONVERSATION HANDLING
// =============================================================================

/** Conversation processing configuration */
export const CONVERSATION_CONFIG = {
  /** Number of recent history messages to include in LLM context */
  recentHistoryCount: 6,
  /** Maximum messages to keep in client-side memory */
  maxConversationHistory: 30,
} as const;

// =============================================================================
// VECTOR SEARCH
// =============================================================================

/** Pinecone vector search configuration */
export const SEARCH_CONFIG = {
  /** Default number of results to return */
  defaultTopK: 8,
  /** Number of results for session-specific queries */
  sessionRefTopK: 10,
  /** Minimum similarity score for concept detection */
  conceptMinScore: 0.3,
  /** Number of concept search results */
  conceptTopK: 3,
  /** Number of sentence search results to retrieve */
  sentenceTopK: 10,
} as const;

// =============================================================================
// SUGGESTIONS
// =============================================================================

/** Follow-up suggestion configuration */
export const SUGGESTION_CONFIG = {
  /** Number of suggestions to generate */
  count: 3,
  /** Maximum character length per suggestion */
  maxLength: 60,
} as const;

// =============================================================================
// QUOTE HANDLING
// =============================================================================

/** Quote display and processing configuration */
export const QUOTE_CONFIG = {
  /** Sentence count threshold for recommending sentence ranges */
  longQuoteThreshold: 15,
  /** Typical ideal sentence range for long quotes */
  idealSentenceRange: { min: 5, max: 12 },
} as const;

// =============================================================================
// RETRY CONFIGURATION
// =============================================================================

/** Retry configuration for external API calls */
export const RETRY_CONFIG = {
  /** OpenAI embedding calls */
  embedding: {
    maxRetries: 3,
    initialDelayMs: 500,
    timeoutMs: 15000,
  },
  /** Query augmentation calls */
  augmentation: {
    maxRetries: 2,
    initialDelayMs: 500,
    timeoutMs: 10000,
  },
  /** Suggestion generation calls */
  suggestions: {
    maxRetries: 2,
    initialDelayMs: 500,
    timeoutMs: 10000,
  },
  /** Chat streaming calls */
  chat: {
    maxRetries: 2,
    initialDelayMs: 1000,
    timeoutMs: 60000,
  },
} as const;

/**
 * Calculate OpenAI API cost based on token usage.
 *
 * @param promptTokens - Number of input tokens
 * @param completionTokens - Number of output tokens
 * @returns Total cost in USD
 */
export function calculateCost(promptTokens: number, completionTokens: number): number {
  const inputCost = (promptTokens / 1_000_000) * MODEL_PRICING.inputCostPer1M;
  const outputCost = (completionTokens / 1_000_000) * MODEL_PRICING.outputCostPer1M;
  return inputCost + outputCost;
}
