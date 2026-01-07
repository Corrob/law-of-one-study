// =============================================================================
// PROMPTS - Main entry point
// Re-exports all prompts and utilities for backward compatibility
// =============================================================================

// Constants (for advanced usage - composing custom prompts)
export {
  ROLE_PREAMBLE,
  STYLE_RULES,
  QUOTE_FORMAT_RULES,
  QUOTE_SELECTION_RULES,
  OFF_TOPIC_HANDLING,
  FALLBACK_HANDLING,
  CONVERSATION_CONTEXT,
  EMOTIONAL_AWARENESS,
  ARCHETYPE_GUIDANCE,
  COMPARATIVE_QUESTIONS,
} from "./constants";

// Main prompts
export { QUERY_AUGMENTATION_PROMPT } from "./query-augmentation";
export { UNIFIED_RESPONSE_PROMPT } from "./response";
export { SUGGESTION_GENERATION_PROMPT } from "./suggestions";

// Utility functions
export { buildContextFromQuotes } from "./utils";
