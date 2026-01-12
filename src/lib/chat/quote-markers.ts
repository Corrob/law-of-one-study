/**
 * Quote and citation marker detection utilities for streaming SSE responses.
 *
 * Handles partial marker buffering when chunks split markers like
 * {{QUOTE:N}}, {{QUOTE:N:sX:sY}}, or {{CITE:N}} across network packets.
 */

/**
 * Complete regex for matching full quote markers
 * Captures: [1] quote index, [2] optional start sentence, [3] optional end sentence
 */
export const QUOTE_MARKER_REGEX = /\{\{QUOTE:(\d+)(?::s(\d+):s(\d+))?\}\}/;

/**
 * Complete regex for matching full citation markers
 * Captures: [1] passage index
 */
export const CITE_MARKER_REGEX = /\{\{CITE:(\d+)\}\}/;

/**
 * Check if a string could be the start of a quote marker that spans multiple chunks.
 *
 * The LLM streams text in chunks that may split a quote marker like `{{QUOTE:1}}` or
 * `{{QUOTE:2:s3:s7}}` across multiple chunks. This function detects partial markers
 * so we can buffer them until complete.
 *
 * ## Marker Formats Supported
 *
 * - **Simple marker:** `{{QUOTE:N}}` - Insert full quote at index N
 * - **Range marker:** `{{QUOTE:N:sX:sY}}` - Insert sentences X through Y from quote N
 *
 * ## Partial Match Patterns
 *
 * The function checks for these progressive partial states:
 *
 * ```
 * Stage 1: Static prefixes being built up
 *   "{"           -> could become {{QUOTE:...
 *   "{{"          -> could become {{QUOTE:...
 *   "{{Q"         -> building "QUOTE"
 *   "{{QU"        -> building "QUOTE"
 *   "{{QUO"       -> building "QUOTE"
 *   "{{QUOT"      -> building "QUOTE"
 *   "{{QUOTE"     -> complete keyword, awaiting ":"
 *   "{{QUOTE:"    -> awaiting quote index number
 *
 * Stage 2: Quote index being built (regex patterns)
 *   "{{QUOTE:1"   -> /^\{\{QUOTE:\d+$/      (index in progress)
 *   "{{QUOTE:12}" -> /^\{\{QUOTE:\d+\}$/    (awaiting second "}")
 *
 * Stage 3: Sentence range being built (for :sX:sY format)
 *   "{{QUOTE:1:"  -> /^\{\{QUOTE:\d+:$/     (awaiting "s")
 *   "{{QUOTE:1:s" -> /^\{\{QUOTE:\d+:s$/    (awaiting start number)
 *   "{{QUOTE:1:s3"-> /^\{\{QUOTE:\d+:s\d+$/ (start number in progress)
 *   "{{QUOTE:1:s3:"   -> awaiting second "s"
 *   "{{QUOTE:1:s3:s"  -> awaiting end number
 *   "{{QUOTE:1:s3:s7" -> /^\{\{QUOTE:\d+:s\d+:s\d+$/  (end number in progress)
 *   "{{QUOTE:1:s3:s7}"-> /^\{\{QUOTE:\d+:s\d+:s\d+\}$/(awaiting second "}")
 * ```
 *
 * @param s - The string fragment to check
 * @returns true if this could be a partial quote marker, false otherwise
 *
 * @example
 * ```ts
 * couldBePartialMarker("{")           // true - could become {{QUOTE:...
 * couldBePartialMarker("{{QUOTE:")    // true - awaiting index
 * couldBePartialMarker("{{QUOTE:1")   // true - index incomplete, might have more digits
 * couldBePartialMarker("{{QUOTE:1}}") // false - this is a COMPLETE marker
 * couldBePartialMarker("Hello")       // false - not a marker prefix
 * ```
 */
export function couldBePartialMarker(s: string): boolean {
  // Stage 1: Static prefixes - building up to "{{QUOTE:" or "{{CITE:"
  // Note: "{", "{{" are shared prefixes for both QUOTE and CITE markers
  const sharedPrefixes = ["{", "{{"];
  if (sharedPrefixes.includes(s)) return true;

  // QUOTE marker prefixes
  const quotePrefixes = ["{{Q", "{{QU", "{{QUO", "{{QUOT", "{{QUOTE", "{{QUOTE:"];
  if (quotePrefixes.includes(s)) return true;

  // CITE marker prefixes
  const citePrefixes = ["{{C", "{{CI", "{{CIT", "{{CITE", "{{CITE:"];
  if (citePrefixes.includes(s)) return true;

  // Stage 2: Quote index in progress - {{QUOTE:N (where N is one or more digits)
  if (/^\{\{QUOTE:\d+$/.test(s)) return true;

  // Simple marker almost complete - {{QUOTE:N} (awaiting second "}")
  if (/^\{\{QUOTE:\d+\}$/.test(s)) return true;

  // Stage 3: Sentence range - for {{QUOTE:N:sX:sY}} format
  if (/^\{\{QUOTE:\d+:$/.test(s)) return true; // awaiting "s" for start
  if (/^\{\{QUOTE:\d+:s$/.test(s)) return true; // awaiting start sentence number
  if (/^\{\{QUOTE:\d+:s\d+$/.test(s)) return true; // start number in progress
  if (/^\{\{QUOTE:\d+:s\d+:$/.test(s)) return true; // awaiting "s" for end
  if (/^\{\{QUOTE:\d+:s\d+:s$/.test(s)) return true; // awaiting end sentence number
  if (/^\{\{QUOTE:\d+:s\d+:s\d+$/.test(s)) return true; // end number in progress
  if (/^\{\{QUOTE:\d+:s\d+:s\d+\}$/.test(s)) return true; // awaiting second "}"

  // CITE marker in progress - {{CITE:N
  if (/^\{\{CITE:\d+$/.test(s)) return true;

  // CITE marker almost complete - {{CITE:N} (awaiting second "}")
  if (/^\{\{CITE:\d+\}$/.test(s)) return true;

  return false;
}

/**
 * Maximum characters to scan backward for partial markers
 * Longest partial: "{{QUOTE:99:s99:s99}" = 20 chars, rounded up for safety
 */
export const MAX_PARTIAL_MARKER_LENGTH = 25;
