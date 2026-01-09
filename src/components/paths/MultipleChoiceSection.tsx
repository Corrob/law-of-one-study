"use client";

import { memo, useState, useCallback, useEffect } from "react";
import type {
  MultipleChoiceSection as MultipleChoiceSectionType,
  QuizResponse,
} from "@/lib/schemas/study-paths";

interface MultipleChoiceSectionProps {
  section: MultipleChoiceSectionType;
  /** Previously saved response, if any */
  savedResponse?: QuizResponse | null;
  /** Callback when user submits an answer */
  onAnswer?: (response: Omit<QuizResponse, "timestamp">) => void;
}

type AnswerState =
  | { type: "unanswered" }
  | { type: "showing_hint" }
  | { type: "answered"; selectedId: string; isCorrect: boolean; attempts: number };

/**
 * Get URL for a Ra Material reference.
 */
function getQuoteUrl(reference: string): string {
  const match = reference.match(/(\d+)\.(\d+)/);
  if (!match) return `https://lawofone.info`;
  const [, session, question] = match;
  return `https://lawofone.info/s/${session}#${question}`;
}

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
  const [answerState, setAnswerState] = useState<AnswerState>({ type: "unanswered" });

  // Initialize from saved response if available
  useEffect(() => {
    if (savedResponse) {
      setSelectedId(savedResponse.selectedOptionId);
      setAnswerState({
        type: "answered",
        selectedId: savedResponse.selectedOptionId,
        isCorrect: savedResponse.wasCorrect,
        attempts: savedResponse.attempts,
      });
    }
  }, [savedResponse]);

  const correctOption = section.options.find((o) => o.isCorrect);
  const selectedOption = section.options.find((o) => o.id === selectedId);

  const handleSubmit = useCallback(() => {
    if (!selectedId || !selectedOption) return;

    const isCorrect = selectedOption.isCorrect;
    const currentAttempts =
      answerState.type === "answered" ? answerState.attempts + 1 : 1;

    const newState: AnswerState = {
      type: "answered",
      selectedId,
      isCorrect,
      attempts: currentAttempts,
    };
    setAnswerState(newState);

    onAnswer?.({
      selectedOptionId: selectedId,
      wasCorrect: isCorrect,
      attempts: currentAttempts,
    });
  }, [selectedId, selectedOption, answerState, onAnswer]);

  const handleRetry = useCallback(() => {
    setSelectedId(null);
    setAnswerState({ type: "unanswered" });
  }, []);

  const handleShowHint = useCallback(() => {
    setAnswerState({ type: "showing_hint" });
  }, []);

  const handleHideHint = useCallback(() => {
    setAnswerState({ type: "unanswered" });
  }, []);

  const isAnswered = answerState.type === "answered";
  const showingHint = answerState.type === "showing_hint";
  const canRetry =
    isAnswered &&
    !answerState.isCorrect &&
    answerState.attempts < MAX_ATTEMPTS;
  const showCorrectAnswer =
    isAnswered &&
    !answerState.isCorrect &&
    answerState.attempts >= MAX_ATTEMPTS;

  // Get the option to show explanation for
  const explanationOption = isAnswered
    ? showCorrectAnswer
      ? correctOption
      : selectedOption
    : null;

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
          const isCorrectOption = option.isCorrect;
          const showAsCorrect = isAnswered && isCorrectOption && showCorrectAnswer;
          const showAsWrong =
            isAnswered && isSelected && !option.isCorrect;

          // Determine option styling
          let optionStyles = "border border-[var(--lo1-celestial)]/20 bg-[var(--lo1-space)]/30";
          if (showAsCorrect) {
            optionStyles = "bg-green-900/20 border border-green-500/40";
          } else if (showAsWrong) {
            optionStyles = "bg-amber-900/20 border border-amber-500/40";
          } else if (isSelected && !isAnswered) {
            optionStyles = "bg-[var(--lo1-gold)]/10 border border-[var(--lo1-gold)]/40";
          }

          // Custom radio button styling
          let radioStyles = "border-2 border-[var(--lo1-celestial)]/40";
          let radioInner = "";
          if (showAsCorrect) {
            radioStyles = "border-2 border-green-500 bg-green-500";
            radioInner = "bg-white";
          } else if (showAsWrong) {
            radioStyles = "border-2 border-amber-500 bg-amber-500";
            radioInner = "bg-white";
          } else if (isSelected) {
            radioStyles = "border-2 border-[var(--lo1-gold)] bg-[var(--lo1-gold)]";
            radioInner = "bg-[var(--lo1-space)]";
          }

          return (
            <label
              key={option.id}
              className={`
                flex items-center gap-3 p-3 rounded-lg transition-all
                ${optionStyles}
                ${isAnswered ? "cursor-default" : "cursor-pointer hover:bg-[var(--lo1-celestial)]/15 hover:border-[var(--lo1-celestial)]/40"}
                ${isSelected && !isAnswered ? "hover:bg-[var(--lo1-gold)]/15" : ""}
              `}
            >
              {/* Hidden native radio for accessibility */}
              <input
                type="radio"
                name={`mc-${section.question.slice(0, 20)}`}
                value={option.id}
                checked={isSelected}
                onChange={() => !isAnswered && setSelectedId(option.id)}
                disabled={isAnswered}
                className="sr-only"
              />
              {/* Custom radio circle */}
              <span
                className={`
                  flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-all
                  ${radioStyles}
                `}
              >
                {isSelected && (
                  <span className={`w-2 h-2 rounded-full ${radioInner}`} />
                )}
              </span>
              <span
                className={`
                  flex-1
                  ${isSelected && !isAnswered ? "text-[var(--lo1-starlight)]" : "text-[var(--lo1-text-light)]"}
                  ${showAsCorrect ? "text-green-300" : ""}
                  ${showAsWrong ? "text-amber-300" : ""}
                `}
              >
                {option.text}
              </span>
              {showAsCorrect && (
                <span className="text-green-400">✓</span>
              )}
              {showAsWrong && (
                <span className="text-amber-400">✗</span>
              )}
            </label>
          );
        })}
      </div>

      {/* Hint display (when shown) */}
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
        <div
          className={`
            mt-4 p-4 rounded-lg
            ${answerState.isCorrect ? "bg-green-900/20 border border-green-500/30" : ""}
            ${!answerState.isCorrect && !showCorrectAnswer ? "bg-amber-900/20 border border-amber-500/30" : ""}
            ${showCorrectAnswer ? "bg-[var(--lo1-indigo)]/40 border border-[var(--lo1-celestial)]/30" : ""}
          `}
          role="alert"
          aria-live="polite"
        >
          <p
            className={`
              font-medium mb-2
              ${answerState.isCorrect ? "text-green-300" : ""}
              ${!answerState.isCorrect && !showCorrectAnswer ? "text-amber-300" : ""}
              ${showCorrectAnswer ? "text-[var(--lo1-starlight)]" : ""}
            `}
          >
            {answerState.isCorrect && "That's right!"}
            {!answerState.isCorrect && !showCorrectAnswer && "Not quite, but let's explore this"}
            {showCorrectAnswer && `The answer is: "${correctOption?.text}"`}
          </p>

          <p className="text-sm text-[var(--lo1-text-light)] leading-relaxed">
            {explanationOption.explanation}
          </p>

          {showCorrectAnswer && (
            <p className="text-sm text-[var(--lo1-text-light)]/70 mt-3 italic">
              Don&apos;t worry, this is about learning, not testing. Take a moment to absorb this before continuing.
            </p>
          )}

          {/* Actions */}
          <div className="mt-4 flex flex-wrap gap-3">
            {canRetry && (
              <button
                onClick={handleRetry}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-amber-600/30 text-amber-200 hover:bg-amber-600/40 transition-colors cursor-pointer"
              >
                Try Again
              </button>
            )}

            {explanationOption.relatedPassage && (
              <a
                href={getQuoteUrl(explanationOption.relatedPassage)}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-lg text-sm font-medium text-[var(--lo1-gold)] hover:text-[var(--lo1-gold-light)] hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                Read more: {explanationOption.relatedPassage}
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

export default MultipleChoiceSection;
