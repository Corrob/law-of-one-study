/**
 * Off-topic query handling
 *
 * Handles queries that are outside the scope of the Ra Material.
 */

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
 * @param chunkSize - Number of characters per chunk (default 10)
 * @param chunkDelay - Delay between chunks in ms (default 10)
 */
export async function streamOffTopicResponse(
  send: (event: string, data: object) => void,
  chunkSize = 10,
  chunkDelay = 10
): Promise<void> {
  const { message, suggestions } = getOffTopicResponse();

  // Send meta event with no quotes
  send("meta", { quotes: [], intent: "off-topic", confidence: "high" });

  // Stream the message in chunks for consistent UX
  for (let i = 0; i < message.length; i += chunkSize) {
    const chunk = message.slice(i, i + chunkSize);
    send("chunk", { type: "text", content: chunk });
    await new Promise((resolve) => setTimeout(resolve, chunkDelay));
  }

  // Send suggestions
  send("suggestions", { items: suggestions });

  // Send done event
  send("done", {});

  // Small delay to ensure client receives all data before connection closes
  await new Promise((resolve) => setTimeout(resolve, 100));
}
