"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { select } from "d3-selection";
import { zoom, zoomIdentity, zoomTransform } from "d3-zoom";
import type { ZoomBehavior } from "d3-zoom";
import type {
  GraphNode,
  GraphLink,
  ConceptCategory,
  ConceptNode,
  ArchetypeSubcategory,
} from "@/lib/graph/types";
import { isClusterNode, isSubClusterNode, isConceptNode } from "@/lib/graph/types";
import {
  getNodeRadius,
  getNodeColor,
  EDGE_STYLES,
} from "@/lib/graph/layout";
import { useForceSimulation } from "@/hooks/useForceSimulation";
import { ZoomControls, CategoryLegend } from "@/components/graph";

interface ConceptGraphProps {
  nodes: GraphNode[];
  links: GraphLink[];
  onSelectConcept: (node: ConceptNode) => void;
  onExpandCluster: (category: ConceptCategory) => void;
  onExpandSubcluster: (subcategory: ArchetypeSubcategory) => void;
  selectedConceptId?: string;
  expandedCategories: Set<ConceptCategory>;
  /** Translated title for the category legend */
  categoriesTitle?: string;
  /** Function to get translated category label */
  getCategoryLabel?: (category: ConceptCategory) => string;
  /** Called once after the graph has mounted and measured its container */
  onReady?: () => void;
}

