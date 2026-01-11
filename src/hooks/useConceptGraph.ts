// Hook for managing concept graph data and interactions

import { useState, useCallback, useMemo } from "react";
import {
  getAllConcepts,
  getConceptsByCategory,
  getCategoryInfo,
} from "@/lib/concept-graph";
import type {
  GraphNode,
  GraphLink,
  ClusterNode,
  SubClusterNode,
  ConceptNode,
  ConceptCategory,
  ArchetypeSubcategory,
  GraphConcept,
  RelationshipType,
} from "@/lib/graph/types";
import { CATEGORY_LABELS } from "@/lib/graph/layout";

// Labels for archetype subcategories (7 positions)
const SUBCATEGORY_LABELS: Record<ArchetypeSubcategory, string> = {
  matrix: "Matrix",
  potentiator: "Potentiator",
  catalyst: "Catalyst",
  experience: "Experience",
  significator: "Significator",
  transformation: "Transformation",
  "great-way": "Great Way",
};

// Order of archetype subcategories
const ARCHETYPE_SUBCATEGORIES: ArchetypeSubcategory[] = [
  "matrix",
  "potentiator",
  "catalyst",
  "experience",
  "significator",
  "transformation",
  "great-way",
];

// All categories in the graph
const ALL_CATEGORIES: ConceptCategory[] = [
  "cosmology",
  "polarity",
  "energy-work",
  "incarnation",
  "entities",
  "metaphysics",
  "practice",
  "archetypes",
];

// Create a cluster node for a category
function createClusterNode(category: ConceptCategory): ClusterNode {
  const info = getCategoryInfo(category);
  const concepts = getConceptsByCategory(category);

  return {
    id: `cluster-${category}`,
    type: "cluster",
    category,
    label: CATEGORY_LABELS[category],
    count: concepts.length,
    description: info?.description || "",
  };
}

// Create a sub-cluster node for an archetype position
function createSubClusterNode(
  subcategory: ArchetypeSubcategory,
  concepts: GraphConcept[]
): SubClusterNode {
  return {
    id: `subcluster-archetypes-${subcategory}`,
    type: "subcluster",
    category: "archetypes",
    subcategory,
    label: SUBCATEGORY_LABELS[subcategory],
    count: concepts.length,
  };
}

// Create a concept node from a GraphConcept
function createConceptNode(concept: GraphConcept): ConceptNode {
  return {
    id: concept.id,
    type: "concept",
    concept,
    category: concept.category,
    teachingLevel: concept.teachingLevel,
    label: concept.term,
  };
}

// Build links between visible concept nodes and sub-clusters
function buildLinks(
  visibleConcepts: GraphConcept[],
  visibleIds: Set<string>,
  collapsedSubclusters: Map<ArchetypeSubcategory, GraphConcept[]>
): GraphLink[] {
  const links: GraphLink[] = [];
  const linkSet = new Set<string>();

  const relationshipTypes: RelationshipType[] = [
    "prerequisite",
    "leads_to",
    "related",
    "contrasts",
    "part_of",
    "contains",
  ];

  // Links between visible concepts
  for (const concept of visibleConcepts) {
    for (const relType of relationshipTypes) {
      const targets = concept.relationships[relType];
      if (!targets) continue;

      for (const targetId of targets) {
        // Only create link if target is visible
        if (!visibleIds.has(targetId)) continue;

        // Create unique link ID (alphabetically sorted to avoid duplicates)
        const [id1, id2] = [concept.id, targetId].sort();
        const linkId = `${id1}-${id2}-${relType}`;

        // Skip if we already have this link
        if (linkSet.has(linkId)) continue;
        linkSet.add(linkId);

        links.push({
          id: linkId,
          source: concept.id,
          target: targetId,
          relationshipType: relType,
        });
      }
    }
  }

  // Links from collapsed sub-clusters to visible concepts
  for (const [subcategory, concepts] of collapsedSubclusters) {
    const subclusterId = `subcluster-archetypes-${subcategory}`;

    // Check all concepts in this sub-cluster for relationships with visible concepts
    for (const concept of concepts) {
      for (const relType of relationshipTypes) {
        const targets = concept.relationships[relType];
        if (!targets) continue;

        for (const targetId of targets) {
          // Only create link if target is visible (not inside a sub-cluster)
          if (!visibleIds.has(targetId)) continue;

          // Create unique link ID from sub-cluster to target
          const linkId = `${subclusterId}-${targetId}-${relType}`;

          // Skip if we already have this link
          if (linkSet.has(linkId)) continue;
          linkSet.add(linkId);

          links.push({
            id: linkId,
            source: subclusterId,
            target: targetId,
            relationshipType: relType,
          });
        }
      }
    }
  }

  return links;
}

