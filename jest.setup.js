// Learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom";

// Mock environment variables
process.env.NEXT_PUBLIC_POSTHOG_KEY = "test-key";
process.env.NEXT_PUBLIC_POSTHOG_HOST = "https://test.posthog.com";
process.env.OPENAI_API_KEY = "test-openai-key";

// Expose Node.js native fetch APIs to the jsdom environment
// These are needed for Next.js API route testing
const { Request, Response, Headers, fetch } = globalThis;
if (Request) global.Request = Request;
if (Response) global.Response = Response;
if (Headers) global.Headers = Headers;
if (fetch) global.fetch = fetch;

// TextEncoder/TextDecoder are needed for streaming
const { TextEncoder, TextDecoder } = require("util");
if (!global.TextEncoder) global.TextEncoder = TextEncoder;
if (!global.TextDecoder) global.TextDecoder = TextDecoder;

// ReadableStream for SSE
const { ReadableStream } = require("stream/web");
if (!global.ReadableStream) global.ReadableStream = ReadableStream;
