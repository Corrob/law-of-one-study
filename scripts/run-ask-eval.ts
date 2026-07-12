/**
 * Ask answer-quality eval harness (revived from the old Seek test-query runner).
 *
 * Runs curated queries (scripts/ask-eval-queries.json) against a live Ask API,
 * parses the SSE stream exactly as the client does, and applies automated
 * checks per query:
 *   - the stream completes without an `error` event
 *   - every {{CITE:x.y}} marker is in the known-references whitelist
 *   - per-query citation expectations (expectCitations / expectedRefsAnyOf)
 *   - grounding recall (meta concepts vs expectConceptsAnyOf)
 *   - no verbatim reproduction of private grounding excerpts
 *   - timing (time to first chunk, total latency)
 *
 * The human `testCriteria` (tone, empathy, structure) are not machine-checked;
 * they're included in the markdown report for manual review.
 *
 * Makes real LLM calls — run manually, never in CI/pre-commit. The runner
 * paces itself and retries on 429 to respect the Ask rate limit.
 *
 * Usage (dev server must be running — `npm run dev`, port 8080):
 *   npm run eval:ask
 *   npm run eval:ask -- --category citation,conceptual
 *   npm run eval:ask -- --query harvest
 *   npm run eval:ask -- --base-url https://lawofone.study --locale es
 *
 * Reports are written to scripts/eval-results/ (gitignored).
 */

import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { getKnownReferences, extractCitedReferences } from "../src/lib/ask/citations";
import { buildGrounding } from "../src/lib/ask/grounding";
import { findReproducedExcerpt } from "../src/lib/ask/reproduction";
import type { AvailableLanguage } from "../src/lib/language-config";

const ROOT = join(__dirname, "..");
const QUERIES_PATH = join(ROOT, "scripts/ask-eval-queries.json");
const RESULTS_DIR = join(ROOT, "scripts/eval-results");

/** Any {{CITE:x.y}} marker, known or not — for detecting hallucinated refs. */
const RAW_CITE_MARKER = /\{\{CITE:\s*(\d+\.\d+)\s*\}\}/g;

interface EvalQuery {
  id: string;
  category: string;
  query: string;
  expectCitations?: boolean;
  expectedRefsAnyOf?: string[];
  expectConceptsAnyOf?: string[];
  testCriteria: string[];
}

interface Check {
  name: string;
  passed: boolean;
  detail: string;
}

interface EvalResult {
  id: string;
  category: string;
  query: string;
  answer: string;
  suggestions: string[];
  metaConcepts: string[];
  citedRefs: string[];
  unknownRefs: string[];
  checks: Check[];
  passed: boolean;
  timeToFirstChunkMs: number;
  totalLatencyMs: number;
  testCriteria: string[];
  error?: string;
}

interface StreamOutcome {
  answer: string;
  suggestions: string[];
  metaConcepts: string[];
  streamError?: string;
  timeToFirstChunkMs: number;
}

function parseArgs(argv: string[]) {
  const get = (flag: string): string | undefined => {
    const i = argv.indexOf(flag);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  return {
    baseUrl: get("--base-url") ?? "http://localhost:8080",
    locale: (get("--locale") ?? "en") as AvailableLanguage,
    categories: get("--category")?.split(","),
    querySubstring: get("--query"),
  };
}

/** Parse the Ask SSE stream, mirroring src/hooks/useAskStream.ts. */
async function readSSE(response: Response, startedAt: number): Promise<StreamOutcome> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buffer = "";
  const outcome: StreamOutcome = {
    answer: "",
    suggestions: [],
    metaConcepts: [],
    timeToFirstChunkMs: 0,
  };

  const handleEvent = (block: string) => {
    const eventMatch = block.match(/^event: (\w+)$/m);
    const dataMatch = block.match(/^data: (.+)$/m);
    if (!eventMatch || !dataMatch) return;
    const data: unknown = JSON.parse(dataMatch[1]);
    const payload = data as Record<string, unknown>;

    switch (eventMatch[1]) {
      case "meta":
        outcome.metaConcepts = (payload.concepts as string[]) ?? [];
        break;
      case "chunk":
        if (outcome.timeToFirstChunkMs === 0) {
          outcome.timeToFirstChunkMs = Date.now() - startedAt;
        }
        outcome.answer += (payload.text as string) ?? "";
        break;
      case "suggestions":
        outcome.suggestions = (payload.items as string[]) ?? [];
        break;
      case "error":
        outcome.streamError = (payload.error as string) ?? "unknown stream error";
        break;
    }
  };

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const blocks = buffer.split("\n\n");
    buffer = blocks.pop() ?? "";
    for (const block of blocks) handleEvent(block);
  }
  return outcome;
}

