/**
 * Hidden, LLM-only grounding supplements for the Ask feature.
 *
 * Some keywords/phrases Ra discusses are NOT concepts in the visual graph, so
 * `identifyConcepts` never matches them and the model gets no grounding and no
 * citable reference (e.g. "men in black" → 12.21). These supplements fill that
 * gap: they are matched against the user's question, injected into the focused
 * grounding as short OUR-WORDS summaries (never verbatim Ra text), and their
 * references are added to the citation whitelist. They never appear in the
 * visual concept graph — the graph code doesn't read this file.
 */

import { z } from "zod";
import { type AvailableLanguage, DEFAULT_LOCALE } from "@/lib/language-config";
import supplementsData from "@/data/ask-supplements.json";

// English is required; other locales are optional and fall back to English.
const LocalizedStringSchema = z.object({
  en: z.string().min(1),
  es: z.string().optional(),
  de: z.string().optional(),
  fr: z.string().optional(),
});

const LocalizedAliasesSchema = z.object({
  en: z.array(z.string().min(1)).min(1),
  es: z.array(z.string()).optional(),
  de: z.array(z.string()).optional(),
  fr: z.array(z.string()).optional(),
});

const SupplementSchema = z.object({
  id: z.string().min(1),
  aliases: LocalizedAliasesSchema,
  summary: LocalizedStringSchema,
  references: z.array(z.string().regex(/^\d+\.\d+$/)).min(1),
});

const SupplementsFileSchema = z.object({
  note: z.string().optional(),
  supplements: z.array(SupplementSchema),
});

export type Supplement = z.infer<typeof SupplementSchema>;

const SUPPLEMENTS: Supplement[] = SupplementsFileSchema.parse(supplementsData).supplements;

/** A localized field value, falling back to English when the locale is absent. */
function pickText(field: Supplement["summary"], locale: AvailableLanguage): string {
  return field[locale] ?? field.en;
}
function pickAliases(field: Supplement["aliases"], locale: AvailableLanguage): string[] {
  return field[locale] ?? field.en;
}

// Compiled matcher per locale: a regex plus an alias→supplement lookup.
interface Matcher {
  regex: RegExp;
  byAlias: Map<string, Supplement>;
}
const _matcherCache = new Map<AvailableLanguage, Matcher>();

function getMatcher(locale: AvailableLanguage): Matcher {
  const cached = _matcherCache.get(locale);
  if (cached) return cached;

  const byAlias = new Map<string, Supplement>();
  const aliases: string[] = [];
  for (const supplement of SUPPLEMENTS) {
    for (const alias of pickAliases(supplement.aliases, locale)) {
      if (!alias) continue;
      aliases.push(alias);
      byAlias.set(alias.toLowerCase(), supplement);
    }
  }

  // Longest first so multi-word phrases win over any shorter substring.
  const unique = [...new Set(aliases)].filter((a) => a.length > 0);
  unique.sort((a, b) => b.length - a.length);
  const escaped = unique.map((a) => a.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&"));
  // `(?!)` never matches — a safe global fallback when there are no aliases
  // (String.matchAll requires a global regex).
  const regex =
    escaped.length > 0 ? new RegExp(`\\b(${escaped.join("|")})\\b`, "gi") : /(?!)/g;

  const matcher: Matcher = { regex, byAlias };
  _matcherCache.set(locale, matcher);
  return matcher;
}

/**
 * Find supplements whose aliases appear in `text`. Returns unique supplements in
 * order of first appearance. Falls back to English aliases for locales that
 * don't define their own.
 */
export function identifySupplements(
  text: string,
  locale: AvailableLanguage = DEFAULT_LOCALE
): Supplement[] {
  const { regex, byAlias } = getMatcher(locale);
  const seen = new Set<string>();
  const result: Supplement[] = [];
  for (const match of text.matchAll(regex)) {
    const supplement = byAlias.get(match[1].toLowerCase());
    if (supplement && !seen.has(supplement.id)) {
      seen.add(supplement.id);
      result.push(supplement);
    }
  }
  return result;
}

/**
 * Build a focused-grounding block for the matched supplements. Each line is an
 * our-words summary plus the references the model may cite. Returns "" when
 * there are none.
 */
export function buildSupplementGrounding(
  supplements: Supplement[],
  locale: AvailableLanguage = DEFAULT_LOCALE
): string {
  if (supplements.length === 0) return "";
  const lines: string[] = [
    "ADDITIONAL RELEVANT TOPICS (our summaries; cite the listed references):",
  ];
  for (const supplement of supplements) {
    lines.push(`- ${pickText(supplement.summary, locale)} [refs: ${supplement.references.join(", ")}]`);
  }
  return lines.join("\n");
}

/** Every reference across all supplements (for the citation whitelist / validation). */
export function getSupplementReferences(): string[] {
  return [...new Set(SUPPLEMENTS.flatMap((s) => s.references))];
}
