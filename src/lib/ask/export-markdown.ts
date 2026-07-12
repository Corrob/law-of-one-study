/**
 * Export an Ask conversation as Markdown (revival of the old Seek "export
 * chat" feature). Assistant text keeps its own-words paraphrase; `{{CITE:...}}`
 * markers become links to the source on llresearch.org. No Ra Material is ever
 * reproduced verbatim — the export contains exactly what the user saw.
 */

import type { AskMessage } from "@/hooks/useAskStream";
import { renderCitationsToMarkdown } from "@/lib/ask/citations";
import { type AvailableLanguage, DEFAULT_LOCALE } from "@/lib/language-config";

export interface ExportLabels {
  /** Document heading, e.g. "Law of One Study — Ask Conversation". */
  title: string;
  /** Byline with the date already interpolated, e.g. "Exported on July 12, 2026". */
  exportedOn: string;
  /** Section heading for the user's turns. */
  you: string;
  /** Section heading for the assistant's turns. */
  guide: string;
}

/** Locale-aware "Month day, year" for the exported-on byline. */
export function formatExportDate(locale: AvailableLanguage = DEFAULT_LOCALE): string {
  const dateLocale = { en: "en-US", es: "es-ES", de: "de-DE", fr: "fr-FR" }[locale];
  return new Date().toLocaleDateString(dateLocale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** Render the conversation to a Markdown document. */
export function exportAskChatToMarkdown(
  messages: AskMessage[],
  locale: AvailableLanguage,
  labels: ExportLabels
): string {
  const lines: string[] = [`# ${labels.title}`, "", `_${labels.exportedOn}_`, ""];

  for (const message of messages) {
    if (message.content === "") continue; // in-flight placeholder
    if (message.role === "user") {
      lines.push(`## ${labels.you}`, "", message.content, "");
    } else {
      lines.push(`## ${labels.guide}`, "");
      if (message.disclaimer) {
        lines.push(`_${message.disclaimer}_`, "");
      }
      lines.push(renderCitationsToMarkdown(message.content, locale), "");
    }
  }

  return lines.join("\n");
}

/** Timestamped filename, e.g. `law-of-one-ask-2026-07-12-0930.md` (local time). */
export function exportFilename(now: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const time = `${pad(now.getHours())}${pad(now.getMinutes())}`;
  return `law-of-one-ask-${date}-${time}.md`;
}

/** Trigger a browser download of `content` as a Markdown file. */
export function downloadMarkdown(content: string, filename: string): void {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
