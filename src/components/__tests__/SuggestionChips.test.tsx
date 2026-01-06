import { render, screen, fireEvent } from "@testing-library/react";
import SuggestionChips from "../SuggestionChips";

// Mock framer-motion
jest.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<object>) => <div {...props}>{children}</div>,
    button: ({
      children,
      onClick,
      disabled,
      className,
      "data-testid": testId,
    }: React.PropsWithChildren<{
      onClick?: () => void;
      disabled?: boolean;
      className?: string;
      "data-testid"?: string;
    }>) => (
      <button onClick={onClick} disabled={disabled} className={className} data-testid={testId}>
        {children}
      </button>
    ),
  },
}));

// Mock analytics
jest.mock("@/lib/analytics", () => ({
  analytics: {
    suggestionDisplayed: jest.fn(),
    suggestionClicked: jest.fn(),
  },
}));

import { analytics } from "@/lib/analytics";

describe("SuggestionChips", () => {
  const mockOnSelect = jest.fn();
  const mockSuggestions = ["What is the Law of One?", "Tell me about densities", "What is harvest?"];

  beforeEach(() => {
    mockOnSelect.mockClear();
    (analytics.suggestionDisplayed as jest.Mock).mockClear();
    (analytics.suggestionClicked as jest.Mock).mockClear();
  });

  describe("rendering", () => {
    it("should render nothing when suggestions array is empty", () => {
      const { container } = render(<SuggestionChips suggestions={[]} onSelect={mockOnSelect} />);

      expect(container.firstChild).toBeNull();
    });

    it("should render all suggestions", () => {
      render(<SuggestionChips suggestions={mockSuggestions} onSelect={mockOnSelect} />);

      expect(screen.getByText("What is the Law of One?")).toBeInTheDocument();
      expect(screen.getByText("Tell me about densities")).toBeInTheDocument();
      expect(screen.getByText("What is harvest?")).toBeInTheDocument();
    });

    it("should render correct number of suggestion chips", () => {
      render(<SuggestionChips suggestions={mockSuggestions} onSelect={mockOnSelect} />);

      const chips = screen.getAllByTestId("suggestion-chip");
      expect(chips).toHaveLength(3);
    });

    it("should display 'Continue exploring:' label", () => {
      render(<SuggestionChips suggestions={mockSuggestions} onSelect={mockOnSelect} />);

      expect(screen.getByText("Continue exploring:")).toBeInTheDocument();
    });
  });

  describe("interactions", () => {
    it("should call onSelect when chip is clicked", () => {
      render(<SuggestionChips suggestions={mockSuggestions} onSelect={mockOnSelect} />);

      fireEvent.click(screen.getByText("What is the Law of One?"));

      expect(mockOnSelect).toHaveBeenCalledWith("What is the Law of One?");
    });

    it("should call onSelect with correct suggestion for each chip", () => {
      render(<SuggestionChips suggestions={mockSuggestions} onSelect={mockOnSelect} />);

      fireEvent.click(screen.getByText("Tell me about densities"));

      expect(mockOnSelect).toHaveBeenCalledWith("Tell me about densities");
    });

    it("should not call onSelect when disabled", () => {
      render(<SuggestionChips suggestions={mockSuggestions} onSelect={mockOnSelect} disabled />);

      fireEvent.click(screen.getByText("What is the Law of One?"));

      expect(mockOnSelect).not.toHaveBeenCalled();
    });
  });

  describe("analytics", () => {
    it("should track suggestion display on mount", () => {
      render(<SuggestionChips suggestions={mockSuggestions} onSelect={mockOnSelect} />);

      expect(analytics.suggestionDisplayed).toHaveBeenCalledWith({ count: 3 });
    });

    it("should not track display when suggestions array is empty", () => {
      render(<SuggestionChips suggestions={[]} onSelect={mockOnSelect} />);

      expect(analytics.suggestionDisplayed).not.toHaveBeenCalled();
    });

    it("should track click analytics on selection", () => {
      render(<SuggestionChips suggestions={mockSuggestions} onSelect={mockOnSelect} />);

      fireEvent.click(screen.getByText("Tell me about densities"));

      expect(analytics.suggestionClicked).toHaveBeenCalledWith({
        suggestion: "Tell me about densities",
      });
    });

    it("should not track click analytics when disabled", () => {
      render(<SuggestionChips suggestions={mockSuggestions} onSelect={mockOnSelect} disabled />);

      fireEvent.click(screen.getByText("Tell me about densities"));

      expect(analytics.suggestionClicked).not.toHaveBeenCalled();
    });
  });

  describe("disabled state", () => {
    it("should disable all buttons when disabled prop is true", () => {
      render(<SuggestionChips suggestions={mockSuggestions} onSelect={mockOnSelect} disabled />);

      const chips = screen.getAllByTestId("suggestion-chip");
      chips.forEach((chip) => {
        expect(chip).toBeDisabled();
      });
    });

    it("should apply disabled styling when disabled", () => {
      render(<SuggestionChips suggestions={mockSuggestions} onSelect={mockOnSelect} disabled />);

      const chips = screen.getAllByTestId("suggestion-chip");
      chips.forEach((chip) => {
        expect(chip.className).toContain("opacity-50");
        expect(chip.className).toContain("cursor-not-allowed");
      });
    });
  });

  describe("single suggestion", () => {
    it("should render correctly with single suggestion", () => {
      render(<SuggestionChips suggestions={["Only suggestion"]} onSelect={mockOnSelect} />);

      expect(screen.getByText("Only suggestion")).toBeInTheDocument();
      expect(screen.getAllByTestId("suggestion-chip")).toHaveLength(1);
    });
  });
});
