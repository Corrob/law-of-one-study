/**
 * Zod schemas for concept graph validation.
 *
 * Validates the JSON structure of the concept graph data
 * to ensure type safety at the boundary of JSON imports.
 */

import { z } from "zod";

/**
 * Schema for relationship types between concepts.
 */
export const RelationshipTypeSchema = z.enum([
  "prerequisite",
  "leads_to",
  "related",
  "contrasts",
  "part_of",
  "contains",
]);

/**
 * Schema for teaching complexity level.
 */
export const TeachingLevelSchema = z.enum([
  "foundational",
  "intermediate",
  "advanced",
]);

/**
 * Schema for concept category.
 */
export const ConceptCategorySchema = z.enum([
  "cosmology",
  "polarity",
  "energy-work",
  "incarnation",
  "entities",
  "metaphysics",
  "practice",
  "archetypes",
]);

/**
 * Schema for archetype subcategory (7 positions in the archetypal mind).
 */
export const ArchetypeSubcategorySchema = z.enum([
  "matrix",
  "potentiator",
  "catalyst",
  "experience",
  "significator",
  "transformation",
  "great-way",
]);

/**
 * Schema for key passages from the Ra Material.
 */
export const KeyPassageSchema = z.object({
  reference: z.string(),
  excerpt: z.string(),
  context: z.string(),
});

/**
 * Schema for session references.
 */
export const SessionReferencesSchema = z.object({
  primary: z.array(z.number()),
  secondary: z.array(z.number()),
});

/**
 * Schema for concept relationships.
 */
export const ConceptRelationshipsSchema = z.object({
  prerequisite: z.array(z.string()).optional(),
  leads_to: z.array(z.string()).optional(),
  related: z.array(z.string()).optional(),
  contrasts: z.array(z.string()).optional(),
  part_of: z.array(z.string()).optional(),
  contains: z.array(z.string()).optional(),
});

/**
 * Schema for a full concept with graph data.
 */
export const GraphConceptSchema = z.object({
  id: z.string(),
  term: z.string(),
  aliases: z.array(z.string()),
  category: ConceptCategorySchema,
  subcategory: ArchetypeSubcategorySchema.optional(),
  definition: z.string(),
  extendedDefinition: z.string(),
  relationships: ConceptRelationshipsSchema,
  sessions: SessionReferencesSchema,
  keyPassages: z.array(KeyPassageSchema),
  searchTerms: z.array(z.string()),
  teachingLevel: TeachingLevelSchema,
});

/**
 * Schema for category metadata.
 */
export const CategoryInfoSchema = z.object({
  name: z.string(),
  description: z.string(),
  concepts: z.array(z.string()),
});

/**
 * Schema for the full concept graph structure.
 */
export const ConceptGraphSchema = z.object({
  version: z.string(),
  generated: z.string(),
  concepts: z.record(z.string(), GraphConceptSchema),
  categories: z.record(ConceptCategorySchema, CategoryInfoSchema),
});

export type ValidatedConceptGraph = z.infer<typeof ConceptGraphSchema>;
export type ValidatedGraphConcept = z.infer<typeof GraphConceptSchema>;

/**
 * Safely parse and validate concept graph data.
 *
 * @param data - Raw JSON data from concept graph file
 * @returns Validated concept graph or null if invalid
 */
export function parseConceptGraph(data: unknown): ValidatedConceptGraph | null {
  const result = ConceptGraphSchema.safeParse(data);
  if (!result.success) {
    console.error("Concept graph validation failed:", result.error.message);
    return null;
  }
  return result.data;
}

/**
 * Validate concept graph data, throwing on failure.
 * Use this at application startup to fail fast on invalid data.
 *
 * @param data - Raw JSON data from concept graph file
 * @returns Validated concept graph
 * @throws Error if validation fails
 */
export function validateConceptGraph(data: unknown): ValidatedConceptGraph {
  const result = ConceptGraphSchema.safeParse(data);
  if (!result.success) {
    throw new Error(`Invalid concept graph data: ${result.error.message}`);
  }
  return result.data;
}
