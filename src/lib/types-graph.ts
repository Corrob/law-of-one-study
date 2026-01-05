// Law of One Concept Knowledge Graph Types

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

// Key passage from the Ra Material
export interface KeyPassage {
  reference: string; // e.g., "16.51"
  excerpt: string; // Short quote (1-3 sentences)
  context: string; // Why this passage is important
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
  id: string; // Unique identifier (kebab-case)
  term: string; // Canonical display name
  aliases: string[]; // Alternative names/forms for matching
  category: ConceptCategory;
  definition: string; // Brief definition (for popover)
  extendedDefinition: string; // Longer explanation
  relationships: ConceptRelationships;
  sessions: SessionReferences;
  keyPassages: KeyPassage[];
  searchTerms: string[]; // Terms for query augmentation
  teachingLevel: TeachingLevel;
}

// Category metadata
export interface CategoryInfo {
  name: string;
  description: string;
  concepts: string[]; // Concept IDs in this category
}

// Full graph structure
export interface ConceptGraph {
  version: string;
  generated: string;
  concepts: Record<string, GraphConcept>;
  categories: Record<ConceptCategory, CategoryInfo>;
}
