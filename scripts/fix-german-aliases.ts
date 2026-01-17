#!/usr/bin/env npx tsx
/**
 * Add German declined forms to concept graph aliases.
 * German has grammatical cases that change adjective endings:
 * - dritte Dichte (nominative) -> dritten Dichte (dative/accusative)
 *
 * This script adds common declined forms so concept detection works
 * when the AI uses different grammatical cases.
 */

import * as fs from "fs";
import * as path from "path";

const CONCEPT_GRAPH_PATH = path.join(__dirname, "../src/data/concept-graph.json");

// Common German adjective declension patterns for density concepts
// Only apply to whole words to avoid bad forms
// Format: base form -> [additional forms to add]
const DECLINED_FORMS: Record<string, string[]> = {
  // Ordinal numbers used with Dichte - these are the most important
  "erste dichte": ["ersten dichte", "erster dichte"],
  "zweite dichte": ["zweiten dichte", "zweiter dichte"],
  "dritte dichte": ["dritten dichte", "dritter dichte"],
  "vierte dichte": ["vierten dichte", "vierter dichte"],
  "fünfte dichte": ["fünften dichte", "fünfter dichte"],
  "sechste dichte": ["sechsten dichte", "sechster dichte"],
  "siebte dichte": ["siebten dichte", "siebter dichte"],
  // Higher self
  "höheres selbst": ["höheren selbst", "höherem selbst"],
  // Free will
  "freier wille": ["freien willen", "freiem willen"],
  // Social memory complex
  "sozialer gedächtniskomplex": ["sozialen gedächtniskomplex", "sozialem gedächtniskomplex"],
};

interface ConceptGraph {
  concepts: Record<string, {
    aliases: {
      en: string[];
      es: string[];
      de: string[];
    };
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
}

function addDeclinedForms(alias: string): string[] {
  const additional: string[] = [];
  const lowerAlias = alias.toLowerCase();

  // Only match exact phrases (not partial)
  for (const [base, forms] of Object.entries(DECLINED_FORMS)) {
    if (lowerAlias === base) {
      additional.push(...forms);
    }
  }

  return additional;
}

function main() {
  console.log("=== Adding German Declined Forms to Concept Graph ===\n");

  const graphData = JSON.parse(fs.readFileSync(CONCEPT_GRAPH_PATH, "utf-8")) as ConceptGraph;

  let totalAdded = 0;

  for (const [conceptId, concept] of Object.entries(graphData.concepts)) {
    if (!concept.aliases?.de) continue;

    const existingAliases = new Set(concept.aliases.de.map(a => a.toLowerCase()));
    const newAliases: string[] = [];

    for (const alias of concept.aliases.de) {
      const declined = addDeclinedForms(alias);
      for (const form of declined) {
        if (!existingAliases.has(form)) {
          newAliases.push(form);
          existingAliases.add(form);
        }
      }
    }

    if (newAliases.length > 0) {
      concept.aliases.de.push(...newAliases);
      console.log(`${conceptId}: +${newAliases.length} (${newAliases.join(", ")})`);
      totalAdded += newAliases.length;
    }
  }

  // Write updated graph
  fs.writeFileSync(CONCEPT_GRAPH_PATH, JSON.stringify(graphData, null, 2));

  console.log(`\n=== Summary ===`);
  console.log(`Added ${totalAdded} declined forms`);
  console.log(`Updated: ${CONCEPT_GRAPH_PATH}`);
}

main();
