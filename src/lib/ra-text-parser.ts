/**
 * Shared utilities for parsing Ra Material text.
 * Used by QuoteCard, AnimatedQuoteCard, and BilingualQuoteCard.
 */

import { buildSpeakerPrefixPattern, isQuestionerPrefix, isRaPrefix } from "./language-config";

export interface TextSegment {
  type: "questioner" | "ra" | "text";
  content: string;
}

// Cached pattern for performance
let cachedPattern: RegExp | null = null;

function getSpeakerPattern(): RegExp {
  if (!cachedPattern) {
    cachedPattern = buildSpeakerPrefixPattern();
  }
  return cachedPattern;
}

/**
 * Parse Ra material text into formatted segments for display.
 * Handles speaker prefixes in all supported languages.
 */
export function parseRaText(text: string): TextSegment[] {
  const segments: TextSegment[] = [];

  // Handle empty or undefined text
  if (!text || !text.trim()) {
    return [{ type: "text", content: "" }];
  }

  // Split by all speaker prefixes
  const pattern = getSpeakerPattern();
  const parts = text.split(pattern);

  let currentType: "questioner" | "ra" | "text" = "text";

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    if (isQuestionerPrefix(trimmed)) {
      currentType = "questioner";
    } else if (isRaPrefix(trimmed)) {
      currentType = "ra";
    } else {
      segments.push({ type: currentType, content: trimmed });
    }
  }

  // If no segments were found, treat entire text as a single segment
  if (segments.length === 0) {
    segments.push({ type: "text", content: text.trim() });
  }

  return segments;
}

/**
 * Parse ellipsis markers from text (added by backend for partial quotes).
 */
export function parseEllipsis(text: string): {
  hasLeading: boolean;
  hasTrailing: boolean;
  content: string;
} {
  let content = text;
  const hasLeading = text.startsWith("...\n\n") || text.startsWith("...");
  const hasTrailing = text.endsWith("\n\n...") || text.endsWith("...");

  if (hasLeading) {
    content = content.replace(/^\.\.\.(\n\n)?/, "");
  }
  if (hasTrailing) {
    content = content.replace(/(\n\n)?\.\.\.$/, "");
  }

  return { hasLeading, hasTrailing, content };
}

/**
 * Extract just the session.question from reference like "Ra 49.8".
 * For confederation references like "Q'uo, 2024-01-24", returns the full reference.
 */
export function getShortReference(reference: string): string {
  const match = reference.match(/(\d+\.\d+)/);
  return match ? match[1] : reference;
}

/** Ra reference pattern: "50.7" or "Ra 50.7" */
const RA_REF_PATTERN = /^\s*(Ra\s+)?\d+\.\d+\s*$/;

/**
 * Check if a quote reference is from Ra Material (e.g., "50.7" or "Ra 50.7").
 */
export function isRaReference(reference: string): boolean {
  return RA_REF_PATTERN.test(reference);
}

/**
 * Extract entity name from a confederation reference like "Q'uo, 2024-01-24".
 * Returns the entity name (e.g., "Q'uo") or null if not a confederation reference.
 */
export function getConfederationEntity(reference: string): string | null {
  if (isRaReference(reference)) return null;
  // Confederation references are typically "Entity, YYYY-MM-DD"
  const commaIdx = reference.indexOf(",");
  if (commaIdx > 0) {
    return reference.slice(0, commaIdx).trim();
  }
  // If no comma, just return the reference itself as the entity name
  return reference.trim() || null;
}
