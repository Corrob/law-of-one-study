/**
 * Validate the Ra Material citations in the concept graph, and keep the
 * lightweight known-references list (used by the Ask feature) in sync.
 *
 * What it checks (offline, always):
 *   - Every keyPassage.reference is well-formed `session.question`.
 *   - Session numbers are within the real range (Ra sessions 1-106).
 *   - Required English excerpt/context fields are populated (and reports missing
 *     translations for es/de/fr).
 *   - Reports coverage: concepts with no key passages, thin definitions.
 *   - Rewrites src/data/known-references.json from the graph and flags drift.
 *
 * With --online (best-effort): fetches each unique reference's session page on
 * lawofone.info with a browser user-agent to confirm reachability. lawofone.info
 * blocks many automated clients (Cloudflare), so this step skips gracefully when
 * requests are refused — run it from an environment/IP that can reach the site.
 *
 * Usage:
 *   npm run validate:citations
 *   npm run validate:citations -- --online
 */

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const ROOT = join(__dirname, "..");
const GRAPH_PATH = join(ROOT, "src/data/concept-graph.json");
const KNOWN_REFS_PATH = join(ROOT, "src/data/known-references.json");

const MAX_SESSION = 106; // The Ra contact ran for 106 sessions.
const THIN_DEFINITION_CHARS = 60;
const REFERENCE_PATTERN = /^\d+\.\d+$/;
const LOCALES = ["en", "es", "de", "fr"] as const;

interface BilingualText {
  en: string;
  es: string;
  de: string;
  fr: string;
}
interface KeyPassage {
  reference: string;
  excerpt: BilingualText;
  context: BilingualText;
}
interface Concept {
  id: string;
  extendedDefinition: BilingualText;
  keyPassages: KeyPassage[];
}
interface Graph {
  concepts: Record<string, Concept>;
}

const errors: string[] = [];
const warnings: string[] = [];

function loadGraph(): Graph {
  return JSON.parse(readFileSync(GRAPH_PATH, "utf8")) as Graph;
}

function validateStructure(graph: Graph): Set<string> {
  const references = new Set<string>();
  const concepts = Object.values(graph.concepts);

  let passageCount = 0;
  let conceptsWithoutPassages = 0;
  let thinDefinitions = 0;

  for (const concept of concepts) {
    if (concept.keyPassages.length === 0) {
      conceptsWithoutPassages++;
      warnings.push(`Concept "${concept.id}" has no key passages.`);
    }

    if ((concept.extendedDefinition.en ?? "").length < THIN_DEFINITION_CHARS) {
      thinDefinitions++;
      warnings.push(
        `Concept "${concept.id}" has a thin English extendedDefinition (${concept.extendedDefinition.en?.length ?? 0} chars).`
      );
    }
    for (const locale of LOCALES) {
      if (!concept.extendedDefinition[locale]?.trim()) {
        warnings.push(`Concept "${concept.id}" missing extendedDefinition.${locale}.`);
      }
    }

    for (const passage of concept.keyPassages) {
      passageCount++;

      if (!REFERENCE_PATTERN.test(passage.reference)) {
        errors.push(
          `Concept "${concept.id}": malformed reference "${passage.reference}" (expected session.question).`
        );
        continue;
      }

      const session = Number(passage.reference.split(".")[0]);
      if (session < 1 || session > MAX_SESSION) {
        errors.push(
          `Concept "${concept.id}": reference "${passage.reference}" has out-of-range session ${session} (valid 1-${MAX_SESSION}).`
        );
      }

      references.add(passage.reference);

      // English excerpt + context are required for grounding.
      if (!passage.excerpt?.en?.trim()) {
        errors.push(
          `Concept "${concept.id}": passage ${passage.reference} missing English excerpt.`
        );
      }
      if (!passage.context?.en?.trim()) {
        warnings.push(
          `Concept "${concept.id}": passage ${passage.reference} missing English context.`
        );
      }
      for (const locale of LOCALES) {
        if (!passage.excerpt?.[locale]?.trim()) {
          warnings.push(
            `Concept "${concept.id}": passage ${passage.reference} missing ${locale} excerpt.`
          );
        }
      }
    }
  }

  console.log("--- Coverage ---");
  console.log(`Concepts:                 ${concepts.length}`);
  console.log(`Key passages:             ${passageCount}`);
  console.log(`Unique references:        ${references.size}`);
  console.log(`Concepts w/o passages:    ${conceptsWithoutPassages}`);
  console.log(`Thin English definitions: ${thinDefinitions}`);
  console.log("");

  return references;
}

function syncKnownReferences(references: Set<string>): void {
  const sorted = [...references].sort((a, b) => {
    const [sa, qa] = a.split(".").map(Number);
    const [sb, qb] = b.split(".").map(Number);
    return sa - sb || qa - qb;
  });

  let existing: string[] = [];
  try {
    existing = JSON.parse(readFileSync(KNOWN_REFS_PATH, "utf8"));
  } catch {
    // No file yet — will be created.
  }

  const drift = existing.length !== sorted.length || sorted.some((ref, i) => existing[i] !== ref);

  writeFileSync(KNOWN_REFS_PATH, JSON.stringify(sorted, null, 0) + "\n");

  if (drift) {
    console.log(`known-references.json updated (${sorted.length} references).`);
  } else {
    console.log(`known-references.json is in sync (${sorted.length} references).`);
  }
  console.log("");
}

async function checkOnline(references: Set<string>): Promise<void> {
  const sessions = new Set([...references].map((r) => r.split(".")[0]));
  console.log(`--- Online check (${sessions.size} sessions) ---`);

  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
  };

  let reachable = 0;
  let blocked = 0;
  for (const session of sessions) {
    const url = `https://www.lawofone.info/s/${session}`;
    try {
      const res = await fetch(url, { headers });
      if (res.ok) reachable++;
      else {
        blocked++;
        warnings.push(`Online: ${url} returned HTTP ${res.status}.`);
      }
    } catch (err) {
      blocked++;
      warnings.push(
        `Online: ${url} failed (${err instanceof Error ? err.message : "network error"}).`
      );
    }
  }

  console.log(`Reachable sessions: ${reachable}`);
  console.log(`Blocked/failed:     ${blocked}`);
  if (blocked > 0 && reachable === 0) {
    console.log(
      "lawofone.info appears to block automated requests from here. Re-run --online from a permitted network to verify references live."
    );
  }
  console.log("");
}

async function main(): Promise<void> {
  const online = process.argv.includes("--online");
  const graph = loadGraph();
  const references = validateStructure(graph);
  syncKnownReferences(references);
  if (online) await checkOnline(references);

  if (warnings.length > 0) {
    console.log(`--- Warnings (${warnings.length}) ---`);
    for (const w of warnings.slice(0, 40)) console.log(`  ! ${w}`);
    if (warnings.length > 40) {
      console.log(`  ...and ${warnings.length - 40} more.`);
    }
    console.log("");
  }

  if (errors.length > 0) {
    console.error(`--- Errors (${errors.length}) ---`);
    for (const e of errors) console.error(`  ✗ ${e}`);
    process.exit(1);
  }

  console.log("✓ Citation validation passed.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
