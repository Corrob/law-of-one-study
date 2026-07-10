/**
 * Configuration for the "Ask" feature — an LLM guide to the Ra Material,
 * grounded entirely in our own concept graph (no RAG, no stored source text).
 *
 * The model paraphrases Ra's teachings in its own words and cites sources as
 * links to L/L Research (llresearch.org); it never reproduces the Ra Material
 * verbatim.
 */

/**
 * OpenAI model powering Ask responses.
 *
 * `gpt-5-mini` is the quality/cost pick for tightly-grounded, no-reproduction
 * answers on a free, community-funded site. Bump to `gpt-5` here if answer
 * quality needs it — the call site is provider-agnostic beyond this constant.
 */
export const ASK_MODEL = "gpt-5-mini";

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
 * gpt-5-mini pricing (USD per 1M tokens) for approximate cost tracking in
 * analytics. Update if OpenAI changes pricing — used only for observability,
 * never for billing.
 */
export const ASK_MODEL_PRICING = {
  inputPer1M: 0.25,
  outputPer1M: 2.0,
} as const;

/** Approximate USD cost of a generation, for PostHog LLM analytics. */
export function calculateCost(promptTokens: number, completionTokens: number): number {
  const input = (promptTokens / 1_000_000) * ASK_MODEL_PRICING.inputPer1M;
  const output = (completionTokens / 1_000_000) * ASK_MODEL_PRICING.outputPer1M;
  return input + output;
}
