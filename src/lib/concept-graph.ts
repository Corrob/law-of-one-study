// Law of One Concept Knowledge Graph Utilities

import type {
  ConceptGraph,
  GraphConcept,
  ConceptCategory,
} from "./types-graph";
import { getLocalizedText, getLocalizedAliases } from "./types-graph";
import { validateConceptGraph } from "./schemas/concept-graph";
import { type AvailableLanguage, DEFAULT_LOCALE } from "./language-config";

// Import the concept graph data
import conceptGraphData from "@/data/concept-graph.json";

// Validate and type the graph at module load time
const conceptGraph: ConceptGraph = validateConceptGraph(conceptGraphData);

// Cache for compiled regex patterns per locale
const _conceptRegexCache: Map<AvailableLanguage, RegExp> = new Map();

/**
 * Get the canonical term for a matched text (for use in search/display)
 * @param matchedText - The text that was matched in content
 * @param locale - Language to search in (defaults to 'en')
 * @returns The canonical term in the requested locale, or the matched text if not found
 */
export function getCanonicalTerm(
  matchedText: string,
  locale: AvailableLanguage = DEFAULT_LOCALE
): string {
  const concept = findConceptByTerm(matchedText, locale);
  if (concept) {
    return getLocalizedText(concept.term, locale);
  }
  return matchedText;
}

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
 * @param term - The term to search for
 * @param locale - Language to search in (defaults to 'en')
 */
export function findConceptByTerm(
  term: string,
  locale: AvailableLanguage = DEFAULT_LOCALE
): GraphConcept | undefined {
  const lower = term.toLowerCase();

  for (const concept of Object.values(conceptGraph.concepts)) {
    if (getLocalizedText(concept.term, locale).toLowerCase() === lower) {
      return concept;
    }
    for (const alias of getLocalizedAliases(concept.aliases, locale)) {
      if (alias.toLowerCase() === lower) {
        return concept;
      }
    }
  }

  return undefined;
}

/**
 * Build regex pattern for matching all concepts in a given locale
 * @param locale - Language to build the regex for
 */
export function buildConceptRegex(locale: AvailableLanguage = DEFAULT_LOCALE): RegExp {
  const cached = _conceptRegexCache.get(locale);
  if (cached) return cached;

  const allTerms: string[] = [];

  for (const concept of Object.values(conceptGraph.concepts)) {
    const term = getLocalizedText(concept.term, locale);
    if (term) allTerms.push(term);
    allTerms.push(...getLocalizedAliases(concept.aliases, locale));
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
  const regex = new RegExp(pattern, "gi");

  _conceptRegexCache.set(locale, regex);
  return regex;
}

/**
 * Identify concepts mentioned in text
 * Returns unique concepts found, in order of first appearance
 * @param text - The text to search for concepts
 * @param locale - Language to search in (defaults to 'en')
 */
export function identifyConcepts(
  text: string,
  locale: AvailableLanguage = DEFAULT_LOCALE
): GraphConcept[] {
  const regex = buildConceptRegex(locale);
  const matches = text.matchAll(regex);
  const foundIds = new Set<string>();
  const result: GraphConcept[] = [];

  for (const match of matches) {
    const concept = findConceptByTerm(match[1], locale);
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
 * Returns search terms to expand the query.
 * Always uses English terms since embeddings are in English.
 */
export function buildSearchExpansion(concepts: GraphConcept[]): string[] {
  const terms = new Set<string>();

  for (const concept of concepts) {
    // Add the concept's search terms (always English for embeddings)
    for (const term of concept.searchTerms) {
      terms.add(term);
    }

    // Add related concept terms (one level) - use English for search
    const related = getRelatedConcepts([concept.id], 1);
    for (const rel of related.slice(0, 3)) {
      // Limit to top 3 related
      terms.add(getLocalizedText(rel.term, "en"));
    }
  }

  return Array.from(terms);
}

/**
 * Build concept context for LLM prompt injection
 * Provides relationship awareness to the model
 * @param concepts - Concepts to include in context
 * @param locale - Language for localized content (defaults to 'en')
 */
export function buildConceptContextForPrompt(
  concepts: GraphConcept[],
  locale: AvailableLanguage = DEFAULT_LOCALE
): string {
  if (concepts.length === 0) return "";

  const lines: string[] = ["CONCEPT CONTEXT:"];

  for (const concept of concepts.slice(0, 5)) {
    // Limit to top 5 concepts
    const term = getLocalizedText(concept.term, locale);
    const definition = getLocalizedText(concept.definition, locale);
    const aliases = getLocalizedAliases(concept.aliases, locale);

    lines.push(`\n"${term}" (${concept.category}):`);
    lines.push(`  Definition: ${definition}`);

    // Show alternative names (especially important for archetypes with tarot names)
    if (aliases.length > 0) {
      // Filter to show meaningful aliases (skip lowercase duplicates of term)
      const meaningfulAliases = aliases.filter(
        (alias) =>
          alias.toLowerCase() !== term.toLowerCase() &&
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
