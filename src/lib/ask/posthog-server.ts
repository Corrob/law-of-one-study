/**
 * Server-side PostHog for the Ask endpoint.
 *
 * Records each LLM generation via PostHog's LLM Analytics ($ai_generation) so
 * we can watch cost, latency, and token usage for this free, community-funded
 * feature. No-ops when NEXT_PUBLIC_POSTHOG_KEY is not configured.
 *
 * Privacy: we deliberately do NOT send the raw question or answer text (seekers
 * ask about grief, crisis, health). We record message *lengths*, token counts,
 * cost, and latency — enough for observability, nothing personally revealing.
 * The distinct id is the client's PostHog id when available, otherwise a salted
 * hash of the IP (never the raw IP).
 */

import { PostHog } from "posthog-node";

let posthogClient: PostHog | null = null;

export function getPostHogClient(): PostHog | null {
  if (!posthogClient) {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (key) {
      // Server-side calls go directly to PostHog (no reverse proxy).
      posthogClient = new PostHog(key, { host: "https://us.i.posthog.com" });
    }
  }
  return posthogClient;
}

interface LLMGenerationEvent {
  distinctId: string;
  traceId?: string;
  model: string;
  provider?: string;
  /** Character length of the user's question (not the text itself). */
  inputLength?: number;
  /** Character length of the generated answer (not the text itself). */
  outputLength?: number;
  promptTokens?: number;
  completionTokens?: number;
  cost?: number;
  latencyMs?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Track an LLM generation with PostHog's LLM Analytics ($ai_generation).
 * Raw prompt/completion text is intentionally omitted (see file header).
 */
export function trackLLMGeneration({
  distinctId,
  traceId,
  model,
  provider = "openai",
  inputLength,
  outputLength,
  promptTokens,
  completionTokens,
  cost,
  latencyMs,
  metadata = {},
}: LLMGenerationEvent): void {
  const client = getPostHogClient();
  if (!client) return;

  client.capture({
    distinctId,
    event: "$ai_generation",
    properties: {
      $ai_trace_id: traceId,
      $ai_model: model,
      $ai_provider: provider,
      $ai_input_tokens: promptTokens,
      $ai_output_tokens: completionTokens,
      // Split the approximate cost across input/output for the dashboard.
      $ai_input_cost_usd: cost !== undefined ? cost * 0.2 : undefined,
      $ai_output_cost_usd: cost !== undefined ? cost * 0.8 : undefined,
      $ai_latency: latencyMs,
      input_length: inputLength,
      output_length: outputLength,
      ...metadata,
    },
  });
}

/**
 * Track an arbitrary server-side event (e.g. an operational flag). No raw
 * user text should be passed in `properties`.
 */
export function trackEvent(
  distinctId: string,
  event: string,
  properties: Record<string, unknown> = {}
): void {
  const client = getPostHogClient();
  if (!client) return;
  client.capture({ distinctId, event, properties });
}

/**
 * Flush pending events. Important on serverless where the process may freeze
 * immediately after the response is returned.
 */
export async function flushPostHog(): Promise<void> {
  const client = getPostHogClient();
  if (client) {
    await client.flush();
  }
}
