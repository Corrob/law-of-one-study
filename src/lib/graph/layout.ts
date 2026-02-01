// D3 Force Layout Configuration for Concept Explorer

import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
} from "d3-force";
import type { Force, Simulation } from "d3-force";
import { graphStratify, sugiyama, coordCenter } from "d3-dag";
import type {
  GraphNode,
  GraphLink,
  ConceptCategory,
  TeachingLevel,
} from "./types";
import { isClusterNode, isSubClusterNode, isConceptNode } from "./types";

// Category colors mapped to energy center rainbow spectrum
// Ordered by teaching progression: foundational → advanced concepts
export const CATEGORY_COLORS: Record<ConceptCategory, string> = {
  incarnation: "#f87171",   // Red ray - physical incarnation, root
  practice: "#fb923c",      // Orange ray - personal practice, identity
  polarity: "#fbbf24",      // Yellow ray - will, choice, polarity
  "energy-work": "#4ade80", // Green ray - heart, energy, healing
  entities: "#38bdf8",      // Blue ray - communication, other beings
  metaphysics: "#818cf8",   // Indigo ray - wisdom, understanding
  cosmology: "#a78bfa",     // Violet ray - cosmic unity, creation
  archetypes: "#e879f9",    // Magenta - archetypal mind, beyond violet
};

// Node radius based on type and teaching level
export function getNodeRadius(node: GraphNode, isMobile: boolean): number {
  const baseSize = isMobile ? 20 : 16;

  if (isClusterNode(node)) {
    // Cluster nodes are larger, scaled by concept count
    const countScale = Math.min(1 + node.count / 30, 2);
    return baseSize * 1.5 * countScale;
  }

  if (isSubClusterNode(node)) {
    // Sub-cluster nodes are medium-sized (between cluster and concept)
    return baseSize * 1.2;
  }

  if (isConceptNode(node)) {
    // Concept nodes sized by teaching level
    const levelMultiplier: Record<TeachingLevel, number> = {
      foundational: 1.2,
      intermediate: 1.0,
      advanced: 0.85,
    };
    return baseSize * levelMultiplier[node.teachingLevel];
  }

  return baseSize;
}

// Get color for a node
export function getNodeColor(node: GraphNode): string {
  if (isClusterNode(node)) {
    return CATEGORY_COLORS[node.category];
  }
  if (isSubClusterNode(node)) {
    return CATEGORY_COLORS[node.category];
  }
  if (isConceptNode(node)) {
    return CATEGORY_COLORS[node.category];
  }
  return "#8a8899"; // fallback: --lo1-stardust
}

// Edge styling based on relationship type
export const EDGE_STYLES: Record<
  string,
  { strokeDasharray: string; opacity: number }
> = {
  prerequisite: { strokeDasharray: "none", opacity: 0.7 },
  leads_to: { strokeDasharray: "none", opacity: 0.5 },
  related: { strokeDasharray: "4,4", opacity: 0.3 },
  contrasts: { strokeDasharray: "2,2", opacity: 0.4 },
  part_of: { strokeDasharray: "none", opacity: 0.5 },
  contains: { strokeDasharray: "6,3", opacity: 0.5 },
};

// Custom force to group nodes by subcategory
function forceSubcategoryCluster(
  nodes: GraphNode[],
  strength: number = 0.1
): Force<GraphNode, GraphLink> {
  let cachedNodes: GraphNode[] = nodes;

  const force: Force<GraphNode, GraphLink> = (alpha: number) => {
    // Group concept nodes by subcategory
    const subcategoryGroups = new Map<string, GraphNode[]>();

    for (const node of cachedNodes) {
      if (isConceptNode(node) && node.concept.subcategory) {
        const key = node.concept.subcategory;
        const group = subcategoryGroups.get(key) || [];
        group.push(node);
        subcategoryGroups.set(key, group);
      }
    }

    // For each group, pull nodes toward their centroid
    for (const group of subcategoryGroups.values()) {
      if (group.length < 2) continue;

      // Calculate centroid
      let cx = 0, cy = 0;
      for (const node of group) {
        cx += node.x || 0;
        cy += node.y || 0;
      }
      cx /= group.length;
      cy /= group.length;

      // Pull each node toward centroid
      for (const node of group) {
        const dx = cx - (node.x || 0);
        const dy = cy - (node.y || 0);
        node.vx = (node.vx || 0) + dx * strength * alpha;
        node.vy = (node.vy || 0) + dy * strength * alpha;
      }
    }
  };

  force.initialize = (newNodes: GraphNode[]) => {
    cachedNodes = newNodes;
  };

  return force;
}

// Create and configure the force simulation
export function createForceSimulation(
  nodes: GraphNode[],
  links: GraphLink[],
  width: number,
  height: number
): Simulation<GraphNode, GraphLink> {
  return forceSimulation<GraphNode>(nodes)
    .force(
      "link",
      forceLink<GraphNode, GraphLink>(links)
        .id((d) => d.id)
        .distance((link) => {
          // Longer distances to spread nodes out more
          const type =
            typeof link.relationshipType === "string"
              ? link.relationshipType
              : "related";
          return type === "prerequisite" || type === "contains" ? 100 : 150;
        })
        .strength(0.2) // Weaker link force allows more spreading
    )
    .force(
      "charge",
      forceManyBody<GraphNode>()
        .strength((d) => {
          // Much stronger repulsion to prevent overlap
          return isClusterNode(d) ? -600 : -300;
        })
        .distanceMax(500)
    )
    .force("center", forceCenter(width / 2, height / 2).strength(0.05))
    .force(
      "collide",
      forceCollide<GraphNode>()
        .radius((d) => getNodeRadius(d, false) + 25) // Much larger collision radius
        .iterations(3) // More iterations for better collision resolution
        .strength(1) // Full collision strength
    )
    .force("subcategoryCluster", forceSubcategoryCluster(nodes, 0.15)) // Keep subcategory concepts together
    .alphaDecay(0.008) // Even slower decay for smoother, longer animations
    .velocityDecay(0.5); // Higher friction for more controlled movement
}

