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
  SearchRequestSchema,
  SearchResultSchema,
  SearchResponseSchema,
  parseSearchRequest,
  type ValidatedSearchRequest,
  type SearchResult,
  type SearchResponse,
} from "./search";

// Study path schemas are imported directly from "@/lib/schemas/study-paths"
// to avoid bloating this index with 40+ exports that aren't used via the barrel.
