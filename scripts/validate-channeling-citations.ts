/**
 * Validate the conscious-channeling references used by the Ask feature.
 *
 * What it checks (offline, always):
 *   - known-channeling-references.json entries are well-formed: id matches
 *     `YYYY-MMDD(_NN)`, the stored date agrees with the id, and the path is a
 *     plausible `/channeling/YYYY/MMDD(_NN)` whose year/day match the id.
 *   - Every theme reference in ask-channeling.json exists in the known list,
 *     and every known reference is used by at least one theme (or reported).
 *   - Theme summaries are present and aliases are non-empty.
 *
 * With --online (best-effort): fetches each llresearch.org transcript page and
 * confirms it resolves (HTTP 200) and mentions the expected source entity —
 * proving every QCITE citation points at a real transcript by the claimed
 * source. Network failures skip gracefully; a 404 is an error.
 *
 * Usage:
 *   npm run validate:channeling
 *   npm run validate:channeling -- --online
 */

import { readFileSync } from "fs";
import { join } from "path";

const ROOT = join(__dirname, "..");
const KNOWN_PATH = join(ROOT, "src/data/known-channeling-references.json");
const THEMES_PATH = join(ROOT, "src/data/ask-channeling.json");

const ID_PATTERN = /^(\d{4})-(\d{4})(_\d{2})?$/;
const PATH_PATTERN = /^\/channeling\/(\d{4})\/(\d{4})((?:_\d{2})?)$/;

interface KnownReference {
  source: string;
  date: string;
  path: string;
}
interface Theme {
  id: string;
  aliases: string[];
  summary: string;
  references: string[];
}

const known = JSON.parse(readFileSync(KNOWN_PATH, "utf8")) as {
  references: Record<string, KnownReference>;
};
const themesFile = JSON.parse(readFileSync(THEMES_PATH, "utf8")) as { themes: Theme[] };

const errors: string[] = [];
const warnings: string[] = [];

// --- Offline: known-reference shape and internal consistency -----------------

for (const [id, ref] of Object.entries(known.references)) {
  const idMatch = id.match(ID_PATTERN);
  if (!idMatch) {
    errors.push(`known reference "${id}": id must match YYYY-MMDD(_NN)`);
    continue;
  }
  const [, idYear, idMmdd, idSuffix] = idMatch;

  const expectedDate = `${idYear}-${idMmdd.slice(0, 2)}-${idMmdd.slice(2)}`;
  if (ref.date !== expectedDate) {
    errors.push(`known reference "${id}": date ${ref.date} disagrees with id (expected ${expectedDate})`);
  }

  const pathMatch = ref.path.match(PATH_PATTERN);
  if (!pathMatch) {
    errors.push(`known reference "${id}": path ${ref.path} must match /channeling/YYYY/MMDD(_NN)`);
  } else {
    const [, pathYear, pathMmdd, pathSuffix] = pathMatch;
    if (pathYear !== idYear || pathMmdd !== idMmdd || pathSuffix !== (idSuffix ?? "")) {
      errors.push(`known reference "${id}": path ${ref.path} disagrees with id`);
    }
  }

  if (!ref.source.trim()) {
    errors.push(`known reference "${id}": source is empty`);
  }
}

// --- Offline: themes reference only known ids; report unused ids -------------

const usedIds = new Set<string>();
for (const theme of themesFile.themes) {
  if (!theme.summary?.trim()) errors.push(`theme "${theme.id}": empty summary`);
  if (!theme.aliases?.length) errors.push(`theme "${theme.id}": no aliases`);
  for (const ref of theme.references) {
    usedIds.add(ref);
    if (!known.references[ref]) {
      errors.push(`theme "${theme.id}": reference "${ref}" is not in known-channeling-references.json`);
    }
  }
}
for (const id of Object.keys(known.references)) {
  if (!usedIds.has(id)) {
    warnings.push(`known reference "${id}" is not used by any theme`);
  }
}

// --- Online (best-effort): every path resolves and names its source ----------

/** "Q'uo" and "Ra (conscious circle)" → comparable tokens without punctuation. */
function entityToken(source: string): string {
  return source.split("(")[0].replace(/[^a-z]/gi, "").toLowerCase();
}

async function validateOnline(): Promise<void> {
  for (const [id, ref] of Object.entries(known.references)) {
    const url = `https://www.llresearch.org${ref.path}`;
    try {
      const response = await fetch(url, { redirect: "follow" });
      if (!response.ok) {
        errors.push(`online: ${id} → ${url} returned HTTP ${response.status}`);
        continue;
      }
      const body = (await response.text()).replace(/[’']/g, "").toLowerCase();
      if (!body.includes(entityToken(ref.source))) {
        warnings.push(`online: ${id} → ${url} loads but does not mention "${ref.source}" — verify the entity`);
      } else {
        console.log(`  ok ${id} (${ref.source}) → ${url}`);
      }
    } catch (cause) {
      warnings.push(`online: ${id} → ${url} fetch failed (network?): ${String(cause)}`);
    }
  }
}

async function main(): Promise<void> {
  console.log(`Checked ${Object.keys(known.references).length} known references, ${themesFile.themes.length} themes.`);

  if (process.argv.includes("--online")) {
    console.log("Fetching llresearch.org transcript pages…");
    await validateOnline();
  }

  for (const warning of warnings) console.warn(`WARN: ${warning}`);
  for (const error of errors) console.error(`ERROR: ${error}`);

  if (errors.length > 0) {
    console.error(`\n${errors.length} error(s).`);
    process.exit(1);
  }
  console.log(`All checks passed${warnings.length ? ` (${warnings.length} warning(s))` : ""}.`);
}

void main();
