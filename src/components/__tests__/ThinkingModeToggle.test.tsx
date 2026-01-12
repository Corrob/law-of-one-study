import { render, screen, fireEvent } from "@testing-library/react";
import ThinkingModeToggle from "../ThinkingModeToggle";

describe("ThinkingModeToggle", () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("rendering", () => {
    it("should render the toggle with label", () => {
      render(<ThinkingModeToggle enabled={false} onChange={mockOnChange} />);

      expect(screen.getByRole("switch")).toBeInTheDocument();
      expect(screen.getByText("Thinking mode")).toBeInTheDocument();
    });

    it("should have correct aria-checked when disabled", () => {
      render(<ThinkingModeToggle enabled={false} onChange={mockOnChange} />);

      expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "false");
    });

    it("should have correct aria-checked when enabled", () => {
      render(<ThinkingModeToggle enabled={true} onChange={mockOnChange} />);

      expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true");
    });
  });

  describe("toggle interaction", () => {
    it("should call onChange with true when toggling from off to on", () => {
      render(<ThinkingModeToggle enabled={false} onChange={mockOnChange} />);

      fireEvent.click(screen.getByRole("switch"));

      expect(mockOnChange).toHaveBeenCalledTimes(1);
      expect(mockOnChange).toHaveBeenCalledWith(true);
    });

    it("should call onChange with false when toggling from on to off", () => {
      render(<ThinkingModeToggle enabled={true} onChange={mockOnChange} />);

      fireEvent.click(screen.getByRole("switch"));

      expect(mockOnChange).toHaveBeenCalledTimes(1);
      expect(mockOnChange).toHaveBeenCalledWith(false);
    });
  });

  describe("info tooltip", () => {
    it("should render info button on mobile", () => {
      render(<ThinkingModeToggle enabled={false} onChange={mockOnChange} />);

      expect(screen.getByLabelText("What is thinking mode?")).toBeInTheDocument();
    });

    it("should show tooltip when info button is clicked", () => {
      render(<ThinkingModeToggle enabled={false} onChange={mockOnChange} />);

      const infoButton = screen.getByLabelText("What is thinking mode?");
      fireEvent.click(infoButton);

      expect(screen.getByText("Slower, more thoughtful responses")).toBeInTheDocument();
    });

    it("should hide tooltip when clicking outside", () => {
      render(<ThinkingModeToggle enabled={false} onChange={mockOnChange} />);

      // Show tooltip
      const infoButton = screen.getByLabelText("What is thinking mode?");
      fireEvent.click(infoButton);
      expect(screen.getByText("Slower, more thoughtful responses")).toBeInTheDocument();

      // Click the backdrop to dismiss
      const backdrop = document.querySelector(".fixed.inset-0");
      fireEvent.click(backdrop!);

      expect(screen.queryByText("Slower, more thoughtful responses")).not.toBeInTheDocument();
    });

    it("should not trigger toggle when clicking info button", () => {
      render(<ThinkingModeToggle enabled={false} onChange={mockOnChange} />);

      const infoButton = screen.getByLabelText("What is thinking mode?");
      fireEvent.click(infoButton);

      // onChange should not be called - info button is separate from toggle
      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe("visual states", () => {
    it("should apply gold color to label when enabled", () => {
      render(<ThinkingModeToggle enabled={true} onChange={mockOnChange} />);

      const label = screen.getByText("Thinking mode");
      expect(label).toHaveClass("text-[var(--lo1-gold)]");
    });

    it("should apply muted color to label when disabled", () => {
      render(<ThinkingModeToggle enabled={false} onChange={mockOnChange} />);

      const label = screen.getByText("Thinking mode");
      expect(label).toHaveClass("text-[var(--lo1-stardust)]");
    });
  });
});