/** POST one query; on 429, waits out retryAfter and tries again (up to 5 times). */
async function executeQuery(
  baseUrl: string,
  query: string,
  locale: AvailableLanguage
): Promise<{ outcome?: StreamOutcome; totalLatencyMs: number; error?: string }> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const startedAt = Date.now();
    const response = await fetch(`${baseUrl}/api/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: query, history: [], locale }),
    });

    if (response.status === 429) {
      const body = (await response.json().catch(() => ({}))) as { retryAfter?: number };
      const waitSeconds = body.retryAfter ?? 10;
      console.log(`    rate limited — waiting ${waitSeconds}s`);
      await new Promise((resolve) => setTimeout(resolve, waitSeconds * 1000));
      continue;
    }
    if (!response.ok) {
      return {
        totalLatencyMs: Date.now() - startedAt,
        error: `HTTP ${response.status}: ${await response.text()}`,
      };
    }

    const outcome = await readSSE(response, startedAt);
    return { outcome, totalLatencyMs: Date.now() - startedAt };
  }
  return { totalLatencyMs: 0, error: "still rate limited after 5 attempts" };
}

function runChecks(
  spec: EvalQuery,
  outcome: StreamOutcome,
  locale: AvailableLanguage
): Pick<EvalResult, "checks" | "citedRefs" | "unknownRefs"> {
  const checks: Check[] = [];
  const known = getKnownReferences();

  const rawRefs = [...outcome.answer.matchAll(RAW_CITE_MARKER)].map((m) => m[1]);
  const unknownRefs = [...new Set(rawRefs.filter((ref) => !known.has(ref)))];
  const citedRefs = extractCitedReferences(outcome.answer);

  checks.push({
    name: "stream-completed",
    passed: !outcome.streamError,
    detail: outcome.streamError ?? "no error event",
  });
  checks.push({
    name: "citations-known",
    passed: unknownRefs.length === 0,
    detail: unknownRefs.length ? `hallucinated refs: ${unknownRefs.join(", ")}` : "all cited refs are whitelisted",
  });

  if (spec.expectCitations === true) {
    checks.push({
      name: "expect-citations",
      passed: citedRefs.length > 0,
      detail: citedRefs.length ? `cited ${citedRefs.join(", ")}` : "no citations in answer",
    });
  }
  if (spec.expectCitations === false) {
    checks.push({
      name: "expect-no-citations",
      passed: citedRefs.length === 0,
      detail: citedRefs.length ? `unexpectedly cited ${citedRefs.join(", ")}` : "no citations, as expected",
    });
  }
  if (spec.expectedRefsAnyOf?.length) {
    const hit = spec.expectedRefsAnyOf.filter((ref) => citedRefs.includes(ref));
    checks.push({
      name: "expected-refs",
      passed: hit.length > 0,
      detail: hit.length
        ? `matched ${hit.join(", ")}`
        : `none of [${spec.expectedRefsAnyOf.join(", ")}] cited (got: ${citedRefs.join(", ") || "none"})`,
    });
  }
  if (spec.expectConceptsAnyOf?.length) {
    const hit = spec.expectConceptsAnyOf.filter((id) => outcome.metaConcepts.includes(id));
    checks.push({
      name: "grounding-concepts",
      passed: hit.length > 0,
      detail: hit.length
        ? `grounded on ${hit.join(", ")}`
        : `none of [${spec.expectConceptsAnyOf.join(", ")}] matched (got: ${outcome.metaConcepts.join(", ") || "none"})`,
    });
  }

  // Same server-side reproduction check the route runs — recomputed here from
  // the same grounding pipeline, since excerpts are never sent to the client.
  const excerpts = buildGrounding(spec.query, [], locale).excerpts;
  const reproduced = findReproducedExcerpt(outcome.answer, excerpts);
  checks.push({
    name: "no-reproduction",
    passed: !reproduced,
    detail: reproduced ? "answer contains a verbatim grounding excerpt" : "no verbatim excerpt found",
  });

  return { checks, citedRefs, unknownRefs };
}

function buildMarkdownReport(results: EvalResult[], locale: string, baseUrl: string): string {
  const failed = results.filter((r) => !r.passed);
  const lines: string[] = [
    `# Ask eval report`,
    ``,
    `- Date: ${new Date().toISOString()}`,
    `- Target: ${baseUrl} (locale: ${locale})`,
    `- Queries: ${results.length}, automated checks passed: ${results.length - failed.length}, failed: ${failed.length}`,
    ``,
    `| # | id | category | checks | ttfc (ms) | total (ms) | concepts | citations |`,
    `|---|----|----------|--------|-----------|------------|----------|-----------|`,
  ];
  results.forEach((r, i) => {
    const checkSummary = r.checks.map((c) => (c.passed ? "✓" : `✗ ${c.name}`)).join(" ");
    lines.push(
      `| ${i + 1} | ${r.id} | ${r.category} | ${checkSummary} | ${r.timeToFirstChunkMs} | ${r.totalLatencyMs} | ${r.metaConcepts.join(", ") || "—"} | ${r.citedRefs.join(", ") || "—"} |`
    );
  });

  lines.push(``, `---`, ``);
  for (const r of results) {
    lines.push(`## ${r.id} (${r.category}) — ${r.passed ? "PASS" : "FAIL"}`);
    lines.push(``, `**Query:** ${r.query}`, ``);
    if (r.error) lines.push(`**Request error:** ${r.error}`, ``);
    for (const check of r.checks) {
      lines.push(`- ${check.passed ? "✓" : "✗"} \`${check.name}\` — ${check.detail}`);
    }
    lines.push(``, `**Review criteria (manual):** ${r.testCriteria.join("; ")}`, ``);
    lines.push(`**Answer:**`, ``, r.answer ? `> ${r.answer.replace(/\n/g, "\n> ")}` : `_(empty)_`, ``);
    if (r.suggestions.length) lines.push(`**Suggestions:** ${r.suggestions.join(" | ")}`, ``);
  }
  return lines.join("\n");
}

