#!/usr/bin/env npx tsx
/**
 * Translate study paths to any supported language.
 *
 * This script reads the English study path JSON files and creates
 * translations using GPT-4o-mini.
 *
 * Usage: npx tsx scripts/translate-study-paths.ts --language de
 */

import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
import OpenAI from "openai";

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, "../.env.local") });

// Parse command line arguments
const args = process.argv.slice(2);
const langIndex = args.findIndex((arg) => arg === "--language" || arg === "--lang");
const TARGET_LANG = langIndex !== -1 && args[langIndex + 1] ? args[langIndex + 1] : "es";

// Language names for prompts
const LANGUAGE_NAMES: Record<string, string> = {
  es: "Spanish",
  de: "German",
  fr: "French",
  pt: "Portuguese",
  it: "Italian",
};

const TARGET_LANGUAGE_NAME = LANGUAGE_NAMES[TARGET_LANG] || TARGET_LANG;

// Configuration
const SOURCE_DIR = path.join(__dirname, "../src/data/study-paths");
const TARGET_DIR = path.join(SOURCE_DIR, TARGET_LANG);

// Study path files to translate
const STUDY_PATH_FILES = [
  "densities.json",
  "energy-centers.json",
  "polarity.json",
  "catalyst.json",
  "veil.json",
  "time-space.json",
];

// Initialize OpenAI
const openai = new OpenAI();

// Ra Material terminology glossaries for consistent translations
const TERMINOLOGY_GLOSSARIES: Record<string, string> = {
  es: `
## Ra Material Terminology (English → Spanish)
- density → densidad
- harvest → cosecha
- catalyst → catalizador
- distortion → distorsión
- polarity → polaridad
- service to others → servicio a otros
- service to self → servicio al yo
- mind/body/spirit complex → complejo mente/cuerpo/espíritu
- social memory complex → complejo de memoria social
- wanderer → errante
- higher self → yo superior
- intelligent infinity → infinito inteligente
- intelligent energy → energía inteligente
- love/light → amor/luz
- light/love → luz/amor
- Logos → Logos
- sub-Logos → sub-Logos
- chakra → chakra (or centro de energía)
- energy center → centro de energía
- red ray → rayo rojo
- orange ray → rayo naranja
- yellow ray → rayo amarillo
- green ray → rayo verde
- blue ray → rayo azul
- indigo ray → rayo índigo
- violet ray → rayo violeta
- archetypical mind → mente arquetípica
- veil of forgetting → velo del olvido
- incarnation → encarnación
- third density → tercera densidad
- fourth density → cuarta densidad
- fifth density → quinta densidad
- sixth density → sexta densidad
- the One Infinite Creator → el Creador Infinito Único
- free will → libre albedrío
- Law of One → Ley del Uno
- Ra → Ra
- Confederation → Confederación
`,
  de: `
## Ra Material Terminology (English → German)
- density → Dichte / Dichtestufe
- harvest → Ernte
- catalyst → Katalysator
- distortion → Verzerrung
- polarity → Polarität
- service to others → Dienst an anderen
- service to self → Dienst am Selbst
- mind/body/spirit complex → Geist/Körper/Seele-Komplex
- social memory complex → sozialer Gedächtniskomplex
- wanderer → Wanderer
- higher self → Höheres Selbst
- intelligent infinity → unendliche Intelligenz
- intelligent energy → intelligente Energie
- love/light → Liebe/Licht
- light/love → Licht/Liebe
- Logos → Logos
- sub-Logos → Sub-Logos
- chakra → Chakra
- energy center → Energiezentrum
- red ray → roter Strahl
- orange ray → orangener Strahl
- yellow ray → gelber Strahl
- green ray → grüner Strahl
- blue ray → blauer Strahl
- indigo ray → Indigo-Strahl
- violet ray → violetter Strahl
- archetypical mind → archetypischer Geist
- veil of forgetting → Schleier des Vergessens
- incarnation → Inkarnation
- third density → dritte Dichte
- fourth density → vierte Dichte
- fifth density → fünfte Dichte
- sixth density → sechste Dichte
- the One Infinite Creator → der Eine Unendliche Schöpfer
- free will → freier Wille
- Law of One → Gesetz des Einen
- Ra → Ra
- Confederation → Konföderation
`,
  fr: `
## Ra Material Terminology (English → French)
- density → densité
- harvest → moisson
- catalyst → catalyseur
- distortion → distorsion
- polarity → polarité
- service to others → service d'autrui
- service to self → service de soi
- mind/body/spirit complex → complexe mental/corps/esprit
- social memory complex → complexe mémoriel sociétal
- wanderer → errant
- higher self → soi supérieur
- intelligent infinity → infini intelligent
- intelligent energy → énergie intelligente
- love/light → amour/lumière
- light/love → lumière/amour
- Logos → Logos
- sub-Logos → sous-Logos
- chakra → chakra
- energy center → centre énergétique
- red ray → rayon rouge
- orange ray → rayon orange
- yellow ray → rayon jaune
- green ray → rayon vert
- blue ray → rayon bleu
- indigo ray → rayon indigo
- violet ray → rayon violet
- archetypical mind → mental archétypal
- veil of forgetting → voile de l'oubli
- incarnation → incarnation
- third density → troisième densité
- fourth density → quatrième densité
- fifth density → cinquième densité
- sixth density → sixième densité
- the One Infinite Creator → l'Un Créateur Infini
- free will → libre arbitre
- Law of One → Loi de l'Un
- Ra → Ra
- Confederation → Confédération
`,
};

