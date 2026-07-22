/**
 * Confederation conscious-channeling themes for the Ask feature.
 *
 * A curated, English-only grounding layer over L/L Research's conscious
 * channeling library (Q'uo, Latwii, Hatonn) — the same copyright-safe pattern
 * as the hidden supplements: alias-matched themes with OUR-WORDS summaries
 * (never transcript text) plus whitelisted, dated references the model may
 * cite with {{QCITE:id}} markers. Injected only when the user has enabled the
 * channeling option and the locale is English (the transcripts have no
 * translations). See docs/ask-channeling-option-design.md.
 */

import { z } from "zod";
import channelingData from "@/data/ask-channeling.json";
import {
  CHANNELING_REFERENCE_ID_PATTERN,
  getChannelingReference,
} from "./channeling-references";

const ChannelingThemeSchema = z.object({
  id: z.string().min(1),
  aliases: z.array(z.string().min(1)).min(1),
  summary: z.string().min(1),
  references: z.array(z.string().regex(CHANNELING_REFERENCE_ID_PATTERN)).min(1),
});

const ChannelingFileSchema = z.object({
  note: z.string().optional(),
  themes: z.array(ChannelingThemeSchema),
});

export type ChannelingTheme = z.infer<typeof ChannelingThemeSchema>;

const THEMES: ChannelingTheme[] = ChannelingFileSchema.parse(channelingData).themes;

/** All curated themes (for validation and tests). */
export function getChannelingThemes(): readonly ChannelingTheme[] {
  return THEMES;
}

// Compiled matcher: one alternation regex plus an alias→theme lookup, built
// once (English-only, so no per-locale cache like supplements.ts needs).
interface Matcher {
  regex: RegExp;
  byAlias: Map<string, ChannelingTheme>;
}
let _matcher: Matcher | null = null;

function getMatcher(): Matcher {
  if (_matcher) return _matcher;

  const byAlias = new Map<string, ChannelingTheme>();
  for (const theme of THEMES) {
    for (const alias of theme.aliases) {
      byAlias.set(alias.toLowerCase(), theme);
    }
  }

  // Longest first so multi-word phrases win over any shorter substring.
  const unique = [...byAlias.keys()].sort((a, b) => b.length - a.length);
  const escaped = unique.map((a) => a.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&"));
  // Unicode-aware word boundaries (same rationale as supplements.ts); `(?!)`
  // never matches — a safe global fallback when there are no aliases.
  const boundaryBefore = "(?<![\\p{L}\\p{N}_])";
  const boundaryAfter = "(?![\\p{L}\\p{N}_])";
  const regex =
    escaped.length > 0
      ? new RegExp(`${boundaryBefore}(${escaped.join("|")})${boundaryAfter}`, "giu")
      : /(?!)/g;

  _matcher = { regex, byAlias };
  return _matcher;
}

/**
 * Find channeling themes whose aliases appear in `text`. Returns unique themes
 * in order of first appearance.
 */
export function identifyChannelingThemes(text: string): ChannelingTheme[] {
  const { regex, byAlias } = getMatcher();
  const seen = new Set<string>();
  const result: ChannelingTheme[] = [];
  for (const match of text.matchAll(regex)) {
    const theme = byAlias.get(match[1].toLowerCase());
    if (theme && !seen.has(theme.id)) {
      seen.add(theme.id);
      result.push(theme);
    }
  }
  return result;
}

/**
 * Build the focused-grounding block for matched channeling themes: our-words
 * summaries with the QCITE references the model may cite, plus the attribution
 * rules that keep the conscious channeling distinct from the Ra contact.
 * Returns "" when there are none.
 */
export function buildChannelingGrounding(themes: ChannelingTheme[]): string {
  if (themes.length === 0) return "";
  const lines: string[] = [
    "CONFEDERATION CHANNELING TOPICS (from L/L Research's later CONSCIOUS channeling — our summaries):",
    "Attribute these by source name (\"Q'uo suggests…\") and cite them ONLY with {{QCITE:id}} markers using ids from this list — never {{CITE:...}}, and never blend them with Ra's voice.",
  ];
  for (const theme of themes) {
    const refs = theme.references
      .map((id) => {
        const known = getChannelingReference(id);
        return known ? `${id} (${known.source})` : id;
      })
      .join(", ");
    lines.push(`- ${theme.summary} [QCITE refs: ${refs}]`);
  }
  return lines.join("\n");
}

/** Every reference across all themes (for validation and tests). */
export function getChannelingThemeReferences(): string[] {
  return [...new Set(THEMES.flatMap((t) => t.references))];
}
