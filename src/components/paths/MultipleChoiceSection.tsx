"use client";

import { memo, useState, useCallback, useEffect } from "react";
import type {
  MultipleChoiceSection as MultipleChoiceSectionType,
  QuizResponse,
} from "@/lib/schemas/study-paths";
import QuizOption from "./QuizOption";
import QuizFeedback from "./QuizFeedback";

interface MultipleChoiceSectionProps {
  section: MultipleChoiceSectionType;
  /** Previously saved response, if any */
  savedResponse?: QuizResponse | null;
  /** Callback when user submits an answer */
  onAnswer?: (response: Omit<QuizResponse, "timestamp">) => void;
}

type AnswerState =
  | { type: "unanswered"; previousAttempts: number }
  | { type: "showing_hint"; previousAttempts: number }
  | { type: "answered"; selectedId: string; isCorrect: boolean; attempts: number };

const MAX_ATTEMPTS = 2;

/**
 * Renders a multiple choice question with:
 * - Radio button options
 * - Hint display (optional)
 * - Feedback with explanations
 * - Retry functionality (up to 2 attempts)
 * - Link to related Ra passages
 */
const MultipleChoiceSection = memo(function MultipleChoiceSection({
  section,
  savedResponse,
  onAnswer,
}: MultipleChoiceSectionProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [answerState, setAnswerState] = useState<AnswerState>({ type: "unanswered", previousAttempts: 0 });

  // Initialize from saved response if available
  // Note: We recalculate isCorrect from current option data rather than trusting
  // the saved value, in case the quiz options were modified after the response was saved
  useEffect(() => {
    if (savedResponse) {
      const savedOption = section.options.find(
        (o) => o.id === savedResponse.selectedOptionId
      );
      const isCorrect = savedOption?.isCorrect ?? false;
      setSelectedId(savedResponse.selectedOptionId);
      setAnswerState({
        type: "answered",
        selectedId: savedResponse.selectedOptionId,
        isCorrect,
        attempts: savedResponse.attempts,
      });
    }
  }, [savedResponse, section.options]);

  const correctOption = section.options.find((o) => o.isCorrect);
  const selectedOption = section.options.find((o) => o.id === selectedId);

  const handleSubmit = useCallback(() => {
    if (!selectedId || !selectedOption) return;

    const isCorrect = selectedOption.isCorrect;
    const previousAttempts = answerState.type === "answered"
      ? answerState.attempts
      : answerState.previousAttempts;
    const currentAttempts = previousAttempts + 1;

    setAnswerState({
      type: "answered",
      selectedId,
      isCorrect,
      attempts: currentAttempts,
    });

    onAnswer?.({
      selectedOptionId: selectedId,
      wasCorrect: isCorrect,
      attempts: currentAttempts,
    });
  }, [selectedId, selectedOption, answerState, onAnswer]);

  const handleRetry = useCallback(() => {
    const previousAttempts = answerState.type === "answered" ? answerState.attempts : 0;
    setSelectedId(null);
    setAnswerState({ type: "unanswered", previousAttempts });
  }, [answerState]);

  const handleShowHint = useCallback(() => {
    const previousAttempts = answerState.type === "answered"
      ? answerState.attempts
      : answerState.previousAttempts;
    setAnswerState({ type: "showing_hint", previousAttempts });
  }, [answerState]);

  const handleHideHint = useCallback(() => {
    const previousAttempts = answerState.type === "showing_hint"
      ? answerState.previousAttempts
      : 0;
    setAnswerState({ type: "unanswered", previousAttempts });
  }, [answerState]);

  // Derived state
  const isAnswered = answerState.type === "answered";
  const showingHint = answerState.type === "showing_hint";
  const canRetry = isAnswered && !answerState.isCorrect && answerState.attempts < MAX_ATTEMPTS;
  const showCorrectAnswer = isAnswered && !answerState.isCorrect && answerState.attempts >= MAX_ATTEMPTS;

  // Get the option to show explanation for
  const explanationOption = isAnswered
    ? showCorrectAnswer
      ? correctOption
      : selectedOption
    : null;

  // Question ID for radio group name (use first 20 chars)
  const questionId = section.question.slice(0, 20);

  return (
    <div className="rounded-lg bg-[var(--lo1-space)]/50 border border-[var(--lo1-celestial)]/20 p-5">
      {/* Question header */}
      <div className="flex items-center gap-2 mb-4">
        <span className="flex-shrink-0 w-5 h-5 rounded-full border-2 border-[var(--lo1-gold)] flex items-center justify-center text-[var(--lo1-gold)] text-xs font-bold">
          ?
        </span>
        <h4 className="text-[var(--lo1-starlight)] font-medium">
          {section.question}
        </h4>
      </div>

      {/* Options */}
      <div className="space-y-2" role="radiogroup" aria-label={section.question}>
        {section.options.map((option) => {
          const isSelected = selectedId === option.id;
          const showAsCorrect = isAnswered && option.isCorrect && showCorrectAnswer;
          const showAsWrong = isAnswered && isSelected && !option.isCorrect;

          return (
            <QuizOption
              key={option.id}
              id={option.id}
              text={option.text}
              isSelected={isSelected}
              isAnswered={isAnswered}
              isCorrectOption={option.isCorrect}
              showAsCorrect={showAsCorrect}
              showAsWrong={showAsWrong}
              questionId={questionId}
              onSelect={() => setSelectedId(option.id)}
            />
          );
        })}
      </div>

      {/* Hint display */}
      {section.hint && showingHint && !isAnswered && (
        <div className="mt-4 text-sm text-[var(--lo1-celestial)] bg-[var(--lo1-celestial)]/10 p-3 rounded-lg">
          <span className="font-medium">Hint:</span> {section.hint}
          <button
            onClick={handleHideHint}
            className="ml-2 text-[var(--lo1-text-light)] hover:text-[var(--lo1-starlight)] underline cursor-pointer"
          >
            Hide
          </button>
        </div>
      )}

      {/* Actions row: hint link + submit button */}
      {!isAnswered && (
        <div className="mt-4 flex items-center justify-between">
          {section.hint && !showingHint ? (
            <button
              onClick={handleShowHint}
              className="text-sm text-[var(--lo1-text-light)]/60 hover:text-[var(--lo1-celestial)] transition-colors cursor-pointer"
            >
              Need a hint?
            </button>
          ) : (
            <div />
          )}
          <button
            onClick={handleSubmit}
            disabled={!selectedId}
            className={`
              px-5 py-2 rounded-lg font-medium transition-all
              ${
                selectedId
                  ? "bg-[var(--lo1-gold)] text-[var(--lo1-space)] hover:bg-[var(--lo1-gold-light)] cursor-pointer"
                  : "bg-[var(--lo1-celestial)]/20 text-[var(--lo1-text-light)]/50 cursor-not-allowed"
              }
            `}
          >
            Submit Answer
          </button>
        </div>
      )}

      {/* Feedback section */}
      {isAnswered && explanationOption && (
        <QuizFeedback
          isCorrect={answerState.isCorrect}
          showCorrectAnswer={showCorrectAnswer}
          canRetry={canRetry}
          explanationOption={explanationOption}
          correctOption={correctOption}
          allOptions={section.options}
          onRetry={handleRetry}
        />
      )}
    </div>
  );
});

export default MultipleChoiceSection;
