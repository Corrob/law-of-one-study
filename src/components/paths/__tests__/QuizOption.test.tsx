import { render, screen, fireEvent } from "@testing-library/react";
import QuizOption from "../QuizOption";

describe("QuizOption", () => {
  const defaultProps = {
    id: "a",
    text: "Test option",
    isSelected: false,
    isAnswered: false,
    isCorrectOption: false,
    showAsCorrect: false,
    showAsWrong: false,
    questionId: "test-question",
    onSelect: jest.fn(),
  };

  beforeEach(() => {
    defaultProps.onSelect.mockClear();
  });

  describe("rendering", () => {
    it("should render option text", () => {
      render(<QuizOption {...defaultProps} />);

      expect(screen.getByText("Test option")).toBeInTheDocument();
    });

    it("should render radio input", () => {
      render(<QuizOption {...defaultProps} />);

      expect(screen.getByRole("radio")).toBeInTheDocument();
    });

    it("should show checkmark when showAsCorrect is true", () => {
      render(<QuizOption {...defaultProps} showAsCorrect={true} isAnswered={true} />);

      expect(screen.getByText("✓")).toBeInTheDocument();
    });

    it("should show X mark when showAsWrong is true", () => {
      render(<QuizOption {...defaultProps} showAsWrong={true} isAnswered={true} />);

      expect(screen.getByText("✗")).toBeInTheDocument();
    });
  });

  describe("selection state", () => {
    it("should have unchecked radio when not selected", () => {
      render(<QuizOption {...defaultProps} isSelected={false} />);

      expect(screen.getByRole("radio")).not.toBeChecked();
    });

    it("should have checked radio when selected", () => {
      render(<QuizOption {...defaultProps} isSelected={true} />);

      expect(screen.getByRole("radio")).toBeChecked();
    });
  });

  describe("interactions", () => {
    it("should call onSelect when clicked and not answered", () => {
      render(<QuizOption {...defaultProps} />);

      fireEvent.click(screen.getByText("Test option"));

      expect(defaultProps.onSelect).toHaveBeenCalled();
    });

    it("should not call onSelect when clicked and already answered", () => {
      render(<QuizOption {...defaultProps} isAnswered={true} />);

      fireEvent.click(screen.getByText("Test option"));

      expect(defaultProps.onSelect).not.toHaveBeenCalled();
    });

    it("should disable radio when answered", () => {
      render(<QuizOption {...defaultProps} isAnswered={true} />);

      expect(screen.getByRole("radio")).toBeDisabled();
    });
  });

  describe("styling", () => {
    it("should apply correct border styling when showing as correct", () => {
      const { container } = render(
        <QuizOption {...defaultProps} showAsCorrect={true} isAnswered={true} />
      );

      const label = container.querySelector("label");
      expect(label?.className).toContain("border-[var(--lo1-success-border)]");
    });

    it("should apply warning border styling when showing as wrong", () => {
      const { container } = render(
        <QuizOption {...defaultProps} showAsWrong={true} isAnswered={true} />
      );

      const label = container.querySelector("label");
      expect(label?.className).toContain("border-[var(--lo1-warning-border)]");
    });

    it("should apply gold styling when selected but not answered", () => {
      const { container } = render(
        <QuizOption {...defaultProps} isSelected={true} isAnswered={false} />
      );

      const label = container.querySelector("label");
      expect(label?.className).toContain("border-[var(--lo1-gold)]");
    });
  });
});
