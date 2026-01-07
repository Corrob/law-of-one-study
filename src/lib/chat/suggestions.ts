/**
 * Follow-up suggestion generation for chat responses
 */

import { openai } from "@/lib/openai";
import { SUGGESTION_GENERATION_PROMPT } from "@/lib/prompts";
import { QueryIntent } from "@/lib/types";
import { withRetry } from "@/lib/retry";
import { MODEL_CONFIG, RETRY_CONFIG } from "@/lib/config";
import { debug } from "@/lib/debug";
import { createChatError } from "@/lib/chat/errors";
import { trackEvent } from "@/lib/posthog-server";
import { parseSuggestionResponse } from "@/lib/schemas";

/** Extract questions from AI response for echo detection */
export function extractAIQuestions(response: string): string[] {
  const sentences = response.split(/(?<=[.!?])\s+/);
  return sentences.filter((s) => s.trim().endsWith("?")).slice(-3);
}

/** Detect suggestion category for variety logging */
export function detectSuggestionCategory(s: string): string {
  if (/connect|relate|compare|difference/i.test(s)) return "breadth";
  if (/Ra say|quote|passage|session/i.test(s)) return "quote";
  if (/something else|new topic|different topic/i.test(s)) return "exit";
  if (/mean by|clarify|what is|what are/i.test(s)) return "clarify";
  return "depth";
}

/** Fallback suggestions by intent when LLM fails or returns fewer than 3 */
const FALLBACK_SUGGESTIONS: Record<QueryIntent, string[]> = {
  "quote-search": [
    "Show me the full passage",
    "What else does Ra say about this?",
    "Which session is this from?",
  ],
  conceptual: [
    "How does this connect to other concepts?",
    "Can you explain this further?",
    "What's the context for this teaching?",
  ],
  practical: [
    "What's the first step?",
    "Are there other approaches?",
    "How do I know if it's working?",
  ],
  personal: [
    "What does Ra say about this?",
    "Is there more to explore here?",
    "I'd like to discuss something else",
  ],
  comparative: [
    "What are the key differences?",
    "Are there other parallels?",
    "How is Ra's view unique?",
  ],
  meta: [
    "What topics can I explore?",
    "What is the Law of One?",
    "How do I search for quotes?",
  ],
  "off-topic": [
    "What is the Law of One?",
    "Tell me about densities",
    "What topics can I explore?",
  ],
};

/** Get fallback suggestions, filtering out any already present */
export function getFallbackSuggestions(intent: QueryIntent, existing: string[]): string[] {
  const fallbacks = FALLBACK_SUGGESTIONS[intent] || FALLBACK_SUGGESTIONS.conceptual;
  return fallbacks.filter((f) => !existing.includes(f));
}

/** Context for suggestion generation */
export interface SuggestionContext {
  turnCount: number;
}

/**
 * Generate follow-up suggestions based on conversation context.
 */
