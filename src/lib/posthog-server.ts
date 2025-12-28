import { PostHog } from "posthog-node";

let posthogClient: PostHog | null = null;

export function getPostHogClient() {
  if (!posthogClient) {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;

    if (key) {
      posthogClient = new PostHog(key, {
        // Server-side calls go directly to PostHog API (no proxy needed)
        host: "https://us.i.posthog.com",
      });
    }
  }

  return posthogClient;
}

/**
 * Track an LLM generation event with PostHog's LLM Analytics
 * Uses $ai_generation event for PostHog's LLM Analytics dashboard
 */
export function trackLLMGeneration({
  distinctId,
  traceId,
  model,
  provider = "openai",
  input,
  output,
  promptTokens,
  completionTokens,
  _totalTokens,
  cost,
  latencyMs,
  metadata = {},
}: {
  distinctId: string;
  traceId?: string;
  model: string;
  provider?: string;
  input?: string;
  output?: string;
  promptTokens?: number;
  completionTokens?: number;
  _totalTokens?: number; // Unused, but kept for API compatibility
  cost?: number;
  latencyMs?: number;
  metadata?: Record<string, unknown>;
}) {
  const client = getPostHogClient();
  if (!client) return;

  // Use $ai_generation event for PostHog LLM Analytics
  client.capture({
    distinctId,
    event: "$ai_generation",
    properties: {
      // Trace ID groups related generations together
      $ai_trace_id: traceId || `trace_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      // Core LLM properties
      $ai_model: model,
      $ai_provider: provider,
      $ai_input: input,
      $ai_output: output,
      // Token usage
      $ai_input_tokens: promptTokens,
      $ai_output_tokens: completionTokens,
      // Cost and latency
      $ai_input_cost_usd: cost ? cost * 0.2 : undefined, // Approximate input portion
      $ai_output_cost_usd: cost ? cost * 0.8 : undefined, // Approximate output portion
      $ai_latency: latencyMs,
      // Additional metadata
      ...metadata,
    },
  });
}

/**
 * Track a custom event with PostHog
 */
export function trackEvent({
  distinctId,
  event,
  properties = {},
}: {
  distinctId: string;
  event: string;
  properties?: Record<string, unknown>;
}) {
  const client = getPostHogClient();
  if (!client) return;

  client.capture({
    distinctId,
    event,
    properties,
  });
}

/**
 * Flush all pending events (important for serverless)
 */
export async function flushPostHog() {
  const client = getPostHogClient();
  if (client) {
    await client.shutdown();
  }
}
