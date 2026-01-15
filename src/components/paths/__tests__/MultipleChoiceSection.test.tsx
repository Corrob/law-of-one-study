import { render, screen, fireEvent } from "@testing-library/react";
import MultipleChoiceSection from "../MultipleChoiceSection";
import type { MultipleChoiceSection as MultipleChoiceSectionType } from "@/lib/schemas/study-paths";

// Mock next-intl
jest.mock("next-intl", () => ({
  useTranslations: () => (key: string, params?: Record<string, unknown>) => {
    const translations: Record<string, string> = {
      "hint": "Hint:",
      "hideHint": "Hide",
      "needHint": "Need a hint?",
      "submitAnswer": "Submit Answer",
      "thatsRight": "That's right!",
      "notQuite": "Not quite, but let's explore this",
      "answerIs": `The answer is: "${params?.answer || ""}"`,
      "dontWorry": "Don't worry, this is about learning, not testing. Take a moment to absorb this before continuing.",
      "tryAgain": "Try Again",
      "readMore": `Read more: ${params?.reference || ""}`,
      "hideOther": "Hide other explanations",
      "whyWrong": "Why were the others wrong?",
    };
    return translations[key] || key;
  },
  useLocale: () => "en",
}));

const mockSection: MultipleChoiceSectionType = {
  type: "multiple-choice",
  question: "What is the best way to serve others?",
  hint: "Think about Ra's emphasis on radiation",
  options: [
    {
      id: "a",
      text: "Following strict rules",
      isCorrect: false,
      explanation: "Ra emphasizes inner guidance over external rules.",
      relatedPassage: "17.30",
    },
    {
      id: "b",
      text: "Radiating love from the heart",
      isCorrect: true,
      explanation: "Ra says the best way is to radiate the love of the Creator.",
      relatedPassage: "17.30",
    },
    {
      id: "c",
      text: "Converting others to your beliefs",
      isCorrect: false,
      explanation: "This infringes on free will, which Ra warns against.",
      relatedPassage: "17.30",
    },
  ],
};

