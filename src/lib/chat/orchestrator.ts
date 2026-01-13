/**
 * Chat pipeline orchestrator.
 *
 * Coordinates the entire chat flow: concept detection, query augmentation,
 * search, LLM generation, streaming, and suggestions.
 *
 * This module extracts business logic from the route handler to make
 * the pipeline testable and the route handler thin.
 */

import { openai } from "@/lib/openai";
import { debug } from "@/lib/debug";
import { UNIFIED_RESPONSE_PROMPT, buildContextFromQuotes } from "@/lib/prompts";
import { ChatMessage, Quote, QueryIntent, IntentConfidence } from "@/lib/types";
import type { GraphConcept } from "@/lib/types-graph";
import { parseSessionQuestionReference } from "@/lib/quote-utils";
import { trackLLMGeneration } from "@/lib/posthog-server";
import { MODEL_CONFIG, CONVERSATION_CONFIG, calculateCost } from "@/lib/config";

import { createChatError } from "./errors";
import { sendStreamError } from "./error-response";
import { buildConversationContext } from "./context";
import { augmentQuery } from "./augmentation";
import { generateSuggestions } from "./suggestions";
import { processStreamWithMarkers } from "./stream-processor";
import { detectConcepts, formatConceptsForMeta, buildQueryWithConcepts } from "./concept-processing";
import { streamOffTopicResponse } from "./off-topic";
import { performSearch } from "./search";
import type { SSESender } from "./sse-encoder";

import { LANGUAGE_NAMES_FOR_PROMPTS, isLanguageAvailable } from "@/lib/language-config";

/**
 * Parameters for executing a chat query.
 */
export interface ExecuteChatParams {
  message: string;
  history: ChatMessage[];
  clientIp: string;
  send: SSESender;
  /** When true, use higher reasoning effort for more thoughtful responses */
  thinkingMode?: boolean;
  /** Target language for responses (ISO code, e.g., 'es' for Spanish) */
  targetLanguage?: string;
}

/**
 * Result of query augmentation stage.
 */
interface AugmentationResult {
  intent: QueryIntent;
  augmentedQuery: string;
  confidence: IntentConfidence;
  sessionRef: { session: number; question?: number } | null;
  detectedConcepts: GraphConcept[];
  promptContext: string;
}

/**
 * Build LLM messages array for the chat completion.
 */
function buildLLMMessages(
  message: string,
  recentHistory: ChatMessage[],
  intent: QueryIntent,
  confidence: IntentConfidence,
  turnCount: number,
  quotesContext: string,
  quotesUsed: string[],
  promptContext: string,
  targetLanguage: string = 'en'
): Array<{ role: "system" | "user" | "assistant"; content: string }> {
  const quoteExclusionBlock =
    quotesUsed.length > 0
      ? `\n\nQUOTES ALREADY SHOWN (do not reuse these references): ${quotesUsed.join(", ")}`
      : "";

  const conceptContextBlock = promptContext ? `\n\n${promptContext}` : "";

  // Add language instruction for non-English responses
  const languageInstruction = targetLanguage !== 'en' && isLanguageAvailable(targetLanguage)
    ? `\n\nIMPORTANT: Respond in ${LANGUAGE_NAMES_FOR_PROMPTS[targetLanguage]}. The user prefers ${LANGUAGE_NAMES_FOR_PROMPTS[targetLanguage]}. Write your explanations, analysis, and connecting text in ${LANGUAGE_NAMES_FOR_PROMPTS[targetLanguage]}. Quote content will be provided in the appropriate language.`
    : '';

  const systemPrompt = UNIFIED_RESPONSE_PROMPT + languageInstruction;

  return [
    { role: "system" as const, content: systemPrompt },
    ...recentHistory.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    {
      role: "user" as const,
      content: `[Intent: ${intent}] [Confidence: ${confidence}] [Turn: ${turnCount}]\n\n${message}\n\nHere are relevant Ra passages:\n\n${quotesContext}${quoteExclusionBlock}${conceptContextBlock}\n\nRespond to the user, using {{QUOTE:N}} format to include quotes.`,
    },
  ];
}

/**
 * Perform query augmentation with concept detection.
 */
async function performAugmentation(
  message: string
): Promise<AugmentationResult> {
  // Check for explicit session/question reference
  const sessionRef = parseSessionQuestionReference(message);
  if (sessionRef) {
    debug.log("[Orchestrator] Detected session/question reference:", sessionRef);
  }

  // Hybrid concept detection
  const conceptResult = await detectConcepts(message);
  const { detectedConcepts, searchTerms, promptContext } = conceptResult;

  // Query augmentation with concept context
  const queryWithConcepts = buildQueryWithConcepts(message, searchTerms);
  let { intent, augmentedQuery, confidence } = await augmentQuery(queryWithConcepts);

  // Override intent for session references
  if (sessionRef) {
    intent = "quote-search";
    confidence = "high";
    if (sessionRef.question === undefined) {
      augmentedQuery = `session ${sessionRef.session} Ra Material`;
    }
  }

  return {
    intent,
    augmentedQuery,
    confidence,
    sessionRef,
    detectedConcepts,
    promptContext,
  };
}

