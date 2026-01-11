"use client";

import { memo } from "react";

interface QuizOptionProps {
  id: string;
  text: string;
  isSelected: boolean;
  isAnswered: boolean;
  isCorrectOption: boolean;
  showAsCorrect: boolean;
  showAsWrong: boolean;
  questionId: string;
  onSelect: () => void;
}

/**
 * Individual quiz option with radio button styling.
 */
const QuizOption = memo(function QuizOption({
  id,
  text,
  isSelected,
  isAnswered,
  showAsCorrect,
  showAsWrong,
  questionId,
  onSelect,
}: QuizOptionProps) {
  // Determine option container styling (theme-aware)
  let optionStyles = "border border-[var(--lo1-celestial)]/20 bg-[var(--lo1-space)]/30";
  if (showAsCorrect) {
    optionStyles = "bg-[var(--lo1-success-bg)] border border-[var(--lo1-success-border)]";
  } else if (showAsWrong) {
    optionStyles = "bg-[var(--lo1-warning-bg)] border border-[var(--lo1-warning-border)]";
  } else if (isSelected && !isAnswered) {
    optionStyles = "bg-[var(--lo1-gold)]/10 border border-[var(--lo1-gold)]/40";
  }

  // Determine radio button styling (theme-aware)
  let radioStyles = "border-2 border-[var(--lo1-celestial)]/40";
  let radioInner = "";
  if (showAsCorrect) {
    radioStyles = "border-2 border-[var(--lo1-success-text)] bg-[var(--lo1-success-text)]";
    radioInner = "bg-white";
  } else if (showAsWrong) {
    radioStyles = "border-2 border-[var(--lo1-warning-text)] bg-[var(--lo1-warning-text)]";
    radioInner = "bg-white";
  } else if (isSelected) {
    radioStyles = "border-2 border-[var(--lo1-gold)] bg-[var(--lo1-gold)]";
    radioInner = "bg-[var(--lo1-space)]";
  }

  // Determine text styling (theme-aware)
  let textStyles = "text-[var(--lo1-text-light)]";
  if (isSelected && !isAnswered) {
    textStyles = "text-[var(--lo1-starlight)]";
  } else if (showAsCorrect) {
    textStyles = "text-[var(--lo1-success-text)]";
  } else if (showAsWrong) {
    textStyles = "text-[var(--lo1-warning-text)]";
  }

  return (
    <label
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
        name={`mc-${questionId}`}
        value={id}
        checked={isSelected}
        onChange={() => !isAnswered && onSelect()}
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
      <span className={`flex-1 ${textStyles}`}>
        {text}
      </span>
      {showAsCorrect && <span className="text-[var(--lo1-success-text)]">✓</span>}
      {showAsWrong && <span className="text-[var(--lo1-warning-text)]">✗</span>}
    </label>
  );
});

export default QuizOption;
