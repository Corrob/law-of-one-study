/**
 * Zod schemas for the Ask API endpoint (request validation).
 */

import { z } from "zod";
import { AvailableLanguageSchema } from "@/lib/language-config";
import { ASK_MAX_MESSAGE_LENGTH, ASK_MAX_HISTORY_MESSAGES } from "@/lib/ask/config";

export const AskHistoryTurnSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(ASK_MAX_MESSAGE_LENGTH),
});

export const AskRequestSchema = z.object({
  message: z.string().trim().min(1).max(ASK_MAX_MESSAGE_LENGTH),
  history: z.array(AskHistoryTurnSchema).max(ASK_MAX_HISTORY_MESSAGES).optional().default([]),
  locale: AvailableLanguageSchema.optional().default("en"),
});

export type AskRequest = z.infer<typeof AskRequestSchema>;
export type AskHistoryTurn = z.infer<typeof AskHistoryTurnSchema>;