describe("MultipleChoiceSection", () => {
  const mockOnAnswer = jest.fn();

  beforeEach(() => {
    mockOnAnswer.mockClear();
  });

  describe("rendering", () => {
    it("should render the question", () => {
      render(<MultipleChoiceSection section={mockSection} />);

      expect(screen.getByText("What is the best way to serve others?")).toBeInTheDocument();
    });

    it("should render all options", () => {
      render(<MultipleChoiceSection section={mockSection} />);

      expect(screen.getByText("Following strict rules")).toBeInTheDocument();
      expect(screen.getByText("Radiating love from the heart")).toBeInTheDocument();
      expect(screen.getByText("Converting others to your beliefs")).toBeInTheDocument();
    });

    it("should render hint button when hint is provided", () => {
      render(<MultipleChoiceSection section={mockSection} />);

      expect(screen.getByText("Need a hint?")).toBeInTheDocument();
    });

    it("should not render hint button when no hint provided", () => {
      const sectionWithoutHint = { ...mockSection, hint: undefined };
      render(<MultipleChoiceSection section={sectionWithoutHint} />);

      expect(screen.queryByText("Need a hint?")).not.toBeInTheDocument();
    });

    it("should render submit button", () => {
      render(<MultipleChoiceSection section={mockSection} />);

      expect(screen.getByText("Submit Answer")).toBeInTheDocument();
    });

    it("should have disabled submit button initially", () => {
      render(<MultipleChoiceSection section={mockSection} />);

      const submitButton = screen.getByText("Submit Answer");
      expect(submitButton).toBeDisabled();
    });
  });

  describe("option selection", () => {
    it("should enable submit button when an option is selected", () => {
      render(<MultipleChoiceSection section={mockSection} />);

      fireEvent.click(screen.getByText("Radiating love from the heart"));

      const submitButton = screen.getByText("Submit Answer");
      expect(submitButton).not.toBeDisabled();
    });

    it("should allow changing selection before submitting", () => {
      render(<MultipleChoiceSection section={mockSection} />);

      fireEvent.click(screen.getByText("Following strict rules"));
      fireEvent.click(screen.getByText("Radiating love from the heart"));

      // Both clicks should work, last one is selected
      const radioB = screen.getByRole("radio", { name: /Radiating love from the heart/i });
      expect(radioB).toBeChecked();
    });
  });

  describe("hint functionality", () => {
    it("should show hint when hint button is clicked", () => {
      render(<MultipleChoiceSection section={mockSection} />);

      fireEvent.click(screen.getByText("Need a hint?"));

      expect(screen.getByText(/Think about Ra's emphasis on radiation/)).toBeInTheDocument();
    });

    it("should hide hint when Hide button is clicked", () => {
      render(<MultipleChoiceSection section={mockSection} />);

      fireEvent.click(screen.getByText("Need a hint?"));
      fireEvent.click(screen.getByText("Hide"));

      expect(screen.queryByText(/Think about Ra's emphasis on radiation/)).not.toBeInTheDocument();
    });
  });

  describe("submitting answers", () => {
    it("should call onAnswer with correct data when correct answer is submitted", () => {
      render(<MultipleChoiceSection section={mockSection} onAnswer={mockOnAnswer} />);

      fireEvent.click(screen.getByText("Radiating love from the heart"));
      fireEvent.click(screen.getByText("Submit Answer"));

      expect(mockOnAnswer).toHaveBeenCalledWith({
        selectedOptionId: "b",
        wasCorrect: true,
        attempts: 1,
      });
    });

    it("should call onAnswer with correct data when wrong answer is submitted", () => {
      render(<MultipleChoiceSection section={mockSection} onAnswer={mockOnAnswer} />);

      fireEvent.click(screen.getByText("Following strict rules"));
      fireEvent.click(screen.getByText("Submit Answer"));

      expect(mockOnAnswer).toHaveBeenCalledWith({
        selectedOptionId: "a",
        wasCorrect: false,
        attempts: 1,
      });
    });

    it("should show correct feedback when correct answer is submitted", () => {
      render(<MultipleChoiceSection section={mockSection} />);

      fireEvent.click(screen.getByText("Radiating love from the heart"));
      fireEvent.click(screen.getByText("Submit Answer"));

      expect(screen.getByText("That's right!")).toBeInTheDocument();
      expect(screen.getByText(/Ra says the best way is to radiate/)).toBeInTheDocument();
    });

    it("should show incorrect feedback when wrong answer is submitted", () => {
      render(<MultipleChoiceSection section={mockSection} />);

      fireEvent.click(screen.getByText("Following strict rules"));
      fireEvent.click(screen.getByText("Submit Answer"));

      expect(screen.getByText("Not quite, but let's explore this")).toBeInTheDocument();
    });

    it("should hide submit button after answering", () => {
      render(<MultipleChoiceSection section={mockSection} />);

      fireEvent.click(screen.getByText("Radiating love from the heart"));
      fireEvent.click(screen.getByText("Submit Answer"));

      expect(screen.queryByText("Submit Answer")).not.toBeInTheDocument();
    });

    it("should disable option selection after answering", () => {
      render(<MultipleChoiceSection section={mockSection} />);

      fireEvent.click(screen.getByText("Radiating love from the heart"));
      fireEvent.click(screen.getByText("Submit Answer"));

      const radioA = screen.getByRole("radio", { name: /Following strict rules/i });
      expect(radioA).toBeDisabled();
    });
  });

  describe("retry functionality", () => {
    it("should show Try Again button after wrong answer", () => {
      render(<MultipleChoiceSection section={mockSection} />);

      fireEvent.click(screen.getByText("Following strict rules"));
      fireEvent.click(screen.getByText("Submit Answer"));

      expect(screen.getByText("Try Again")).toBeInTheDocument();
    });

    it("should not show Try Again button after correct answer", () => {
      render(<MultipleChoiceSection section={mockSection} />);

      fireEvent.click(screen.getByText("Radiating love from the heart"));
      fireEvent.click(screen.getByText("Submit Answer"));

      expect(screen.queryByText("Try Again")).not.toBeInTheDocument();
    });

    it("should reset quiz state when Try Again is clicked", () => {
      render(<MultipleChoiceSection section={mockSection} />);

      fireEvent.click(screen.getByText("Following strict rules"));
      fireEvent.click(screen.getByText("Submit Answer"));
      fireEvent.click(screen.getByText("Try Again"));

      expect(screen.getByText("Submit Answer")).toBeInTheDocument();
      expect(screen.queryByText("Not quite")).not.toBeInTheDocument();
    });

    it("should increment attempts on retry", () => {
      render(<MultipleChoiceSection section={mockSection} onAnswer={mockOnAnswer} />);

      // First attempt
      fireEvent.click(screen.getByText("Following strict rules"));
      fireEvent.click(screen.getByText("Submit Answer"));

      // Retry
      fireEvent.click(screen.getByText("Try Again"));
      fireEvent.click(screen.getByText("Converting others to your beliefs"));
      fireEvent.click(screen.getByText("Submit Answer"));

      expect(mockOnAnswer).toHaveBeenLastCalledWith({
        selectedOptionId: "c",
        wasCorrect: false,
        attempts: 2,
      });
    });

    it("should show correct answer after max attempts", () => {
      render(<MultipleChoiceSection section={mockSection} />);

      // First wrong attempt
      fireEvent.click(screen.getByText("Following strict rules"));
      fireEvent.click(screen.getByText("Submit Answer"));
      fireEvent.click(screen.getByText("Try Again"));

      // Second wrong attempt (max)
      fireEvent.click(screen.getByText("Converting others to your beliefs"));
      fireEvent.click(screen.getByText("Submit Answer"));

      // The feedback should show "The answer is: [correct answer]"
      expect(screen.getByText(/The answer is:.*Radiating love from the heart/)).toBeInTheDocument();
      expect(screen.queryByText("Try Again")).not.toBeInTheDocument();
    });
  });

  describe("saved response", () => {
    it("should restore state from saved response", () => {
      const savedResponse = {
        selectedOptionId: "b",
        wasCorrect: true,
        attempts: 1,
        timestamp: new Date().toISOString(),
      };

      render(<MultipleChoiceSection section={mockSection} savedResponse={savedResponse} />);

      expect(screen.getByText("That's right!")).toBeInTheDocument();
      const radioB = screen.getByRole("radio", { name: /Radiating love from the heart/i });
      expect(radioB).toBeChecked();
    });

    it("should recalculate isCorrect from current data", () => {
      // Simulate corrupted saved data where wasCorrect doesn't match actual option
      const savedResponse = {
        selectedOptionId: "a", // Wrong answer
        wasCorrect: true, // But marked as correct (corrupted)
        attempts: 1,
        timestamp: new Date().toISOString(),
      };

      render(<MultipleChoiceSection section={mockSection} savedResponse={savedResponse} />);

      // Should show as wrong because option "a" isCorrect is false
      expect(screen.queryByText("That's right!")).not.toBeInTheDocument();
      expect(screen.getByText("Not quite, but let's explore this")).toBeInTheDocument();
    });
  });

  describe("other explanations", () => {
    it("should show 'Why were the others wrong?' after correct answer", () => {
      render(<MultipleChoiceSection section={mockSection} />);

      fireEvent.click(screen.getByText("Radiating love from the heart"));
      fireEvent.click(screen.getByText("Submit Answer"));

      expect(screen.getByText("Why were the others wrong?")).toBeInTheDocument();
    });

    it("should expand to show other explanations when clicked", () => {
      render(<MultipleChoiceSection section={mockSection} />);

      fireEvent.click(screen.getByText("Radiating love from the heart"));
      fireEvent.click(screen.getByText("Submit Answer"));
      fireEvent.click(screen.getByText("Why were the others wrong?"));

      expect(screen.getByText(/Ra emphasizes inner guidance/)).toBeInTheDocument();
      expect(screen.getByText(/This infringes on free will/)).toBeInTheDocument();
    });
  });
});
