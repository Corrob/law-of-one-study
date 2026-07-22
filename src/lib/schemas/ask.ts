/**
 * Zod schemas for the Ask API endpoint (request validation).
 */

import { z } from "zod";
import { AvailableLanguageSchema } from "@/lib/language-config";
import {
  ASK_MAX_MESSAGE_LENGTH,
  ASK_MAX_HISTORY_MESSAGES,
  ASK_MAX_HISTORY_CHARS,
} from "@/lib/ask/config";

export const AskHistoryTurnSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(ASK_MAX_MESSAGE_LENGTH),
});

export const AskRequestSchema = z.object({
  message: z.string().trim().min(1).max(ASK_MAX_MESSAGE_LENGTH),
  history: z
    .array(AskHistoryTurnSchema)
    .max(ASK_MAX_HISTORY_MESSAGES)
    .refine(
      (turns) => turns.reduce((sum, t) => sum + t.content.length, 0) <= ASK_MAX_HISTORY_CHARS,
      { message: `History exceeds ${ASK_MAX_HISTORY_CHARS} characters.` }
    )
    .optional()
    .default([]),
  locale: AvailableLanguageSchema.optional().default("en"),
  /**
   * Opt-in to conscious-channeling grounding (Q'uo, Latwii, Hatonn).
   * English-only — ignored for other locales (the transcripts have no
   * translations).
   */
  includeChanneling: z.boolean().optional().default(false),
  /** PostHog distinct id from the client, for server-side LLM analytics. */
  distinctId: z.string().max(200).optional(),
});

export type AskRequest = z.infer<typeof AskRequestSchema>;
export type AskHistoryTurn = z.infer<typeof AskHistoryTurnSchema>;
