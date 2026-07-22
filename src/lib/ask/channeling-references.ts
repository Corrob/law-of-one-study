/**
 * Known Confederation conscious-channeling references for the Ask feature.
 *
 * Client-safe counterpart of `known-references.json` for the channeling
 * library: a small whitelist mapping dated reference ids (`YYYY-MMDD`, with an
 * optional `_NN` suffix mirroring llresearch.org's same-day URL convention) to
 * the source entity, session date, and the transcript's path on
 * llresearch.org. The path is authoritative — URLs are never derived from the
 * id — so whatever the live URL is, the entry records it.
 */

import { z } from "zod";
import knownChannelingData from "@/data/known-channeling-references.json";

export const CHANNELING_REFERENCE_ID_PATTERN = /^\d{4}-\d{4}(?:_\d{2})?$/;

const ChannelingReferenceSchema = z.object({
  /** The channeled source, e.g. "Q'uo", "Latwii", "Hatonn". */
  source: z.string().min(1),
  /** ISO session date, e.g. "2000-02-20". */
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  /** Path on llresearch.org, e.g. "/channeling/2000/0220". */
  path: z.string().regex(/^\/channeling\/\d{4}\/\d{4}(?:_\d{2})?$/),
});

const ChannelingReferencesFileSchema = z.object({
  note: z.string().optional(),
  references: z.record(
    z.string().regex(CHANNELING_REFERENCE_ID_PATTERN),
    ChannelingReferenceSchema
  ),
});

export type ChannelingReference = z.infer<typeof ChannelingReferenceSchema>;

const REFERENCES: Record<string, ChannelingReference> =
  ChannelingReferencesFileSchema.parse(knownChannelingData).references;

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

/** The whitelist entry for a reference id, or null when unknown. */
export function getChannelingReference(id: string): ChannelingReference | null {
  return REFERENCES[id] ?? null;
}

/** Every known channeling reference id (for validation and tests). */
export function getKnownChannelingReferenceIds(): ReadonlySet<string> {
  return new Set(Object.keys(REFERENCES));
}

/**
 * The llresearch.org URL for a known reference, e.g.
 * `2000-0220` → `https://www.llresearch.org/channeling/2000/0220`.
 * Transcripts are English-only, so there is no locale path prefix.
 */
export function channelingCitationUrl(id: string): string | null {
  const reference = REFERENCES[id];
  return reference ? `https://www.llresearch.org${reference.path}` : null;
}

/**
 * Human label for a known reference: entity plus session date, e.g.
 * "Q'uo · February 20, 2000". Formatted from the stored date parts (never via
 * Date, which would invite timezone drift).
 */
export function channelingCitationLabel(id: string): string | null {
  const reference = REFERENCES[id];
  if (!reference) return null;
  const [year, month, day] = reference.date.split("-").map(Number);
  const monthName = MONTHS[month - 1];
  if (!monthName || !day || !year) return null;
  return `${reference.source} · ${monthName} ${day}, ${year}`;
}
