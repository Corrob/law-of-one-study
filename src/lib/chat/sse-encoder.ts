/**
 * SSE (Server-Sent Events) encoding utilities.
 *
 * Provides type-safe encoding for SSE responses,
 * decoupling the transport layer from business logic.
 */

/**
 * Function type for sending SSE events.
 * Used throughout the chat pipeline to emit events.
 */
export type SSESender = (event: string, data: object) => void;

/**
 * Create a TextEncoder instance for SSE encoding.
 * Reusable across multiple encode calls.
 */
const encoder = new TextEncoder();

/**
 * Encode an SSE event into a Uint8Array.
 *
 * @param event - Event type (e.g., "chunk", "done", "error")
 * @param data - Event data to JSON-serialize
 * @returns Encoded bytes ready for streaming
 */
export function encodeSSEEvent(event: string, data: object): Uint8Array {
  return encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

/**
 * Create an SSE sender function bound to a stream controller.
 *
 * @param controller - ReadableStream controller for enqueueing data
 * @returns SSESender function for emitting events
 *
 * @example
 * ```typescript
 * const stream = new ReadableStream({
 *   start(controller) {
 *     const send = createSSESender(controller);
 *     send("chunk", { type: "text", content: "Hello" });
 *     send("done", {});
 *     controller.close();
 *   }
 * });
 * ```
 */
export function createSSESender(
  controller: ReadableStreamDefaultController<Uint8Array>
): SSESender {
  return (event: string, data: object) => {
    controller.enqueue(encodeSSEEvent(event, data));
  };
}

/**
 * Standard SSE response headers.
 */
export const SSE_HEADERS = {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache",
  Connection: "keep-alive",
} as const;

/**
 * Create a Response object with SSE headers.
 *
 * @param stream - ReadableStream of SSE events
 * @returns Response configured for SSE
 */
export function createSSEResponse(stream: ReadableStream<Uint8Array>): Response {
  return new Response(stream, { headers: SSE_HEADERS });
}
