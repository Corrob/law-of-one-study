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
}));

// Mock category labels for testing
const CATEGORY_LABELS: Record<string, string> = {
  densities: "Densities",
  archetypes: "Archetypes",
  "energy-centers": "Energy Centers",
  polarities: "Polarities",
  cosmology: "Cosmology",
  "spiritual-practices": "Spiritual Practices",
  "social-structures": "Social Structures",
  metaphysics: "Metaphysics",
};

const mockGetCategoryLabel = (category: ConceptCategory) => CATEGORY_LABELS[category] || category;
const defaultTitle = "Categories";

describe("CategoryLegend", () => {
  it("returns null when no categories are expanded", () => {
    const { container } = render(
      <CategoryLegend
        expandedCategories={new Set<ConceptCategory>()}
        title={defaultTitle}
        getCategoryLabel={mockGetCategoryLabel}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it("renders when categories are expanded", () => {
    const expandedCategories = new Set<ConceptCategory>(["densities"]);
    render(
      <CategoryLegend
        expandedCategories={expandedCategories}
        title={defaultTitle}
        getCategoryLabel={mockGetCategoryLabel}
      />
    );

    expect(screen.getByText("Categories")).toBeInTheDocument();
  });

  it("displays category labels for expanded categories", () => {
    const expandedCategories = new Set<ConceptCategory>(["densities", "archetypes"]);
    render(
      <CategoryLegend
        expandedCategories={expandedCategories}
        title={defaultTitle}
        getCategoryLabel={mockGetCategoryLabel}
      />
    );

    expect(screen.getByText("Densities")).toBeInTheDocument();
    expect(screen.getByText("Archetypes")).toBeInTheDocument();
  });

  it("renders color indicators for each category", () => {
    const expandedCategories = new Set<ConceptCategory>(["densities"]);
    const { container } = render(
      <CategoryLegend
        expandedCategories={expandedCategories}
        title={defaultTitle}
        getCategoryLabel={mockGetCategoryLabel}
      />
    );

    const colorIndicator = container.querySelector(".rounded-full");
    expect(colorIndicator).toBeInTheDocument();
  });

  it("renders multiple categories", () => {
    const expandedCategories = new Set<ConceptCategory>([
      "densities",
      "archetypes",
      "energy-centers",
    ]);
    render(
      <CategoryLegend
        expandedCategories={expandedCategories}
        title={defaultTitle}
        getCategoryLabel={mockGetCategoryLabel}
      />
    );

    expect(screen.getByText("Densities")).toBeInTheDocument();
    expect(screen.getByText("Archetypes")).toBeInTheDocument();
    expect(screen.getByText("Energy Centers")).toBeInTheDocument();
  });

  it("has correct container styling", () => {
    const expandedCategories = new Set<ConceptCategory>(["densities"]);
    const { container } = render(
      <CategoryLegend
        expandedCategories={expandedCategories}
        title={defaultTitle}
        getCategoryLabel={mockGetCategoryLabel}
      />
    );

    const legendContainer = container.firstChild as HTMLElement;
    expect(legendContainer).toHaveClass("absolute", "bottom-4", "left-4");
  });

  it("uses custom title when provided", () => {
    const expandedCategories = new Set<ConceptCategory>(["densities"]);
    render(
      <CategoryLegend
        expandedCategories={expandedCategories}
        title="Categorías"
        getCategoryLabel={mockGetCategoryLabel}
      />
    );

    expect(screen.getByText("Categorías")).toBeInTheDocument();
  });
});
