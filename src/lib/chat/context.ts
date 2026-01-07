/**
 * Conversation context utilities for chat API
 */

import { ChatMessage } from "@/lib/types";

/**
 * Conversation metadata for enhanced prompt generation
 */
export interface ConversationMeta {
  /** Number of user turns in the conversation (current message = +1) */
  turnCount: number;
  /** All quote references shown in conversation (for deduplication) */
  quotesUsed: string[];
}

/**
 * Build conversation context from message history.
 *
 * Extracts metadata about the conversation for use in:
 * - Prompt generation (turn count affects response style)
 * - Quote deduplication (avoid repeating same quotes)
 *
 * @param history - Array of previous chat messages
 * @returns Conversation metadata
 *
 * @example
 * ```ts
 * const { turnCount, quotesUsed } = buildConversationContext(history);
 * // turnCount: 3 (2 previous user messages + current = 3rd turn)
 * // quotesUsed: ["50.7", "51.1"] (quotes already shown)
 * ```
 */
export function buildConversationContext(history: ChatMessage[]): ConversationMeta {
  // Count turns (each user message = 1 turn, +1 for current message)
  const turnCount = history.filter((m) => m.role === "user").length + 1;

  // Collect all quotes used in conversation
  const quotesUsed = history
    .flatMap((m) => m.quotesUsed || [])
    .filter((q): q is string => typeof q === "string" && q.length > 0);

  return { turnCount, quotesUsed };
}
