"use client";

import { memo, useState } from "react";
import type { MultipleChoiceSection } from "@/lib/schemas/study-paths";

type Option = MultipleChoiceSection["options"][number];

interface QuizFeedbackProps {
  isCorrect: boolean;
  showCorrectAnswer: boolean;
  canRetry: boolean;
  explanationOption: Option;
  correctOption: Option | undefined;
  allOptions: Option[];
  onRetry: () => void;
}

/**
 * Get URL for a Ra Material reference.
 */
function getQuoteUrl(reference: string): string {
  const match = reference.match(/(\d+)\.(\d+)/);
  if (!match) return `https://lawofone.info`;
  const [, session, question] = match;
  return `https://lawofone.info/s/${session}#${question}`;
}

/**
 * Feedback panel shown after answering a quiz question.
 * Includes the result message, explanation, retry button, and expandable other explanations.
 */
const QuizFeedback = memo(function QuizFeedback({
  isCorrect,
  showCorrectAnswer,
  canRetry,
  explanationOption,
  correctOption,
  allOptions,
  onRetry,
}: QuizFeedbackProps) {
  const [showOtherExplanations, setShowOtherExplanations] = useState(false);

  // Determine container styling based on state
  let containerStyles = "";
  if (isCorrect) {
    containerStyles = "bg-green-900/20 border border-green-500/30";
  } else if (!showCorrectAnswer) {
    containerStyles = "bg-amber-900/20 border border-amber-500/30";
  } else {
    containerStyles = "bg-[var(--lo1-indigo)]/40 border border-[var(--lo1-celestial)]/30";
  }

  // Determine header text styling
  let headerStyles = "";
  if (isCorrect) {
    headerStyles = "text-green-300";
  } else if (!showCorrectAnswer) {
    headerStyles = "text-amber-300";
  } else {
    headerStyles = "text-[var(--lo1-starlight)]";
  }

  // Get header message
  let headerMessage = "";
  if (isCorrect) {
    headerMessage = "That's right!";
  } else if (!showCorrectAnswer) {
    headerMessage = "Not quite, but let's explore this";
  } else {
    headerMessage = `The answer is: "${correctOption?.text}"`;
  }

  const wrongOptions = allOptions.filter((o) => !o.isCorrect);
  const showOtherExplanationsToggle = isCorrect || showCorrectAnswer;

  return (
    <div
      className={`mt-4 p-4 rounded-lg ${containerStyles}`}
      role="alert"
      aria-live="polite"
    >
      <p className={`font-medium mb-2 ${headerStyles}`}>
        {headerMessage}
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
            onClick={onRetry}
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

      {/* Other explanations toggle */}
      {showOtherExplanationsToggle && wrongOptions.length > 0 && (
        <div className="mt-4 pt-3 border-t border-[var(--lo1-celestial)]/20">
          <button
            onClick={() => setShowOtherExplanations(!showOtherExplanations)}
            className="text-sm text-[var(--lo1-text-light)]/60 hover:text-[var(--lo1-celestial)] transition-colors cursor-pointer flex items-center gap-1"
          >
            <svg
              className={`w-4 h-4 transition-transform ${showOtherExplanations ? "rotate-90" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            {showOtherExplanations ? "Hide other explanations" : "Why were the others wrong?"}
          </button>

          {showOtherExplanations && (
            <div className="mt-3 space-y-3">
              {wrongOptions.map((option) => (
                <div
                  key={option.id}
                  className="text-sm p-3 rounded-lg bg-[var(--lo1-space)]/50 border border-[var(--lo1-celestial)]/10"
                >
                  <p className="text-[var(--lo1-text-light)]/80 font-medium mb-1">
                    &ldquo;{option.text}&rdquo;
                  </p>
                  <p className="text-[var(--lo1-text-light)]/60">
                    {option.explanation}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

export default QuizFeedback;