/**
 * Call the LLM and process the streaming response.
 */
async function streamLLMResponse(
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
  passages: Quote[],
  send: SSESender,
  thinkingMode: boolean = false
): Promise<{ fullOutput: string; usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } }> {
  const reasoningEffort = thinkingMode
    ? MODEL_CONFIG.thinkingModeReasoningEffort
    : MODEL_CONFIG.chatReasoningEffort;

  let response;
  try {
    response = await openai.chat.completions.create({
      model: MODEL_CONFIG.chatModel,
      messages,
      reasoning_effort: reasoningEffort,
      stream: true,
      stream_options: { include_usage: true },
    });
  } catch (e) {
    throw createChatError("STREAM_FAILED", e instanceof Error ? e : undefined);
  }

  try {
    return await processStreamWithMarkers(
      response as AsyncIterable<{
        choices: Array<{ delta?: { content?: string } }>;
        usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
      }>,
      passages,
      send
    );
  } catch (e) {
    throw createChatError("STREAM_FAILED", e instanceof Error ? e : undefined);
  }
}

/**
 * Track analytics for LLM generation.
 */
function trackAnalytics(
  clientIp: string,
  message: string,
  fullOutput: string,
  usage: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number },
  intent: QueryIntent,
  confidence: IntentConfidence,
  augmentedQuery: string,
  numPassages: number,
  latencyMs: number
): void {
  trackLLMGeneration({
    distinctId: clientIp,
    model: MODEL_CONFIG.chatModel,
    provider: "openai",
    input: message.substring(0, 500),
    output: fullOutput.substring(0, 500),
    promptTokens: usage.prompt_tokens,
    completionTokens: usage.completion_tokens,
    cost: calculateCost(usage.prompt_tokens || 0, usage.completion_tokens || 0),
    latencyMs,
    metadata: {
      intent,
      confidence,
      augmentedQuery: augmentedQuery.substring(0, 200),
      numPassages,
    },
  });
}

/**
 * Execute the full chat query pipeline.
 *
 * This is the main orchestration function that coordinates:
 * 1. Concept detection
 * 2. Query augmentation
 * 3. Off-topic handling
 * 4. Vector search
 * 5. LLM streaming
 * 6. Analytics tracking
 * 7. Suggestion generation
 *
 * @param params - Chat execution parameters
 * @throws Never - all errors are sent via SSE
 */
export async function executeChatQuery(params: ExecuteChatParams): Promise<void> {
  const { message, history, clientIp, send, thinkingMode = false, targetLanguage = 'en' } = params;
  const startTime = Date.now();

  try {
    // Build conversation context
    const recentHistory = history.slice(-CONVERSATION_CONFIG.recentHistoryCount);
    const { turnCount, quotesUsed } = buildConversationContext(history);

    // Perform augmentation (concept detection + query expansion)
    const augmentation = await performAugmentation(message);
    const { intent, augmentedQuery, confidence, sessionRef, detectedConcepts, promptContext } =
      augmentation;

    debug.log("[Orchestrator] Query augmentation:", {
      intent,
      confidence,
      augmentedQuery,
      turnCount,
      sessionRef,
      latencyMs: Date.now() - startTime,
    });

    // Handle off-topic queries
    if (intent === "off-topic") {
      await streamOffTopicResponse(send);
      return;
    }

    // Search for relevant passages
    const { passages } = await performSearch(augmentedQuery, sessionRef);

    // Send metadata to client
    send("meta", {
      quotes: passages,
      intent,
      confidence,
      concepts: formatConceptsForMeta(detectedConcepts),
    });

    // Build LLM messages
    const quotesContext = buildContextFromQuotes(passages);
    const llmMessages = buildLLMMessages(
      message,
      recentHistory,
      intent,
      confidence,
      turnCount,
      quotesContext,
      quotesUsed,
      promptContext,
      targetLanguage
    );

    // Stream LLM response
    const { fullOutput, usage } = await streamLLMResponse(llmMessages, passages, send, thinkingMode);

    // Track analytics
    if (usage) {
      trackAnalytics(
        clientIp,
        message,
        fullOutput,
        usage,
        intent,
        confidence,
        augmentedQuery,
        passages.length,
        Date.now() - startTime
      );
    }

    // Generate follow-up suggestions
    const suggestions = await generateSuggestions(message, fullOutput, intent, { turnCount });
    if (suggestions.length > 0) {
      send("suggestions", { items: suggestions });
    }

    send("done", {});
  } catch (error) {
    console.error("Chat pipeline error:", error);
    sendStreamError(send, error);
  }
}
