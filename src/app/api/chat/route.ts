import { NextRequest } from "next/server";
import { openai, createEmbedding } from "@/lib/openai";
import { searchRaMaterial } from "@/lib/pinecone";
import { debug } from "@/lib/debug";
import {
  QUERY_AUGMENTATION_PROMPT,
  UNIFIED_RESPONSE_PROMPT,
  SUGGESTION_GENERATION_PROMPT,
  buildContextFromQuotes,
} from "@/lib/prompts";
import { Quote, QueryIntent, IntentConfidence, ChatMessage } from "@/lib/types";
import { applySentenceRangeToQuote, formatWholeQuote, parseSessionQuestionReference } from "@/lib/quote-utils";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { trackLLMGeneration } from "@/lib/posthog-server";
import {
  identifyConcepts,
  getRelatedConcepts,
  buildSearchExpansion,
  buildConceptContextForPrompt,
  findConceptById,
} from "@/lib/concept-graph";
import { searchConcepts } from "@/lib/pinecone";
import type { GraphConcept } from "@/lib/types-graph";
import {
  MODEL_CONFIG,
  RATE_LIMIT_CONFIG,
  VALIDATION_LIMITS,
  CONVERSATION_CONFIG,
  SEARCH_CONFIG,
  calculateCost,
} from "@/lib/config";
import { withRetry } from "@/lib/retry";

interface ChatRequest {
  message: string;
  history: ChatMessage[];
}

/**
 * Check if a string could be the start of a quote marker that spans multiple chunks.
 *
 * The LLM streams text in chunks that may split a quote marker like `{{QUOTE:1}}` or
 * `{{QUOTE:2:s3:s7}}` across multiple chunks. This function detects partial markers
 * so we can buffer them until complete.
 *
 * ## Marker Formats Supported
 *
 * - **Simple marker:** `{{QUOTE:N}}` - Insert full quote at index N
 * - **Range marker:** `{{QUOTE:N:sX:sY}}` - Insert sentences X through Y from quote N
 *
 * ## Partial Match Patterns
 *
 * The function checks for these progressive partial states:
 *
 * ```
 * Stage 1: Static prefixes being built up
 *   "{"           -> could become {{QUOTE:...
 *   "{{"          -> could become {{QUOTE:...
 *   "{{Q"         -> building "QUOTE"
 *   "{{QU"        -> building "QUOTE"
 *   "{{QUO"       -> building "QUOTE"
 *   "{{QUOT"      -> building "QUOTE"
 *   "{{QUOTE"     -> complete keyword, awaiting ":"
 *   "{{QUOTE:"    -> awaiting quote index number
 *
 * Stage 2: Quote index being built (regex patterns)
 *   "{{QUOTE:1"   -> /^\{\{QUOTE:\d+$/      (index in progress)
 *   "{{QUOTE:12}" -> /^\{\{QUOTE:\d+\}$/    (awaiting second "}")
 *
 * Stage 3: Sentence range being built (for :sX:sY format)
 *   "{{QUOTE:1:"  -> /^\{\{QUOTE:\d+:$/     (awaiting "s")
 *   "{{QUOTE:1:s" -> /^\{\{QUOTE:\d+:s$/    (awaiting start number)
 *   "{{QUOTE:1:s3"-> /^\{\{QUOTE:\d+:s\d+$/ (start number in progress)
 *   "{{QUOTE:1:s3:"   -> awaiting second "s"
 *   "{{QUOTE:1:s3:s"  -> awaiting end number
 *   "{{QUOTE:1:s3:s7" -> /^\{\{QUOTE:\d+:s\d+:s\d+$/  (end number in progress)
 *   "{{QUOTE:1:s3:s7}"-> /^\{\{QUOTE:\d+:s\d+:s\d+\}$/(awaiting second "}")
 * ```
 *
 * @param s - The string fragment to check
 * @returns true if this could be a partial quote marker, false otherwise
 *
 * @example
 * ```ts
 * couldBePartialMarker("{")           // true - could become {{QUOTE:...
 * couldBePartialMarker("{{QUOTE:")    // true - awaiting index
 * couldBePartialMarker("{{QUOTE:1")   // true - index incomplete, might have more digits
 * couldBePartialMarker("{{QUOTE:1}}") // false - this is a COMPLETE marker
 * couldBePartialMarker("Hello")       // false - not a marker prefix
 * ```
 */
