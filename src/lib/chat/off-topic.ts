/**
 * Off-topic query handling
 *
 * Handles queries that are outside the scope of the Ra Material.
 */

import type { SSESender } from "./sse-encoder";

export interface OffTopicHandlerResult {
  message: string;
  suggestions: string[];
}

/** Standard redirect message for off-topic queries */
export const OFF_TOPIC_MESSAGE =
  "That's outside my focus on the Ra Material, but I'd be happy to explore any Law of One topics with you. Is there something about consciousness, spiritual evolution, or Ra's teachings you're curious about?";

/** Welcoming suggestions to redirect users to Ra Material topics */
export const OFF_TOPIC_SUGGESTIONS = [
  "What is the Law of One?",
  "Tell me about densities",
  "What topics can I explore?",
];

/**
 * Gets the standard off-topic response data
 */
export function getOffTopicResponse(): OffTopicHandlerResult {
  return {
    message: OFF_TOPIC_MESSAGE,
    suggestions: OFF_TOPIC_SUGGESTIONS,
  };
}

/**
 * Streams an off-topic response through SSE
 *
 * @param send - The SSE sender function
 */
export async function streamOffTopicResponse(
  send: SSESender
): Promise<void> {
  const { message, suggestions } = getOffTopicResponse();

  // Send meta event with no quotes
  send("meta", { quotes: [], intent: "off-topic", confidence: "high" });

  // Send the message as a single chunk to avoid formatting issues
  // (Multiple small chunks create separate block elements with margins)
  send("chunk", { type: "text", content: message });

  // Send suggestions
  send("suggestions", { items: suggestions });

  // Send done event
  send("done", {});

  // Small delay to ensure client receives all data before connection closes
  await new Promise((resolve) => setTimeout(resolve, 100));
}
