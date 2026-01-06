/**
 * Test utilities for mocking OpenAI streaming responses.
 *
 * These helpers create async iterables that mimic the OpenAI SDK's
 * streaming response format, allowing tests to simulate various
 * streaming scenarios including quote markers.
 */

/** Shape of a single chunk in the OpenAI stream */
interface StreamChunk {
  choices: Array<{ delta?: { content?: string } }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

/**
 * Create an async generator that yields chunks like OpenAI's stream.
 *
 * @param chunks - Array of chunk objects with content and optional usage
 * @returns AsyncIterable matching OpenAI's streaming format
 *
 * @example
 * ```ts
 * const stream = createMockStream([
 *   { content: "Hello " },
 *   { content: "world!" },
 *   { content: "", usage: { prompt_tokens: 10, completion_tokens: 5 } },
 * ]);
 * ```
 */
export function createMockStream(
  chunks: Array<{ content?: string; usage?: StreamChunk["usage"] }>
): AsyncIterable<StreamChunk> {
  return {
    async *[Symbol.asyncIterator]() {
      for (const chunk of chunks) {
        yield {
          choices: [{ delta: { content: chunk.content || "" } }],
          usage: chunk.usage,
        };
      }
    },
  };
}

/**
 * Create a mock stream from simple text chunks.
 *
 * @param textChunks - Array of text strings to stream
 * @param usage - Optional token usage to include in final chunk
 * @returns AsyncIterable matching OpenAI's streaming format
 *
 * @example
 * ```ts
 * const stream = createMockStreamFromText(
 *   ["Hello ", "world!"],
 *   { prompt_tokens: 10, completion_tokens: 5 }
 * );
 * ```
 */
export function createMockStreamFromText(
  textChunks: string[],
  usage?: StreamChunk["usage"]
): AsyncIterable<StreamChunk> {
  const chunks: Array<{ content?: string; usage?: StreamChunk["usage"] }> =
    textChunks.map((content) => ({ content }));
  if (usage) {
    chunks.push({ content: "", usage });
  }
  return createMockStream(chunks);
}

/**
 * Create a mock stream that includes quote markers.
 *
 * Useful for testing the quote marker processing logic.
 *
 * @param parts - Array of strings and quote marker objects
 * @param usage - Optional token usage to include in final chunk
 * @returns AsyncIterable matching OpenAI's streaming format
 *
 * @example
 * ```ts
 * const stream = createMockStreamWithQuotes([
 *   "Here is a quote: ",
 *   { quoteIndex: 1 },
 *   " and some more text ",
 *   { quoteIndex: 2, sentenceStart: 1, sentenceEnd: 3 },
 * ]);
 * ```
 */
export function createMockStreamWithQuotes(
  parts: Array<string | { quoteIndex: number; sentenceStart?: number; sentenceEnd?: number }>,
  usage?: StreamChunk["usage"]
): AsyncIterable<StreamChunk> {
  const textChunks: string[] = [];

  for (const part of parts) {
    if (typeof part === "string") {
      textChunks.push(part);
    } else {
      // Format quote marker
      if (part.sentenceStart !== undefined && part.sentenceEnd !== undefined) {
        textChunks.push(`{{QUOTE:${part.quoteIndex}:s${part.sentenceStart}:s${part.sentenceEnd}}}`);
      } else {
        textChunks.push(`{{QUOTE:${part.quoteIndex}}}`);
      }
    }
  }

  return createMockStreamFromText(textChunks, usage);
}

/**
 * Create a mock stream that simulates a split quote marker.
 *
 * This is useful for testing partial marker detection when
 * a quote marker is split across multiple chunks.
 *
 * @param beforeMarker - Text before the marker
 * @param markerPart1 - First part of the marker (e.g., "{{QUOTE:")
 * @param markerPart2 - Second part of the marker (e.g., "1}}")
 * @param afterMarker - Text after the marker
 * @param usage - Optional token usage
 * @returns AsyncIterable matching OpenAI's streaming format
 *
 * @example
 * ```ts
 * // Simulates: "Ra says {{QUOTE:1}} about love"
 * // Split as: ["Ra says {{QUOTE:", "1}} about love"]
 * const stream = createMockStreamWithSplitMarker(
 *   "Ra says ",
 *   "{{QUOTE:",
 *   "1}}",
 *   " about love"
 * );
 * ```
 */
export function createMockStreamWithSplitMarker(
  beforeMarker: string,
  markerPart1: string,
  markerPart2: string,
  afterMarker: string,
  usage?: StreamChunk["usage"]
): AsyncIterable<StreamChunk> {
  return createMockStreamFromText(
    [beforeMarker + markerPart1, markerPart2 + afterMarker],
    usage
  );
}

/**
 * Create a mock implementation for OpenAI chat completions.
 *
 * @param stream - The mock stream to return
 * @returns A jest mock function that returns the stream
 *
 * @example
 * ```ts
 * const mockCreate = createMockChatCompletion(
 *   createMockStreamFromText(["Hello", " world"])
 * );
 * mockOpenAI.chat.completions.create.mockImplementation(mockCreate);
 * ```
 */
export function createMockChatCompletion(
  stream: AsyncIterable<StreamChunk>
): () => AsyncIterable<StreamChunk> {
  return () => stream;
}

/**
 * Default usage stats for tests.
 */
export const DEFAULT_USAGE: StreamChunk["usage"] = {
  prompt_tokens: 100,
  completion_tokens: 50,
  total_tokens: 150,
};
