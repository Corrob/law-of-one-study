/**
 * Script to generate bilingual concept graph by:
 * 1. Matching keyPassage excerpts to Spanish Ra Material source files
 * 2. Applying curated term translations for Ra Material terminology
 * 3. Translating definitions and extended definitions
 *
 * Usage: npx tsx scripts/translate-concept-graph.ts
 */

import * as fs from "fs";
import * as path from "path";

// ============================================================================
// Types
// ============================================================================

interface OriginalKeyPassage {
  reference: string;
  excerpt: string;
  context: string;
}

interface BilingualText {
  en: string;
  es: string;
}

interface BilingualAliases {
  en: string[];
  es: string[];
}

interface BilingualKeyPassage {
  reference: string;
  excerpt: BilingualText;
  context: BilingualText;
}

interface OriginalConcept {
  id: string;
  term: string;
  aliases: string[];
  category: string;
  subcategory?: string;
  definition: string;
  extendedDefinition: string;
  relationships: Record<string, string[]>;
  sessions: { primary: number[]; secondary: number[] };
  keyPassages: OriginalKeyPassage[];
  searchTerms: string[];
  teachingLevel: string;
}

interface BilingualConcept {
  id: string;
  term: BilingualText;
  aliases: BilingualAliases;
  category: string;
  subcategory?: string;
  definition: BilingualText;
  extendedDefinition: BilingualText;
  relationships: Record<string, string[]>;
  sessions: { primary: number[]; secondary: number[] };
  keyPassages: BilingualKeyPassage[];
  searchTerms: string[];
  teachingLevel: string;
}

interface OriginalCategoryInfo {
  name: string;
  description: string;
  concepts: string[];
}

interface BilingualCategoryInfo {
  name: BilingualText;
  description: BilingualText;
  concepts: string[];
}

interface OriginalConceptGraph {
  version: string;
  generated: string;
  concepts: Record<string, OriginalConcept>;
  categories: Record<string, OriginalCategoryInfo>;
}

interface BilingualConceptGraph {
  version: string;
  generated: string;
  concepts: Record<string, BilingualConcept>;
  categories: Record<string, BilingualCategoryInfo>;
}

// ============================================================================
// Curated Term Translations (Ra Material Terminology)
// ============================================================================

