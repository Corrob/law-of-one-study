/**
 * Search utilities for the Law of One Study app.
 */

export {
  textContainsTerms,
  splitIntoParagraphs,
  truncateAtParagraph,
  getSegmentDisplayContent,
  type TruncationResult,
  type TruncationOptions,
} from "./truncation";

export {
  getHighlightTerms,
  parseRaMaterialText,
  type SegmentType,
  type TextSegment,
} from "./highlight";
