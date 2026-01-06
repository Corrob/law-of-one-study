/**
 * Chat API utilities
 *
 * Extracted modules for the chat route to improve maintainability and testability.
 */

// Error handling
export { createChatError, isChatError, toChatError } from "./errors";
export type { ChatError } from "./errors";

// Quote marker detection
export { couldBePartialMarker, QUOTE_MARKER_REGEX, MAX_PARTIAL_MARKER_LENGTH } from "./quote-markers";

// Conversation context
export { buildConversationContext } from "./context";
export type { ConversationMeta } from "./context";

// Query augmentation
export { augmentQuery, VALID_INTENTS, VALID_CONFIDENCES } from "./augmentation";
export type { AugmentationResult, AugmentationContext } from "./augmentation";

// Suggestion generation
export { generateSuggestions, getFallbackSuggestions, extractAIQuestions, detectSuggestionCategory } from "./suggestions";
export type { SuggestionContext } from "./suggestions";

// Stream processing
export { processStreamWithMarkers } from "./stream-processor";
export type { StreamProcessorResult, StreamChunk, TokenUsage, SSESender } from "./stream-processor";