const TERM_TRANSLATIONS: Record<string, string> = {
  // Core concepts
  "Law of One": "Ley del Uno",
  "The Law of One": "La Ley del Uno",
  "One Infinite Creator": "Creador Infinito Único",
  "The One Infinite Creator": "El Creador Infinito Único",
  "Infinite Creator": "Creador Infinito",
  "The Infinite Creator": "El Creador Infinito",
  "The Creator": "El Creador",
  "Original Thought": "Pensamiento Original",
  Unity: "Unidad",
  Oneness: "Unicidad",
  Density: "Densidad",
  Densities: "Densidades",
  "First Density": "Primera Densidad",
  "1st Density": "1ª Densidad",
  "Second Density": "Segunda Densidad",
  "2nd Density": "2ª Densidad",
  "Third Density": "Tercera Densidad",
  "3rd Density": "3ª Densidad",
  "Fourth Density": "Cuarta Densidad",
  "4th Density": "4ª Densidad",
  "Fifth Density": "Quinta Densidad",
  "5th Density": "5ª Densidad",
  "Sixth Density": "Sexta Densidad",
  "6th Density": "6ª Densidad",
  "Seventh Density": "Séptima Densidad",
  "7th Density": "7ª Densidad",
  Octave: "Octava",
  Harvest: "Cosecha",
  "The Harvest": "La Cosecha",
  Graduation: "Graduación",

  // Polarity
  Polarity: "Polaridad",
  "Service to Others": "Servicio a Otros",
  "Service to Self": "Servicio a Sí Mismo",
  "Positive Path": "Camino Positivo",
  "Negative Path": "Camino Negativo",

  // Energy work
  "Energy Center": "Centro de Energía",
  "Energy Centers": "Centros de Energía",
  Chakra: "Chakra",
  Chakras: "Chakras",
  "Red Ray": "Rayo Rojo",
  "Orange Ray": "Rayo Naranja",
  "Yellow Ray": "Rayo Amarillo",
  "Green Ray": "Rayo Verde",
  "Blue Ray": "Rayo Azul",
  "Indigo Ray": "Rayo Índigo",
  "Violet Ray": "Rayo Violeta",

  // Incarnation
  Incarnation: "Encarnación",
  Catalyst: "Catalizador",
  "Higher Self": "Yo Superior",
  "Mind/Body/Spirit Complex": "Complejo Mente/Cuerpo/Espíritu",
  Veil: "Velo",
  "Veil of Forgetting": "Velo del Olvido",
  "Pre-incarnative Choices": "Elecciones Pre-encarnativas",

  // Entities
  Ra: "Ra",
  Confederation: "Confederación",
  "Confederation of Planets": "Confederación de Planetas",
  Wanderer: "Errante",
  Wanderers: "Errantes",
  "Social Memory Complex": "Complejo de Memoria Social",
  Logos: "Logos",
  "Sub-Logos": "Sub-Logos",

  // Metaphysics
  Distortion: "Distorsión",
  "Intelligent Infinity": "Infinito Inteligente",
  "Intelligent Energy": "Energía Inteligente",
  "Love/Light": "Amor/Luz",
  "Light/Love": "Luz/Amor",
  Love: "Amor",
  Light: "Luz",
  "Free Will": "Libre Albedrío",

  // Practice
  Meditation: "Meditación",
  Balancing: "Equilibrio",
  Seeking: "Búsqueda",
  Adept: "Adepto",
  "Discipline of the Personality": "Disciplina de la Personalidad",

  // Archetypes
  Archetypes: "Arquetipos",
  "Archetypal Mind": "Mente Arquetípica",
  Matrix: "Matriz",
  Potentiator: "Potenciador",
  Experience: "Experiencia",
  Significator: "Significador",
  Transformation: "Transformación",
  "Great Way": "Gran Camino",
  "Matrix of the Mind": "Matriz de la Mente",
  "Potentiator of the Mind": "Potenciador de la Mente",
  "Catalyst of the Mind": "Catalizador de la Mente",
  "Experience of the Mind": "Experiencia de la Mente",
  "Significator of the Mind": "Significador de la Mente",
  "Transformation of the Mind": "Transformación de la Mente",
  "Great Way of the Mind": "Gran Camino de la Mente",
  "Matrix of the Body": "Matriz del Cuerpo",
  "Potentiator of the Body": "Potenciador del Cuerpo",
  "Catalyst of the Body": "Catalizador del Cuerpo",
  "Experience of the Body": "Experiencia del Cuerpo",
  "Significator of the Body": "Significador del Cuerpo",
  "Transformation of the Body": "Transformación del Cuerpo",
  "Great Way of the Body": "Gran Camino del Cuerpo",
  "Matrix of the Spirit": "Matriz del Espíritu",
  "Potentiator of the Spirit": "Potenciador del Espíritu",
  "Catalyst of the Spirit": "Catalizador del Espíritu",
  "Experience of the Spirit": "Experiencia del Espíritu",
  "Significator of the Spirit": "Significador del Espíritu",
  "Transformation of the Spirit": "Transformación del Espíritu",
  "Great Way of the Spirit": "Gran Camino del Espíritu",

  // Additional terms
  "Other-Self": "Otro-Yo",
  "Mind/Body/Spirit": "Mente/Cuerpo/Espíritu",
  Evolution: "Evolución",
  "Spiritual Evolution": "Evolución Espiritual",
  Consciousness: "Consciencia",
  "Time/Space": "Tiempo/Espacio",
  "Space/Time": "Espacio/Tiempo",
};

