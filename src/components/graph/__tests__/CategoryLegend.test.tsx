/**
 * Tests for CategoryLegend component
 */

import { render, screen } from "@testing-library/react";
import { CategoryLegend } from "../CategoryLegend";
import type { ConceptCategory } from "@/lib/graph/types";

// Mock layout module to avoid D3 ESM issues
jest.mock("@/lib/graph/layout", () => ({
  CATEGORY_COLORS: {
    densities: "#FF6B6B",
    archetypes: "#4ECDC4",
    "energy-centers": "#45B7D1",
    polarities: "#96CEB4",
    cosmology: "#FFEAA7",
    "spiritual-practices": "#DDA0DD",
    "social-structures": "#98D8C8",
    metaphysics: "#F7DC6F",
  },
  CATEGORY_LABELS: {
    densities: "Densities",
    archetypes: "Archetypes",
    "energy-centers": "Energy Centers",
    polarities: "Polarities",
    cosmology: "Cosmology",
    "spiritual-practices": "Spiritual Practices",
    "social-structures": "Social Structures",
    metaphysics: "Metaphysics",
  },
}));

describe("CategoryLegend", () => {
  it("returns null when no categories are expanded", () => {
    const { container } = render(
      <CategoryLegend expandedCategories={new Set<ConceptCategory>()} />
    );

    expect(container.firstChild).toBeNull();
  });

  it("renders when categories are expanded", () => {
    const expandedCategories = new Set<ConceptCategory>(["densities"]);
    render(<CategoryLegend expandedCategories={expandedCategories} />);

    expect(screen.getByText("Categories")).toBeInTheDocument();
  });

  it("displays category labels for expanded categories", () => {
    const expandedCategories = new Set<ConceptCategory>(["densities", "archetypes"]);
    render(<CategoryLegend expandedCategories={expandedCategories} />);

    expect(screen.getByText("Densities")).toBeInTheDocument();
    expect(screen.getByText("Archetypes")).toBeInTheDocument();
  });

  it("renders color indicators for each category", () => {
    const expandedCategories = new Set<ConceptCategory>(["densities"]);
    const { container } = render(<CategoryLegend expandedCategories={expandedCategories} />);

    const colorIndicator = container.querySelector(".rounded-full");
    expect(colorIndicator).toBeInTheDocument();
  });

  it("renders multiple categories", () => {
    const expandedCategories = new Set<ConceptCategory>([
      "densities",
      "archetypes",
      "energy-centers",
    ]);
    render(<CategoryLegend expandedCategories={expandedCategories} />);

    expect(screen.getByText("Densities")).toBeInTheDocument();
    expect(screen.getByText("Archetypes")).toBeInTheDocument();
    expect(screen.getByText("Energy Centers")).toBeInTheDocument();
  });

  it("has correct container styling", () => {
    const expandedCategories = new Set<ConceptCategory>(["densities"]);
    const { container } = render(<CategoryLegend expandedCategories={expandedCategories} />);

    const legendContainer = container.firstChild as HTMLElement;
    expect(legendContainer).toHaveClass("absolute", "bottom-4", "left-4");
  });
});
