/**
 * Configuration for the "Ask" feature — an LLM guide to the Ra Material,
 * grounded entirely in our own concept graph (no RAG, no stored source text).
 *
 * The model paraphrases Ra's teachings in its own words and cites sources as
 * links to lawofone.info; it never reproduces the Ra Material verbatim.
 */

/**
 * Claude model powering Ask responses.
 *
 * `claude-opus-4-8` is the quality pick for tightly-grounded, no-reproduction
 * answers. This site is free and community-funded — if traffic/cost grows,
 * `claude-sonnet-5` or `claude-haiku-4-5` are drop-in swaps here (near-Opus
 * quality at lower cost).
 */
export const ASK_MODEL = "claude-opus-4-8";

/**
 * Max output tokens per answer. Answers are intentionally concise (a few short
 * paragraphs), so this is generous headroom rather than a target.
 */
export const ASK_MAX_TOKENS = 2048;

/**
 * Thinking is disabled for chat latency — grounded paraphrase does not need
 * extended reasoning. The system prompt instructs the model to reply with the
 * final answer only (Opus 4.8 can otherwise narrate reasoning when thinking is
 * off). Flip to `{ type: "adaptive" }` if answer quality needs it.
 */
export const ASK_THINKING = { type: "disabled" } as const;

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
