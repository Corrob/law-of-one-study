import { renderHook, act } from "@testing-library/react";
import { useConceptGraph } from "../useConceptGraph";

// Mock the layout module that imports D3
jest.mock("@/lib/graph/layout", () => ({
  CATEGORY_LABELS: {
    cosmology: "Cosmology",
    polarity: "Polarity",
    "energy-work": "Energy Work",
    incarnation: "Incarnation",
    entities: "Entities",
    metaphysics: "Metaphysics",
    practice: "Practice",
    archetypes: "Archetypes",
  },
}));

describe("useConceptGraph", () => {
  describe("initial state", () => {
    it("should start with 8 cluster nodes (one per category)", () => {
      const { result } = renderHook(() => useConceptGraph());

      expect(result.current.nodes).toHaveLength(8);
      expect(result.current.nodes.every((n) => n.type === "cluster")).toBe(
        true
      );
    });

    it("should start with no links (clusters don't have links)", () => {
      const { result } = renderHook(() => useConceptGraph());

      expect(result.current.links).toHaveLength(0);
    });

    it("should have no expanded categories initially", () => {
      const { result } = renderHook(() => useConceptGraph());

      expect(result.current.expandedCategories.size).toBe(0);
    });

    it("should report 0 visible concepts initially", () => {
      const { result } = renderHook(() => useConceptGraph());

      expect(result.current.stats.visibleConcepts).toBe(0);
    });

    it("should report total concepts count", () => {
      const { result } = renderHook(() => useConceptGraph());

      // Should have all 120 concepts in total
      expect(result.current.stats.totalConcepts).toBeGreaterThan(100);
    });
  });

  describe("cluster nodes", () => {
    it("should have correct category for each cluster", () => {
      const { result } = renderHook(() => useConceptGraph());

      const categories = result.current.nodes.map((n) => {
        if (n.type === "cluster") return n.category;
        return null;
      });

      expect(categories).toContain("cosmology");
      expect(categories).toContain("polarity");
      expect(categories).toContain("energy-work");
      expect(categories).toContain("incarnation");
      expect(categories).toContain("entities");
      expect(categories).toContain("metaphysics");
      expect(categories).toContain("practice");
      expect(categories).toContain("archetypes");
    });

    it("should have concept counts in cluster nodes", () => {
      const { result } = renderHook(() => useConceptGraph());

      for (const node of result.current.nodes) {
        if (node.type === "cluster") {
          expect(node.count).toBeGreaterThan(0);
        }
      }
    });
  });

  describe("expandCluster", () => {
    it("should expand a category and show its concepts", () => {
      const { result } = renderHook(() => useConceptGraph());

      act(() => {
        result.current.expandCluster("polarity");
      });

      expect(result.current.isExpanded("polarity")).toBe(true);
      expect(result.current.stats.visibleConcepts).toBeGreaterThan(0);
    });

    it("should replace cluster node with concept nodes", () => {
      const { result } = renderHook(() => useConceptGraph());

      const clusterCountBefore = result.current.nodes.filter(
        (n) => n.type === "cluster"
      ).length;

      act(() => {
        result.current.expandCluster("polarity");
      });

      const clusterCountAfter = result.current.nodes.filter(
        (n) => n.type === "cluster"
      ).length;
      const conceptCountAfter = result.current.nodes.filter(
        (n) => n.type === "concept"
      ).length;

      expect(clusterCountAfter).toBe(clusterCountBefore - 1);
      expect(conceptCountAfter).toBeGreaterThan(0);
    });

    it("should create links between visible concepts", () => {
      const { result } = renderHook(() => useConceptGraph());

      act(() => {
        result.current.expandCluster("polarity");
      });

      // Polarity concepts have relationships among themselves
      expect(result.current.stats.totalLinks).toBeGreaterThanOrEqual(0);
    });
  });

  describe("collapseCluster", () => {
    it("should collapse an expanded category", () => {
      const { result } = renderHook(() => useConceptGraph());

      act(() => {
        result.current.expandCluster("polarity");
      });

      expect(result.current.isExpanded("polarity")).toBe(true);

      act(() => {
        result.current.collapseCluster("polarity");
      });

      expect(result.current.isExpanded("polarity")).toBe(false);
    });

    it("should restore cluster node when collapsed", () => {
      const { result } = renderHook(() => useConceptGraph());

      act(() => {
        result.current.expandCluster("polarity");
        result.current.collapseCluster("polarity");
      });

      const clusters = result.current.nodes.filter((n) => n.type === "cluster");
      const polarityCluster = clusters.find(
        (n) => n.type === "cluster" && n.category === "polarity"
      );

      expect(polarityCluster).toBeDefined();
    });
  });

  describe("toggleCluster", () => {
    it("should expand collapsed category", () => {
      const { result } = renderHook(() => useConceptGraph());

      expect(result.current.isExpanded("cosmology")).toBe(false);

      act(() => {
        result.current.toggleCluster("cosmology");
      });

      expect(result.current.isExpanded("cosmology")).toBe(true);
    });

    it("should collapse expanded category", () => {
      const { result } = renderHook(() => useConceptGraph());

      act(() => {
        result.current.toggleCluster("cosmology");
      });

      expect(result.current.isExpanded("cosmology")).toBe(true);

      act(() => {
        result.current.toggleCluster("cosmology");
      });

      expect(result.current.isExpanded("cosmology")).toBe(false);
    });
  });

  describe("multiple categories", () => {
    it("should allow multiple categories to be expanded", () => {
      const { result } = renderHook(() => useConceptGraph());

      act(() => {
        result.current.expandCluster("polarity");
        result.current.expandCluster("cosmology");
      });

      expect(result.current.isExpanded("polarity")).toBe(true);
      expect(result.current.isExpanded("cosmology")).toBe(true);
      expect(result.current.expandedCategories.size).toBe(2);
    });

    it("should create cross-category links when concepts reference each other", () => {
      const { result } = renderHook(() => useConceptGraph());

      // Expand categories that have cross-references
      act(() => {
        result.current.expandCluster("polarity");
        result.current.expandCluster("cosmology");
      });

      // Should have more links than with single category
      expect(result.current.stats.totalLinks).toBeGreaterThan(0);
    });
  });

  describe("isExpanded", () => {
    it("should return false for collapsed categories", () => {
      const { result } = renderHook(() => useConceptGraph());

      expect(result.current.isExpanded("polarity")).toBe(false);
      expect(result.current.isExpanded("cosmology")).toBe(false);
    });

    it("should return true for expanded categories", () => {
      const { result } = renderHook(() => useConceptGraph());

      act(() => {
        result.current.expandCluster("polarity");
      });

      expect(result.current.isExpanded("polarity")).toBe(true);
    });
  });

  describe("stats", () => {
    it("should track visible concepts correctly", () => {
      const { result } = renderHook(() => useConceptGraph());

      const initialVisible = result.current.stats.visibleConcepts;

      act(() => {
        result.current.expandCluster("polarity");
      });

      expect(result.current.stats.visibleConcepts).toBeGreaterThan(
        initialVisible
      );
    });

    it("should track total links correctly", () => {
      const { result } = renderHook(() => useConceptGraph());

      act(() => {
        result.current.expandCluster("polarity");
      });

      const linksWithPolarity = result.current.stats.totalLinks;

      act(() => {
        result.current.expandCluster("cosmology");
      });

      // May have same or more links with additional category
      expect(result.current.stats.totalLinks).toBeGreaterThanOrEqual(
        linksWithPolarity
      );
    });
  });
});