export async function generateSuggestions(
  userMessage: string,
  assistantResponse: string,
  intent: QueryIntent,
  context: SuggestionContext
): Promise<string[]> {
  try {
    // For short responses, include the whole thing; for longer ones, focus on ending
    const responseForContext =
      assistantResponse.length > 1200
        ? `[Response summary - about ${Math.round(assistantResponse.length / 4)} words on the topic]\n\n...${assistantResponse.slice(-700)}`
        : assistantResponse;

    // Build rich context including intent and conversation depth
    const depthNote =
      context.turnCount >= 5
        ? " (deep conversation - consider offering a breadth option)"
        : context.turnCount >= 3
          ? " (established conversation)"
          : "";

    // Extract AI questions for echo detection
    const aiQuestions = extractAIQuestions(assistantResponse);
    const aiQuestionsBlock =
      aiQuestions.length > 0
        ? `\n\nAI QUESTIONS (do not echo these):\n${aiQuestions.map((q) => `- "${q.trim()}"`).join("\n")}`
        : "";

    const conversationContext = [
      `DETECTED INTENT: ${intent}${intent === "personal" ? " (emotional/vulnerable - be gentle with suggestions)" : ""}`,
      `CONVERSATION DEPTH: Turn ${context.turnCount}${depthNote}`,
      ``,
      `USER'S MESSAGE: ${userMessage}`,
      ``,
      `ASSISTANT'S RESPONSE:`,
      responseForContext,
      aiQuestionsBlock,
    ].join("\n");

    const response = await withRetry(
      () =>
        openai.chat.completions.create({
          model: MODEL_CONFIG.chatModel,
          messages: [
            { role: "system", content: SUGGESTION_GENERATION_PROMPT },
            { role: "user", content: conversationContext },
          ],
          reasoning_effort: MODEL_CONFIG.reasoningEffort,
        }),
      RETRY_CONFIG.suggestions
    );

    const content = response.choices[0]?.message?.content || "";

    // Parse and validate response with Zod
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      throw new Error("Invalid JSON response from suggestions");
    }

    const validated = parseSuggestionResponse(parsed);
    if (!validated) {
      throw new Error("Response did not match expected schema");
    }

    // Validate suggestions
    if (Array.isArray(validated.suggestions)) {
      const rawSuggestions = validated.suggestions;
      let validSuggestions = rawSuggestions
        .filter((s) => s.length > 0 && s.length <= 100)
        .slice(0, 3);

      // Log if suggestions were filtered out due to length
      if (rawSuggestions.length > validSuggestions.length) {
        debug.log("[API] Some suggestions filtered:", {
          raw: rawSuggestions,
          valid: validSuggestions,
          filtered: rawSuggestions.filter((s) => s.length > 100),
        });
      }

      // For personal intent, filter out practice-related suggestions
      if (intent === "personal") {
        const practicePatterns = /\b(meditat|journal|practice|routine|daily|exercise|try this)\b/i;
        const beforeFilter = validSuggestions.length;
        validSuggestions = validSuggestions.filter((s) => !practicePatterns.test(s));
        if (validSuggestions.length < beforeFilter) {
          debug.log("[API] Filtered practice suggestions for personal intent:", {
            before: beforeFilter,
            after: validSuggestions.length,
          });
        }
      }

      // Log variety metrics for monitoring
      if (validSuggestions.length >= 2) {
        const categories = validSuggestions.map(detectSuggestionCategory);
        const uniqueCategories = new Set(categories);
        if (uniqueCategories.size < validSuggestions.length) {
          debug.log("[API] Low variety in suggestions:", {
            suggestions: validSuggestions,
            categories,
            uniqueCount: uniqueCategories.size,
          });
        }
      }

      // If we have fewer than 3, pad with fallback suggestions based on intent
      if (validSuggestions.length < 3) {
        const fallbacks = getFallbackSuggestions(intent, validSuggestions);
        const padded = [...validSuggestions, ...fallbacks].slice(0, 3);
        debug.log("[API] Padded suggestions:", { original: validSuggestions.length, padded: padded.length });
        return padded;
      }

      return validSuggestions;
    }
    return getFallbackSuggestions(intent, []);
  } catch (error) {
    // Create typed error for logging
    const chatError = createChatError(
      "SUGGESTIONS_FAILED",
      error instanceof Error ? error : new Error(String(error))
    );

    // Log with context
    console.error("[API] Suggestion generation failed:", {
      code: chatError.code,
      message: chatError.message,
      intent,
      turnCount: context.turnCount,
    });

    // Track to PostHog for monitoring
    trackEvent({
      distinctId: "system",
      event: "suggestions_error",
      properties: {
        error_code: chatError.code,
        error_message: chatError.message,
        intent,
        turn_count: context.turnCount,
      },
    });

    // Return fallback (preserve graceful degradation)
    return getFallbackSuggestions(intent, []);
  }
}
