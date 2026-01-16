/**
 * Translate quote text and highlights in Spanish study path files.
 * Uses GPT-4o-mini to translate the specific quote excerpts while preserving
 * the Ra Material terminology and style.
 */

import * as fs from "fs";
import * as path from "path";
import dotenv from "dotenv";
import OpenAI from "openai";

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../.env.local") });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const STUDY_PATHS_DIR = path.join(__dirname, "../src/data/study-paths");

interface QuoteSection {
  type: "quote";
  reference: string;
  text: string;
  context?: string;
  highlight?: string[];
}

interface StudyPath {
  id: string;
  title: string;
  lessons: Array<{
    id: string;
    sections: Array<{ type: string; [key: string]: unknown }>;
  }>;
  [key: string]: unknown;
}

const TRANSLATION_PROMPT = `You are translating Ra Material quotes from English to Spanish.

CRITICAL RULES:
1. Translate the quote text naturally into Spanish
2. Keep Ra's speaking style - formal, precise, philosophical
3. Use these standard Spanish translations for Ra Material terms:
   - "density" → "densidad"
   - "harvest" → "cosecha"
   - "catalyst" → "catalizador"
   - "distortion" → "distorsión"
   - "mind/body/spirit complex" → "complejo mente/cuerpo/espíritu"
   - "other-self" → "otro-yo"
   - "service to others" → "servicio a otros"
   - "service to self" → "servicio a sí mismo"
   - "wanderer" → "errante"
   - "Logos" → "Logos"
   - "sub-Logos" → "sub-Logos"
   - "intelligent infinity" → "infinito inteligente"
   - "intelligent energy" → "energía inteligente"
   - "love/light" → "amor/luz"
   - "light/love" → "luz/amor"
   - "I am Ra" → "Soy Ra"
   - "octave" → "octava"
   - "veil" → "velo"
   - "polarity" → "polaridad"
   - "incarnation" → "encarnación"
   - "energy center" → "centro de energía"
   - "chakra" → "chakra"
   - "ray" (as in "green ray") → "rayo"

Translate the following quote and its highlight phrases. Return ONLY valid JSON with this structure:
{
  "text": "translated quote text",
  "highlight": ["translated highlight 1", "translated highlight 2"]
}

Do not include any markdown, code blocks, or explanation - just the raw JSON object.`;

async function translateQuote(
  text: string,
  highlights: string[]
): Promise<{ text: string; highlight: string[] }> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: TRANSLATION_PROMPT },
      {
        role: "user",
        content: JSON.stringify({ text, highlight: highlights }),
      },
    ],
    temperature: 0.3,
  });

  const content = response.choices[0].message.content?.trim() || "{}";

  try {
    // Try to parse as JSON, handling potential markdown code blocks
    let jsonStr = content;
    if (content.startsWith("```")) {
      jsonStr = content.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
    }
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("Failed to parse response:", content);
    throw e;
  }
}

async function translateStudyPathQuotes(filename: string): Promise<void> {
  const esPath = path.join(STUDY_PATHS_DIR, "es", filename);

  if (!fs.existsSync(esPath)) {
    console.log(`Skipping ${filename} - Spanish file not found`);
    return;
  }

  console.log(`\nTranslating quotes in ${filename}...`);

  const studyPath: StudyPath = JSON.parse(fs.readFileSync(esPath, "utf-8"));
  let quotesTranslated = 0;

  for (const lesson of studyPath.lessons) {
    for (const section of lesson.sections) {
      if (section.type === "quote") {
        const quote = section as unknown as QuoteSection;

        // Check if the quote text appears to be in English (simple heuristic)
        const isEnglish = /\b(the|is|are|of|to|and|in|that|which)\b/i.test(quote.text);

        if (isEnglish) {
          console.log(`  Translating quote ${quote.reference}...`);

          try {
            const translated = await translateQuote(
              quote.text,
              quote.highlight || []
            );

            quote.text = translated.text;
            quote.highlight = translated.highlight;
            quotesTranslated++;

            // Small delay to avoid rate limiting
            await new Promise((resolve) => setTimeout(resolve, 500));
          } catch (e) {
            console.error(`  Failed to translate ${quote.reference}:`, e);
          }
        }
      }
    }
  }

  // Write back the updated file
  fs.writeFileSync(esPath, JSON.stringify(studyPath, null, 2) + "\n");
  console.log(`  Translated ${quotesTranslated} quotes in ${filename}`);
}

async function main() {
  console.log("Translating study path quotes to Spanish...\n");

  const files = ["densities.json", "polarity.json", "energy-centers.json"];

  for (const file of files) {
    await translateStudyPathQuotes(file);
  }

  console.log("\nDone!");
}

main().catch(console.error);
