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
   * Which library grounds the answer: the trance-channeled Ra contact
   * (default) or L/L Research's conscious channeling (Q'uo, Latwii, Hatonn).
   * The two are never blended. Channeling is English-only — other locales are
   * always answered from the Ra material.
   */
  source: z.enum(["ra", "channeling"]).optional().default("ra"),
  /** PostHog distinct id from the client, for server-side LLM analytics. */
  distinctId: z.string().max(200).optional(),
});

export type AskRequest = z.infer<typeof AskRequestSchema>;
export type AskHistoryTurn = z.infer<typeof AskHistoryTurnSchema>;
export type AskSource = AskRequest["source"];
