// Utility functions for parsing and filtering Ra Material quotes

import { debug } from "@/lib/debug";
import { type AvailableLanguage } from "./language-config";

// Result of parsing a session/question reference from user query
export interface SessionQuestionRef {
  session: number;
  question?: number; // undefined means "all questions in session"
}

/**
 * Parse session/question references from user queries.
 * Supports patterns like:
 * - "session 5" → { session: 5 }
 * - "question 5.1" or "5.1" → { session: 5, question: 1 }
 * - "Ra 5.1" → { session: 5, question: 1 }
 * - "show me 5.1" → { session: 5, question: 1 }
 * - "s5q1" or "s5" → { session: 5, question: 1 } or { session: 5 }
 * - lawofone.info/s/5#1 → { session: 5, question: 1 }
 */
export function parseSessionQuestionReference(query: string): SessionQuestionRef | null {
  const normalized = query.toLowerCase().trim();

  // Pattern 1: URL format - lawofone.info/s/SESSION#QUESTION
  const urlMatch = normalized.match(/lawofone\.info\/s\/(\d+)(?:#(\d+))?/);
  if (urlMatch) {
    return {
      session: parseInt(urlMatch[1], 10),
      question: urlMatch[2] ? parseInt(urlMatch[2], 10) : undefined,
    };
  }

  // Pattern 2: Explicit "session X" or "session X question Y"
  const sessionMatch = normalized.match(/session\s+(\d+)(?:\s+question\s+(\d+))?/);
  if (sessionMatch) {
    return {
      session: parseInt(sessionMatch[1], 10),
      question: sessionMatch[2] ? parseInt(sessionMatch[2], 10) : undefined,
    };
  }

  // Pattern 3: "question X.Y" format
  const questionMatch = normalized.match(/question\s+(\d+)\.(\d+)/);
  if (questionMatch) {
    return {
      session: parseInt(questionMatch[1], 10),
      question: parseInt(questionMatch[2], 10),
    };
  }

  // Pattern 4: Shorthand "s5q1" or "s5"
  const shorthandMatch = normalized.match(/\bs(\d+)(?:q(\d+))?\b/);
  if (shorthandMatch) {
    return {
      session: parseInt(shorthandMatch[1], 10),
      question: shorthandMatch[2] ? parseInt(shorthandMatch[2], 10) : undefined,
    };
  }

  // Pattern 5: "Ra X.Y" or just "X.Y" (but only if it looks like a reference)
  // Must be preceded by "ra", "show", "find", "get", "read", or start of string/whitespace
  const raRefMatch = normalized.match(/(?:^|ra\s+|show\s+(?:me\s+)?|find\s+|get\s+|read\s+)(\d{1,3})\.(\d{1,2})\b/);
  if (raRefMatch) {
    const session = parseInt(raRefMatch[1], 10);
    const question = parseInt(raRefMatch[2], 10);
    // Validate: sessions are 1-106, questions typically 0-30ish
    if (session >= 1 && session <= 106 && question >= 0 && question <= 50) {
      return { session, question };
    }
  }

  // Pattern 6: Standalone "X.Y" at word boundary when query is short/focused
  // Only match if the query seems to be primarily about finding this reference
  if (normalized.length < 30) {
    const standaloneMatch = normalized.match(/\b(\d{1,3})\.(\d{1,2})\b/);
    if (standaloneMatch) {
      const session = parseInt(standaloneMatch[1], 10);
      const question = parseInt(standaloneMatch[2], 10);
      if (session >= 1 && session <= 106 && question >= 0 && question <= 50) {
        return { session, question };
      }
    }
  }

  return null;
}

// Re-export language types from centralized config
// Note: Only languages with actual Ra Material translations are available
export { AVAILABLE_LANGUAGES, type AvailableLanguage } from './language-config';

// Alias for backwards compatibility
export type SupportedLanguage = import('./language-config').AvailableLanguage;

// Fetch full quote from sections JSON files
// Language defaults to 'en' for backwards compatibility
export async function fetchFullQuote(
  reference: string,
  language: AvailableLanguage = 'en'
): Promise<string | null> {
  // Validate language - only allow known languages
  const validLanguages = ['en', 'es'] as const;
  if (!validLanguages.includes(language as typeof validLanguages[number])) {
    debug.log("[fetchFullQuote] Invalid language, defaulting to English:", language);
    language = 'en';
  }

  // Extract session number from reference (e.g., "49.8" -> "49" or "Ra 49.8" -> "49")
  const match = reference.match(/(\d+)\.\d+/);
  if (!match) {
    debug.error("[fetchFullQuote] Failed to extract session number from:", reference);
    return null;
  }

  const sessionNumber = match[1];

  // Validate session number is within valid range (1-106)
  const sessionNum = parseInt(sessionNumber, 10);
  if (isNaN(sessionNum) || sessionNum < 1 || sessionNum > 106) {
    debug.error("[fetchFullQuote] Invalid session number:", sessionNumber);
    return null;
  }

  try {
    const path = `/sections/${language}/${sessionNumber}.json`;
    debug.log("[fetchFullQuote] Fetching", path);
    const response = await fetch(path);
    if (!response.ok) {
      // If translation not available, fall back to English
      if (language !== 'en') {
        debug.log("[fetchFullQuote] Translation not found, falling back to English");
        return fetchFullQuote(reference, 'en');
      }
      debug.error("[fetchFullQuote] HTTP error:", response.status, response.statusText);
      return null;
    }

    const data = await response.json();

    // Extract session.question from reference (e.g., "Ra 49.8" -> "49.8")
    const refMatch = reference.match(/(\d+\.\d+)/);
    if (!refMatch) {
      debug.error("[fetchFullQuote] Failed to extract key from:", reference);
      return null;
    }

    const key = refMatch[1];
    debug.log("[fetchFullQuote] Looking for key:", key, "in data");
    const fullText = data[key];

    if (!fullText) {
      debug.error("[fetchFullQuote] Key not found in data. Available keys:", Object.keys(data).slice(0, 5));
    }

    return fullText || null;
  } catch (error) {
    // Network errors are common during development (hot reload, etc.)
    // Log quietly and return null instead of throwing
    if (error instanceof TypeError && (error.message === 'Failed to fetch' || error.message.includes('fetch'))) {
      debug.log("[fetchFullQuote] Network error (likely dev server reload):", reference);
    } else {
      debug.error("[fetchFullQuote] Error fetching full quote:", error);
    }
    return null;
  }
}

// Fetch quote in both target language and English for bilingual display
export async function fetchBilingualQuote(
  reference: string,
  language: AvailableLanguage
): Promise<{ text: string; originalText?: string } | null> {
  if (language === 'en') {
    const text = await fetchFullQuote(reference, 'en');
    return text ? { text } : null;
  }

  // Fetch both translations in parallel
  const [translatedText, englishText] = await Promise.all([
    fetchFullQuote(reference, language),
    fetchFullQuote(reference, 'en'),
  ]);

  if (!translatedText && !englishText) {
    return null;
  }

  // If translation not available, use English only
  if (!translatedText) {
    return englishText ? { text: englishText } : null;
  }

  return {
    text: translatedText,
    originalText: englishText || undefined,
  };
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

// Format quote text for copying with proper paragraph breaks between speakers
export function formatQuoteForCopy(text: string): string {
  // Split by Questioner: and Ra: labels
  const parts: string[] = [];
  const segments = text.split(/(Questioner:|Ra:)/);

  let currentLabel = "";

  for (const segment of segments) {
    const trimmed = segment.trim();
    if (!trimmed) continue;

    if (trimmed === "Questioner:" || trimmed === "Ra:") {
      currentLabel = trimmed;
    } else {
      // Add label if we have one
      if (currentLabel) {
        if (parts.length > 0) {
          parts.push("\n\n"); // Paragraph break before new speaker
        }
        parts.push(currentLabel);
        currentLabel = "";
      }
      parts.push(" ");
      parts.push(trimmed);
    }
  }

  return parts.join("").trim();
}

/**
 * Format a quote with attribution and source URL for clipboard copying.
 * Produces a consistent format across the app:
 *
 * "{quote text}"
 * — Ra {session.question}
 *
 * https://lawofone.info/s/{session}#{question}
 */
export function formatQuoteWithAttribution(
  text: string,
  reference: string,
  url: string
): string {
  // Clean up text - format with paragraph breaks if it has speakers
  const formattedText = formatQuoteForCopy(text);
  return `"${formattedText}"\n— ${reference}\n\n${url}`;
}

// Apply sentence range to quote text (main function to use)
export function applySentenceRangeToQuote(
  text: string,
  sentenceStart: number,
  sentenceEnd: number
): string {
  debug.log("[applySentenceRangeToQuote] Input text length:", text.length);
  debug.log("[applySentenceRangeToQuote] Sentence range:", sentenceStart, "-", sentenceEnd);

  const allParagraphs = parseIntoParagraphs(text);
  debug.log("[applySentenceRangeToQuote] Total paragraphs:", allParagraphs.length);
  console.log(
    "[applySentenceRangeToQuote] Paragraph ranges:",
    allParagraphs.map((p) => `${p.sentenceStart}-${p.sentenceEnd}`)
  );

  const selectedParagraphs = filterParagraphsByRange(allParagraphs, sentenceStart, sentenceEnd);
  debug.log("[applySentenceRangeToQuote] Selected paragraphs:", selectedParagraphs.length);

  if (selectedParagraphs.length === 0) {
    console.warn(
      "[applySentenceRangeToQuote] No paragraphs matched range, returning original text"
    );
    return text; // Return original if no match
  }

  const hasTextBefore = selectedParagraphs[0].sentenceStart > 1;
  const hasTextAfter =
    selectedParagraphs[selectedParagraphs.length - 1].sentenceEnd <
    allParagraphs[allParagraphs.length - 1].sentenceEnd;

  const result = reconstructTextFromParagraphs(selectedParagraphs, hasTextBefore, hasTextAfter);
  debug.log("[applySentenceRangeToQuote] Result length:", result.length);
  debug.log("[applySentenceRangeToQuote] Has ellipsis:", hasTextBefore, hasTextAfter);

  return result;
}
