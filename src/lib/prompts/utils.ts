// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

export function buildContextFromQuotes(
  quotes: Array<{ text: string; reference: string; url: string }>
): string {
  return quotes
    .map((q, i) => {
      // Count sentences in the quote
      const sentenceCount = q.text.split(/(?<=[.!?])\s+/).filter((s) => s.trim()).length;
      return `[${i + 1}] "${q.text}" — ${q.reference} (${sentenceCount} sentences)`;
    })
    .join("\n\n");
}
