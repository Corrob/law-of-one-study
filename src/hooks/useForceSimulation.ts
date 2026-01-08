/**
 * Hook for managing D3 force simulation for the concept graph.
 * Handles node positioning, physics simulation, and position persistence.
 */

import { useRef, useEffect, useState } from "react";
import type { GraphNode, GraphLink } from "@/lib/graph/types";
import { isClusterNode, isSubClusterNode, isConceptNode } from "@/lib/graph/types";
import { createForceSimulation, computeSugiyamaLayout } from "@/lib/graph/layout";
import type { Simulation } from "d3";

interface UseForceSimulationOptions {
  nodes: GraphNode[];
  links: GraphLink[];
  width: number;
  height: number;
  isMobile: boolean;
}

interface UseForceSimulationReturn {
  nodePositions: Map<string, { x: number; y: number }>;
  positionsRef: React.MutableRefObject<Map<string, { x: number; y: number }>>;
}

export function useForceSimulation({
  nodes,
  links,
  width,
  height,
  isMobile,
}: UseForceSimulationOptions): UseForceSimulationReturn {
  const simulationRef = useRef<Simulation<GraphNode, GraphLink> | null>(null);
  const positionsRef = useRef<Map<string, { x: number; y: number }>>(new Map());
  const [nodePositions, setNodePositions] = useState<Map<string, { x: number; y: number }>>(
    new Map()
  );

  useEffect(() => {
    // Stop previous simulation
    if (simulationRef.current) {
      simulationRef.current.stop();
    }

    const centerX = width / 2;
    const centerY = height / 2;

    // Compute Sugiyama layout for hierarchical positioning
    const sugiyamaPositions = computeSugiyamaLayout(
      nodes,
      links,
      width,
      height,
      isMobile
    );

    // Check if we're in cluster-only mode (initial grid view)
    const clusterOnlyMode = nodes.every((n) => isClusterNode(n));

    // Create copies of nodes with preserved or Sugiyama-computed positions
    const simNodes = nodes.map((n) => {
      const copy = { ...n };

      // In cluster-only mode, always use fresh Sugiyama positions for clusters
      // This prevents stale cached positions from wrong isMobile state
      if (clusterOnlyMode && isClusterNode(n)) {
        const sugiyamaPos = sugiyamaPositions.get(n.id);
        if (sugiyamaPos) {
          copy.x = sugiyamaPos.x + (Math.random() - 0.5) * 10;
          copy.y = sugiyamaPos.y + (Math.random() - 0.5) * 10;
        }
        return copy;
      }

      // Check if we have a saved position for this node
      const savedPos = positionsRef.current.get(n.id);
      if (savedPos) {
        copy.x = savedPos.x;
        copy.y = savedPos.y;
      } else {
        // Check Sugiyama layout for computed position
        const sugiyamaPos = sugiyamaPositions.get(n.id);
        if (sugiyamaPos) {
          // Use Sugiyama-computed position with small random offset for organic feel
          copy.x = sugiyamaPos.x + (Math.random() - 0.5) * 10;
          copy.y = sugiyamaPos.y + (Math.random() - 0.5) * 10;
        } else if (isConceptNode(n)) {
          // For archetype concepts, check for sub-cluster position first
          let parentPos: { x: number; y: number } | undefined;

          if (n.concept.subcategory) {
            // Look for the sub-cluster's saved position
            parentPos = positionsRef.current.get(
              `subcluster-archetypes-${n.concept.subcategory}`
            );
          }

          // Fall back to category cluster position
          if (!parentPos) {
            parentPos = positionsRef.current.get(`cluster-${n.category}`);
          }

          if (parentPos) {
            // Position near parent with small offset to form a tight group
            const angle = Math.random() * Math.PI * 2;
            const distance = 30 + Math.random() * 20;
            copy.x = parentPos.x + Math.cos(angle) * distance;
            copy.y = parentPos.y + Math.sin(angle) * distance;
          } else {
            copy.x = centerX + (Math.random() - 0.5) * 50;
            copy.y = centerY + (Math.random() - 0.5) * 50;
          }
        } else if (isSubClusterNode(n)) {
          // Sub-cluster nodes: position near parent category cluster
          const clusterPos = positionsRef.current.get(`cluster-${n.category}`);
          if (clusterPos) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 40 + Math.random() * 30;
            copy.x = clusterPos.x + Math.cos(angle) * distance;
            copy.y = clusterPos.y + Math.sin(angle) * distance;
          } else {
            copy.x = centerX + (Math.random() - 0.5) * 100;
            copy.y = centerY + (Math.random() - 0.5) * 100;
          }
        } else {
          // Cluster node without saved position - start near center
          copy.x = centerX + (Math.random() - 0.5) * 100;
          copy.y = centerY + (Math.random() - 0.5) * 100;
        }
      }

      return copy;
    });

    const simLinks = links.map((l) => ({
      ...l,
      source: l.source,
      target: l.target,
    }));

    const simulation = createForceSimulation(simNodes, simLinks, width, height);

    simulationRef.current = simulation;

    // Update positions on each tick
    simulation.on("tick", () => {
      const positions = new Map<string, { x: number; y: number }>();
      for (const node of simNodes) {
        if (node.x !== undefined && node.y !== undefined) {
          positions.set(node.id, { x: node.x, y: node.y });
          // Also save to ref for persistence
          positionsRef.current.set(node.id, { x: node.x, y: node.y });
        }
      }
      setNodePositions(new Map(positions));
    });

    // Run simulation with lower alpha for smoother animation when expanding
    simulation.alpha(0.8).restart();

    return () => {
      simulation.stop();
    };
  }, [nodes, links, width, height, isMobile]);

  return { nodePositions, positionsRef };
}
