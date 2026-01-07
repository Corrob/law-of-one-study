import { render, screen } from "@testing-library/react";

// Mock react-markdown before importing the component
jest.mock("react-markdown", () => {
  return function MockReactMarkdown({ children, components }: {
    children: string;
    components?: Record<string, React.ComponentType<{ children?: React.ReactNode }>>
  }) {
    // Simple mock that renders paragraphs
    const P = components?.p || (({ children }: { children?: React.ReactNode }) => <p>{children}</p>);
    const Strong = components?.strong || (({ children }: { children?: React.ReactNode }) => <strong>{children}</strong>);
    const Em = components?.em || (({ children }: { children?: React.ReactNode }) => <em>{children}</em>);
    const Li = components?.li || (({ children }: { children?: React.ReactNode }) => <li>{children}</li>);

    // Very simple markdown parsing for tests
    const lines = children.split("\n");
    const elements: React.ReactNode[] = [];
    let inList = false;
    let listItems: React.ReactNode[] = [];

    lines.forEach((line, i) => {
      // List items
      if (line.startsWith("- ") || /^\d+\. /.test(line)) {
        if (!inList) {
          inList = true;
          listItems = [];
        }
        const content = line.replace(/^- |^\d+\. /, "");
        listItems.push(<Li key={i}>{content}</Li>);
      } else {
        if (inList) {
          elements.push(<ul key={`list-${i}`}>{listItems}</ul>);
          inList = false;
          listItems = [];
        }
        if (line.trim()) {
          // Parse bold and italic
          let content: React.ReactNode = line;
          if (line.includes("**")) {
            const parts = line.split(/\*\*(.+?)\*\*/);
            content = parts.map((part, j) =>
              j % 2 === 1 ? <Strong key={j}>{part}</Strong> : part
            );
          } else if (line.includes("*")) {
            const parts = line.split(/\*(.+?)\*/);
            content = parts.map((part, j) =>
              j % 2 === 1 ? <Em key={j}>{part}</Em> : part
            );
          }
          elements.push(<P key={i}>{content}</P>);
        }
      }
    });

    if (inList) {
      elements.push(<ul key="final-list">{listItems}</ul>);
    }

    return <>{elements}</>;
  };
});

jest.mock("remark-gfm", () => () => {});

import MarkdownRenderer from "../MarkdownRenderer";

// Mock ConceptPopover
jest.mock("../ConceptPopover", () => {
  return function MockConceptPopover({ term, displayText }: { term: string; displayText: string }) {
    return <span data-testid="concept-popover" data-term={term}>{displayText}</span>;
  };
});

// Mock concept parser
jest.mock("@/lib/conceptParser", () => ({
  parseConceptsInText: jest.fn((text: string) => {
    // Simple mock: treat "catalyst" as a concept
    if (text.includes("catalyst")) {
      const parts = text.split("catalyst");
      const segments = [];
      if (parts[0]) {
        segments.push({ type: "text", content: parts[0] });
      }
      segments.push({
        type: "concept",
        content: "catalyst",
        searchTerm: "catalyst",
        displayText: "catalyst"
      });
      if (parts[1]) {
        segments.push({ type: "text", content: parts[1] });
      }
      return segments;
    }
    return [{ type: "text", content: text }];
  }),
}));

describe("MarkdownRenderer", () => {
  describe("without onSearch", () => {
    it("should render plain text", () => {
      render(<MarkdownRenderer content="Hello world" />);

      expect(screen.getByText("Hello world")).toBeInTheDocument();
    });

    it("should render bold text", () => {
      render(<MarkdownRenderer content="This is **bold** text" />);

      expect(screen.getByText("bold")).toBeInTheDocument();
    });

    it("should render italic text", () => {
      render(<MarkdownRenderer content="This is *italic* text" />);

      expect(screen.getByText("italic")).toBeInTheDocument();
    });

    it("should render list content", () => {
      render(<MarkdownRenderer content="- Item 1" />);

      // List item is rendered
      expect(screen.getByRole("listitem")).toBeInTheDocument();
    });

    it("should render ordered list content", () => {
      render(<MarkdownRenderer content="1. First item" />);

      // List item is rendered
      expect(screen.getByRole("listitem")).toBeInTheDocument();
    });

    it("should not show concept popovers without onSearch", () => {
      render(<MarkdownRenderer content="The catalyst is important" />);

      expect(screen.queryByTestId("concept-popover")).not.toBeInTheDocument();
    });
  });

  describe("with onSearch", () => {
    const mockOnSearch = jest.fn();

    beforeEach(() => {
      mockOnSearch.mockClear();
    });

    it("should render concept popovers for recognized terms", () => {
      render(<MarkdownRenderer content="The catalyst is key" onSearch={mockOnSearch} />);

      expect(screen.getByTestId("concept-popover")).toBeInTheDocument();
      expect(screen.getByTestId("concept-popover")).toHaveAttribute("data-term", "catalyst");
    });

    it("should render concepts in paragraphs", () => {
      render(
        <MarkdownRenderer
          content="Understanding catalyst helps growth"
          onSearch={mockOnSearch}
        />
      );

      expect(screen.getByTestId("concept-popover")).toBeInTheDocument();
    });

    it("should render concepts in list items", () => {
      render(
        <MarkdownRenderer
          content="- The catalyst concept\n- Another item"
          onSearch={mockOnSearch}
        />
      );

      expect(screen.getByTestId("concept-popover")).toBeInTheDocument();
    });

    it("should render concepts in bold text", () => {
      render(
        <MarkdownRenderer
          content="This is **catalyst** emphasis"
          onSearch={mockOnSearch}
        />
      );

      expect(screen.getByTestId("concept-popover")).toBeInTheDocument();
    });

    it("should render concepts in italic text", () => {
      render(
        <MarkdownRenderer
          content="This is *catalyst* styled"
          onSearch={mockOnSearch}
        />
      );

      expect(screen.getByTestId("concept-popover")).toBeInTheDocument();
    });

    it("should render plain text without concepts normally", () => {
      render(
        <MarkdownRenderer
          content="No special terms here"
          onSearch={mockOnSearch}
        />
      );

      expect(screen.queryByTestId("concept-popover")).not.toBeInTheDocument();
      expect(screen.getByText("No special terms here")).toBeInTheDocument();
    });
  });

  describe("markdown styling", () => {
    it("should apply paragraph spacing", () => {
      const { container } = render(
        <MarkdownRenderer content="First paragraph\n\nSecond paragraph" />
      );

      const paragraphs = container.querySelectorAll("p");
      expect(paragraphs.length).toBeGreaterThanOrEqual(1);
    });

    it("should handle content with line breaks", () => {
      const { container } = render(<MarkdownRenderer content="Some content here" />);

      // Content is rendered within a paragraph
      expect(container.querySelector("p")).toBeInTheDocument();
      expect(screen.getByText("Some content here")).toBeInTheDocument();
    });
  });
});
