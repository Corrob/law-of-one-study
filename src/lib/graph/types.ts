// D3 Graph Types for Concept Explorer

import type { SimulationNodeDatum, SimulationLinkDatum } from "d3";
import type {
  ConceptCategory,
  TeachingLevel,
  RelationshipType,
  GraphConcept,
  ArchetypeSubcategory,
} from "../types-graph";

// Node types for the graph
export type GraphNodeType = "cluster" | "subcluster" | "concept";

// Base interface for all graph nodes
interface BaseGraphNode extends SimulationNodeDatum {
  id: string;
  type: GraphNodeType;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

// Cluster node representing a category
export interface ClusterNode extends BaseGraphNode {
  type: "cluster";
  category: ConceptCategory;
  label: string;
  count: number;
  description: string;
}

// Sub-cluster node representing a grouping within a category (e.g., archetype positions)
export interface SubClusterNode extends BaseGraphNode {
  type: "subcluster";
  category: ConceptCategory;
  subcategory: ArchetypeSubcategory;
  label: string;
  count: number;
}

// Individual concept node
export interface ConceptNode extends BaseGraphNode {
  type: "concept";
  concept: GraphConcept;
  category: ConceptCategory;
  teachingLevel: TeachingLevel;
  label: string;
}

// Union type for all node types
export type GraphNode = ClusterNode | SubClusterNode | ConceptNode;

// Link between nodes
export interface GraphLink extends SimulationLinkDatum<GraphNode> {
  id: string;
  source: string | GraphNode;
  target: string | GraphNode;
  relationshipType: RelationshipType;
}

// Type guards
export function isClusterNode(node: GraphNode): node is ClusterNode {
  return node.type === "cluster";
}

export function isSubClusterNode(node: GraphNode): node is SubClusterNode {
  return node.type === "subcluster";
}

export function isConceptNode(node: GraphNode): node is ConceptNode {
  return node.type === "concept";
}

// Graph state
export interface GraphState {
  nodes: GraphNode[];
  links: GraphLink[];
  expandedCategories: Set<ConceptCategory>;
  expandedSubcategories: Map<ConceptCategory, Set<ArchetypeSubcategory>>;
}

// Zoom transform state
export interface ZoomTransform {
  x: number;
  y: number;
  k: number;
}

// Re-export types from types-graph for convenience
export type { ConceptCategory, TeachingLevel, RelationshipType, GraphConcept, ArchetypeSubcategory };
