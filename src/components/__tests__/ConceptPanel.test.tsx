import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ConceptPanel from "../ConceptPanel";
import type { GraphConcept } from "@/lib/graph/types";

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
  CATEGORY_COLORS: {
    cosmology: "#4a5899",
    polarity: "#d4a853",
    "energy-work": "#4ade80",
    incarnation: "#6b5b95",
    entities: "#f472b6",
    metaphysics: "#60a5fa",
    practice: "#fbbf24",
    archetypes: "#a78bfa",
  },
}));

// Mock @/i18n/navigation for locale-aware routing
const mockPush = jest.fn();
jest.mock("@/i18n/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: () => "/explore",
  Link: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

// Mock concept-graph to return a related concept
jest.mock("@/lib/concept-graph", () => ({
  findConceptById: (id: string) => {
    if (id === "related-concept") {
      return {
        id: "related-concept",
        term: "Related Concept",
        category: "metaphysics",
        definition: "A related concept",
        extendedDefinition: "",
        relationships: {},
        sessions: { primary: [], secondary: [] },
        keyPassages: [],
        searchTerms: [],
        teachingLevel: "foundational",
        aliases: [],
      };
    }
    return undefined;
  },
}));

// Mock framer-motion to simplify testing
jest.mock("framer-motion", () => ({
  motion: {
    div: ({
      children,
      className,
      ...props
    }: {
      children: React.ReactNode;
      className?: string;
    }) => (
      <div className={className} {...props}>
        {children}
      </div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useDragControls: () => ({
    start: jest.fn(),
  }),
}));

const mockConcept: GraphConcept = {
  id: "test-concept",
  term: "Test Concept",
  aliases: ["alias1"],
  category: "cosmology",
  definition: "This is a test concept definition.",
  extendedDefinition: "This is an extended definition with more details.",
  relationships: {
    related: ["related-concept"],
    leads_to: [],
    prerequisite: [],
  },
  sessions: {
    primary: [1, 2],
    secondary: [3],
  },
  keyPassages: [
    {
      reference: "1.7",
      excerpt: "This is a key passage from Ra.",
      context: "Important context",
    },
  ],
  searchTerms: ["test", "concept"],
  teachingLevel: "foundational",
};

describe("ConceptPanel", () => {
  const mockOnClose = jest.fn();
  const mockOnSelectConcept = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the concept term", () => {
    render(
      <ConceptPanel
        concept={mockConcept}
        onClose={mockOnClose}
        onSelectConcept={mockOnSelectConcept}
      />
    );

    expect(screen.getAllByText("Test Concept").length).toBeGreaterThan(0);
  });

  it("renders the category badge", () => {
    render(
      <ConceptPanel
        concept={mockConcept}
        onClose={mockOnClose}
        onSelectConcept={mockOnSelectConcept}
      />
    );

    expect(screen.getAllByText("Cosmology").length).toBeGreaterThan(0);
  });

  it("renders the definition", () => {
    render(
      <ConceptPanel
        concept={mockConcept}
        onClose={mockOnClose}
        onSelectConcept={mockOnSelectConcept}
      />
    );

    expect(
      screen.getAllByText("This is a test concept definition.").length
    ).toBeGreaterThan(0);
  });

  it("renders extended definition when available", () => {
    render(
      <ConceptPanel
        concept={mockConcept}
        onClose={mockOnClose}
        onSelectConcept={mockOnSelectConcept}
      />
    );

    expect(
      screen.getAllByText("This is an extended definition with more details.")
        .length
    ).toBeGreaterThan(0);
  });

  it("renders key passages", () => {
    render(
      <ConceptPanel
        concept={mockConcept}
        onClose={mockOnClose}
        onSelectConcept={mockOnSelectConcept}
      />
    );

    expect(
      screen.getAllByText(/This is a key passage from Ra/).length
    ).toBeGreaterThan(0);
  });

  it("renders related concepts as buttons", () => {
    render(
      <ConceptPanel
        concept={mockConcept}
        onClose={mockOnClose}
        onSelectConcept={mockOnSelectConcept}
      />
    );

    expect(screen.getAllByText("Related Concept").length).toBeGreaterThan(0);
  });

  it("calls onClose when close button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <ConceptPanel
        concept={mockConcept}
        onClose={mockOnClose}
        onSelectConcept={mockOnSelectConcept}
      />
    );

    const closeButtons = screen.getAllByRole("button", { name: /close/i });
    await user.click(closeButtons[0]);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("calls onSelectConcept when related concept is clicked", async () => {
    const user = userEvent.setup();
    render(
      <ConceptPanel
        concept={mockConcept}
        onClose={mockOnClose}
        onSelectConcept={mockOnSelectConcept}
      />
    );

    const relatedButtons = screen.getAllByText("Related Concept");
    await user.click(relatedButtons[0]);

    expect(mockOnSelectConcept).toHaveBeenCalledWith("related-concept");
  });

  it("navigates to chat when 'Explore this concept' is clicked", async () => {
    const user = userEvent.setup();
    render(
      <ConceptPanel
        concept={mockConcept}
        onClose={mockOnClose}
        onSelectConcept={mockOnSelectConcept}
      />
    );

    const exploreButtons = screen.getAllByText("Explore this concept");
    await user.click(exploreButtons[0]);

    expect(mockPush).toHaveBeenCalledWith(
      "/chat?q=Help%20me%20understand%20Test%20Concept"
    );
  });

  it("renders passage reference as link", () => {
    render(
      <ConceptPanel
        concept={mockConcept}
        onClose={mockOnClose}
        onSelectConcept={mockOnSelectConcept}
      />
    );

    const links = screen.getAllByRole("link");
    const passageLinks = links.filter((link) =>
      link.getAttribute("href")?.includes("llresearch.org")
    );

    expect(passageLinks.length).toBeGreaterThan(0);
  });

  it("displays teaching level", () => {
    render(
      <ConceptPanel
        concept={mockConcept}
        onClose={mockOnClose}
        onSelectConcept={mockOnSelectConcept}
      />
    );

    expect(screen.getAllByText(/foundational/i).length).toBeGreaterThan(0);
  });
});
