/**
 * Server-Sent Events (SSE) parsing utilities
 */

export interface SSEEvent {
  type: string;
  data: Record<string, unknown>;
}

/**
 * Parse a buffer of SSE data into discrete events.
 *
 * SSE format uses double newlines to separate events:
 * ```
 * event: chunk
 * data: {"type": "text", "content": "Hello"}
 *
 * event: done
 * data: {}
 * ```
 *
 * @param buffer - Raw SSE string buffer from the stream
 * @returns Object containing parsed events and any remaining incomplete data
 *
 * @example
 * ```ts
 * const { events, remaining } = parseSSE(buffer);
 * buffer = remaining; // Keep incomplete data for next chunk
 * for (const event of events) {
 *   console.log(event.type, event.data);
 * }
 * ```
 */
export function parseSSE(buffer: string): { events: SSEEvent[]; remaining: string } {
  const events: SSEEvent[] = [];
  const parts = buffer.split("\n\n");

  // Last part might be incomplete
  const remaining = buffer.endsWith("\n\n") ? "" : parts.pop() || "";

  for (const part of parts) {
    if (!part.trim()) continue;
    const lines = part.split("\n");
    let type = "";
    let data = "";
    for (const line of lines) {
      if (line.startsWith("event: ")) type = line.slice(7);
      if (line.startsWith("data: ")) data = line.slice(6);
    }
    if (type && data) {
      try {
        events.push({ type, data: JSON.parse(data) });
      } catch {
        // Skip malformed JSON
      }
    }
  }

  return { events, remaining };
}
