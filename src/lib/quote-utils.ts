// Utility functions for parsing and filtering Ra Material quotes

// Fetch full quote from sections JSON files
export async function fetchFullQuote(reference: string): Promise<string | null> {
  // Extract session number from reference (e.g., "49.8" -> "49" or "Ra 49.8" -> "49")
  const match = reference.match(/(\d+)\.\d+/);
  if (!match) {
    console.error("[fetchFullQuote] Failed to extract session number from:", reference);
    return null;
  }

  const sessionNumber = match[1];

  try {
    console.log("[fetchFullQuote] Fetching /sections/" + sessionNumber + ".json");
    const response = await fetch(`/sections/${sessionNumber}.json`);
    if (!response.ok) {
      console.error("[fetchFullQuote] HTTP error:", response.status, response.statusText);
      return null;
    }

    const data = await response.json();

    // Extract session.question from reference (e.g., "Ra 49.8" -> "49.8")
    const refMatch = reference.match(/(\d+\.\d+)/);
    if (!refMatch) {
      console.error("[fetchFullQuote] Failed to extract key from:", reference);
      return null;
    }

    const key = refMatch[1];
    console.log("[fetchFullQuote] Looking for key:", key, "in data");
    const fullText = data[key];

    if (!fullText) {
      console.error("[fetchFullQuote] Key not found in data. Available keys:", Object.keys(data).slice(0, 5));
    }

    return fullText || null;
  } catch (error) {
    console.error("[fetchFullQuote] Error fetching full quote:", error);
    return null;
  }
}

// Split text into sentences (handles Ra Material formatting)
export function splitIntoSentences(text: string): string[] {
  // Fix periods without spaces first (same normalization)
  const normalized = text.replace(/\.(?=[A-Z])/g, ". ");

  // Split on period followed by space or newline, question mark, or exclamation
  const sentences: string[] = [];
  const parts = normalized.split(/(?<=[.!?])\s+/);

  for (const part of parts) {
    if (part.trim()) {
      sentences.push(part.trim());
    }
  }

  return sentences;
}

// Paragraph data structure with sentence range
export interface Paragraph {
  type: "questioner" | "ra" | "text";
  content: string;
  sentenceStart: number; // 1-indexed
  sentenceEnd: number; // 1-indexed
}

// Parse Ra material text into paragraphs with sentence ranges
export function parseIntoParagraphs(text: string): Paragraph[] {
  // Split by speaker changes (Questioner: and Ra:)
  // Don't normalize yet - we need to detect paragraph breaks first
  const parts = text.split(/(?=\s(?:Questioner:|Ra:))/);

  const paragraphs: Paragraph[] = [];
  let sentenceIndex = 0; // Track which sentence we're at (0-indexed)

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    // Determine speaker type
    let type: "questioner" | "ra" | "text" = "text";
    let content = trimmed;

    if (trimmed.startsWith("Questioner:")) {
      type = "questioner";
      content = trimmed.substring("Questioner:".length).trim();
    } else if (trimmed.startsWith("Ra:")) {
      type = "ra";
      content = trimmed.substring("Ra:".length).trim();
    }

    // Split by paragraph breaks: period followed directly by uppercase (NO space)
    // This is how the original source denotes paragraph breaks
    const subParagraphs = content.split(/\.(?=[A-Z])/);

    for (let i = 0; i < subParagraphs.length; i++) {
      let paragraphText = subParagraphs[i].trim();

      // Re-add the period that was removed by split (except for last subparagraph)
      if (i < subParagraphs.length - 1) {
        paragraphText += ".";
      }

      if (!paragraphText) continue;

      // Count sentences in this paragraph
      const paragraphSentences = splitIntoSentences(paragraphText);
      const sentenceStart = sentenceIndex + 1; // Convert to 1-indexed
      sentenceIndex += paragraphSentences.length;
      const sentenceEnd = sentenceIndex; // Already 1-indexed

      paragraphs.push({
        type,
        content: paragraphText,
        sentenceStart,
        sentenceEnd,
      });
    }
  }

  return paragraphs;
}

// Filter paragraphs to those that intersect with the requested sentence range
export function filterParagraphsByRange(
  paragraphs: Paragraph[],
  sentenceStart: number,
  sentenceEnd: number
): Paragraph[] {
  return paragraphs.filter((p) => {
    // Check if paragraph's sentence range intersects with requested range
    return p.sentenceEnd >= sentenceStart && p.sentenceStart <= sentenceEnd;
  });
}

// Reconstruct text from paragraphs
export function reconstructTextFromParagraphs(
  paragraphs: Paragraph[],
  hasTextBefore: boolean,
  hasTextAfter: boolean
): string {
  const parts: string[] = [];
  let lastType: "questioner" | "ra" | "text" | null = null;

  for (let i = 0; i < paragraphs.length; i++) {
    const para = paragraphs[i];

    // Add speaker label if type changed
    if (para.type !== lastType) {
      if (para.type === "questioner") {
        parts.push("Questioner:");
      } else if (para.type === "ra") {
        parts.push("Ra:");
      }
      lastType = para.type;
    }

    // Add paragraph content
    parts.push(para.content);

    // Add paragraph break after this paragraph if:
    // - Not the last paragraph AND
    // - Next paragraph is same speaker (different speakers already get separated by labels)
    if (i < paragraphs.length - 1 && paragraphs[i + 1].type === para.type) {
      parts.push("\n\n");
    }
  }

  const text = parts.join(" ");

  // Add ellipsis as separate paragraphs
  const prefix = hasTextBefore ? "...\n\n" : "";
  const suffix = hasTextAfter ? "\n\n..." : "";

  return `${prefix}${text}${suffix}`;
}

// Format whole quote with paragraph breaks (no sentence range filtering)
export function formatWholeQuote(text: string): string {
  const allParagraphs = parseIntoParagraphs(text);
  // No filtering - use all paragraphs, no ellipsis needed
  return reconstructTextFromParagraphs(allParagraphs, false, false);
}

// Apply sentence range to quote text (main function to use)
export function applySentenceRangeToQuote(
  text: string,
  sentenceStart: number,
  sentenceEnd: number
): string {
  const allParagraphs = parseIntoParagraphs(text);
  const selectedParagraphs = filterParagraphsByRange(allParagraphs, sentenceStart, sentenceEnd);

  if (selectedParagraphs.length === 0) {
    return text; // Return original if no match
  }

  const hasTextBefore = selectedParagraphs[0].sentenceStart > 1;
  const hasTextAfter =
    selectedParagraphs[selectedParagraphs.length - 1].sentenceEnd <
    allParagraphs[allParagraphs.length - 1].sentenceEnd;

  return reconstructTextFromParagraphs(selectedParagraphs, hasTextBefore, hasTextAfter);
}
