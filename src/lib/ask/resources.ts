/**
 * Registry of linkable site resources for the Ask feature.
 *
 * Backs two recommendation surfaces:
 *   - inline `{{LINK:type:id}}` markers the model may emit (resource-links.ts)
 *   - the deterministic "Explore further" cards (recommendations.ts)
 *
 * The data is a slim generated file (src/data/ask-resources.json, written by
 * scripts/generate-ask-resources.ts) so this module stays client-safe and does
 * not pull in the concept graph or study-path lessons — the same pattern as
 * known-references.json for citations.
 */

import askResources from "@/data/ask-resources.json";
import { z } from "zod";
import {
  AVAILABLE_LANGUAGES,
  type AvailableLanguage,
  DEFAULT_LOCALE,
} from "@/lib/language-config";

export const RESOURCE_TYPES = ["meditation", "song", "path", "concept"] as const;
export type ResourceType = (typeof RESOURCE_TYPES)[number];

/** One recommendable resource, fully resolved for a locale. */
export interface RelatedResource {
  type: ResourceType;
  id: string;
  title: string;
  description?: string;
  /** Locale-neutral internal href (next-intl adds the locale prefix). */
  href: string;
}

const LocalizedTextSchema = z.object(
  Object.fromEntries(AVAILABLE_LANGUAGES.map((l) => [l, z.string()])) as Record<
    AvailableLanguage,
    z.ZodString
  >
);

const ResourceEntrySchema = z.object({
  id: z.string().min(1),
  title: LocalizedTextSchema,
  description: LocalizedTextSchema.optional(),
});

const RegistrySchema = z.object({
  meditation: z.array(ResourceEntrySchema),
  song: z.array(ResourceEntrySchema),
  path: z.array(ResourceEntrySchema),
  concept: z.array(ResourceEntrySchema),
});

type ResourceEntry = z.infer<typeof ResourceEntrySchema>;

const REGISTRY = RegistrySchema.parse(askResources);

const BY_TYPE_AND_ID: ReadonlyMap<ResourceType, ReadonlyMap<string, ResourceEntry>> = new Map(
  RESOURCE_TYPES.map((type) => [type, new Map(REGISTRY[type].map((e) => [e.id, e]))])
);

/** How each resource type is reached. Paths have a real route; the rest deep-link via query param. */
const HREF_BUILDERS: Record<ResourceType, (id: string) => string> = {
  meditation: (id) => `/meditate?meditation=${id}`,
  song: (id) => `/listen?song=${id}`,
  path: (id) => `/paths/${id}`,
  concept: (id) => `/explore?concept=${id}`,
};

export function isResourceType(type: string): type is ResourceType {
  return (RESOURCE_TYPES as readonly string[]).includes(type);
}

/** True when `type` is a valid resource type and `id` exists in the registry. */
export function isKnownResource(type: string, id: string): boolean {
  return isResourceType(type) && BY_TYPE_AND_ID.get(type)!.has(id);
}

/** Locale-neutral internal href for a resource (next-intl Link adds the prefix). */
export function resourceHref(type: ResourceType, id: string): string {
  return HREF_BUILDERS[type](id);
}

/** Localized title for a known resource (English fallback); undefined if unknown. */
export function resourceTitle(
  type: ResourceType,
  id: string,
  locale: AvailableLanguage = DEFAULT_LOCALE
): string | undefined {
  const entry = BY_TYPE_AND_ID.get(type)!.get(id);
  if (!entry) return undefined;
  return entry.title[locale] || entry.title[DEFAULT_LOCALE];
}

const SITE_ORIGIN = "https://lawofone.study";

/**
 * Absolute URL for copy/export contexts, with the locale path prefix applied
 * manually (localePrefix "as-needed": English unprefixed, others prefixed).
 */
export function absoluteResourceUrl(
  type: ResourceType,
  id: string,
  locale: AvailableLanguage = DEFAULT_LOCALE
): string {
  const prefix = locale === DEFAULT_LOCALE ? "" : `/${locale}`;
  return `${SITE_ORIGIN}${prefix}${resourceHref(type, id)}`;
}

/** Fully resolved resource for a locale; undefined if unknown. */
export function getRelatedResource(
  type: ResourceType,
  id: string,
  locale: AvailableLanguage = DEFAULT_LOCALE
): RelatedResource | undefined {
  const entry = BY_TYPE_AND_ID.get(type)!.get(id);
  if (!entry) return undefined;
  return {
    type,
    id,
    title: entry.title[locale] || entry.title[DEFAULT_LOCALE],
    description: entry.description
      ? entry.description[locale] || entry.description[DEFAULT_LOCALE]
      : undefined,
    href: resourceHref(type, id),
  };
}

/** Types the model is taught to link inline. `concept` stays card-only (135 IDs = hallucination surface). */
const INVENTORY_TYPES: readonly ResourceType[] = ["meditation", "song", "path"];

/**
 * The SITE RESOURCE INVENTORY block for the system prompt: every inline-linkable
 * resource with its marker id and a one-line description, in the answer locale.
 */
export function buildResourceInventory(locale: AvailableLanguage = DEFAULT_LOCALE): string {
  const lines: string[] = ["SITE RESOURCE INVENTORY (the only valid {{LINK}} ids):"];
  for (const type of INVENTORY_TYPES) {
    for (const entry of REGISTRY[type]) {
      const title = entry.title[locale] || entry.title[DEFAULT_LOCALE];
      const description = entry.description
        ? entry.description[locale] || entry.description[DEFAULT_LOCALE]
        : "";
      lines.push(`- ${type}:${entry.id} — "${title}"${description ? ` — ${description}` : ""}`);
    }
  }
  return lines.join("\n");
}
