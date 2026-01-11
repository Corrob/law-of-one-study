import { render, screen, fireEvent } from "@testing-library/react";
import QuizFeedback from "../QuizFeedback";

const mockOptions = [
  {
    id: "a",
    text: "Wrong answer 1",
    isCorrect: false,
    explanation: "Explanation for wrong answer 1",
    relatedPassage: "17.30",
  },
  {
    id: "b",
    text: "Correct answer",
    isCorrect: true,
    explanation: "Explanation for correct answer",
    relatedPassage: "17.30",
  },
  {
    id: "c",
    text: "Wrong answer 2",
    isCorrect: false,
    explanation: "Explanation for wrong answer 2",
    relatedPassage: "17.31",
  },
];

const correctOption = mockOptions[1];
const wrongOption = mockOptions[0];

describe("QuizFeedback", () => {
  const mockOnRetry = jest.fn();

  beforeEach(() => {
    mockOnRetry.mockClear();
  });

  describe("correct answer feedback", () => {
    it("should display 'That's right!' for correct answer", () => {
      render(
        <QuizFeedback
          isCorrect={true}
          showCorrectAnswer={false}
          canRetry={false}
          explanationOption={correctOption}
          correctOption={correctOption}
          allOptions={mockOptions}
          onRetry={mockOnRetry}
        />
      );

      expect(screen.getByText("That's right!")).toBeInTheDocument();
    });

    it("should display explanation for correct answer", () => {
      render(
        <QuizFeedback
          isCorrect={true}
          showCorrectAnswer={false}
          canRetry={false}
          explanationOption={correctOption}
          correctOption={correctOption}
          allOptions={mockOptions}
          onRetry={mockOnRetry}
        />
      );

      expect(screen.getByText("Explanation for correct answer")).toBeInTheDocument();
    });

    it("should not show retry button for correct answer", () => {
      render(
        <QuizFeedback
          isCorrect={true}
          showCorrectAnswer={false}
          canRetry={false}
          explanationOption={correctOption}
          correctOption={correctOption}
          allOptions={mockOptions}
          onRetry={mockOnRetry}
        />
      );

      expect(screen.queryByText("Try Again")).not.toBeInTheDocument();
    });
  });

  describe("wrong answer feedback", () => {
    it("should display 'Not quite' for wrong answer with retries left", () => {
      render(
        <QuizFeedback
          isCorrect={false}
          showCorrectAnswer={false}
          canRetry={true}
          explanationOption={wrongOption}
          correctOption={correctOption}
          allOptions={mockOptions}
          onRetry={mockOnRetry}
        />
      );

      expect(screen.getByText("Not quite, but let's explore this")).toBeInTheDocument();
    });

    it("should show retry button when canRetry is true", () => {
      render(
        <QuizFeedback
          isCorrect={false}
          showCorrectAnswer={false}
          canRetry={true}
          explanationOption={wrongOption}
          correctOption={correctOption}
          allOptions={mockOptions}
          onRetry={mockOnRetry}
        />
      );

      expect(screen.getByText("Try Again")).toBeInTheDocument();
    });

    it("should call onRetry when Try Again is clicked", () => {
      render(
        <QuizFeedback
          isCorrect={false}
          showCorrectAnswer={false}
          canRetry={true}
          explanationOption={wrongOption}
          correctOption={correctOption}
          allOptions={mockOptions}
          onRetry={mockOnRetry}
        />
      );

      fireEvent.click(screen.getByText("Try Again"));

      expect(mockOnRetry).toHaveBeenCalled();
    });
  });

  describe("max attempts reached", () => {
    it("should display correct answer when showCorrectAnswer is true", () => {
      render(
        <QuizFeedback
          isCorrect={false}
          showCorrectAnswer={true}
          canRetry={false}
          explanationOption={correctOption}
          correctOption={correctOption}
          allOptions={mockOptions}
          onRetry={mockOnRetry}
        />
      );

      expect(screen.getByText(/The answer is:/)).toBeInTheDocument();
      expect(screen.getByText(/"Correct answer"/)).toBeInTheDocument();
    });

    it("should show encouraging message after max attempts", () => {
      render(
        <QuizFeedback
          isCorrect={false}
          showCorrectAnswer={true}
          canRetry={false}
          explanationOption={correctOption}
          correctOption={correctOption}
          allOptions={mockOptions}
          onRetry={mockOnRetry}
        />
      );

      expect(screen.getByText(/this is about learning, not testing/)).toBeInTheDocument();
    });

    it("should not show retry button after max attempts", () => {
      render(
        <QuizFeedback
          isCorrect={false}
          showCorrectAnswer={true}
          canRetry={false}
          explanationOption={correctOption}
          correctOption={correctOption}
          allOptions={mockOptions}
          onRetry={mockOnRetry}
        />
      );

      expect(screen.queryByText("Try Again")).not.toBeInTheDocument();
    });
  });

  describe("related passage link", () => {
    it("should render link to related passage", () => {
      render(
        <QuizFeedback
          isCorrect={true}
          showCorrectAnswer={false}
          canRetry={false}
          explanationOption={correctOption}
          correctOption={correctOption}
          allOptions={mockOptions}
          onRetry={mockOnRetry}
        />
      );

      expect(screen.getByText(/Read more: 17.30/)).toBeInTheDocument();
    });

    it("should link to correct lawofone.info URL", () => {
      render(
        <QuizFeedback
          isCorrect={true}
          showCorrectAnswer={false}
          canRetry={false}
          explanationOption={correctOption}
          correctOption={correctOption}
          allOptions={mockOptions}
          onRetry={mockOnRetry}
        />
      );

      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("href", "https://lawofone.info/s/17#30");
    });
  });

  describe("other explanations toggle", () => {
    it("should show toggle for other explanations after correct answer", () => {
      render(
        <QuizFeedback
          isCorrect={true}
          showCorrectAnswer={false}
          canRetry={false}
          explanationOption={correctOption}
          correctOption={correctOption}
          allOptions={mockOptions}
          onRetry={mockOnRetry}
        />
      );

      expect(screen.getByText("Why were the others wrong?")).toBeInTheDocument();
    });

    it("should show toggle after max attempts", () => {
      render(
        <QuizFeedback
          isCorrect={false}
          showCorrectAnswer={true}
          canRetry={false}
          explanationOption={correctOption}
          correctOption={correctOption}
          allOptions={mockOptions}
          onRetry={mockOnRetry}
        />
      );

      expect(screen.getByText("Why were the others wrong?")).toBeInTheDocument();
    });

    it("should not show toggle when can still retry", () => {
      render(
        <QuizFeedback
          isCorrect={false}
          showCorrectAnswer={false}
          canRetry={true}
          explanationOption={wrongOption}
          correctOption={correctOption}
          allOptions={mockOptions}
          onRetry={mockOnRetry}
        />
      );

      expect(screen.queryByText("Why were the others wrong?")).not.toBeInTheDocument();
    });

    it("should expand to show wrong option explanations when clicked", () => {
      render(
        <QuizFeedback
          isCorrect={true}
          showCorrectAnswer={false}
          canRetry={false}
          explanationOption={correctOption}
          correctOption={correctOption}
          allOptions={mockOptions}
          onRetry={mockOnRetry}
        />
      );

      fireEvent.click(screen.getByText("Why were the others wrong?"));

      expect(screen.getByText("Explanation for wrong answer 1")).toBeInTheDocument();
      expect(screen.getByText("Explanation for wrong answer 2")).toBeInTheDocument();
    });

    it("should show wrong option text in expanded view", () => {
      render(
        <QuizFeedback
          isCorrect={true}
          showCorrectAnswer={false}
          canRetry={false}
          explanationOption={correctOption}
          correctOption={correctOption}
          allOptions={mockOptions}
          onRetry={mockOnRetry}
        />
      );

      fireEvent.click(screen.getByText("Why were the others wrong?"));

      // Text is wrapped in curly quotes, so search for content without quotes
      expect(screen.getByText(/Wrong answer 1/)).toBeInTheDocument();
      expect(screen.getByText(/Wrong answer 2/)).toBeInTheDocument();
    });

    it("should collapse when clicked again", () => {
      render(
        <QuizFeedback
          isCorrect={true}
          showCorrectAnswer={false}
          canRetry={false}
          explanationOption={correctOption}
          correctOption={correctOption}
          allOptions={mockOptions}
          onRetry={mockOnRetry}
        />
      );

      fireEvent.click(screen.getByText("Why were the others wrong?"));
      fireEvent.click(screen.getByText("Hide other explanations"));

      expect(screen.queryByText("Explanation for wrong answer 1")).not.toBeInTheDocument();
    });

    it("should not include correct option in other explanations", () => {
      render(
        <QuizFeedback
          isCorrect={true}
          showCorrectAnswer={false}
          canRetry={false}
          explanationOption={correctOption}
          correctOption={correctOption}
          allOptions={mockOptions}
          onRetry={mockOnRetry}
        />
      );

      fireEvent.click(screen.getByText("Why were the others wrong?"));

      // The correct option's explanation should not appear in the "others" section
      // (the option text "Correct answer" appears in main feedback, so we check for its explanation)
      const otherExplanationsSection = screen.getByText("Explanation for wrong answer 1").parentElement?.parentElement;
      expect(otherExplanationsSection).not.toHaveTextContent("Explanation for correct answer");
    });
  });
});
