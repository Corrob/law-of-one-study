// Mock D3 modules before importing layout
jest.mock("d3-force", () => ({
  forceSimulation: jest.fn(() => ({
    force: jest.fn().mockReturnThis(),
    alphaDecay: jest.fn().mockReturnThis(),
    velocityDecay: jest.fn().mockReturnThis(),
    tick: jest.fn(),
    stop: jest.fn(),
    alpha: jest.fn().mockReturnThis(),
  })),
  forceLink: jest.fn(() => ({
    id: jest.fn().mockReturnThis(),
    distance: jest.fn().mockReturnThis(),
    strength: jest.fn().mockReturnThis(),
  })),
  forceManyBody: jest.fn(() => ({
    strength: jest.fn().mockReturnThis(),
    distanceMax: jest.fn().mockReturnThis(),
  })),
  forceCenter: jest.fn(() => ({
    strength: jest.fn().mockReturnThis(),
  })),
  forceCollide: jest.fn(() => ({
    radius: jest.fn().mockReturnThis(),
    iterations: jest.fn().mockReturnThis(),
    strength: jest.fn().mockReturnThis(),
  })),
}));

jest.mock("d3-dag", () => ({
  graphStratify: jest.fn(() => jest.fn(() => ({
    nodes: jest.fn(() => []),
  }))),
  sugiyama: jest.fn(() => ({
    nodeSize: jest.fn().mockReturnThis(),
    coord: jest.fn().mockReturnThis(),
  })),
  coordCenter: jest.fn(),
}));

import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  EDGE_STYLES,
  getNodeRadius,
  getNodeColor,
  computeSugiyamaLayout,
  createForceSimulation,
} from "../layout";
import type {
  ClusterNode,
  SubClusterNode,
  ConceptNode,
  GraphConcept,
  GraphLink,
} from "../types";

// Mock concept for testing
const mockConcept: GraphConcept = {
  id: "test-concept",
  term: "Test Concept",
  aliases: [],
  category: "cosmology",
  definition: "Test definition",
  extendedDefinition: "Extended definition",
  relationships: {},
  sessions: { primary: [], secondary: [] },
  keyPassages: [],
  searchTerms: [],
  teachingLevel: "intermediate",
};

// Helper to create mock nodes
function createClusterNode(
  category: GraphConcept["category"],
  count: number = 10
): ClusterNode {
  return {
    id: `cluster-${category}`,
    type: "cluster",
    category,
    label: category,
    count,
    description: `${category} concepts`,
  };
}

function createSubClusterNode(
  subcategory: "matrix" | "potentiator" | "catalyst" | "experience" | "significator" | "transformation" | "great-way",
  count: number = 4
): SubClusterNode {
  return {
    id: `subcluster-archetypes-${subcategory}`,
    type: "subcluster",
    category: "archetypes",
    subcategory,
    label: subcategory,
    count,
  };
}

function createConceptNode(
  id: string,
  category: GraphConcept["category"],
  teachingLevel: GraphConcept["teachingLevel"] = "intermediate"
): ConceptNode {
  return {
    id,
    type: "concept",
    category,
    teachingLevel,
    label: id,
    concept: { ...mockConcept, id, category, teachingLevel },
  };
}

