/**
 * Script to translate concept aliases to Spanish using OpenAI's API.
 *
 * Usage: npx tsx scripts/translate-concept-aliases.ts
 */

import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config({ path: ".env.local" });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface AliasToTranslate {
  id: string;
  term: string;
  aliases: string[];
}

interface BilingualText {
  en: string;
  es: string;
}

interface BilingualAliases {
  en: string[];
  es: string[];
}

interface ConceptData {
  id: string;
  term: BilingualText;
  aliases: BilingualAliases;
}

interface ConceptGraph {
  concepts: Record<string, ConceptData>;
  categories: Record<string, unknown>;
}

async function translateAliasBatch(items: AliasToTranslate[]): Promise<Map<string, string[]>> {
  const systemPrompt = `You are a translator specializing in spiritual and metaphysical content from the Ra Material (Law of One).
Translate the aliases (alternative names) for each concept from English to Spanish.

Guidelines:
- These are alternative terms/names that refer to the same concept
- Keep proper nouns and universal terms that are used the same in Spanish (Kundalini, Karma, Tarot, etc.)
- Translate descriptive terms appropriately
- Some aliases may be acronyms or abbreviations - keep those if commonly used
- "mind/body/spirit" = "mente/cuerpo/espíritu"
- "complex" = "complejo"
- "density" = "densidad"

Respond with a JSON object mapping the concept term to an array of Spanish aliases.`;

  const itemList = items.map(i => `${i.term}: [${i.aliases.join(", ")}]`).join("\n");

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Translate the aliases for these ${items.length} concepts:\n\n${itemList}\n\nRespond with JSON only: {"Concept Term": ["spanish alias 1", "spanish alias 2"], ...}` },
      ],
      temperature: 0.2,
      max_tokens: 3000,
    });

    const content = response.choices[0].message.content || "{}";
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("Failed to parse response:", content);
      return new Map();
    }

    const translations: Record<string, string[]> = JSON.parse(jsonMatch[0]);
    return new Map(Object.entries(translations));
  } catch (error) {
    console.error("Translation error:", error);
    return new Map();
  }
}

async function main() {
  console.log("=== Concept Alias Translation ===\n");

  const graphPath = path.join(__dirname, "../src/data/concept-graph.json");
  const graph: ConceptGraph = JSON.parse(fs.readFileSync(graphPath, "utf-8"));

  // Find aliases needing translation
  const aliasesToTranslate: AliasToTranslate[] = [];

  for (const concept of Object.values(graph.concepts)) {
    if (concept.aliases.en.length > 0 &&
        JSON.stringify(concept.aliases.en) === JSON.stringify(concept.aliases.es)) {
      aliasesToTranslate.push({
        id: concept.id,
        term: concept.term.en,
        aliases: concept.aliases.en,
      });
    }
  }

  console.log(`Found ${aliasesToTranslate.length} concepts with aliases needing translation\n`);

  if (aliasesToTranslate.length === 0) {
    console.log("Nothing to translate!");
    return;
  }

  // Process in batches of 15
  const batchSize = 15;
  const allTranslations = new Map<string, string[]>();

  for (let i = 0; i < aliasesToTranslate.length; i += batchSize) {
    const batch = aliasesToTranslate.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(aliasesToTranslate.length / batchSize);

    console.log(`Processing batch ${batchNum}/${totalBatches}...`);

    const translations = await translateAliasBatch(batch);
    for (const [key, value] of translations) {
      allTranslations.set(key, value);
    }

    if (i + batchSize < aliasesToTranslate.length) {
      await sleep(1000);
    }
  }

  // Apply translations
  let appliedCount = 0;
  for (const { id, term } of aliasesToTranslate) {
    const spanish = allTranslations.get(term);
    if (spanish && spanish.length > 0 && graph.concepts[id]) {
      graph.concepts[id].aliases.es = spanish;
      appliedCount++;
      console.log(`  ${term}: [${spanish.join(", ")}]`);
    }
  }

  // Write updated graph
  fs.writeFileSync(graphPath, JSON.stringify(graph, null, 2));

  console.log(`\n=== Summary ===`);
  console.log(`Concepts with translated aliases: ${appliedCount}`);
  console.log(`Output written to: ${graphPath}`);
}

main().catch(console.error);