function couldBePartialMarker(s: string): boolean {
  // Stage 1: Static prefixes - building up to "{{QUOTE:"
  const prefixes = ["{", "{{", "{{Q", "{{QU", "{{QUO", "{{QUOT", "{{QUOTE", "{{QUOTE:"];
  if (prefixes.includes(s)) return true;

  // Stage 2: Quote index in progress - {{QUOTE:N (where N is one or more digits)
  if (/^\{\{QUOTE:\d+$/.test(s)) return true;

  // Simple marker almost complete - {{QUOTE:N} (awaiting second "}")
  if (/^\{\{QUOTE:\d+\}$/.test(s)) return true;

  // Stage 3: Sentence range - for {{QUOTE:N:sX:sY}} format
  if (/^\{\{QUOTE:\d+:$/.test(s)) return true;        // awaiting "s" for start
  if (/^\{\{QUOTE:\d+:s$/.test(s)) return true;       // awaiting start sentence number
  if (/^\{\{QUOTE:\d+:s\d+$/.test(s)) return true;    // start number in progress
  if (/^\{\{QUOTE:\d+:s\d+:$/.test(s)) return true;   // awaiting "s" for end
  if (/^\{\{QUOTE:\d+:s\d+:s$/.test(s)) return true;  // awaiting end sentence number
  if (/^\{\{QUOTE:\d+:s\d+:s\d+$/.test(s)) return true;   // end number in progress
  if (/^\{\{QUOTE:\d+:s\d+:s\d+\}$/.test(s)) return true; // awaiting second "}"

  return false;
}


// Build conversation context from history for enhanced prompt generation
function buildConversationContext(history: ChatMessage[]): {
  turnCount: number;
  quotesUsed: string[];
} {
  // Count turns (each user message = 1 turn)
  const turnCount = history.filter((m) => m.role === "user").length + 1;

  // Collect all quotes used in conversation
  const quotesUsed = history.flatMap((m) => m.quotesUsed || []).filter(Boolean) as string[];

  return { turnCount, quotesUsed };
}

// Valid intents for query classification
const VALID_INTENTS: QueryIntent[] = [
  "quote-search",
  "conceptual",
  "practical",
  "personal",
  "comparative",
  "meta",
  "off-topic",
];

// Valid confidence levels
const VALID_CONFIDENCES: IntentConfidence[] = ["high", "medium", "low"];

/**
 * Augment a user query with Ra Material terminology and detect intent.
 *
 * This function uses a fast LLM call to:
 * 1. Classify the user's intent (quote-search, conceptual, practical, etc.)
 * 2. Expand the query with Ra-specific terminology for better vector search
 * 3. Assess confidence in the classification
 *
 * @param message - The user's raw input message
 * @param context - Optional conversation context for better intent detection
 * @param context.recentTopics - Topics discussed in recent messages
 * @param context.previousIntent - The intent of the previous user message
 *
 * @returns Object containing:
 *   - intent: Classified query type (quote-search, conceptual, practical, personal, comparative, meta, off-topic)
 *   - augmentedQuery: Query expanded with Ra terminology for semantic search
 *   - confidence: Classification confidence level (high, medium, low)
 *
 * @example
 * ```ts
 * const result = await augmentQuery("What is harvest?");
 * // Returns:
 * // {
 * //   intent: "conceptual",
 * //   augmentedQuery: "harvest fourth density graduation transition polarization",
 * //   confidence: "high"
 * // }
 * ```
 */
async function augmentQuery(
  message: string,
  context?: { recentTopics?: string[]; previousIntent?: QueryIntent }
): Promise<{ intent: QueryIntent; augmentedQuery: string; confidence: IntentConfidence }> {
  try {
    // Build context block if conversation context is available
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

    // Parse JSON response
    const parsed = JSON.parse(content);

    // Validate intent is one of the allowed values
    const intent: QueryIntent = VALID_INTENTS.includes(parsed.intent)
      ? parsed.intent
      : "conceptual";

    // Validate confidence is one of the allowed values
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
    // Fallback: use original message with "conceptual" intent and low confidence
    return { intent: "conceptual", augmentedQuery: message, confidence: "low" };
  }
}

// Extract questions from AI response for echo detection
function extractAIQuestions(response: string): string[] {
  const sentences = response.split(/(?<=[.!?])\s+/);
  return sentences.filter(s => s.trim().endsWith('?')).slice(-3);
}

// Detect suggestion category for variety logging
function detectSuggestionCategory(s: string): string {
  if (/connect|relate|compare|difference/i.test(s)) return 'breadth';
  if (/Ra say|quote|passage|session/i.test(s)) return 'quote';
  if (/something else|new topic|different topic/i.test(s)) return 'exit';
  if (/mean by|clarify|what is|what are/i.test(s)) return 'clarify';
  return 'depth';
}

// Generate follow-up suggestions based on conversation context
async function generateSuggestions(
  userMessage: string,
  assistantResponse: string,
  intent: QueryIntent,
  context: { turnCount: number }
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
    const aiQuestionsBlock = aiQuestions.length > 0
      ? `\n\nAI QUESTIONS (do not echo these):\n${aiQuestions.map(q => `- "${q.trim()}"`).join('\n')}`
      : '';

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
      { maxRetries: 2, initialDelayMs: 500 }
    );

    const content = response.choices[0]?.message?.content || "";
    const parsed = JSON.parse(content);

    // Validate suggestions
    if (Array.isArray(parsed.suggestions)) {
      const rawSuggestions = parsed.suggestions;
      let validSuggestions = rawSuggestions
        .filter((s: unknown) => typeof s === "string" && s.length > 0 && s.length <= 60)
        .slice(0, 3);

      // Log if suggestions were filtered out due to length
      if (rawSuggestions.length > validSuggestions.length) {
        debug.log("[API] Some suggestions filtered:", {
          raw: rawSuggestions,
          valid: validSuggestions,
          filtered: rawSuggestions.filter(
            (s: unknown) => typeof s !== "string" || (typeof s === "string" && s.length > 60)
          ),
        });
      }

      // For personal intent, filter out practice-related suggestions
      if (intent === "personal") {
        const practicePatterns = /\b(meditat|journal|practice|routine|daily|exercise|try this)\b/i;
        const beforeFilter = validSuggestions.length;
        validSuggestions = validSuggestions.filter((s: string) => !practicePatterns.test(s));
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
    console.error("[API] Suggestion generation failed:", error);
    return getFallbackSuggestions(intent, []);
  }
}

// Fallback suggestions when LLM returns fewer than 3
function getFallbackSuggestions(intent: QueryIntent, existing: string[]): string[] {
  const fallbacksByIntent: Record<QueryIntent, string[]> = {
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

  const fallbacks = fallbacksByIntent[intent] || fallbacksByIntent.conceptual;
  // Filter out any that are already in existing
  return fallbacks.filter((f) => !existing.includes(f));
}

/**
 * Process a streaming LLM response, detecting quote markers and sending SSE events.
 *
 * This function implements a streaming state machine that handles the complex task of
 * detecting and processing quote markers (`{{QUOTE:N}}` and `{{QUOTE:N:sX:sY}}`) that
 * may be split across multiple stream chunks.
 *
 * ## Architecture Overview
 *
 * ```
 *                     ┌─────────────────────────────────────────┐
 *                     │           STREAM INPUT                  │
 *                     │  (chunks arrive asynchronously)         │
 *                     └─────────────────┬───────────────────────┘
 *                                       │
 *                                       ▼
 *                     ┌─────────────────────────────────────────┐
 *                     │              BUFFER                     │
 *                     │  (accumulates incoming text)            │
 *                     └─────────────────┬───────────────────────┘
 *                                       │
 *                          ┌────────────┴────────────┐
 *                          ▼                         ▼
 *              ┌───────────────────┐     ┌───────────────────────┐
 *              │ COMPLETE MARKER   │     │ PARTIAL MARKER CHECK  │
 *              │ /\{\{QUOTE:...\}\}│     │ couldBePartialMarker()│
 *              └─────────┬─────────┘     └───────────┬───────────┘
 *                        │                           │
 *          ┌─────────────┴──────────┐    ┌──────────┴──────────┐
 *          ▼                        ▼    ▼                     ▼
 *   ┌────────────┐           ┌──────────────┐          ┌──────────────┐
 *   │ TEXT BEFORE│           │ QUOTE DATA   │          │ KEEP IN      │
 *   │ → accum.   │           │ → emit quote │          │ BUFFER       │
 *   └────────────┘           └──────────────┘          │ (wait more)  │
 *          │                        │                  └──────────────┘
 *          ▼                        ▼
 *   ┌─────────────────────────────────────┐
 *   │           SSE EVENTS                │
 *   │  - "chunk" { type: "text", ... }    │
 *   │  - "chunk" { type: "quote", ... }   │
 *   └─────────────────────────────────────┘
 * ```
 *
 * ## Two-Buffer System
 *
 * The function uses two buffers to handle partial markers:
 *
 * 1. **buffer**: Raw incoming chunks that may contain partial markers
 * 2. **accumulatedText**: Confirmed text safe to emit (no partial markers)
 *
 * ## Processing Loop State Machine
 *
 * ```
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ FOR EACH CHUNK:                                                      │
 * │                                                                      │
 * │  1. Append chunk.content to buffer                                   │
 * │                                                                      │
 * │  2. WHILE buffer not empty:                                          │
 * │     ├── TRY: Match complete marker /\{\{QUOTE:(\d+)...\}\}/          │
 * │     │   ├── YES: Move text-before-marker → accumulatedText           │
 * │     │   │        Emit accumulatedText as "text" chunk                │
 * │     │   │        Parse quote index and sentence range                │
 * │     │   │        Emit quote as "quote" chunk                         │
 * │     │   │        Remove marker from buffer                           │
 * │     │   │        Continue WHILE loop                                 │
 * │     │   │                                                            │
 * │     │   └── NO: Check for partial marker at end of buffer            │
 * │     │           ├── Scan last 25 chars for partial marker start      │
 * │     │           ├── If found: Move safe text → accumulatedText       │
 * │     │           │             Keep potential marker in buffer        │
 * │     │           └── If not: Move all buffer → accumulatedText        │
 * │     │                       Clear buffer                             │
 * │     └── EXIT WHILE loop                                              │
 * │                                                                      │
 * │  3. After stream ends: Flush remaining buffer + accumulatedText      │
 * └──────────────────────────────────────────────────────────────────────┘
 * ```
 *
 * ## Partial Marker Detection
 *
 * When no complete marker is found, we must check if the buffer ends with
 * a potential partial marker. The algorithm:
 *
 * 1. Scan backwards from buffer end (max 25 chars - longest possible partial)
 * 2. For each position, check if `buffer.slice(position)` passes `couldBePartialMarker()`
 * 3. If match found:
 *    - Everything BEFORE that position is safe → move to accumulatedText
 *    - Everything FROM that position stays in buffer (might complete next chunk)
 * 4. If no match: entire buffer is safe → move all to accumulatedText
 *
 * @param stream - AsyncIterable from OpenAI streaming response
 * @param passages - Array of Quote objects available for marker substitution (1-indexed in markers)
 * @param send - Function to emit SSE events to the client
 *
 * @returns Object with:
 *   - fullOutput: Complete raw text output (for logging/analytics)
 *   - usage: Token usage statistics from final chunk
 *
 * @example
 * ```ts
 * // Incoming stream chunks (split across network packets):
 * // Chunk 1: "Ra teaches that love is {{QUOTE:"
 * // Chunk 2: "1}} and unity pervades all."
 *
 * // Buffer states:
 * // After Chunk 1: buffer="Ra teaches that love is {{QUOTE:"
 * //                       ↑ partial marker detected, kept in buffer
 * //                accumulatedText="Ra teaches that love is "
 * //
 * // After Chunk 2: buffer="{{QUOTE:1}} and unity pervades all."
 * //                       ↑ complete marker found!
 * //                Emit: "text" chunk, then "quote" chunk
 * //                buffer=" and unity pervades all."
 * ```
 */
async function processStreamWithMarkers(
  stream: AsyncIterable<{ choices: Array<{ delta?: { content?: string } }>; usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } }>,
  passages: Quote[],
  send: (event: string, data: object) => void
): Promise<{ fullOutput: string; usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } }> {
  let buffer = "";
  let accumulatedText = "";
  let fullOutput = "";
  let usageData: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } | undefined;

  for await (const chunk of stream) {
    // Capture usage data from final chunk
    if (chunk.usage) {
      usageData = chunk.usage;
    }

    const content = chunk.choices[0]?.delta?.content || "";
    if (content) {
      fullOutput += content;
      buffer += content;

      // Process buffer for complete markers
      while (true) {
        const markerMatch = buffer.match(/\{\{QUOTE:(\d+)(?::s(\d+):s(\d+))?\}\}/);
        if (!markerMatch || markerMatch.index === undefined) {
          // No complete marker found - check for partial marker
          let partialStart = -1;
          for (let i = Math.max(0, buffer.length - 25); i < buffer.length; i++) {
            if (couldBePartialMarker(buffer.slice(i))) {
              partialStart = i;
              break;
            }
          }

          if (partialStart >= 0) {
            accumulatedText += buffer.slice(0, partialStart);
            buffer = buffer.slice(partialStart);
          } else {
            accumulatedText += buffer;
            buffer = "";
          }
          break;
        }

        // Found complete marker - text before goes to accumulated
        const textBefore = buffer.slice(0, markerMatch.index);
        accumulatedText += textBefore;

        // Emit accumulated text as one complete chunk
        if (accumulatedText.trim()) {
          send("chunk", { type: "text", content: accumulatedText });
          accumulatedText = "";
        }

        // Parse quote marker and apply sentence range filtering
        const quoteIndex = parseInt(markerMatch[1], 10);
        const quote = passages[quoteIndex - 1]; // Convert from 1-indexed to 0-indexed

        if (quote) {
          let quoteText: string;

          // Apply sentence range if specified, otherwise format whole quote
          if (markerMatch[2] && markerMatch[3]) {
            const sentenceStart = parseInt(markerMatch[2], 10);
            const sentenceEnd = parseInt(markerMatch[3], 10);
            quoteText = applySentenceRangeToQuote(quote.text, sentenceStart, sentenceEnd);
            debug.log("[API] Applied sentence range", sentenceStart, "-", sentenceEnd, "to quote", quoteIndex);
          } else {
            quoteText = formatWholeQuote(quote.text);
            debug.log("[API] Formatted whole quote", quoteIndex);
          }

          debug.log("[API] Matched marker:", markerMatch[0]);
          send("chunk", {
            type: "quote",
            text: quoteText,
            reference: quote.reference,
            url: quote.url,
          });
        }

        buffer = buffer.slice(markerMatch.index + markerMatch[0].length);
      }
    }
  }

  // Flush any remaining text
  accumulatedText += buffer;
  if (accumulatedText.trim()) {
    send("chunk", { type: "text", content: accumulatedText });
  }

  return { fullOutput, usage: usageData };
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const clientIp = getClientIp(request);
    const rateLimitResult = checkRateLimit(clientIp, RATE_LIMIT_CONFIG);

    if (!rateLimitResult.success) {
      return new Response(
        JSON.stringify({
          error: "Too many requests. Please wait before trying again.",
          retryAfter: Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000),
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "X-RateLimit-Limit": rateLimitResult.limit.toString(),
            "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
            "X-RateLimit-Reset": new Date(rateLimitResult.resetAt).toISOString(),
            "Retry-After": Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    const body: ChatRequest = await request.json();
    const { message, history } = body;

    // Input validation - message
    if (!message || typeof message !== "string") {
      return new Response(JSON.stringify({ error: "Message is required and must be a string" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (message.length === 0) {
      return new Response(JSON.stringify({ error: "Message cannot be empty" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (message.length > VALIDATION_LIMITS.maxMessageLength) {
      return new Response(JSON.stringify({ error: `Message too long. Maximum ${VALIDATION_LIMITS.maxMessageLength} characters.` }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Input validation - history
    if (!Array.isArray(history)) {
      return new Response(JSON.stringify({ error: "History must be an array" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (history.length > VALIDATION_LIMITS.maxHistoryLength) {
      return new Response(JSON.stringify({ error: `History too long. Maximum ${VALIDATION_LIMITS.maxHistoryLength} messages.` }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate history structure
    for (const msg of history) {
      if (!msg || typeof msg !== "object") {
        return new Response(JSON.stringify({ error: "Invalid history format" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      if (!msg.role || (msg.role !== "user" && msg.role !== "assistant")) {
        return new Response(JSON.stringify({ error: "Invalid message role in history" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      if (!msg.content || typeof msg.content !== "string") {
        return new Response(JSON.stringify({ error: "Invalid message content in history" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      if (msg.content.length > VALIDATION_LIMITS.maxHistoryMessageLength) {
        return new Response(JSON.stringify({ error: "Message in history too long" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Build conversation context (recent messages for LLM, full history for metadata)
    const recentHistory = history.slice(-CONVERSATION_CONFIG.recentHistoryCount);
    const { turnCount, quotesUsed } = buildConversationContext(history);

    // Create streaming response
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        const send = (event: string, data: object) => {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        };

        try {
          // Step 0: Check for explicit session/question reference
          const sessionRef = parseSessionQuestionReference(message);
          if (sessionRef) {
            debug.log("[API] Detected session/question reference:", sessionRef);
          }

          // Step 0.5: HYBRID CONCEPT DETECTION
          // A) Regex-based detection (instant, free)
          const regexConcepts = identifyConcepts(message);

          // B) Embedding-based detection (semantic, ~$0.00001)
          const conceptEmbedding = await createEmbedding(message);
          const conceptSearchResults = await searchConcepts(conceptEmbedding, SEARCH_CONFIG.conceptTopK);
          const embeddingConcepts = conceptSearchResults
            .filter((r) => r.score !== undefined && r.score > SEARCH_CONFIG.conceptMinScore)
            .map((r) => findConceptById(r.id))
            .filter((c): c is GraphConcept => c !== undefined);

          // C) Merge: regex concepts first (higher confidence), then embedding
          const seenIds = new Set(regexConcepts.map((c) => c.id));
          const detectedConcepts = [...regexConcepts];
          for (const concept of embeddingConcepts) {
            if (!seenIds.has(concept.id)) {
              seenIds.add(concept.id);
              detectedConcepts.push(concept);
            }
          }

          // D) Get related concepts from merged set
          const relatedConcepts = detectedConcepts.length > 0
            ? getRelatedConcepts(detectedConcepts.map(c => c.id), 1)
            : [];
          const conceptSearchTerms = buildSearchExpansion(detectedConcepts);
          const conceptContext = buildConceptContextForPrompt(detectedConcepts);

          if (detectedConcepts.length > 0) {
            debug.log("[API] Regex concepts:", regexConcepts.map(c => c.term));
            debug.log("[API] Embedding concepts:", embeddingConcepts.map(c => c.term));
            debug.log("[API] Merged concepts:", detectedConcepts.map(c => c.term));
            debug.log("[API] Related concepts:", relatedConcepts.slice(0, 5).map(c => c.term));
            debug.log("[API] Search expansion terms:", conceptSearchTerms.slice(0, 10));
          }

          // Step 1: Augment query with Ra terminology and detect intent
          const augmentStartTime = Date.now();
          // Include concept terms in query for better augmentation
          const queryWithConcepts = conceptSearchTerms.length > 0
            ? `${message} [Related concepts: ${conceptSearchTerms.slice(0, 5).join(", ")}]`
            : message;
          let { intent, augmentedQuery, confidence } = await augmentQuery(queryWithConcepts);
          const augmentLatencyMs = Date.now() - augmentStartTime;

          // If session ref detected, override to quote-search intent for better response handling
          if (sessionRef) {
            intent = "quote-search";
            confidence = "high";
            // For session-only queries, augment with session topics
            if (sessionRef.question === undefined) {
              augmentedQuery = `session ${sessionRef.session} Ra Material`;
            }
          }
          debug.log("[API] Query augmentation:", { intent, confidence, augmentedQuery, turnCount, sessionRef, latencyMs: augmentLatencyMs });

          // Handle off-topic queries - skip search, return redirect
          if (intent === "off-topic") {
            // Send meta event with no quotes
            send("meta", { quotes: [], intent, confidence });

            // Stream redirect message
            const redirectMessage = "That's outside my focus on the Ra Material, but I'd be happy to explore any Law of One topics with you. Is there something about consciousness, spiritual evolution, or Ra's teachings you're curious about?";

            // Stream the message character by character for consistent UX
            for (let i = 0; i < redirectMessage.length; i += 10) {
              const chunk = redirectMessage.slice(i, i + 10);
              send("chunk", { type: "text", content: chunk });
              await new Promise((resolve) => setTimeout(resolve, 10));
            }

            // Generate welcoming suggestions for Ra topics
            const offTopicSuggestions = [
              "What is the Law of One?",
              "Tell me about densities",
              "What topics can I explore?",
            ];
            send("suggestions", { items: offTopicSuggestions });

            send("done", {});
            // Small delay to ensure client receives all data before connection closes
            await new Promise((resolve) => setTimeout(resolve, 100));
            controller.close();
            return;
          }

          // Step 2: Create embedding from augmented query
          const embedding = await createEmbedding(augmentedQuery);

          // Step 3: Search Pinecone (with metadata filter if session ref detected)
          const searchResults = await searchRaMaterial(embedding, {
            topK: sessionRef ? SEARCH_CONFIG.sessionRefTopK : SEARCH_CONFIG.defaultTopK,
            sessionFilter: sessionRef || undefined,
          });

          const passages: Quote[] = searchResults.map((r) => ({
            text: r.text,
            reference: r.reference,
            url: r.url,
          }));

          // Step 4: Send quotes metadata with intent, confidence, and detected concepts
          send("meta", {
            quotes: passages,
            intent,
            confidence,
            concepts: detectedConcepts.map(c => ({
              id: c.id,
              term: c.term,
              definition: c.definition,
              category: c.category,
            })),
          });

          const quotesContext = buildContextFromQuotes(passages);

          // Build quote exclusion block if quotes were previously shown
          const quoteExclusionBlock =
            quotesUsed.length > 0
              ? `\n\nQUOTES ALREADY SHOWN (do not reuse these references): ${quotesUsed.join(", ")}`
              : "";

          // Build concept context block if concepts were detected
          const conceptContextBlock = conceptContext
            ? `\n\n${conceptContext}`
            : "";

          // Step 5: Single streaming LLM call with unified prompt
          const response = await openai.chat.completions.create({
            model: MODEL_CONFIG.chatModel,
            messages: [
              { role: "system", content: UNIFIED_RESPONSE_PROMPT },
              ...recentHistory.map((m) => ({
                role: m.role as "user" | "assistant",
                content: m.content,
              })),
              {
                role: "user",
                content: `[Intent: ${intent}] [Confidence: ${confidence}] [Turn: ${turnCount}]\n\n${message}\n\nHere are relevant Ra passages:\n\n${quotesContext}${quoteExclusionBlock}${conceptContextBlock}\n\nRespond to the user, using {{QUOTE:N}} format to include quotes.`,
              },
            ],
            reasoning_effort: MODEL_CONFIG.reasoningEffort,
            stream: true,
            stream_options: { include_usage: true },
          });

          // Step 6: Process stream with marker handling
          const { fullOutput, usage } = await processStreamWithMarkers(
            response as AsyncIterable<{ choices: Array<{ delta?: { content?: string } }>; usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } }>,
            passages,
            send
          );

          // Track LLM generation with PostHog
          if (usage) {
            const responseLatencyMs = Date.now() - augmentStartTime;
            trackLLMGeneration({
              distinctId: clientIp,
              model: MODEL_CONFIG.chatModel,
              provider: "openai",
              input: message.substring(0, 500),
              output: fullOutput.substring(0, 500),
              promptTokens: usage.prompt_tokens,
              completionTokens: usage.completion_tokens,
              cost: calculateCost(usage.prompt_tokens || 0, usage.completion_tokens || 0),
              latencyMs: responseLatencyMs,
              metadata: {
                intent,
                confidence,
                augmentedQuery: augmentedQuery.substring(0, 200),
                numPassages: passages.length,
              },
            });
          }

          // Step 7: Generate follow-up suggestions
          const suggestions = await generateSuggestions(message, fullOutput, intent, { turnCount });
          if (suggestions.length > 0) {
            send("suggestions", { items: suggestions });
          }

          send("done", {});
        } catch (error) {
          console.error("Streaming error:", error);
          send("error", { message: "Failed to generate response" });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response(JSON.stringify({ error: "Failed to process request" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
