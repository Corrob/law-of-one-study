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

// Input validation
export { validateMessage, validateHistory, validateChatRequest, validationErrorResponse } from "./validation";
export type { ValidationResult } from "./validation";

// Concept detection
export { detectConcepts, formatConceptsForMeta, buildQueryWithConcepts } from "./concept-processing";
export type { ConceptDetectionResult } from "./concept-processing";

// Off-topic handling
export { getOffTopicResponse, streamOffTopicResponse, OFF_TOPIC_MESSAGE, OFF_TOPIC_SUGGESTIONS } from "./off-topic";
export type { OffTopicHandlerResult } from "./off-topic";

// Search orchestration
export { createSearchEmbedding, searchPassages, performSearch } from "./search";
export type { SessionReference, SearchResult } from "./search";
