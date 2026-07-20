/**
 * Lazily-initialised OpenAI client singleton for the Ask feature.
 *
 * The key is server-side only (never exposed to the client). The route guards
 * on `process.env.OPENAI_API_KEY` before calling, so this throws only if
 * misconfigured.
 */

import OpenAI from "openai";

let client: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!client) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("Missing OPENAI_API_KEY environment variable");
    }
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return client;
}