export default function ConceptGraph({
  nodes,
  links,
  onSelectConcept,
  onExpandCluster,
  onExpandSubcluster,
  onReady,
  selectedConceptId,
  expandedCategories,
  categoriesTitle = "Categories",
  getCategoryLabel,
}: ConceptGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [transform, setTransform] = useState(zoomIdentity);
  const [isMobile, setIsMobile] = useState(false);

  // Track previous mobile state to detect layout changes
  const prevIsMobileRef = useRef<boolean | null>(null);

  // Track previous node count to detect expansion
  const prevNodeCountRef = useRef(nodes.length);

  // Store zoom behavior for programmatic control
  const zoomRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  // Use force simulation hook
  const { nodePositions, positionsRef } = useForceSimulation({
    nodes,
    links,
    width: dimensions.width,
    height: dimensions.height,
    isMobile,
  });

  // Handle resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({ width, height });
        const mobile = window.innerWidth < 768;

        // Clear cluster positions when switching between mobile/desktop layouts
        // This forces the grid to be recalculated
        if (prevIsMobileRef.current !== null && prevIsMobileRef.current !== mobile) {
          positionsRef.current.clear();
        }
        prevIsMobileRef.current = mobile;
        setIsMobile(mobile);
      }
    };

    // Clear positions on initial mount to ensure fresh layout
    positionsRef.current.clear();

    updateDimensions();
    onReady?.();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, [positionsRef, onReady]);

  // Setup zoom behavior
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = select(svgRef.current);
    const zoomBehavior = zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 3])
      .on("zoom", (event) => {
        setTransform(event.transform);
      });

    svg.call(zoomBehavior);
    zoomRef.current = zoomBehavior;

    // Apply initial zoomed-out transform to show all categories
    if (dimensions.width > 0) {
      const scale = isMobile ? 0.55 : 0.75; // More zoomed out on mobile
      const offsetX = (dimensions.width * (1 - scale)) / 2;
      const offsetY = (dimensions.height * (1 - scale)) / 2;
      const initialTransform = zoomIdentity.translate(offsetX, offsetY).scale(scale);
      svg.call(zoomBehavior.transform, initialTransform);
    }

    // Double-click to reset zoom (to fit view showing all categories)
    svg.on("dblclick.zoom", () => {
      const scale = isMobile ? 0.55 : 0.75;
      const offsetX = (dimensions.width * (1 - scale)) / 2;
      const offsetY = (dimensions.height * (1 - scale)) / 2;
      svg.transition().duration(300).call(
        zoomBehavior.transform,
        zoomIdentity.translate(offsetX, offsetY).scale(scale)
      );
    });

    return () => {
      svg.on(".zoom", null);
    };
  }, [isMobile, dimensions.width, dimensions.height]);

  // Auto-pan to center on nodes after cluster expansion
  useEffect(() => {
    const wasExpanded = nodes.length > prevNodeCountRef.current;
    prevNodeCountRef.current = nodes.length;

    if (!wasExpanded || !svgRef.current || !zoomRef.current) return;

    // Wait for force simulation to settle before panning
    const timeoutId = setTimeout(() => {
      const positions = positionsRef.current;
      if (positions.size === 0) return;

      // Calculate centroid of all visible nodes
      let sumX = 0, sumY = 0, count = 0;
      positions.forEach(({ x, y }) => {
        sumX += x;
        sumY += y;
        count++;
      });

      if (count === 0) return;

      const centroidX = sumX / count;
      const centroidY = sumY / count;

      // Get current transform and calculate new pan position
      const svg = select(svgRef.current);
      const currentTransform = zoomTransform(svgRef.current!);
      const currentScale = currentTransform.k;

      const newX = dimensions.width / 2 - centroidX * currentScale;
      const newY = dimensions.height / 2 - centroidY * currentScale;

      const newTransform = zoomIdentity
        .translate(newX, newY)
        .scale(currentScale);

      // Animate to new transform
      if (svgRef.current && zoomRef.current) {
        svg.transition().duration(400).call(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          zoomRef.current.transform as any,
          newTransform
        );
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes.length]);

  // Handle node click
  const handleNodeClick = useCallback(
    (node: GraphNode) => {
      if (isClusterNode(node)) {
        onExpandCluster(node.category);
      } else if (isSubClusterNode(node)) {
        onExpandSubcluster(node.subcategory);
      } else if (isConceptNode(node)) {
        onSelectConcept(node);
      }
    },
    [onExpandCluster, onExpandSubcluster, onSelectConcept]
  );

  // Get link positions
  const getLinkPosition = useCallback(
    (link: GraphLink) => {
      const sourceId =
        typeof link.source === "string" ? link.source : link.source.id;
      const targetId =
        typeof link.target === "string" ? link.target : link.target.id;

      const sourcePos = nodePositions.get(sourceId);
      const targetPos = nodePositions.get(targetId);

      if (!sourcePos || !targetPos) return null;

      return {
        x1: sourcePos.x,
        y1: sourcePos.y,
        x2: targetPos.x,
        y2: targetPos.y,
      };
    },
    [nodePositions]
  );

  return (
    <div ref={containerRef} className="w-full h-full relative">
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className="cursor-grab active:cursor-grabbing"
      >
        <g transform={`translate(${transform.x},${transform.y}) scale(${transform.k})`}>
          {/* Links */}
          <g className="links">
            {links.map((link) => {
              const pos = getLinkPosition(link);
              if (!pos) return null;

              const style = EDGE_STYLES[link.relationshipType] || EDGE_STYLES.related;

              return (
                <line
                  key={link.id}
                  x1={pos.x1}
                  y1={pos.y1}
                  x2={pos.x2}
                  y2={pos.y2}
                  stroke="var(--lo1-stardust)"
                  strokeWidth={1}
                  strokeDasharray={style.strokeDasharray}
                  opacity={style.opacity}
                />
              );
            })}
          </g>

          {/* Nodes */}
          <g className="nodes">
            {nodes.map((node) => {
              const pos = nodePositions.get(node.id);
              if (!pos) return null;

              const radius = getNodeRadius(node, isMobile);
              const color = getNodeColor(node);
              const isSelected =
                isConceptNode(node) && node.id === selectedConceptId;

              return (
                <g
                  key={node.id}
                  transform={`translate(${pos.x},${pos.y})`}
                  onClick={() => handleNodeClick(node)}
                  className="cursor-pointer"
                  data-testid={`node-${node.id}`}
                >
                  {/* Glow effect for selected node */}
                  {isSelected && (
                    <circle
                      r={radius + 8}
                      fill="none"
                      stroke={color}
                      strokeWidth={2}
                      opacity={0.5}
                      className="animate-pulse"
                    />
                  )}

                  {/* Main circle */}
                  <circle
                    r={radius}
                    fill={color}
                    opacity={isClusterNode(node) || isSubClusterNode(node) ? 0.9 : 0.8}
                    stroke={isSelected ? "white" : "transparent"}
                    strokeWidth={isSelected ? 2 : 0}
                    className="transition-all duration-200 hover:opacity-100"
                  />

                  {/* Label */}
                  <text
                    y={radius + 14}
                    textAnchor="middle"
                    fill="var(--lo1-starlight)"
                    fontSize={isClusterNode(node) ? 12 : isSubClusterNode(node) ? 11 : 10}
                    fontWeight={isClusterNode(node) || isSubClusterNode(node) ? 600 : 400}
                    className="pointer-events-none select-none"
                  >
                    {node.label}
                  </text>

                  {/* Count badge for clusters and sub-clusters */}
                  {(isClusterNode(node) || isSubClusterNode(node)) && (
                    <text
                      y={4}
                      textAnchor="middle"
                      fill="white"
                      fontSize={isSubClusterNode(node) ? 10 : 11}
                      fontWeight={600}
                      className="pointer-events-none select-none"
                    >
                      {node.count}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </g>
      </svg>

      <ZoomControls svgRef={svgRef} zoomRef={zoomRef} />
      {getCategoryLabel && (
        <CategoryLegend
          expandedCategories={expandedCategories}
          title={categoriesTitle}
          getCategoryLabel={getCategoryLabel}
        />
      )}
    </div>
  );
}
