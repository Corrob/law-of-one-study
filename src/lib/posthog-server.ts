import { PostHog } from 'posthog-node'

let posthogClient: PostHog | null = null

export function getPostHogClient() {
  if (!posthogClient) {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST

    if (key && host) {
      posthogClient = new PostHog(key, {
        host: host,
      })
    }
  }

  return posthogClient
}

/**
 * Track an LLM generation event with PostHog
 */
export function trackLLMGeneration({
  distinctId,
  model,
  provider = 'openai',
  input,
  output,
  promptTokens,
  completionTokens,
  totalTokens,
  cost,
  latencyMs,
  metadata = {},
}: {
  distinctId: string
  model: string
  provider?: string
  input?: string
  output?: string
  promptTokens?: number
  completionTokens?: number
  totalTokens?: number
  cost?: number
  latencyMs?: number
  metadata?: Record<string, any>
}) {
  const client = getPostHogClient()
  if (!client) return

  client.capture({
    distinctId,
    event: 'llm_generation',
    properties: {
      $ai_model: model,
      $ai_provider: provider,
      $ai_input: input,
      $ai_output: output,
      $ai_prompt_tokens: promptTokens,
      $ai_completion_tokens: completionTokens,
      $ai_total_tokens: totalTokens,
      $ai_cost_usd: cost,
      $ai_latency_ms: latencyMs,
      ...metadata,
    },
  })
}

/**
 * Track a custom event with PostHog
 */
export function trackEvent({
  distinctId,
  event,
  properties = {},
}: {
  distinctId: string
  event: string
  properties?: Record<string, any>
}) {
  const client = getPostHogClient()
  if (!client) return

  client.capture({
    distinctId,
    event,
    properties,
  })
}

/**
 * Flush all pending events (important for serverless)
 */
export async function flushPostHog() {
  const client = getPostHogClient()
  if (client) {
    await client.shutdown()
  }
}
