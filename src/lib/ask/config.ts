/**
 * Configuration for the "Ask" feature — an LLM guide to the Ra Material,
 * grounded entirely in our own concept graph (no RAG, no stored source text).
 *
 * The model paraphrases Ra's teachings in its own words and cites sources as
 * links to L/L Research (llresearch.org); it never reproduces the Ra Material
 * verbatim.
 */

/**
 * OpenAI model powering Ask responses (and the follow-up suggestion call).
 *
 * `gpt-5.6-luna` is the current quality pick for tightly-grounded,
 * no-reproduction answers. Swap to a cheaper tier here (e.g. `gpt-5-mini`) if
 * traffic/cost grows — the call sites are provider-agnostic beyond this
 * constant and the reasoning-effort setting below.
 */
export const ASK_MODEL = "gpt-5.6-luna";

/**
 * Reasoning effort for the model. Grounded paraphrase does not need deep
 * reasoning, and low effort keeps chat latency down. Raise to "medium" if
 * answer quality needs it.
 */
export const ASK_REASONING_EFFORT = "low" as const;

/**
 * Hard cap on tokens generated per answer (a cost/abuse safety ceiling, not a
 * target). Answers are a few short paragraphs; this is generous headroom.
 * Note: for a reasoning model this budget covers reasoning + output, so it is
 * set well above the expected answer length to avoid truncation.
 */
export const ASK_MAX_TOKENS = 4096;

/** Input validation limits (mirrors the removed feature's validation.ts). */
export const ASK_MAX_MESSAGE_LENGTH = 4000;
export const ASK_MAX_HISTORY_MESSAGES = 12;
export const ASK_MAX_HISTORY_CHARS = 8000;

/** How many concepts to inject as focused, full-detail grounding per query. */
export const ASK_MAX_FOCUSED_CONCEPTS = 6;

/** Per-IP rate limit for the Ask endpoint. */
export const ASK_RATE_LIMIT = {
  maxRequests: 12,
  windowMs: 60_000,
} as const;

/**
 * gpt-5.6-luna pricing (USD per 1M tokens) for cost tracking in analytics only —
 * never billing. Update if OpenAI changes pricing.
 */
export const ASK_MODEL_PRICING = {
  inputPer1M: 1.0,
  outputPer1M: 6.0,
} as const;

/** Approximate USD cost of a generation, for PostHog LLM analytics. */
export function calculateCost(promptTokens: number, completionTokens: number): number {
  const input = (promptTokens / 1_000_000) * ASK_MODEL_PRICING.inputPer1M;
  const output = (completionTokens / 1_000_000) * ASK_MODEL_PRICING.outputPer1M;
  return input + output;
}