// Category translations
const CATEGORY_TRANSLATIONS: Record<string, { name: string; description: string }> = {
  cosmology: {
    name: "Cosmología y Estructura",
    description: "La estructura de la creación, densidades y la octava de experiencia",
  },
  polarity: {
    name: "Polaridad y Servicio",
    description: "Los caminos de servicio a otros y servicio a sí mismo",
  },
  "energy-work": {
    name: "Centros de Energía",
    description: "Los chakras y el trabajo con la energía",
  },
  incarnation: {
    name: "Encarnación y Catalizador",
    description: "La experiencia física y el procesamiento del catalizador",
  },
  entities: {
    name: "Seres y Contactos",
    description: "Ra, la Confederación, errantes y otros seres",
  },
  metaphysics: {
    name: "Metafísica",
    description: "La naturaleza de la realidad, la Ley del Uno y conceptos fundamentales",
  },
  practice: {
    name: "Práctica Espiritual",
    description: "Meditación, equilibrio y métodos espirituales",
  },
  archetypes: {
    name: "Mente Arquetípica",
    description: "Los arquetipos y la estructura profunda de la mente",
  },
};

// ============================================================================
// Sentence Matching (reused from translate-daily-quotes.ts)
// ============================================================================

function splitIntoSentences(text: string): string[] {
  let cleaned = text
    .replace(/^(Ra:|Questioner:|Interrogador:|Cuestionador:)\s*/i, "")
    .replace(/^Soy Ra\.\s*/i, "")
    .replace(/^I am Ra\.\s*/i, "");

  cleaned = cleaned.replace(/([.!?])([¿¡])/g, "$1 $2");

  const sentences = cleaned
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  return sentences;
}

function normalizeForComparison(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
    .trim();
}

function findSentenceRange(
  excerpt: string,
  fullText: string
): { start: number; end: number } | null {
  const excerptSentences = splitIntoSentences(excerpt);
  const fullSentences = splitIntoSentences(fullText);

  if (excerptSentences.length === 0 || fullSentences.length === 0) {
    return null;
  }

  const normalizedFirst = normalizeForComparison(excerptSentences[0]);

  for (let i = 0; i < fullSentences.length; i++) {
    const normalizedFull = normalizeForComparison(fullSentences[i]);

    if (
      normalizedFull.includes(normalizedFirst.slice(0, 50)) ||
      normalizedFirst.includes(normalizedFull.slice(0, 50))
    ) {
      let matchLength = 0;
      for (let j = 0; j < excerptSentences.length && i + j < fullSentences.length; j++) {
        const excerptNorm = normalizeForComparison(excerptSentences[j]);
        const fullNorm = normalizeForComparison(fullSentences[i + j]);

        if (
          excerptNorm.slice(0, 30) === fullNorm.slice(0, 30) ||
          fullNorm.includes(excerptNorm.slice(0, 40)) ||
          excerptNorm.includes(fullNorm.slice(0, 40))
        ) {
          matchLength++;
        } else {
          break;
        }
      }

      if (matchLength >= excerptSentences.length * 0.8) {
        return { start: i, end: i + excerptSentences.length - 1 };
      }
    }
  }

  return null;
}

function countSentences(text: string): number {
  return splitIntoSentences(text).length;
}

// ============================================================================
// File Loading
// ============================================================================

function loadConceptGraph(): OriginalConceptGraph {
  const graphPath = path.join(__dirname, "../src/data/concept-graph.json");
  const content = fs.readFileSync(graphPath, "utf-8");
  return JSON.parse(content);
}

function loadSection(language: "en" | "es", session: number): Record<string, string> | null {
  const sectionPath = path.join(__dirname, `../public/sections/${language}/${session}.json`);
  try {
    const content = fs.readFileSync(sectionPath, "utf-8");
    return JSON.parse(content);
  } catch {
    return null;
  }
}

function parseReference(reference: string): { session: number; question: number } | null {
  const match = reference.match(/^(\d+)\.(\d+)$/);
  if (!match) return null;
  return {
    session: parseInt(match[1], 10),
    question: parseInt(match[2], 10),
  };
}

// ============================================================================
// Translation Functions
// ============================================================================

