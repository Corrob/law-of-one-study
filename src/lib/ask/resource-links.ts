/**
 * Inline site-resource links for the Ask feature.
 *
 * Alongside `{{CITE:session.question}}` citations, the model may emit
 * `{{LINK:type:id}}` markers (e.g. `{{LINK:meditation:balancing-the-self}}`)
 * to recommend one of the site's own resources. We replace each marker with a
 * Markdown link whose text is the resource's localized title — the model never
 * writes link text or URLs itself, so labels are always correct for the locale
 * and unknown/hallucinated ids simply disappear (same convention as citations).
 *
 * Pass ordering: run `renderCitationsToMarkdown` BEFORE the link pass (or use
 * `renderAskMarkdown`, which does). The citation pass strips a bare trailing
 * `{{` mid-stream; this module's partial matcher takes over once `{{L` has
 * arrived.
 */

import { renderCitationsToMarkdown } from "@/lib/ask/citations";
import {
  absoluteResourceUrl,
  isKnownResource,
  resourceHref,
  resourceTitle,
  type ResourceType,
} from "@/lib/ask/resources";
import { type AvailableLanguage, DEFAULT_LOCALE } from "@/lib/language-config";

/** Matches a complete link marker: {{LINK:meditation:balancing-the-self}} */
const LINK_MARKER = /\{\{LINK:\s*([a-z]+)\s*:\s*([a-z0-9-]+)\s*\}\}/g;

/**
 * Matches a trailing, not-yet-complete link marker during streaming (e.g.
 * "{{LINK:medita" before the rest arrives), so the fragment stays hidden until
 * the full marker is available. A lone trailing "{{" is already handled by the
 * citation pass.
 */
const PARTIAL_TRAILING_LINK = /\{\{L(?:I(?:N(?:K(?::[a-z]*(?::[a-z0-9-]*(?:\})?)?)?)?)?)?$/;

export interface ResourceLinkRef {
  type: ResourceType;
  id: string;
}

interface RenderOptions {
  /** Emit absolute lawofone.study URLs (for copy/export) instead of internal hrefs. */
  absolute?: boolean;
}

/**
 * Replace `{{LINK:type:id}}` markers with Markdown links titled by the
 * resource's localized name. Unknown types/ids are dropped (not linked); an
 * incomplete trailing marker is stripped so it isn't shown mid-stream.
 *
 * Safe to call on partial text on every streaming tick.
 */
export function renderResourceLinksToMarkdown(
  text: string,
  locale: AvailableLanguage = DEFAULT_LOCALE,
  options: RenderOptions = {}
): string {
  const withLinks = text.replace(LINK_MARKER, (_match, type: string, id: string) => {
    if (!isKnownResource(type, id)) return "";
    const resourceType = type as ResourceType;
    const title = resourceTitle(resourceType, id, locale) ?? id;
    const url = options.absolute
      ? absoluteResourceUrl(resourceType, id, locale)
      : resourceHref(resourceType, id);
    return `[${title}](${url})`;
  });

  return withLinks.replace(PARTIAL_TRAILING_LINK, "");
}

/**
 * Render both Ask marker kinds — citations first, then resource links — into
 * Markdown. This is what the answer renderer, copy button, and export use.
 */
export function renderAskMarkdown(
  text: string,
  locale: AvailableLanguage = DEFAULT_LOCALE,
  options: RenderOptions = {}
): string {
  return renderResourceLinksToMarkdown(renderCitationsToMarkdown(text, locale), locale, options);
}

/**
 * Distinct, known resource links in a response, in order of first appearance.
 * Used to dedupe the "Explore further" cards against inline links, and for
 * analytics/eval.
 */
export function extractResourceLinks(text: string): ResourceLinkRef[] {
  const seen = new Set<string>();
  const result: ResourceLinkRef[] = [];

  for (const match of text.matchAll(LINK_MARKER)) {
    const [, type, id] = match;
    const key = `${type}:${id}`;
    if (isKnownResource(type, id) && !seen.has(key)) {
      seen.add(key);
      result.push({ type: type as ResourceType, id });
    }
  }
  return result;
}

/** Raw `type:id` strings for every LINK marker, valid or not — for eval/analytics. */
export function extractRawResourceMarkers(text: string): string[] {
  return [...text.matchAll(LINK_MARKER)].map(([, type, id]) => `${type}:${id}`);
}

/**
 * Reduce all Ask markers to plain text — for contexts like the aria-live
 * answer announcement. Citations vanish (a read-aloud "6.14" is noise), but a
 * resource link becomes its localized title so the sentence keeps its object
 * ("…try Balancing the Self." rather than "…try .").
 */
export function stripAskMarkers(
  text: string,
  locale: AvailableLanguage = DEFAULT_LOCALE
): string {
  return text
    .replace(/\{\{CITE:\s*\d+\.\d+\s*\}\}/g, "")
    .replace(/\{\{QCITE:\s*\d{4}-\d{4}(?:_\d{2})?\s*\}\}/g, "")
    .replace(LINK_MARKER, (_match, type: string, id: string) =>
      isKnownResource(type, id) ? (resourceTitle(type as ResourceType, id, locale) ?? "") : ""
    )
    .replace(/ {2,}/g, " ")
    .replace(/ ([.,;:!?])/g, "$1")
    .trim();
}
