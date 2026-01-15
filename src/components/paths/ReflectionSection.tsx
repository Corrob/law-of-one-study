"use client";

import { memo, useState, useCallback, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import type {
  ReflectionSection as ReflectionSectionType,
  SavedReflection,
} from "@/lib/schemas/study-paths";

interface ReflectionSectionProps {
  section: ReflectionSectionType;
  /** Previously saved reflection, if any */
  savedReflection?: SavedReflection | null;
  /** Callback when user saves their reflection */
  onSave?: (text: string) => void;
}

type ViewState =
  | { type: "editing"; text: string }
  | { type: "saved"; text: string; savedAt: string; updatedAt?: string }
  | { type: "editing_saved"; originalText: string; currentText: string };

/**
 * Format a date string for display.
 */
function formatDate(isoDate: string, locale: string): string {
  try {
    const date = new Date(isoDate);
    return date.toLocaleDateString(locale === "es" ? "es-ES" : "en-US", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

/**
 * Renders a reflection prompt with:
 * - Open-ended question
 * - Optional guiding thoughts
 * - Text area for response
 * - Save/skip options
 * - Display of saved responses with edit capability
 */
const ReflectionSection = memo(function ReflectionSection({
  section,
  savedReflection,
  onSave,
}: ReflectionSectionProps) {
  const locale = useLocale();
  const t = useTranslations("studyPaths.reflection");
  // Start in editing mode to show textarea directly (reduces friction)
  const [viewState, setViewState] = useState<ViewState>({ type: "editing", text: "" });
  const [isSaving, setIsSaving] = useState(false);

  // Initialize from saved reflection if available
  useEffect(() => {
    if (savedReflection?.text) {
      setViewState({
        type: "saved",
        text: savedReflection.text,
        savedAt: savedReflection.savedAt,
        updatedAt: savedReflection.updatedAt,
      });
    }
  }, [savedReflection]);

  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newText = e.target.value;
      setViewState((prev) => {
        if (prev.type === "editing_saved") {
          return { ...prev, currentText: newText };
        }
        return { type: "editing", text: newText };
      });
    },
    []
  );

  const handleSave = useCallback(async () => {
    const text =
      viewState.type === "editing"
        ? viewState.text
        : viewState.type === "editing_saved"
          ? viewState.currentText
          : "";

    if (!text.trim()) return;

    setIsSaving(true);
    try {
      await onSave?.(text);
      setViewState({
        type: "saved",
        text,
        savedAt: savedReflection?.savedAt || new Date().toISOString(),
        updatedAt: savedReflection ? new Date().toISOString() : undefined,
      });
    } finally {
      setIsSaving(false);
    }
  }, [viewState, onSave, savedReflection]);

  const handleEdit = useCallback(() => {
    if (viewState.type === "saved") {
      setViewState({
        type: "editing_saved",
        originalText: viewState.text,
        currentText: viewState.text,
      });
    }
  }, [viewState]);

  const handleCancelEdit = useCallback(() => {
    if (viewState.type === "editing_saved") {
      setViewState({
        type: "saved",
        text: viewState.originalText,
        savedAt: savedReflection?.savedAt || "",
        updatedAt: savedReflection?.updatedAt,
      });
    }
  }, [viewState, savedReflection]);

  const currentText =
    viewState.type === "editing"
      ? viewState.text
      : viewState.type === "editing_saved"
        ? viewState.currentText
        : "";

  const isEditing = viewState.type === "editing" || viewState.type === "editing_saved";
  const isSaved = viewState.type === "saved";

  const showMinLengthWarning =
    section.minLength && currentText.length > 0 && currentText.length < section.minLength;

  return (
    <div className="rounded-lg bg-[var(--lo1-space)]/50 border border-[var(--lo1-gold)]/20 p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-[var(--lo1-gold)]">✦</span>
          <h4 className="text-[var(--lo1-starlight)] font-medium">{t("title")}</h4>
        </div>
        {isSaved && (
          <span className="text-xs text-[var(--lo1-text-light)]/60">
            {t("saved", { date: formatDate(viewState.updatedAt || viewState.savedAt, locale) })}
          </span>
        )}
        {viewState.type === "editing_saved" && (
          <span className="text-xs text-[var(--lo1-gold)]">{t("editing")}</span>
        )}
      </div>

      {/* Prompt */}
      <p className="text-[var(--lo1-text-light)] mb-4 leading-relaxed">
        {section.prompt}
      </p>

      {/* Guiding thoughts */}
      {section.guidingThoughts && section.guidingThoughts.length > 0 && !isSaved && (
        <ul className="text-sm text-[var(--lo1-text-light)]/70 mb-4 space-y-1">
          {section.guidingThoughts.map((thought, index) => (
            <li key={index} className="flex items-start gap-2">
              <span className="text-[var(--lo1-celestial)]">•</span>
              {thought}
            </li>
          ))}
        </ul>
      )}

      {/* Text area for writing */}
      {isEditing && (
        <>
          <textarea
            value={currentText}
            onChange={handleTextChange}
            placeholder={section.placeholder || t("placeholder")}
            className="w-full h-32 p-3 rounded-lg bg-[var(--lo1-space)] border border-[var(--lo1-celestial)]/30
                       text-[var(--lo1-text-light)] placeholder-[var(--lo1-text-light)]/40
                       focus:outline-none focus:border-[var(--lo1-gold)]/50 focus:ring-1 focus:ring-[var(--lo1-gold)]/20
                       resize-none"
            aria-label={t("title")}
          />

          {showMinLengthWarning && section.minLength && (
            <p className="text-xs text-[var(--lo1-celestial)] mt-2">
              {t("expandThoughts", { count: section.minLength - currentText.length })}
            </p>
          )}

          {/* Actions */}
          <div className="mt-4 flex flex-wrap gap-3 justify-end">
            {viewState.type === "editing_saved" && (
              <button
                onClick={handleCancelEdit}
                className="px-4 py-2 rounded-lg text-sm text-[var(--lo1-text-light)] hover:text-[var(--lo1-starlight)] transition-colors cursor-pointer"
              >
                {t("cancel")}
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={!currentText.trim() || isSaving}
              className={`
                px-5 py-2 rounded-lg text-sm font-medium transition-all
                ${
                  currentText.trim() && !isSaving
                    ? "bg-[var(--lo1-gold)] text-[var(--lo1-space)] hover:bg-[var(--lo1-gold-light)] cursor-pointer"
                    : "border border-[var(--lo1-gold)]/30 text-[var(--lo1-gold)]/50 cursor-not-allowed"
                }
              `}
            >
              {isSaving ? t("saving") : viewState.type === "editing_saved" ? t("saveChanges") : t("saveReflection")}
            </button>
          </div>
        </>
      )}

      {/* Saved reflection display */}
      {isSaved && (
        <>
          <div className="p-4 rounded-lg bg-[var(--lo1-indigo)]/30 border border-[var(--lo1-gold)]/20">
            <p className="text-sm text-[var(--lo1-text-light)]/60 mb-2">{t("previousReflection")}</p>
            <p className="text-[var(--lo1-starlight)] whitespace-pre-wrap leading-relaxed">
              &ldquo;{viewState.text}&rdquo;
            </p>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={handleEdit}
              className="px-4 py-2 rounded-lg text-sm text-[var(--lo1-gold)] hover:text-[var(--lo1-gold-light)] hover:underline transition-colors cursor-pointer"
            >
              {t("editReflection")}
            </button>
          </div>
        </>
      )}
    </div>
  );
});

export default ReflectionSection;