function translateTerm(term: string): string {
  // Check exact match first
  if (TERM_TRANSLATIONS[term]) {
    return TERM_TRANSLATIONS[term];
  }

  // Check case-insensitive
  const lowerTerm = term.toLowerCase();
  for (const [en, es] of Object.entries(TERM_TRANSLATIONS)) {
    if (en.toLowerCase() === lowerTerm) {
      return es;
    }
  }

  // Return original with marker for manual review
  return `[TRANSLATE] ${term}`;
}

function translateAlias(alias: string): string {
  const translated = translateTerm(alias);
  if (translated.startsWith("[TRANSLATE]")) {
    // For aliases, just lowercase the term translation if available
    const term = alias.charAt(0).toUpperCase() + alias.slice(1);
    const termTranslation = translateTerm(term);
    if (!termTranslation.startsWith("[TRANSLATE]")) {
      return termTranslation.toLowerCase();
    }
  }
  return translated.toLowerCase().replace("[TRANSLATE] ", "");
}

function translateKeyPassage(
  passage: OriginalKeyPassage,
  _conceptId: string
): BilingualKeyPassage {
  const ref = parseReference(passage.reference);

  if (!ref) {
    // Fallback to English if reference can't be parsed
    return {
      reference: passage.reference,
      excerpt: { en: passage.excerpt, es: passage.excerpt },
      context: { en: passage.context, es: passage.context },
    };
  }

  const englishSection = loadSection("en", ref.session);
  const spanishSection = loadSection("es", ref.session);

  if (!englishSection || !spanishSection) {
    // Fallback to English if sections not found
    return {
      reference: passage.reference,
      excerpt: { en: passage.excerpt, es: passage.excerpt },
      context: { en: passage.context, es: passage.context },
    };
  }

  const key = `${ref.session}.${ref.question}`;
  const englishFull = englishSection[key];
  const spanishFull = spanishSection[key];

  if (!englishFull || !spanishFull) {
    // Fallback to English if Q&A not found
    return {
      reference: passage.reference,
      excerpt: { en: passage.excerpt, es: passage.excerpt },
      context: { en: passage.context, es: passage.context },
    };
  }

  // Find the excerpt in the full text
  const range = findSentenceRange(passage.excerpt, englishFull);

  let spanishExcerpt: string;
  if (range) {
    const excerptSentenceCount = countSentences(passage.excerpt);
    const spanishSentences = splitIntoSentences(spanishFull);
    const endIndex = Math.min(range.start + excerptSentenceCount - 1, spanishSentences.length - 1);
    spanishExcerpt = spanishSentences.slice(range.start, endIndex + 1).join(" ");
  } else {
    // Fallback to English if no match found
    spanishExcerpt = passage.excerpt;
  }

  return {
    reference: passage.reference,
    excerpt: { en: passage.excerpt, es: spanishExcerpt },
    // Context falls back to English (can be translated later)
    context: { en: passage.context, es: passage.context },
  };
}

function translateConcept(concept: OriginalConcept): BilingualConcept {
  const term = translateTerm(concept.term);
  const aliases = concept.aliases.map(translateAlias);

  // For definitions, fall back to English if no translation available
  // This allows the app to work while translations are being added
  return {
    id: concept.id,
    term: {
      en: concept.term,
      es: term.startsWith("[TRANSLATE]") ? term.replace("[TRANSLATE] ", "") : term
    },
    aliases: {
      en: concept.aliases,
      es: aliases.map(a => a.replace("[translate] ", ""))
    },
    category: concept.category,
    subcategory: concept.subcategory,
    // Use English as fallback for definitions (can be translated later)
    definition: {
      en: concept.definition,
      es: concept.definition, // Fallback to English
    },
    extendedDefinition: {
      en: concept.extendedDefinition,
      es: concept.extendedDefinition, // Fallback to English
    },
    relationships: concept.relationships,
    sessions: concept.sessions,
    keyPassages: concept.keyPassages.map((p) => translateKeyPassage(p, concept.id)),
    searchTerms: concept.searchTerms,
    teachingLevel: concept.teachingLevel,
  };
}

