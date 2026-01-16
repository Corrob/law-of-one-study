/**
 * Script to translate concept graph definitions and contexts to Spanish
 * using OpenAI's API.
 *
 * Usage: npx tsx scripts/translate-concept-definitions.ts
 *
 * This script:
 * 1. Loads the bilingual concept-graph.json
 * 2. Identifies fields where Spanish = English (needs translation)
 * 3. Translates using OpenAI in batches
 * 4. Writes the updated concept-graph.json
 */

import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
import OpenAI from "openai";

// Load environment variables from .env.local
dotenv.config({ path: ".env.local" });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Rate limiting helper
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface TranslationItem {
  conceptId: string;
  field: "definition" | "extendedDefinition" | "passageExcerpt" | "passageContext";
  passageIndex?: number;
  english: string;
}

interface TranslationResult {
  conceptId: string;
  field: string;
  passageIndex?: number;
  spanish: string;
}

interface BilingualText {
  en: string;
  es: string;
}

interface KeyPassage {
  reference: string;
  excerpt: BilingualText;
  context: BilingualText;
}

interface ConceptData {
  id: string;
  definition: BilingualText;
  extendedDefinition: BilingualText;
  keyPassages: KeyPassage[];
}

/**
 * Translate a batch of texts using OpenAI
 */
async function translateBatch(items: TranslationItem[]): Promise<TranslationResult[]> {
  const systemPrompt = `You are a translator specializing in spiritual and metaphysical content from the Ra Material (Law of One).
Translate the following English texts to Spanish, preserving:
- Spiritual terminology (e.g., "densities" = "densidades", "harvest" = "cosecha", "wanderer" = "errante")
- Ra Material specific terms (e.g., "mind/body/spirit complex" = "complejo mente/cuerpo/espíritu")
- The contemplative, philosophical tone of the material
- Any technical precision in the definitions

Respond with a JSON array containing the translations in the same order as the input.`;

  const userPrompt = items.map((item, i) => `${i + 1}. ${item.english}`).join("\n\n");

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Translate these ${items.length} texts to Spanish:\n\n${userPrompt}\n\nRespond with a JSON array of strings only, no explanation.` },
      ],
      temperature: 0.3,
      max_tokens: 4000,
    });

    const content = response.choices[0].message.content || "[]";
    // Extract JSON array from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error("Failed to parse response:", content);
      return [];
    }

    const translations: string[] = JSON.parse(jsonMatch[0]);

    return items.map((item, i) => ({
      conceptId: item.conceptId,
      field: item.field,
      passageIndex: item.passageIndex,
      spanish: translations[i] || item.english,
    }));
  } catch (error) {
    console.error("Translation error:", error);
    return items.map((item) => ({
      conceptId: item.conceptId,
      field: item.field,
      passageIndex: item.passageIndex,
      spanish: item.english, // Fallback to English on error
    }));
  }
}

async function main() {
  console.log("=== Concept Graph Definition Translation ===\n");

  // Load current concept graph
  const graphPath = path.join(__dirname, "../src/data/concept-graph.json");
  const graph = JSON.parse(fs.readFileSync(graphPath, "utf-8"));

  // Collect items needing translation
  const toTranslate: TranslationItem[] = [];

  for (const concept of Object.values(graph.concepts) as ConceptData[]) {
    // Check definition
    if (concept.definition.en === concept.definition.es && concept.definition.en) {
      toTranslate.push({
        conceptId: concept.id,
        field: "definition",
        english: concept.definition.en,
      });
    }

    // Check extended definition
    if (concept.extendedDefinition.en === concept.extendedDefinition.es && concept.extendedDefinition.en) {
      toTranslate.push({
        conceptId: concept.id,
        field: "extendedDefinition",
        english: concept.extendedDefinition.en,
      });
    }

    // Check key passages
    for (let i = 0; i < concept.keyPassages.length; i++) {
      const passage = concept.keyPassages[i];

      // Excerpt (only if still in English)
      if (passage.excerpt.en === passage.excerpt.es && passage.excerpt.en) {
        toTranslate.push({
          conceptId: concept.id,
          field: "passageExcerpt",
          passageIndex: i,
          english: passage.excerpt.en,
        });
      }

      // Context
      if (passage.context.en === passage.context.es && passage.context.en) {
        toTranslate.push({
          conceptId: concept.id,
          field: "passageContext",
          passageIndex: i,
          english: passage.context.en,
        });
      }
    }
  }

  console.log(`Found ${toTranslate.length} items needing translation\n`);

  if (toTranslate.length === 0) {
    console.log("Nothing to translate!");
    return;
  }

  // Process in batches of 10
  const batchSize = 10;
  const results: TranslationResult[] = [];

  for (let i = 0; i < toTranslate.length; i += batchSize) {
    const batch = toTranslate.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(toTranslate.length / batchSize);

    console.log(`Processing batch ${batchNum}/${totalBatches}...`);

    const batchResults = await translateBatch(batch);
    results.push(...batchResults);

    // Rate limit: wait between batches
    if (i + batchSize < toTranslate.length) {
      await sleep(1000);
    }
  }

  // Apply translations to graph
  let appliedCount = 0;
  for (const result of results) {
    const concept = graph.concepts[result.conceptId];
    if (!concept) continue;

    switch (result.field) {
      case "definition":
        concept.definition.es = result.spanish;
        appliedCount++;
        break;
      case "extendedDefinition":
        concept.extendedDefinition.es = result.spanish;
        appliedCount++;
        break;
      case "passageExcerpt":
        if (result.passageIndex !== undefined && concept.keyPassages[result.passageIndex]) {
          concept.keyPassages[result.passageIndex].excerpt.es = result.spanish;
          appliedCount++;
        }
        break;
      case "passageContext":
        if (result.passageIndex !== undefined && concept.keyPassages[result.passageIndex]) {
          concept.keyPassages[result.passageIndex].context.es = result.spanish;
          appliedCount++;
        }
        break;
    }
  }

  // Write updated graph
  fs.writeFileSync(graphPath, JSON.stringify(graph, null, 2));

  console.log(`\n=== Summary ===`);
  console.log(`Translations applied: ${appliedCount}`);
  console.log(`Output written to: ${graphPath}`);
}

main().catch(console.error);
