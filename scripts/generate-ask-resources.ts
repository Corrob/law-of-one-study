/**
 * Generate src/data/ask-resources.json — the slim, client-safe registry of
 * linkable site resources used by the Ask feature (inline {{LINK:type:id}}
 * markers and the "Explore further" recommendation cards).
 *
 * Sources (single source of truth stays with each feature):
 *   - meditations: src/data/meditations.ts + messages/<locale>/common.json
 *   - songs:       src/data/music/album.ts  + messages/<locale>/music.json
 *   - paths:       src/data/study-paths/*.json via getAllPathMetas(locale)
 *   - concepts:    src/data/concept-graph.json (term per locale)
 *
 * The registry exists so the /ask client bundle can validate marker IDs and
 * resolve localized titles WITHOUT importing the full concept graph or the
 * study-path lessons (hundreds of KB). Same pattern as known-references.json
 * (see scripts/validate-ra-citations.ts).
 *
 * Usage:
 *   npm run generate:ask-resources            # rewrite the registry
 *   npm run generate:ask-resources -- --check # exit 1 if the file has drifted
 */

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { MEDITATIONS } from "../src/data/meditations";
import { ALBUM } from "../src/data/music/album";
import { getAllPathMetas } from "../src/lib/study-paths";
import { AVAILABLE_LANGUAGES, type AvailableLanguage } from "../src/lib/language-config";

const ROOT = join(__dirname, "..");
const OUT_PATH = join(ROOT, "src/data/ask-resources.json");

type LocalizedText = Record<AvailableLanguage, string>;

interface ResourceEntry {
  id: string;
  title: LocalizedText;
  description?: LocalizedText;
}

interface Registry {
  meditation: ResourceEntry[];
  song: ResourceEntry[];
  path: ResourceEntry[];
  concept: ResourceEntry[];
}

/** Read one locale's message namespace file (e.g. messages/es/common.json). */
function readMessages(locale: string, file: string): Record<string, unknown> {
  return JSON.parse(readFileSync(join(ROOT, "messages", locale, file), "utf8"));
}

/** Resolve a dotted key ("songs.firstBreath.title") inside a messages object. */
function resolveKey(messages: Record<string, unknown>, dottedKey: string): string {
  let node: unknown = messages;
  for (const part of dottedKey.split(".")) {
    if (typeof node !== "object" || node === null) break;
    node = (node as Record<string, unknown>)[part];
  }
  if (typeof node !== "string" || !node.trim()) {
    throw new Error(`Missing translation for key "${dottedKey}"`);
  }
  return node;
}

function localized(resolve: (locale: AvailableLanguage) => string): LocalizedText {
  const out = {} as LocalizedText;
  for (const locale of AVAILABLE_LANGUAGES) out[locale] = resolve(locale);
  return out;
}

function buildRegistry(): Registry {
  const common = Object.fromEntries(
    AVAILABLE_LANGUAGES.map((l) => [l, readMessages(l, "common.json")])
  );
  const music = Object.fromEntries(
    AVAILABLE_LANGUAGES.map((l) => [l, readMessages(l, "music.json")])
  );

  const meditation: ResourceEntry[] = MEDITATIONS.map((m) => ({
    id: m.id,
    title: localized((l) => resolveKey(common[l], `meditate.meditations.${m.titleKey}`)),
    description: localized((l) =>
      resolveKey(common[l], `meditate.meditations.${m.descriptionKey}`)
    ),
  }));

  const song: ResourceEntry[] = ALBUM.songs.map((s) => ({
    id: s.id,
    title: localized((l) => resolveKey(music[l], s.titleKey)),
    description: localized((l) => resolveKey(music[l], s.descriptionKey)),
  }));

  const path: ResourceEntry[] = getAllPathMetas("en").map((meta) => ({
    id: meta.id,
    title: localized((l) => {
      const localizedMeta = getAllPathMetas(l).find((p) => p.id === meta.id);
      if (!localizedMeta) throw new Error(`Path "${meta.id}" missing in locale "${l}"`);
      return localizedMeta.title;
    }),
    description: localized((l) => {
      const localizedMeta = getAllPathMetas(l).find((p) => p.id === meta.id);
      if (!localizedMeta) throw new Error(`Path "${meta.id}" missing in locale "${l}"`);
      return localizedMeta.description;
    }),
  }));

  interface GraphConcept {
    id: string;
    term: Record<string, string>;
  }
  const graph = JSON.parse(readFileSync(join(ROOT, "src/data/concept-graph.json"), "utf8")) as {
    concepts: Record<string, GraphConcept>;
  };
  const concept: ResourceEntry[] = Object.values(graph.concepts)
    .map((c) => ({
      id: c.id,
      title: localized((l) => {
        const term = c.term[l] ?? c.term.en;
        if (!term?.trim()) throw new Error(`Concept "${c.id}" missing term`);
        return term;
      }),
    }))
    .sort((a, b) => a.id.localeCompare(b.id));

  return { meditation, song, path, concept };
}

function main(): void {
  const check = process.argv.includes("--check");
  const registry = buildRegistry();
  const next = JSON.stringify(registry, null, 2) + "\n";

  let existing = "";
  try {
    existing = readFileSync(OUT_PATH, "utf8");
  } catch {
    // No file yet — will be created (or reported as drift in --check mode).
  }

  const counts = `${registry.meditation.length} meditations, ${registry.song.length} songs, ${registry.path.length} paths, ${registry.concept.length} concepts`;

  if (check) {
    if (existing !== next) {
      console.error(
        "ask-resources.json is out of date. Run `npm run generate:ask-resources` and commit the result."
      );
      process.exit(1);
    }
    console.log(`ask-resources.json is in sync (${counts}).`);
    return;
  }

  writeFileSync(OUT_PATH, next);
  console.log(
    existing === next
      ? `ask-resources.json is in sync (${counts}).`
      : `ask-resources.json updated (${counts}).`
  );
}

main();