const TERMINOLOGY_GLOSSARY = TERMINOLOGY_GLOSSARIES[TARGET_LANG] || "";

interface StudyPathSection {
  type: string;
  markdown?: string;
  text?: string;
  context?: string;
  question?: string;
  prompt?: string;
  placeholder?: string;
  guidingThoughts?: string[];
  highlight?: string[];
  options?: Array<{
    id: string;
    text: string;
    isCorrect: boolean;
    explanation: string;
    relatedPassage?: string;
  }>;
  reference?: string;
}

interface StudyPathLesson {
  id: string;
  title: string;
  estimatedMinutes: number;
  sections: StudyPathSection[];
}

interface StudyPath {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  estimatedMinutes: number;
  concepts: string[];
  lessons: StudyPathLesson[];
}

async function translateText(
  text: string,
  context: string = "study path content"
): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are a professional translator specializing in spiritual and philosophical texts.
Translate the following text from English to ${TARGET_LANGUAGE_NAME}.

${TERMINOLOGY_GLOSSARY}

Guidelines:
- Use the terminology glossary above for consistent translations
- Maintain a warm, respectful tone appropriate for spiritual content
- Keep the meaning precise and clear
- Do not translate proper nouns (Ra, Logos)
- For markdown content, preserve all formatting
- Translate naturally, not word-for-word

Context: ${context}

Return ONLY the translated text, no explanations.`,
      },
      {
        role: "user",
        content: text,
      },
    ],
    temperature: 0.3,
  });

  return response.choices[0]?.message?.content?.trim() || text;
}

async function translateSection(section: StudyPathSection): Promise<StudyPathSection> {
  const translated: StudyPathSection = { ...section };

  // Translate based on section type
  if (section.type === "content" && section.markdown) {
    translated.markdown = await translateText(section.markdown, "lesson content");
  }

  if (section.type === "quote") {
    // Don't translate the quote text - it comes from pre-translated Ra Material
    // But translate the context
    if (section.context) {
      translated.context = await translateText(section.context, "quote context");
    }
    // Don't translate highlight - these are keywords from the English quote
  }

  if (section.type === "multiple-choice") {
    if (section.question) {
      translated.question = await translateText(section.question, "quiz question");
    }
    if (section.options) {
      translated.options = await Promise.all(
        section.options.map(async (option) => ({
          ...option,
          text: await translateText(option.text, "quiz option"),
          explanation: await translateText(option.explanation, "quiz explanation"),
        }))
      );
    }
  }

  if (section.type === "reflection") {
    if (section.prompt) {
      translated.prompt = await translateText(section.prompt, "reflection prompt");
    }
    if (section.placeholder) {
      translated.placeholder = await translateText(section.placeholder, "placeholder text");
    }
    if (section.guidingThoughts) {
      translated.guidingThoughts = await Promise.all(
        section.guidingThoughts.map((thought) =>
          translateText(thought, "guiding thought")
        )
      );
    }
  }

  return translated;
}

async function translateLesson(lesson: StudyPathLesson): Promise<StudyPathLesson> {
  console.log(`    Translating lesson: ${lesson.title}`);

  const translatedSections = await Promise.all(
    lesson.sections.map((section) => translateSection(section))
  );

  return {
    ...lesson,
    title: await translateText(lesson.title, "lesson title"),
    sections: translatedSections,
  };
}

async function translateStudyPath(studyPath: StudyPath): Promise<StudyPath> {
  console.log(`  Translating study path: ${studyPath.title}`);

  const translatedLessons = [];
  for (const lesson of studyPath.lessons) {
    const translatedLesson = await translateLesson(lesson);
    translatedLessons.push(translatedLesson);
  }

  return {
    ...studyPath,
    title: await translateText(studyPath.title, "study path title"),
    description: await translateText(studyPath.description, "study path description"),
    lessons: translatedLessons,
  };
}

async function main() {
  console.log("=== Study Paths Translation Script ===\n");
  console.log(`Source: ${SOURCE_DIR}`);
  console.log(`Target: ${TARGET_DIR}`);
  console.log(`Language: ${TARGET_LANG}\n`);

  // Create target directory if it doesn't exist
  if (!fs.existsSync(TARGET_DIR)) {
    fs.mkdirSync(TARGET_DIR, { recursive: true });
    console.log(`Created directory: ${TARGET_DIR}\n`);
  }

  // Process each study path file
  for (const filename of STUDY_PATH_FILES) {
    const sourcePath = path.join(SOURCE_DIR, filename);
    const targetPath = path.join(TARGET_DIR, filename);

    // Check if already translated
    if (fs.existsSync(targetPath)) {
      console.log(`Skipping ${filename} (already exists)`);
      continue;
    }

    console.log(`\nProcessing: ${filename}`);

    // Read source file
    const sourceContent = fs.readFileSync(sourcePath, "utf-8");
    const studyPath: StudyPath = JSON.parse(sourceContent);

    // Translate
    const translatedPath = await translateStudyPath(studyPath);

    // Write translated file
    fs.writeFileSync(targetPath, JSON.stringify(translatedPath, null, 2));
    console.log(`  Written: ${targetPath}`);
  }

  console.log("\n=== Translation Complete ===");
}

main().catch(console.error);