// Category display labels - match names from concept-graph.json
export const CATEGORY_LABELS: Record<ConceptCategory, string> = {
  cosmology: "Cosmology & Structure",
  polarity: "Polarity & Service",
  "energy-work": "Energy Centers",
  incarnation: "Incarnation & Catalyst",
  entities: "Beings & Contacts",
  metaphysics: "Metaphysics",
  practice: "Spiritual Practice",
  archetypes: "Archetypical Mind",
};

// Sugiyama layout for hierarchical DAG visualization
// Returns positions for nodes based on their relationships
export function computeSugiyamaLayout(
  nodes: GraphNode[],
  links: GraphLink[],
  width: number,
  height: number,
  isMobile: boolean = false
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();

  // Separate clusters and concepts
  const clusters = nodes.filter(isClusterNode);
  const concepts = nodes.filter(isConceptNode);

  // Position clusters in a responsive grid if no concepts expanded
  if (concepts.length === 0) {
    // Use 2 columns on mobile, 4 on desktop
    const cols = isMobile ? 2 : 4;
    const rows = Math.ceil(clusters.length / cols);
    const padding = isMobile ? 20 : 40;
    const cellWidth = (width - padding * 2) / cols;
    const cellHeight = (height - padding * 2) / rows;

    clusters.forEach((cluster, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      positions.set(cluster.id, {
        x: padding + cellWidth * (col + 0.5),
        y: padding + cellHeight * (row + 0.5),
      });
    });
    return positions;
  }

  // Build parent-child relationships from links
  // prerequisite: if A is prerequisite of B, A should be above B (A is parent)
  // leads_to: if A leads_to B, A should be above B (A is parent)
  // part_of: if A is part_of B, B should be above A (B is parent)
  const parentMap = new Map<string, string[]>();

  // Initialize all concepts with empty parent arrays
  concepts.forEach((c) => parentMap.set(c.id, []));

  // Build relationships from links
  for (const link of links) {
    const sourceId = typeof link.source === "string" ? link.source : link.source.id;
    const targetId = typeof link.target === "string" ? link.target : link.target.id;

    // Only process if both nodes are in our concept list
    if (!parentMap.has(sourceId) || !parentMap.has(targetId)) continue;

    if (link.relationshipType === "prerequisite") {
      // source is prerequisite of target, so source is parent of target
      parentMap.get(targetId)!.push(sourceId);
    } else if (link.relationshipType === "leads_to") {
      // source leads_to target, so source is parent
      parentMap.get(targetId)!.push(sourceId);
    } else if (link.relationshipType === "part_of") {
      // source is part_of target, so target is parent
      parentMap.get(sourceId)!.push(targetId);
    } else if (link.relationshipType === "contains") {
      // source contains target, so source is parent
      parentMap.get(targetId)!.push(sourceId);
    }
  }

  // Create data for d3-dag stratify
  const dagData = concepts.map((c) => ({
    id: c.id,
    parentIds: parentMap.get(c.id) || [],
  }));

  try {
    // Create DAG using stratify
    const stratify = graphStratify();
    const dag = stratify(dagData);

    // Create Sugiyama layout with pyramid-style hierarchy
    // - coordCenter: centers children under parents for pyramid look
    // - Larger vertical spacing (120) for clear layer separation
    // - Horizontal spacing (100) for readability
    const layout = sugiyama()
      .nodeSize(() => [100, 120] as const) // [horizontal, vertical] spacing
      .coord(coordCenter()); // Center nodes for pyramid hierarchy

    // Run layout
    const { width: dagWidth, height: dagHeight } = layout(dag);

    // Scale and center the layout
    const padding = 80;
    const scaleX = (width - padding * 2) / Math.max(dagWidth, 1);
    const scaleY = (height - padding * 2) / Math.max(dagHeight, 1);
    const scale = Math.min(scaleX, scaleY, 1.2); // Slightly smaller cap for better fit

    const offsetX = (width - dagWidth * scale) / 2;
    const offsetY = padding; // Start from top with padding

    // Extract positions from DAG nodes
    for (const node of dag.nodes()) {
      positions.set(node.data.id, {
        x: node.x * scale + offsetX,
        y: node.y * scale + offsetY,
      });
    }
  } catch {
    // Fallback: if DAG creation fails (cycles, disconnected), use grid layout
    const cols = Math.ceil(Math.sqrt(concepts.length));
    const cellWidth = (width - 100) / cols;
    const cellHeight = (height - 100) / Math.ceil(concepts.length / cols);

    concepts.forEach((concept, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      positions.set(concept.id, {
        x: cellWidth * (col + 0.5) + 50,
        y: cellHeight * (row + 0.5) + 50,
      });
    });
  }

  // Position remaining clusters around the edges
  const clusterY = 50;
  const clusterSpacing = width / (clusters.length + 1);
  clusters.forEach((cluster, i) => {
    positions.set(cluster.id, {
      x: clusterSpacing * (i + 1),
      y: clusterY,
    });
  });

  return positions;
}
