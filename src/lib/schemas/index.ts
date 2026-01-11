/**
 * Centralized exports for all Zod validation schemas.
 */

export {
  PineconeMetadataSchema,
  ConceptMetadataSchema,
  parsePineconeMetadata,
  parseConceptMetadata,
  type ValidatedPineconeMetadata,
  type ValidatedConceptMetadata,
} from "./pinecone";

export {
  AugmentationResponseSchema,
  SuggestionResponseSchema,
  parseAugmentationResponse,
  parseSuggestionResponse,
  type ValidatedAugmentationResponse,
  type ValidatedSuggestionResponse,
} from "./openai";

export {
  SearchModeSchema,
  SearchRequestSchema,
  HybridSearchResultSchema,
  SearchResultSchema,
  SearchResponseSchema,
  parseSearchRequest,
  type SearchMode,
  type ValidatedSearchRequest,
  type HybridSearchResult,
  type SearchResult,
  type SearchResponse,
} from "./search";

export {
  SpeakerSchema,
  SentenceMetadataSchema,
  SentenceSearchResultSchema,
  parseSentenceMetadata,
  type Speaker,
  type ValidatedSentenceMetadata,
  type SentenceSearchResult,
} from "./sentence";

// Study path schemas are imported directly from "@/lib/schemas/study-paths"
// to avoid bloating this index with 40+ exports that aren't used via the barrel.
