import OpenAI from "openai";
import { withRetry, withCircuitBreaker } from "./retry";
import { RETRY_CONFIG } from "./config";

let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("Missing OPENAI_API_KEY environment variable");
    }
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
}

export const openai = {
  get chat() {
    return getOpenAIClient().chat;
  },
  get embeddings() {
    return getOpenAIClient().embeddings;
  },
};

export async function createEmbedding(text: string): Promise<number[]> {
  const client = getOpenAIClient();

  return withCircuitBreaker(
    "openai-embedding",
    () =>
      withRetry(
        async () => {
          const response = await client.embeddings.create({
            model: "text-embedding-3-small",
            input: text,
          });
          return response.data[0].embedding;
        },
        RETRY_CONFIG.embedding
      ),
    { failureThreshold: 5, resetTimeMs: 60000 }
  );
}
