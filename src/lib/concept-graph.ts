// Law of One Concept Knowledge Graph Utilities

import type {
  ConceptGraph,
  GraphConcept,
  ConceptCategory,
} from "./types-graph";

// Import the concept graph data
import conceptGraphData from "@/data/concept-graph.json";

// Typed graph with proper casting
const conceptGraph = conceptGraphData as ConceptGraph;

// Cache for the compiled regex pattern
let _conceptRegex: RegExp | null = null;

/**
 * Get the full concept graph
 */
export function getConceptGraph(): ConceptGraph {
  return conceptGraph;
}

/**
 * Find a concept by its ID
 */
export function findConceptById(id: string): GraphConcept | undefined {
  return conceptGraph.concepts[id];
}

/**
 * Find a concept by term or alias (case-insensitive)
 */
export function findConceptByTerm(term: string): GraphConcept | undefined {
  const lower = term.toLowerCase();

  for (const concept of Object.values(conceptGraph.concepts)) {
    if (concept.term.toLowerCase() === lower) {
      return concept;
    }
    for (const alias of concept.aliases) {
      if (alias.toLowerCase() === lower) {
        return concept;
      }
    }
  }

  return undefined;
}

/**
 * Build regex pattern for matching all concepts
 */
function buildConceptRegex(): RegExp {
  if (_conceptRegex) return _conceptRegex;

  const allTerms: string[] = [];

  for (const concept of Object.values(conceptGraph.concepts)) {
    if (concept.term) allTerms.push(concept.term);
    allTerms.push(...concept.aliases);
  }

  // Remove duplicates and empty strings
  const uniqueTerms = [...new Set(allTerms)].filter((t) => t.length > 0);

  // Sort by length descending (match longer phrases first)
  uniqueTerms.sort((a, b) => b.length - a.length);

  // Escape special regex characters
  const escapedTerms = uniqueTerms.map((t) =>
    t.replace(/[.*+?^${}()|[\]\\\/]/g, "\\$&")
  );

  // Build pattern with word boundaries
  const pattern = `\\b(${escapedTerms.join("|")})\\b`;
  _conceptRegex = new RegExp(pattern, "gi");

  return _conceptRegex;
}

/**
 * Identify concepts mentioned in text
 * Returns unique concepts found, in order of first appearance
 */
export function identifyConcepts(text: string): GraphConcept[] {
  const regex = buildConceptRegex();
  const matches = text.matchAll(regex);
  const foundIds = new Set<string>();
  const result: GraphConcept[] = [];

  for (const match of matches) {
    const concept = findConceptByTerm(match[1]);
    if (concept && !foundIds.has(concept.id)) {
      foundIds.add(concept.id);
      result.push(concept);
    }
  }

  return result;
}

/**
 * Get related concepts by traversing relationships
 * @param conceptIds - Starting concept IDs
 * @param depth - How many levels of relationships to traverse (default 1)
 * @returns Related concepts (excluding the input concepts)
 */
export function getRelatedConcepts(
  conceptIds: string[],
  depth: number = 1
): GraphConcept[] {
  const visited = new Set<string>(conceptIds);
  const result: GraphConcept[] = [];
  let currentLevel = conceptIds;

  for (let d = 0; d < depth; d++) {
    const nextLevel: string[] = [];

    for (const id of currentLevel) {
      const concept = findConceptById(id);
      if (!concept) continue;

      // Gather all related concept IDs from relationships
      const relatedIds: string[] = [
        ...(concept.relationships.related || []),
        ...(concept.relationships.leads_to || []),
        ...(concept.relationships.prerequisite || []),
        ...(concept.relationships.contains || []),
        ...(concept.relationships.part_of || []),
      ];

      for (const relatedId of relatedIds) {
        if (!visited.has(relatedId)) {
          visited.add(relatedId);
          const relatedConcept = findConceptById(relatedId);
          if (relatedConcept) {
            result.push(relatedConcept);
            nextLevel.push(relatedId);
          }
        }
      }
    }

    currentLevel = nextLevel;
  }

  return result;
}

/**
 * Get concepts by category
 */
export function getConceptsByCategory(
  category: ConceptCategory
): GraphConcept[] {
  return Object.values(conceptGraph.concepts).filter(
    (c) => c.category === category
  );
}

/**
 * Get concepts discussed in a specific session
 */
export function getConceptsBySession(sessionNumber: number): GraphConcept[] {
  return Object.values(conceptGraph.concepts).filter(
    (c) =>
      c.sessions.primary.includes(sessionNumber) ||
      c.sessions.secondary.includes(sessionNumber)
  );
}

/**
 * Build augmentation context from identified concepts
 * Returns search terms to expand the query
 */
export function buildSearchExpansion(concepts: GraphConcept[]): string[] {
  const terms = new Set<string>();

  for (const concept of concepts) {
    // Add the concept's search terms
    for (const term of concept.searchTerms) {
      terms.add(term);
    }

    // Add related concept terms (one level)
    const related = getRelatedConcepts([concept.id], 1);
    for (const rel of related.slice(0, 3)) {
      // Limit to top 3 related
      terms.add(rel.term);
    }
  }

  return Array.from(terms);
}

/**
 * Build concept context for LLM prompt injection
 * Provides relationship awareness to the model
 */
export function buildConceptContextForPrompt(
  concepts: GraphConcept[]
): string {
  if (concepts.length === 0) return "";

  const lines: string[] = ["CONCEPT CONTEXT:"];

  for (const concept of concepts.slice(0, 5)) {
    // Limit to top 5 concepts
    lines.push(`\n"${concept.term}" (${concept.category}):`);
    lines.push(`  Definition: ${concept.definition}`);

    // Show alternative names (especially important for archetypes with tarot names)
    if (concept.aliases.length > 0) {
      // Filter to show meaningful aliases (skip lowercase duplicates of term)
      const meaningfulAliases = concept.aliases.filter(
        (alias) =>
          alias.toLowerCase() !== concept.term.toLowerCase() &&
          !alias.match(/^(card|arcanum|archetype) \d+$/i)
      );
      if (meaningfulAliases.length > 0) {
        lines.push(`  Also known as: ${meaningfulAliases.slice(0, 4).join(", ")}`);
      }
    }

    // Show relationships
    if (concept.relationships.related?.length) {
      lines.push(
        `  Related to: ${concept.relationships.related.slice(0, 4).join(", ")}`
      );
    }
    if (concept.relationships.prerequisite?.length) {
      lines.push(
        `  Requires understanding: ${concept.relationships.prerequisite.join(", ")}`
      );
    }
    if (concept.relationships.leads_to?.length) {
      lines.push(
        `  Opens understanding of: ${concept.relationships.leads_to.slice(0, 3).join(", ")}`
      );
    }

    // Show a key passage if available
    if (concept.keyPassages.length > 0) {
      const passage = concept.keyPassages[0];
      lines.push(`  Key reference: Ra ${passage.reference}`);
    }
  }

  return lines.join("\n");
}

/**
 * Get all concepts as a flat array
 */
export function getAllConcepts(): GraphConcept[] {
  return Object.values(conceptGraph.concepts);
}

/**
 * Get category info
 */
export function getCategoryInfo(category: ConceptCategory) {
  return conceptGraph.categories[category];
}