async function main(): Promise<void> {
  const { baseUrl, locale, categories, querySubstring } = parseArgs(process.argv.slice(2));
  const allQueries = (JSON.parse(readFileSync(QUERIES_PATH, "utf-8")) as { queries: EvalQuery[] })
    .queries;

  const queries = allQueries.filter(
    (q) =>
      (!categories || categories.includes(q.category)) &&
      (!querySubstring || q.query.toLowerCase().includes(querySubstring.toLowerCase()))
  );
  if (queries.length === 0) {
    console.error("No queries match the given filters.");
    process.exit(1);
  }

  console.log(`Running ${queries.length}/${allQueries.length} eval queries against ${baseUrl} (${locale})\n`);
  const results: EvalResult[] = [];

  for (const [index, spec] of queries.entries()) {
    console.log(`[${index + 1}/${queries.length}] ${spec.id}: ${spec.query.slice(0, 70)}`);
    const { outcome, totalLatencyMs, error } = await executeQuery(baseUrl, spec.query, locale);

    if (!outcome) {
      results.push({
        id: spec.id,
        category: spec.category,
        query: spec.query,
        answer: "",
        suggestions: [],
        metaConcepts: [],
        citedRefs: [],
        unknownRefs: [],
        checks: [{ name: "request", passed: false, detail: error ?? "request failed" }],
        passed: false,
        timeToFirstChunkMs: 0,
        totalLatencyMs,
        testCriteria: spec.testCriteria,
        error,
      });
      console.log(`    ✗ ${error}`);
      continue;
    }

    const { checks, citedRefs, unknownRefs } = runChecks(spec, outcome, locale);
    const passed = checks.every((c) => c.passed);
    results.push({
      id: spec.id,
      category: spec.category,
      query: spec.query,
      answer: outcome.answer,
      suggestions: outcome.suggestions,
      metaConcepts: outcome.metaConcepts,
      citedRefs,
      unknownRefs,
      checks,
      passed,
      timeToFirstChunkMs: outcome.timeToFirstChunkMs,
      totalLatencyMs,
      testCriteria: spec.testCriteria,
    });
    const failures = checks.filter((c) => !c.passed);
    console.log(
      failures.length
        ? `    ✗ ${failures.map((c) => `${c.name}: ${c.detail}`).join("; ")}`
        : `    ✓ ${checks.length} checks, ${citedRefs.length} citations, ${totalLatencyMs}ms`
    );
  }

  mkdirSync(RESULTS_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const mdPath = join(RESULTS_DIR, `${stamp}-ask-eval.md`);
  const jsonPath = join(RESULTS_DIR, `${stamp}-ask-eval.json`);
  writeFileSync(mdPath, buildMarkdownReport(results, locale, baseUrl));
  writeFileSync(jsonPath, JSON.stringify(results, null, 2));

  const failedCount = results.filter((r) => !r.passed).length;
  console.log(`\n${results.length - failedCount}/${results.length} queries passed all automated checks.`);
  console.log(`Report: ${mdPath}`);
  console.log(`Data:   ${jsonPath}`);
  console.log(`\nRemember: tone/empathy/structure criteria need human review — read the report.`);
  process.exit(failedCount > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error("Eval run failed:", error);
  process.exit(1);
});
