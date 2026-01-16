// Law of One Concept Knowledge Graph Types

import { type AvailableLanguage } from "./language-config";

// Bilingual text field for internationalization
export interface BilingualText {
  en: string;
  es: string;
}

// Bilingual aliases for concept matching in different languages
export interface BilingualAliases {
  en: string[];
  es: string[];
}

/**
 * Get localized text from a BilingualText object.
 * Falls back to English if the requested locale is not available.
 */
export function getLocalizedText(
  text: BilingualText,
  locale: AvailableLanguage
): string {
  return text[locale] || text.en;
}

/**
 * Get localized aliases from a BilingualAliases object.
 * Falls back to English if the requested locale is not available.
 */
export function getLocalizedAliases(
  aliases: BilingualAliases,
  locale: AvailableLanguage
): string[] {
  return aliases[locale] || aliases.en;
}

// Relationship types between concepts
export type RelationshipType =
  | "prerequisite" // Must understand this concept first
  | "leads_to" // Understanding this opens understanding of
  | "related" // Commonly discussed together
  | "contrasts" // Often confused or compared with
  | "part_of" // Is a component of a larger concept
  | "contains"; // Contains these sub-concepts

// Teaching complexity level
export type TeachingLevel =
  | "foundational" // Core concepts for beginners
  | "intermediate" // Requires some background
  | "advanced"; // Deep study material

// Category of concept
export type ConceptCategory =
  | "cosmology" // Structure of creation
  | "polarity" // Service paths and choice
  | "energy-work" // Chakras and energy centers
  | "incarnation" // Physical experience and catalyst
  | "entities" // Beings and groups
  | "metaphysics" // Nature of reality
  | "practice" // Spiritual methods
  | "archetypes"; // Deep mind structure

// Subcategory for archetype groupings (7 positions in the archetypal mind)
export type ArchetypeSubcategory =
  | "matrix" // Position 1: Unrealized potential
  | "potentiator" // Position 2: Activation
  | "catalyst" // Position 3: Opportunity
  | "experience" // Position 4: Processing
  | "significator" // Position 5: The Actor (Self)
  | "transformation" // Position 6: Change through choice
  | "great-way"; // Position 7: Integration/Environment

// Key passage from the Ra Material
export interface KeyPassage {
  reference: string; // e.g., "16.51" - language-neutral identifier
  excerpt: BilingualText; // Short quote (1-3 sentences) in both languages
  context: BilingualText; // Why this passage is important, in both languages
}

// Session references for a concept
export interface SessionReferences {
  primary: number[]; // Sessions with major discussion
  secondary: number[]; // Sessions with mentions
}

// Relationships to other concepts
export interface ConceptRelationships {
  prerequisite?: string[]; // Concepts to understand first
  leads_to?: string[]; // Concepts this opens up
  related?: string[]; // Commonly paired concepts
  contrasts?: string[]; // Often confused with
  part_of?: string[]; // Parent concepts
  contains?: string[]; // Child concepts
}

// Full concept with graph data
export interface GraphConcept {
  id: string; // Unique identifier (kebab-case) - language-neutral
  term: BilingualText; // Canonical display name in both languages
  aliases: BilingualAliases; // Alternative names/forms for matching per language
  category: ConceptCategory; // Language-neutral category ID
  subcategory?: ArchetypeSubcategory; // For archetypes: position grouping
  definition: BilingualText; // Brief definition (for popover) in both languages
  extendedDefinition: BilingualText; // Longer explanation in both languages
  relationships: ConceptRelationships; // Uses concept IDs (language-neutral)
  sessions: SessionReferences; // Session numbers (language-neutral)
  keyPassages: KeyPassage[];
  searchTerms: string[]; // Terms for query augmentation (English for embedding)
  teachingLevel: TeachingLevel;
}

// Category metadata
export interface CategoryInfo {
  name: BilingualText; // Category display name in both languages
  description: BilingualText; // Category description in both languages
  concepts: string[]; // Concept IDs in this category (language-neutral)
}

// Full graph structure
export interface ConceptGraph {
  version: string;
  generated: string;
  concepts: Record<string, GraphConcept>;
  categories: Record<ConceptCategory, CategoryInfo>;
}
