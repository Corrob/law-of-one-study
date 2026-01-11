/**
 * Truncation utilities for search result display.
 * Pure functions for paragraph-based truncation with highlight awareness.
 */

export interface TruncationResult {
  /** The truncated (or full) content to display */
  content: string;
  /** Whether the content was truncated */
  isTruncated: boolean;
  /** Whether to show the expand/collapse button */
  needsButton: boolean;
}

export interface TruncationOptions {
  /** Minimum characters before considering truncation (default: 200) */
  minLength?: number;
  /** Terms to search for when determining where to truncate */
  highlightTerms?: string[];
}

const DEFAULT_MIN_LENGTH = 200;

/**
 * Check if text contains any of the given terms as word prefixes (case-insensitive).
 * For example, "law" matches "law" and "lawful" but not "flaw".
 */
export function textContainsTerms(text: string, terms: string[]): boolean {
  if (terms.length === 0) return false;
  // Use word boundary to match only at word starts (prefix match)
  const pattern = new RegExp(
    `\\b(${terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`,
    "i"
  );
  return pattern.test(text);
}

/**
 * Split text into paragraphs (by double newlines).
 */
export function splitIntoParagraphs(text: string): string[] {
  return text.split(/\n\n+/).filter(p => p.trim().length > 0);
}

/**
 * Truncate Ra's answer text at paragraph boundaries.
 *
 * Strategy:
 * 1. If text has no paragraphs or is short, show all
 * 2. Include paragraphs until one contains a highlighted term
 * 3. If no highlight found, show first paragraph only (never cut mid-paragraph)
 *
 * @param text - The full text content
 * @param options - Truncation options
 * @returns TruncationResult with content and metadata
 */
export function truncateAtParagraph(
  text: string,
  options: TruncationOptions = {}
): TruncationResult {
  const { minLength: _minLength = DEFAULT_MIN_LENGTH, highlightTerms = [] } = options;

  // Handle empty/short text
  if (!text || text.trim().length === 0) {
    return { content: text, isTruncated: false, needsButton: false };
  }

  const paragraphs = splitIntoParagraphs(text);

  // Single paragraph or very short - show all
  if (paragraphs.length <= 1) {
    return { content: text, isTruncated: false, needsButton: false };
  }

  // No highlight terms - show first paragraph only
  if (highlightTerms.length === 0) {
    const firstPara = paragraphs[0];
    const hasMore = paragraphs.length > 1;
    return {
      content: firstPara,
      isTruncated: hasMore,
      needsButton: hasMore,
    };
  }

  // Include paragraphs until we find one with a highlight
  const includedParagraphs: string[] = [];
  let foundHighlight = false;

  for (const para of paragraphs) {
    includedParagraphs.push(para);
    if (textContainsTerms(para, highlightTerms)) {
      foundHighlight = true;
      break;
    }
  }

  // If no highlight found in any paragraph, show first paragraph only
  if (!foundHighlight) {
    const hasMore = paragraphs.length > 1;
    return {
      content: paragraphs[0],
      isTruncated: hasMore,
      needsButton: hasMore,
    };
  }

  // Join included paragraphs
  const result = includedParagraphs.join("\n\n");
  const hasMore = includedParagraphs.length < paragraphs.length;

  return {
    content: result,
    isTruncated: hasMore,
    needsButton: hasMore,
  };
}

/**
 * Get display content for a segment.
 * Questions are always shown in full, Ra answers are truncated.
 *
 * @param segmentType - Type of segment ("questioner", "ra", or "text")
 * @param content - The segment content
 * @param isExpanded - Whether the segment is currently expanded
 * @param highlightTerms - Terms to consider when truncating
 * @returns TruncationResult with display content
 */
export function getSegmentDisplayContent(
  segmentType: "questioner" | "ra" | "text",
  content: string,
  isExpanded: boolean,
  highlightTerms: string[] = []
): TruncationResult {
  // Always show full question - only truncate Ra's answers
  if (segmentType !== "ra") {
    return { content, isTruncated: false, needsButton: false };
  }

  // If expanded, show all but keep button visible
  if (isExpanded) {
    return { content, isTruncated: false, needsButton: true };
  }

  // Truncate Ra's answer at paragraph boundary
  return truncateAtParagraph(content, { highlightTerms });
}
