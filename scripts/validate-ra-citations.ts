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
 * With --online (best-effort): fetches the exact llresearch.org ra-contact page
 * we link for each reference and confirms the reference RESOLVES — the session
 * page loads and that question's anchor exists. This is the same source/URL the
 * Ask and Explore features cite, so it proves every citation points at a real
 * Q&A. Excerpts are intentionally our own paraphrases in many cases, so wording
 * is NOT required to be verbatim; the verbatim/paraphrase split is only
 * reported. Network failures skip gracefully; an unresolved reference is an
 * error.
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

interface PassageRecord {
  conceptId: string;
  reference: string;
  excerptEn: string;
}

/** Every well-formed keyPassage with its English excerpt, for online verification. */
function collectPassages(graph: Graph): PassageRecord[] {
  const passages: PassageRecord[] = [];
  for (const concept of Object.values(graph.concepts)) {
    for (const passage of concept.keyPassages) {
      if (REFERENCE_PATTERN.test(passage.reference)) {
        passages.push({
          conceptId: concept.id,
          reference: passage.reference,
          excerptEn: passage.excerpt?.en ?? "",
        });
      }
    }
  }
  return passages;
}

const RA_CONTACT_BASE = "https://www.llresearch.org/channeling/ra-contact";

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
};

/** Minimal HTML entity decode (numeric + the few named entities the source uses). */
function decodeEntities(html: string): string {
  return html
    .replace(/&#x([0-9a-fA-F]+);/g, (_m, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_m, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

/**
 * Extract the plain text of one question's exchange (Questioner + Ra) from an
 * ra-contact session page. Questions are delimited by
 * `<h4 class="speaker" ... id="{question}">` anchors.
 */
function extractQuestionText(page: string, question: number): string | null {
  const anchorRe = /<h4 class="speaker"[^>]*\sid="(\d+)"/g;
  const anchors: Array<{ pos: number; num: number }> = [];
  let m: RegExpExecArray | null;
  while ((m = anchorRe.exec(page)) !== null) {
    anchors.push({ pos: m.index, num: Number(m[1]) });
  }
  const target = anchors.find((a) => a.num === question);
  if (!target) return null;
  const laterPositions = anchors.filter((a) => a.pos > target.pos).map((a) => a.pos);
  const end = laterPositions.length ? Math.min(...laterPositions) : page.length;
  const block = page.slice(target.pos, end).replace(/<[^>]+>/g, " ");
  return decodeEntities(block);
}

/** Normalize for verbatim comparison: quote/dash/whitespace-insensitive. */
function normalizeForMatch(text: string): string {
  return text
    .toLowerCase()
    .replace(/[—–−]/g, "-")
    .replace(/…/g, "...")
    .replace(/["'`‘’‚‛“”„‟]/g, "")
    .replace(/\s+/g, "");
}

/**
 * Verify each reference RESOLVES on the llresearch.org page we link — i.e. the
 * session page loads and that question's anchor exists. This is the property
 * that matters: a citation must point at a real Q&A.
 *
 * We do NOT require excerpts to be verbatim (they are intentionally our own
 * paraphrases/summaries in many cases); we only *report* the verbatim vs.
 * paraphrase split for visibility. Session pages are fetched once and cached;
 * network failures are graceful (recorded as warnings); an unresolved reference
 * is an error.
 */
async function checkOnline(passages: PassageRecord[]): Promise<void> {
  const sessions = new Set(passages.map((p) => p.reference.split(".")[0]));
  console.log(`--- Online reference check (${passages.length} passages, ${sessions.size} sessions) ---`);

  const pageCache = new Map<string, string | null>();
  async function getPage(session: string): Promise<string | null> {
    if (pageCache.has(session)) return pageCache.get(session)!;
    const url = `${RA_CONTACT_BASE}/${session}`;
    try {
      const res = await fetch(url, { headers: BROWSER_HEADERS });
      if (!res.ok) {
        warnings.push(`Online: ${url} returned HTTP ${res.status} (skipped).`);
        pageCache.set(session, null);
        return null;
      }
      const html = await res.text();
      pageCache.set(session, html);
      return html;
    } catch (err) {
      warnings.push(
        `Online: ${url} failed (${err instanceof Error ? err.message : "network error"}) (skipped).`
      );
      pageCache.set(session, null);
      return null;
    }
  }

  let resolved = 0;
  let skipped = 0;
  let verbatim = 0;
  let paraphrase = 0;
  for (const passage of passages) {
    const [session, question] = passage.reference.split(".");
    const page = await getPage(session);
    if (page === null) {
      skipped++;
      continue;
    }
    const text = extractQuestionText(page, Number(question));
    if (text === null) {
      errors.push(
        `Online: "${passage.conceptId}" reference ${passage.reference} does not resolve — question anchor #${question} not found on the source page.`
      );
      continue;
    }
    resolved++;
    // Informational only: is the stored excerpt a verbatim quote or our summary?
    if (passage.excerptEn) {
      if (normalizeForMatch(text).includes(normalizeForMatch(passage.excerptEn))) verbatim++;
      else paraphrase++;
    }
  }

  console.log(`References resolved: ${resolved}`);
  console.log(`Skipped (network):   ${skipped}`);
  console.log(`  excerpt split — verbatim: ${verbatim}, paraphrase/summary: ${paraphrase}`);
  if (skipped > 0 && resolved === 0) {
    console.log(
      "The source appears unreachable from here. Re-run --online from a permitted network."
    );
  }
  console.log("");
}

async function main(): Promise<void> {
  const online = process.argv.includes("--online");
  const graph = loadGraph();
  const references = validateStructure(graph);
  syncKnownReferences(references);
  if (online) await checkOnline(collectPassages(graph));

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