describe("layout", () => {
  describe("CATEGORY_COLORS", () => {
    it("should have colors for all 8 categories", () => {
      const categories = [
        "cosmology",
        "polarity",
        "energy-work",
        "incarnation",
        "entities",
        "metaphysics",
        "practice",
        "archetypes",
      ] as const;

      categories.forEach((category) => {
        expect(CATEGORY_COLORS[category]).toBeDefined();
        expect(CATEGORY_COLORS[category]).toMatch(/^#[0-9a-f]{6}$/i);
      });
    });

    it("should have unique colors for each category", () => {
      const colors = Object.values(CATEGORY_COLORS);
      const uniqueColors = new Set(colors);
      expect(uniqueColors.size).toBe(colors.length);
    });
  });

  describe("CATEGORY_LABELS", () => {
    it("should have labels for all 8 categories", () => {
      const categories = [
        "cosmology",
        "polarity",
        "energy-work",
        "incarnation",
        "entities",
        "metaphysics",
        "practice",
        "archetypes",
      ] as const;

      categories.forEach((category) => {
        expect(CATEGORY_LABELS[category]).toBeDefined();
        expect(typeof CATEGORY_LABELS[category]).toBe("string");
        expect(CATEGORY_LABELS[category].length).toBeGreaterThan(0);
      });
    });
  });

  describe("EDGE_STYLES", () => {
    it("should have styles for all relationship types", () => {
      const relationshipTypes = [
        "prerequisite",
        "leads_to",
        "related",
        "contrasts",
        "part_of",
        "contains",
      ];

      relationshipTypes.forEach((type) => {
        expect(EDGE_STYLES[type]).toBeDefined();
        expect(EDGE_STYLES[type]).toHaveProperty("strokeDasharray");
        expect(EDGE_STYLES[type]).toHaveProperty("opacity");
        expect(typeof EDGE_STYLES[type].opacity).toBe("number");
      });
    });
  });

  describe("getNodeRadius", () => {
    it("should return larger radius for cluster nodes", () => {
      const clusterNode = createClusterNode("cosmology", 10);
      const conceptNode = createConceptNode("test", "cosmology");

      const clusterRadius = getNodeRadius(clusterNode, false);
      const conceptRadius = getNodeRadius(conceptNode, false);

      expect(clusterRadius).toBeGreaterThan(conceptRadius);
    });

    it("should scale cluster radius by count", () => {
      const smallCluster = createClusterNode("cosmology", 5);
      const largeCluster = createClusterNode("cosmology", 30);

      const smallRadius = getNodeRadius(smallCluster, false);
      const largeRadius = getNodeRadius(largeCluster, false);

      expect(largeRadius).toBeGreaterThan(smallRadius);
    });

    it("should return larger radius on mobile", () => {
      const node = createConceptNode("test", "cosmology");

      const desktopRadius = getNodeRadius(node, false);
      const mobileRadius = getNodeRadius(node, true);

      expect(mobileRadius).toBeGreaterThan(desktopRadius);
    });

    it("should return medium radius for sub-cluster nodes", () => {
      const clusterNode = createClusterNode("archetypes", 10);
      const subClusterNode = createSubClusterNode("matrix");
      const conceptNode = createConceptNode("test", "archetypes");

      const clusterRadius = getNodeRadius(clusterNode, false);
      const subClusterRadius = getNodeRadius(subClusterNode, false);
      const conceptRadius = getNodeRadius(conceptNode, false);

      expect(subClusterRadius).toBeLessThan(clusterRadius);
      expect(subClusterRadius).toBeGreaterThan(conceptRadius);
    });

    it("should vary concept radius by teaching level", () => {
      const foundational = createConceptNode("f", "cosmology", "foundational");
      const intermediate = createConceptNode("i", "cosmology", "intermediate");
      const advanced = createConceptNode("a", "cosmology", "advanced");

      const fRadius = getNodeRadius(foundational, false);
      const iRadius = getNodeRadius(intermediate, false);
      const aRadius = getNodeRadius(advanced, false);

      expect(fRadius).toBeGreaterThan(iRadius);
      expect(iRadius).toBeGreaterThan(aRadius);
    });
  });

  describe("getNodeColor", () => {
    it("should return category color for cluster nodes", () => {
      const node = createClusterNode("polarity");
      expect(getNodeColor(node)).toBe(CATEGORY_COLORS.polarity);
    });

    it("should return category color for sub-cluster nodes", () => {
      const node = createSubClusterNode("matrix");
      expect(getNodeColor(node)).toBe(CATEGORY_COLORS.archetypes);
    });

    it("should return category color for concept nodes", () => {
      const node = createConceptNode("test", "entities");
      expect(getNodeColor(node)).toBe(CATEGORY_COLORS.entities);
    });

    it("should return fallback color for unknown node types", () => {
      const unknownNode = { id: "unknown", type: "unknown" } as never;
      expect(getNodeColor(unknownNode)).toBe("#8a8899");
    });
  });

  describe("computeSugiyamaLayout", () => {
    it("should position clusters in 4-column grid on desktop", () => {
      const clusters = [
        createClusterNode("cosmology"),
        createClusterNode("polarity"),
        createClusterNode("energy-work"),
        createClusterNode("incarnation"),
        createClusterNode("entities"),
        createClusterNode("metaphysics"),
        createClusterNode("practice"),
        createClusterNode("archetypes"),
      ];

      const positions = computeSugiyamaLayout(clusters, [], 800, 600, false);

      expect(positions.size).toBe(8);

      // First row should have 4 clusters
      const firstRowY = positions.get("cluster-cosmology")!.y;
      const secondRowY = positions.get("cluster-entities")!.y;

      // Clusters 0-3 should be in first row, 4-7 in second
      expect(positions.get("cluster-polarity")!.y).toBe(firstRowY);
      expect(positions.get("cluster-energy-work")!.y).toBe(firstRowY);
      expect(positions.get("cluster-incarnation")!.y).toBe(firstRowY);

      expect(positions.get("cluster-metaphysics")!.y).toBe(secondRowY);
      expect(positions.get("cluster-practice")!.y).toBe(secondRowY);
      expect(positions.get("cluster-archetypes")!.y).toBe(secondRowY);

      // Second row should be below first row
      expect(secondRowY).toBeGreaterThan(firstRowY);
    });

    it("should position clusters in 2-column grid on mobile", () => {
      const clusters = [
        createClusterNode("cosmology"),
        createClusterNode("polarity"),
        createClusterNode("energy-work"),
        createClusterNode("incarnation"),
      ];

      const positions = computeSugiyamaLayout(clusters, [], 400, 800, true);

      expect(positions.size).toBe(4);

      // First row should have 2 clusters
      const row1Y = positions.get("cluster-cosmology")!.y;
      const row2Y = positions.get("cluster-energy-work")!.y;

      // Clusters 0-1 in first row, 2-3 in second
      expect(positions.get("cluster-polarity")!.y).toBe(row1Y);
      expect(positions.get("cluster-incarnation")!.y).toBe(row2Y);

      expect(row2Y).toBeGreaterThan(row1Y);
    });

    it("should return positions for all nodes", () => {
      const clusters = [
        createClusterNode("cosmology"),
        createClusterNode("polarity"),
      ];

      const positions = computeSugiyamaLayout(clusters, [], 800, 600, false);

      clusters.forEach((cluster) => {
        const pos = positions.get(cluster.id);
        expect(pos).toBeDefined();
        expect(typeof pos!.x).toBe("number");
        expect(typeof pos!.y).toBe("number");
        expect(pos!.x).toBeGreaterThan(0);
        expect(pos!.y).toBeGreaterThan(0);
      });
    });
  });

  describe("createForceSimulation", () => {
    it("should create a d3 force simulation", () => {
      const d3Force = require("d3-force");
      const nodes = [createClusterNode("cosmology")];
      const links: GraphLink[] = [];

      const simulation = createForceSimulation(nodes, links, 800, 600);

      expect(simulation).toBeDefined();
      expect(d3Force.forceSimulation).toHaveBeenCalledWith(nodes);
    });

    it("should configure all required forces", () => {
      const d3Force = require("d3-force");
      const nodes = [
        createClusterNode("cosmology"),
        createClusterNode("polarity"),
      ];
      const links: GraphLink[] = [];

      createForceSimulation(nodes, links, 800, 600);

      // Verify force functions were called
      expect(d3Force.forceLink).toHaveBeenCalled();
      expect(d3Force.forceManyBody).toHaveBeenCalled();
      expect(d3Force.forceCenter).toHaveBeenCalledWith(400, 300); // width/2, height/2
      expect(d3Force.forceCollide).toHaveBeenCalled();
    });
  });
});
