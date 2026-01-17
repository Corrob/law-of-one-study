// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

export function buildContextFromQuotes(
  quotes: Array<{ text: string; reference: string; url: string }>
): string {
  return quotes
    .map((q, i) => {
      // Count sentences in the quote (normalize periods followed by capitals first)
      const normalized = q.text.replace(/\.(?=[A-Z])/g, ". ");
      const sentenceCount = normalized.split(/(?<=[.!?])\s+/).filter((s) => s.trim()).length;
      return `[${i + 1}] "${q.text}" — ${q.reference} (${sentenceCount} sentences)`;
    })
    .join("\n\n");
}
