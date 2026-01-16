/**
 * Script to translate concept term names to Spanish using OpenAI's API.
 *
 * Usage: npx tsx scripts/translate-concept-terms.ts
 */

import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config({ path: ".env.local" });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface TermToTranslate {
  id: string;
  term: string;
}

interface BilingualText {
  en: string;
  es: string;
}

interface ConceptData {
  id: string;
  term: BilingualText;
}

interface ConceptGraph {
  concepts: Record<string, ConceptData>;
  categories: Record<string, unknown>;
}

async function translateTerms(terms: TermToTranslate[]): Promise<Map<string, string>> {
  const systemPrompt = `You are a translator specializing in spiritual and metaphysical content from the Ra Material (Law of One).
Translate the following concept names from English to Spanish.

Guidelines:
- Use established Spanish translations for Ra Material terms where they exist
- Keep proper nouns that are commonly used in Spanish (e.g., "Kundalini" stays "Kundalini", "Karma" stays "Karma")
- "Archetype" = "Arquetipo"
- "Catalyst" = "Catalizador"
- "Experience" = "Experiencia"
- "Logos" = "Logos" (keep as is, it's used in Spanish)
- "Sub-Logos" = "Sub-Logos"
- "Tarot" = "Tarot"
- "Healing" = "Sanación"
- "Ra" = "Ra" (proper noun)
- "Orion" = "Orión"
- "Quarantine" = "Cuarentena"
- "Faith" = "Fe"
- "Will" = "Voluntad"
- "Gateway" = "Portal"
- "Forgiveness" = "Perdón"
- "Magic" = "Magia"
- "Healer" = "Sanador"
- Compound terms should be translated appropriately (e.g., "Energy Center Blockage" = "Bloqueo del Centro de Energía")

Respond with a JSON object mapping each English term to its Spanish translation.`;

  const termList = terms.map(t => t.term).join("\n");

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Translate these ${terms.length} concept names to Spanish:\n\n${termList}\n\nRespond with a JSON object only, like: {"English Term": "Spanish Term", ...}` },
      ],
      temperature: 0.2,
      max_tokens: 2000,
    });

    const content = response.choices[0].message.content || "{}";
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("Failed to parse response:", content);
      return new Map();
    }

    const translations: Record<string, string> = JSON.parse(jsonMatch[0]);
    return new Map(Object.entries(translations));
  } catch (error) {
    console.error("Translation error:", error);
    return new Map();
  }
}

async function main() {
  console.log("=== Concept Term Translation ===\n");

  const graphPath = path.join(__dirname, "../src/data/concept-graph.json");
  const graph: ConceptGraph = JSON.parse(fs.readFileSync(graphPath, "utf-8"));

  // Find terms needing translation
  const termsToTranslate: TermToTranslate[] = [];

  for (const concept of Object.values(graph.concepts)) {
    if (concept.term.en === concept.term.es) {
      termsToTranslate.push({
        id: concept.id,
        term: concept.term.en,
      });
    }
  }

  console.log(`Found ${termsToTranslate.length} terms needing translation\n`);

  if (termsToTranslate.length === 0) {
    console.log("Nothing to translate!");
    return;
  }

  // Translate all terms in one batch (they're short)
  console.log("Translating terms...");
  const translations = await translateTerms(termsToTranslate);

  // Apply translations
  let appliedCount = 0;
  for (const { id, term } of termsToTranslate) {
    const spanish = translations.get(term);
    if (spanish && graph.concepts[id]) {
      graph.concepts[id].term.es = spanish;
      appliedCount++;
      console.log(`  ${term} → ${spanish}`);
    }
  }

  // Write updated graph
  fs.writeFileSync(graphPath, JSON.stringify(graph, null, 2));

  console.log(`\n=== Summary ===`);
  console.log(`Terms translated: ${appliedCount}`);
  console.log(`Output written to: ${graphPath}`);
}

main().catch(console.error);