function translateCategory(
  categoryId: string,
  category: OriginalCategoryInfo
): BilingualCategoryInfo {
  const translation = CATEGORY_TRANSLATIONS[categoryId];

  return {
    name: {
      en: category.name,
      es: translation?.name || `[TRANSLATE] ${category.name}`,
    },
    description: {
      en: category.description,
      es: translation?.description || `[TRANSLATE] ${category.description}`,
    },
    concepts: category.concepts,
  };
}

// ============================================================================
// Main
// ============================================================================

function main() {
  console.log("=== Concept Graph Translation Script ===\n");

  const originalGraph = loadConceptGraph();
  const conceptIds = Object.keys(originalGraph.concepts);

  console.log(`Processing ${conceptIds.length} concepts...\n`);

  // Translate all concepts
  const bilingualConcepts: Record<string, BilingualConcept> = {};
  const stats = {
    totalConcepts: conceptIds.length,
    totalPassages: 0,
    translatedPassages: 0,
    fallbackPassages: 0,
  };

  for (const id of conceptIds) {
    const original = originalGraph.concepts[id];
    const translated = translateConcept(original);
    bilingualConcepts[id] = translated;

    // Count stats - check if Spanish excerpt differs from English (meaning it was translated)
    stats.totalPassages += translated.keyPassages.length;
    for (let i = 0; i < translated.keyPassages.length; i++) {
      const passage = translated.keyPassages[i];
      const originalPassage = original.keyPassages[i];
      if (passage.excerpt.es !== originalPassage.excerpt) {
        stats.translatedPassages++;
      } else {
        stats.fallbackPassages++;
      }
    }
  }

  // Translate categories
  const bilingualCategories: Record<string, BilingualCategoryInfo> = {};
  for (const [categoryId, category] of Object.entries(originalGraph.categories)) {
    bilingualCategories[categoryId] = translateCategory(categoryId, category);
  }

  // Build output
  const bilingualGraph: BilingualConceptGraph = {
    version: "2.0-bilingual",
    generated: new Date().toISOString().split("T")[0],
    concepts: bilingualConcepts,
    categories: bilingualCategories,
  };

  // Write output
  const outputPath = path.join(__dirname, "../src/data/concept-graph-bilingual.json");
  fs.writeFileSync(outputPath, JSON.stringify(bilingualGraph, null, 2));

  // Print stats
  console.log("\n=== Summary ===");
  console.log(`Total concepts: ${stats.totalConcepts}`);
  console.log(`Total key passages: ${stats.totalPassages}`);
  console.log(`Translated passages (Spanish text): ${stats.translatedPassages}`);
  console.log(`Fallback passages (English text): ${stats.fallbackPassages}`);
  console.log(`Translation rate: ${Math.round((stats.translatedPassages / stats.totalPassages) * 100)}%`);
  console.log(`\nOutput written to: ${outputPath}`);
  console.log(`\nNote: Definitions and context fall back to English. Key passage excerpts are matched from Spanish Ra Material.`);

  // Show samples
  console.log("\n=== Sample Output ===\n");
  const sampleConcept = bilingualConcepts["law-of-one"];
  if (sampleConcept) {
    console.log(`Concept: ${sampleConcept.term.en} → ${sampleConcept.term.es}`);
    console.log(`Aliases EN: ${sampleConcept.aliases.en.join(", ")}`);
    console.log(`Aliases ES: ${sampleConcept.aliases.es.join(", ")}`);
    if (sampleConcept.keyPassages.length > 0) {
      const passage = sampleConcept.keyPassages[0];
      console.log(`\nKey Passage ${passage.reference}:`);
      console.log(`EN: ${passage.excerpt.en.slice(0, 100)}...`);
      console.log(`ES: ${passage.excerpt.es.slice(0, 100)}...`);
    }
  }

  console.log("\n✅ Bilingual concept graph generated successfully!");
  console.log("- Key passage excerpts: Matched from Spanish Ra Material where possible");
  console.log("- Terms: Translated using curated dictionary");
  console.log("- Definitions: Fall back to English (can be translated later)");
}


main();