export interface UseConceptGraphReturn {
  nodes: GraphNode[];
  links: GraphLink[];
  expandedCategories: Set<ConceptCategory>;
  expandedSubcategories: Set<ArchetypeSubcategory>;
  expandCluster: (category: ConceptCategory) => void;
  collapseCluster: (category: ConceptCategory) => void;
  toggleCluster: (category: ConceptCategory) => void;
  toggleSubcluster: (subcategory: ArchetypeSubcategory) => void;
  isExpanded: (category: ConceptCategory) => boolean;
  isSubcategoryExpanded: (subcategory: ArchetypeSubcategory) => boolean;
  stats: {
    totalConcepts: number;
    visibleConcepts: number;
    totalLinks: number;
  };
}

export function useConceptGraph(): UseConceptGraphReturn {
  const [expandedCategories, setExpandedCategories] = useState<
    Set<ConceptCategory>
  >(new Set());
  const [expandedSubcategories, setExpandedSubcategories] = useState<
    Set<ArchetypeSubcategory>
  >(new Set());

  // All concepts in the graph
  const allConcepts = useMemo(() => getAllConcepts(), []);

  // Compute visible nodes and links based on expanded categories and subcategories
  const { nodes, links, stats } = useMemo(() => {
    const nodeList: GraphNode[] = [];
    const visibleConcepts: GraphConcept[] = [];
    const visibleConceptIds = new Set<string>();
    const collapsedSubclusters = new Map<ArchetypeSubcategory, GraphConcept[]>();

    for (const category of ALL_CATEGORIES) {
      if (!expandedCategories.has(category)) {
        // Category is collapsed - show cluster node
        nodeList.push(createClusterNode(category));
        continue;
      }

      // Special handling for archetypes category - use sub-clusters
      if (category === "archetypes") {
        const allArchetypes = getConceptsByCategory("archetypes");

        // Group concepts by subcategory
        const conceptsBySubcategory = new Map<ArchetypeSubcategory, GraphConcept[]>();
        const conceptsWithoutSubcategory: GraphConcept[] = [];

        for (const concept of allArchetypes) {
          if (concept.subcategory) {
            const existing = conceptsBySubcategory.get(concept.subcategory) || [];
            existing.push(concept);
            conceptsBySubcategory.set(concept.subcategory, existing);
          } else {
            // Meta-concepts without subcategory (archetypical-mind, tarot, etc.)
            conceptsWithoutSubcategory.push(concept);
          }
        }

        // For each archetype position, either show sub-cluster or expanded concepts
        for (const subcategory of ARCHETYPE_SUBCATEGORIES) {
          const concepts = conceptsBySubcategory.get(subcategory) || [];

          if (expandedSubcategories.has(subcategory)) {
            // Sub-cluster is expanded - show individual concepts
            for (const concept of concepts) {
              nodeList.push(createConceptNode(concept));
              visibleConcepts.push(concept);
              visibleConceptIds.add(concept.id);
            }
          } else {
            // Sub-cluster is collapsed - show sub-cluster node and track for edge creation
            nodeList.push(createSubClusterNode(subcategory, concepts));
            collapsedSubclusters.set(subcategory, concepts);
          }
        }

        // Always show meta-concepts (archetypical-mind, tarot, etc.) when archetypes is expanded
        for (const concept of conceptsWithoutSubcategory) {
          nodeList.push(createConceptNode(concept));
          visibleConcepts.push(concept);
          visibleConceptIds.add(concept.id);
        }
      } else {
        // Non-archetype categories - show all concepts directly
        const concepts = getConceptsByCategory(category);
        for (const concept of concepts) {
          nodeList.push(createConceptNode(concept));
          visibleConcepts.push(concept);
          visibleConceptIds.add(concept.id);
        }
      }
    }

    // Build links between visible concepts and from sub-clusters to visible concepts
    const linkList = buildLinks(visibleConcepts, visibleConceptIds, collapsedSubclusters);

    return {
      nodes: nodeList,
      links: linkList,
      stats: {
        totalConcepts: allConcepts.length,
        visibleConcepts: visibleConcepts.length,
        totalLinks: linkList.length,
      },
    };
  }, [expandedCategories, expandedSubcategories, allConcepts]);

  const expandCluster = useCallback((category: ConceptCategory) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      next.add(category);
      return next;
    });
  }, []);

  const collapseCluster = useCallback((category: ConceptCategory) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      next.delete(category);
      return next;
    });
  }, []);

  const toggleCluster = useCallback((category: ConceptCategory) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }, []);

  const isExpanded = useCallback(
    (category: ConceptCategory) => expandedCategories.has(category),
    [expandedCategories]
  );

  const toggleSubcluster = useCallback((subcategory: ArchetypeSubcategory) => {
    setExpandedSubcategories((prev) => {
      const next = new Set(prev);
      if (next.has(subcategory)) {
        next.delete(subcategory);
      } else {
        next.add(subcategory);
      }
      return next;
    });
  }, []);

  const isSubcategoryExpanded = useCallback(
    (subcategory: ArchetypeSubcategory) => expandedSubcategories.has(subcategory),
    [expandedSubcategories]
  );

  return {
    nodes,
    links,
    expandedCategories,
    expandedSubcategories,
    expandCluster,
    collapseCluster,
    toggleCluster,
    toggleSubcluster,
    isExpanded,
    isSubcategoryExpanded,
    stats,
  };
}
