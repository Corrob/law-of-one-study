/**
 * Stream processing with quote marker detection for SSE responses.
 *
 * Handles the complex task of detecting and processing quote markers
 * ({{QUOTE:N}} and {{QUOTE:N:sX:sY}}) that may be split across multiple stream chunks.
 */

import { Quote } from "@/lib/types";
import { couldBePartialMarker, QUOTE_MARKER_REGEX, MAX_PARTIAL_MARKER_LENGTH } from "./quote-markers";
import { applySentenceRangeToQuote, formatWholeQuote } from "@/lib/quote-utils";
import { debug } from "@/lib/debug";
import type { SSESender } from "./sse-encoder";

/** Token usage data from OpenAI API */
export interface TokenUsage {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
}

/** Result from stream processing */
export interface StreamProcessorResult {
  /** Complete raw text output (for logging/analytics) */
  fullOutput: string;
  /** Token usage statistics from final chunk */
  usage?: TokenUsage;
}

/** Stream chunk shape from OpenAI */
export interface StreamChunk {
  choices: Array<{ delta?: { content?: string } }>;
  usage?: TokenUsage;
}

/**
 * Process a streaming LLM response, detecting quote markers and sending SSE events.
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
 * @param stream - AsyncIterable from OpenAI streaming response
 * @param passages - Array of Quote objects available for marker substitution (1-indexed in markers)
 * @param send - Function to emit SSE events to the client
 *
 * @returns Object with fullOutput and usage statistics
 */
export async function processStreamWithMarkers(
  stream: AsyncIterable<StreamChunk>,
  passages: Quote[],
  send: SSESender
): Promise<StreamProcessorResult> {
  let buffer = "";
  let accumulatedText = "";
  let fullOutput = "";
  let usageData: TokenUsage | undefined;

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
        const markerMatch = buffer.match(QUOTE_MARKER_REGEX);
        if (!markerMatch || markerMatch.index === undefined) {
          // No complete marker found - check for partial marker
          let partialStart = -1;
          for (let i = Math.max(0, buffer.length - MAX_PARTIAL_MARKER_LENGTH); i < buffer.length; i++) {
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
