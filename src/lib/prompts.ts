// =============================================================================
// PROMPTS - Re-export from modular directory structure
// This file exists for backward compatibility with existing imports
// =============================================================================

export {
  // Constants
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
  // Main prompts
  QUERY_AUGMENTATION_PROMPT,
  UNIFIED_RESPONSE_PROMPT,
  SUGGESTION_GENERATION_PROMPT,
  // Utility functions
  buildContextFromQuotes,
} from "./prompts/index";
