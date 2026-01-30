import type { Message } from "@/lib/types";

/**
 * Converts chat messages to a markdown string for export.
 */
export function exportChatToMarkdown(messages: Message[], locale: string = "en"): string {
  const lines: string[] = [];

  const dateLocale = locale === "es" ? "es-ES" : locale === "de" ? "de-DE" : locale === "fr" ? "fr-FR" : "en-US";
  const dateStr = new Date().toLocaleDateString(dateLocale, { year: "numeric", month: "long", day: "numeric" });

  lines.push("# Law of One Study — Seek Conversation");
  lines.push("");
  lines.push(`_Exported on ${dateStr}_`);
  lines.push("");

  for (const message of messages) {
    if (message.role === "user") {
      lines.push("## You");
      lines.push("");
      lines.push(message.content);
      lines.push("");
    } else {
      lines.push("## Companion");
      lines.push("");

      if (message.segments && message.segments.length > 0) {
        for (const segment of message.segments) {
          if (segment.type === "text") {
            lines.push(segment.content);
            lines.push("");
          } else if (segment.type === "quote") {
            const quotedLines = segment.quote.text.split("\n").map((l) => `> ${l}`);
            lines.push(...quotedLines);
            lines.push(">");
            lines.push(`> — [${segment.quote.reference}](${segment.quote.url})`);
            lines.push("");
          }
        }
      } else {
        lines.push(message.content);
        lines.push("");
      }
    }
  }

  return lines.join("\n");
}

/**
 * Downloads a string as a markdown file.
 */
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
