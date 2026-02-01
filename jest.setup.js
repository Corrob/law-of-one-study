// Learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom";

// Mock next-intl modules to avoid ESM issues
jest.mock("next-intl/routing", () => ({
  defineRouting: (config) => config,
}));

// Mock next-intl for components using useTranslations
jest.mock("next-intl", () => ({
  useTranslations: (namespace) => (key, params) => {
    // Return a simple key path or formatted string for testing
    const fullKey = namespace ? `${namespace}.${key}` : key;
    if (params) {
      // Simple template replacement for testing
      return Object.entries(params).reduce(
        (str, [k, v]) => str.replace(`{${k}}`, String(v)),
        fullKey
      );
    }
    return fullKey;
  },
  useLocale: () => "en",
  useMessages: () => ({}),
  useNow: () => new Date(),
  useTimeZone: () => "UTC",
  NextIntlClientProvider: ({ children }) => children,
}));

// Create persistent mock functions for router
const mockRouterPush = jest.fn();
const mockRouterReplace = jest.fn();
const mockRouterBack = jest.fn();
const mockRouterForward = jest.fn();
const mockRouterRefresh = jest.fn();
const mockRouterPrefetch = jest.fn();

jest.mock("next-intl/navigation", () => ({
  createNavigation: () => ({
    Link: ({ href, children, ...props }) => {
      const React = require("react");
      return React.createElement("a", { href, ...props }, children);
    },
    redirect: (pathname) => {
      throw new Error(`NEXT_REDIRECT: ${pathname}`);
    },
    usePathname: () => "/",
    useRouter: () => ({
      push: mockRouterPush,
      replace: mockRouterReplace,
      back: mockRouterBack,
      forward: mockRouterForward,
      refresh: mockRouterRefresh,
      prefetch: mockRouterPrefetch,
    }),
    getPathname: ({ href }) => href,
  }),
}));

// Clear router mocks before each test
beforeEach(() => {
  mockRouterPush.mockClear();
  mockRouterReplace.mockClear();
  mockRouterBack.mockClear();
  mockRouterForward.mockClear();
  mockRouterRefresh.mockClear();
  mockRouterPrefetch.mockClear();
});

// Mock environment variables
process.env.NEXT_PUBLIC_POSTHOG_KEY = "test-key";
process.env.NEXT_PUBLIC_POSTHOG_HOST = "https://test.posthog.com";
process.env.OPENAI_API_KEY = "test-openai-key";

// Mock DOM APIs not implemented in jsdom
if (typeof Element !== "undefined") {
  Element.prototype.scrollIntoView = jest.fn();
}

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
