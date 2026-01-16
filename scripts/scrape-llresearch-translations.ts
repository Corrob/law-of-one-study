/**
 * Scrape Ra Material translations from L/L Research
 *
 * Usage:
 *   npx tsx scripts/scrape-llresearch-translations.ts --lang es --sessions 1,2
 *   npx tsx scripts/scrape-llresearch-translations.ts --lang es --all
 *
 * This script scrapes translated Ra Material from L/L Research and outputs
 * JSON files matching the English format in public/sections/
 */

import * as fs from "fs";
import * as path from "path";

// Language codes supported by L/L Research
const SUPPORTED_LANGUAGES = [
  "es", // Spanish
  "fr", // French
  "de", // German
  "pt", // Portuguese
  "it", // Italian
  "ru", // Russian
  "pl", // Polish
  "nl", // Dutch
  "ja", // Japanese
  "zh", // Chinese
  "ko", // Korean
  "ar", // Arabic
] as const;

type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

// Speaker labels by language (for output format matching English)
const SPEAKER_LABELS: Record<string, { ra: string; questioner: string }> = {
  en: { ra: "Ra:", questioner: "Questioner:" },
  es: { ra: "Ra:", questioner: "Interrogador:" },
  fr: { ra: "Ra:", questioner: "Questionneur:" },
  de: { ra: "Ra:", questioner: "Fragesteller:" },
  pt: { ra: "Ra:", questioner: "Questionador:" },
  it: { ra: "Ra:", questioner: "Interrogante:" },
  ru: { ra: "Ра:", questioner: "Вопрошающий:" },
  pl: { ra: "Ra:", questioner: "Pytający:" },
  nl: { ra: "Ra:", questioner: "Vraagsteller:" },
  ja: { ra: "ラー:", questioner: "質問者:" },
  zh: { ra: "Ra:", questioner: "发问者:" },
  ko: { ra: "라:", questioner: "질문자:" },
  ar: { ra: "را:", questioner: "السائل:" },
};

/**
 * Fetch HTML content from L/L Research
 */
async function fetchSessionPage(
  lang: string,
  sessionNumber: number
): Promise<string> {
  const url = `https://www.llresearch.org/${lang}/channeling/ra-contact/${sessionNumber}`;
  console.log(`Fetching: ${url}`);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch session ${sessionNumber}: ${response.status}`
    );
  }

  return response.text();
}

/**
 * Clean HTML text - decode entities and normalize whitespace
 */
function cleanText(text: string): string {
  return (
    text
      .replace(/<[^>]+>/g, "") // Remove HTML tags
      .replace(/&nbsp;/g, " ")
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&rsquo;/g, "'")
      .replace(/&lsquo;/g, "'")
      .replace(/&rdquo;/g, '"')
      .replace(/&ldquo;/g, '"')
      .replace(/&mdash;/g, "—")
      .replace(/&ndash;/g, "–")
      .replace(/&hellip;/g, "...")
      .replace(/&#\d+;/g, "") // Remove numeric entities
      // Note: We do NOT replace newlines here - we handle paragraph joining separately
      .trim()
  );
}

/**
 * Parse Q&A pairs from HTML content
 *
 * L/L Research HTML structure:
 * <h4 class="speaker" id="N"><a class="num" href="#N">SESSION.N</a><span class="name">Speaker</span></h4>
 * <p>Content paragraph 1</p>
 * <p>Content paragraph 2</p>
 * <h4 class="speaker"><span class="name">Ra</span></h4>  (Ra's response, no id)
 * <p>Ra's response paragraph 1</p>
 * ...
 */
function parseSessionContent(
  html: string,
  sessionNumber: number,
  lang: SupportedLanguage
): Record<string, string> {
  const result: Record<string, string> = {};
  const labels = SPEAKER_LABELS[lang] || SPEAKER_LABELS.es;

  // Truncate HTML at footer to avoid including site content
  const footerIndex = html.indexOf("<footer");
  const contentHtml = footerIndex > 0 ? html.substring(0, footerIndex) : html;

  // Find all h4 speaker headers and their positions
  const h4Pattern =
    /<h4 class="speaker"[^>]*>(?:<a[^>]*>(\d+\.\d+)<\/a>)?<span class="name"[^>]*>([^<]+)<\/span><\/h4>/gi;

  interface SpeakerBlock {
    reference: string | null;
    speaker: string;
    startIndex: number;
    endIndex?: number;
  }

  // Find all speaker headers
  const headers: SpeakerBlock[] = [];
  let match;
  while ((match = h4Pattern.exec(contentHtml)) !== null) {
    headers.push({
      reference: match[1] || null, // e.g., "1.0", "1.1" or null for Ra responses
      speaker: match[2].trim(), // "Ra" or "Interrogador"
      startIndex: match.index + match[0].length,
    });
  }

  // Set end indices
  for (let i = 0; i < headers.length; i++) {
    headers[i].endIndex =
      i < headers.length - 1 ? headers[i + 1].startIndex - 100 : contentHtml.length;
  }

  // Process each numbered Q&A
  for (let i = 0; i < headers.length; i++) {
    const header = headers[i];

    // Skip Ra-only headers (they're part of the previous Q&A)
    if (!header.reference) continue;

    const ref = header.reference;

    // Get content between this header and the next numbered header
    let endIndex = contentHtml.length;
    for (let j = i + 1; j < headers.length; j++) {
      if (headers[j].reference) {
        endIndex = headers[j].startIndex - 100;
        break;
      }
    }

    const contentBlock = contentHtml.substring(header.startIndex, endIndex);

    // Check if this is Ra-only (like 1.0) or Q&A
    const isRaOnly =
      header.speaker.toLowerCase() === "ra" ||
      header.speaker.toLowerCase().includes("ra");

    if (isRaOnly && header.reference?.endsWith(".0")) {
      // Ra's opening statement - collect all paragraphs
      const paragraphs: string[] = [];
      let pMatch;
      const localPPattern = /<p[^>]*>([\s\S]*?)<\/p>/gi;
      while ((pMatch = localPPattern.exec(contentBlock)) !== null) {
        const text = cleanText(pMatch[1]);
        // Skip stage directions in brackets or notes
        if (text && !text.match(/^\[.*\]$/) && !text.includes("class=")) {
          paragraphs.push(text);
        }
      }

      if (paragraphs.length > 0) {
        // Join paragraphs WITHOUT space (matching English quirk)
        result[ref] = `${labels.ra} ${paragraphs.join("")}`;
      }
    } else {
      // Q&A format - Questioner asks, Ra responds
      // Find where Ra's response starts
      const raHeaderMatch = contentBlock.match(
        /<h4 class="speaker"[^>]*><span class="name"[^>]*>Ra<\/span><\/h4>/i
      );

      if (raHeaderMatch && raHeaderMatch.index !== undefined) {
        const questionBlock = contentBlock.substring(0, raHeaderMatch.index);
        const answerBlock = contentBlock.substring(
          raHeaderMatch.index + raHeaderMatch[0].length
        );

        // Extract question paragraphs
        const questionParagraphs: string[] = [];
        const qPattern = /<p[^>]*>([\s\S]*?)<\/p>/gi;
        let qMatch;
        while ((qMatch = qPattern.exec(questionBlock)) !== null) {
          const text = cleanText(qMatch[1]);
          if (text && !text.match(/^\[.*\]$/)) {
            questionParagraphs.push(text);
          }
        }

        // Extract answer paragraphs
        const answerParagraphs: string[] = [];
        const aPattern = /<p[^>]*>([\s\S]*?)<\/p>/gi;
        let aMatch;
        while ((aMatch = aPattern.exec(answerBlock)) !== null) {
          const text = cleanText(aMatch[1]);
          if (text && !text.match(/^\[.*\]$/)) {
            answerParagraphs.push(text);
          }
        }

        // Combine in English format (no space between paragraphs)
        const question = questionParagraphs.join("");
        const answer = answerParagraphs.join("");

        if (question && answer) {
          result[ref] = `${labels.questioner} ${question} ${labels.ra} ${answer}`;
        } else if (answer) {
          // Some entries might just be Ra responding to an inaudible question
          result[ref] = `${labels.questioner} [Inaudible] ${labels.ra} ${answer}`;
        } else if (question) {
          result[ref] = `${labels.questioner} ${question}`;
        }
      } else {
        // No Ra header found - might be a different structure
        // Just collect all paragraphs
        const paragraphs: string[] = [];
        const allPattern = /<p[^>]*>([\s\S]*?)<\/p>/gi;
        let allMatch;
        while ((allMatch = allPattern.exec(contentBlock)) !== null) {
          const text = cleanText(allMatch[1]);
          if (text && !text.match(/^\[.*\]$/)) {
            paragraphs.push(text);
          }
        }

        if (paragraphs.length > 0) {
          const prefix = header.speaker.toLowerCase().includes("ra")
            ? labels.ra
            : labels.questioner;
          result[ref] = `${prefix} ${paragraphs.join("")}`;
        }
      }
    }
  }

  return result;
}

/**
 * Save JSON to file
 */
function saveSessionJson(
  data: Record<string, string>,
  lang: string,
  sessionNumber: number
): void {
  const outputDir = path.join(process.cwd(), "public", "sections", lang);

  // Create directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, `${sessionNumber}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
  console.log(`Saved: ${outputPath} (${Object.keys(data).length} Q&A pairs)`);
}

/**
 * Compare with English to validate structure
 */
function validateAgainstEnglish(
  translatedData: Record<string, string>,
  sessionNumber: number
): { matches: number; missing: string[]; extra: string[] } {
  const englishPath = path.join(
    process.cwd(),
    "public",
    "sections",
    `${sessionNumber}.json`
  );

  if (!fs.existsSync(englishPath)) {
    console.warn(`English file not found: ${englishPath}`);
    return { matches: 0, missing: [], extra: [] };
  }

  const englishData = JSON.parse(fs.readFileSync(englishPath, "utf-8"));
  const englishKeys = new Set(Object.keys(englishData));
  const translatedKeys = new Set(Object.keys(translatedData));

  const missing = [...englishKeys].filter((k) => !translatedKeys.has(k));
  const extra = [...translatedKeys].filter((k) => !englishKeys.has(k));
  const matches = [...englishKeys].filter((k) => translatedKeys.has(k)).length;

  return { matches, missing, extra };
}

/**
 * Rate limiting helper
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Main scraping function for a single session
 */
async function scrapeSession(
  lang: SupportedLanguage,
  sessionNumber: number
): Promise<void> {
  try {
    const html = await fetchSessionPage(lang, sessionNumber);
    const data = parseSessionContent(html, sessionNumber, lang);

    if (Object.keys(data).length === 0) {
      console.error(`No Q&A pairs found for session ${sessionNumber}`);
      // Save a sample of HTML for debugging
      console.log("Sample HTML around content:");
      const contentStart = html.indexOf('<h4 class="speaker"');
      if (contentStart > 0) {
        console.log(html.substring(contentStart, contentStart + 500));
      }
      return;
    }

    // Validate against English
    const validation = validateAgainstEnglish(data, sessionNumber);
    console.log(
      `Validation: ${validation.matches} matches, ${validation.missing.length} missing, ${validation.extra.length} extra`
    );

    if (validation.missing.length > 0) {
      console.warn(`Missing keys: ${validation.missing.join(", ")}`);
    }
    if (validation.extra.length > 0) {
      console.warn(`Extra keys: ${validation.extra.join(", ")}`);
    }

    // Show sample output
    const sampleKey = Object.keys(data)[0];
    if (sampleKey) {
      console.log(`Sample (${sampleKey}): ${data[sampleKey].substring(0, 150)}...`);
    }

    // Save the result
    saveSessionJson(data, lang, sessionNumber);
  } catch (error) {
    console.error(`Error scraping session ${sessionNumber}:`, error);
  }
}

/**
 * CLI entry point
 */
async function main() {
  const args = process.argv.slice(2);

  // Parse arguments
  let lang: SupportedLanguage = "es";
  let sessions: number[] = [];
  let all = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--lang" && args[i + 1]) {
      lang = args[i + 1] as SupportedLanguage;
      i++;
    } else if (args[i] === "--sessions" && args[i + 1]) {
      sessions = args[i + 1].split(",").map(Number);
      i++;
    } else if (args[i] === "--all") {
      all = true;
    }
  }

  // Validate language
  if (!SUPPORTED_LANGUAGES.includes(lang)) {
    console.error(`Unsupported language: ${lang}`);
    console.log(`Supported: ${SUPPORTED_LANGUAGES.join(", ")}`);
    process.exit(1);
  }

  // Determine sessions to scrape
  if (all) {
    // All sessions except 47 (which doesn't exist)
    sessions = Array.from({ length: 106 }, (_, i) => i + 1).filter(
      (n) => n !== 47
    );
  } else if (sessions.length === 0) {
    console.log("Usage:");
    console.log(
      "  npx tsx scripts/scrape-llresearch-translations.ts --lang es --sessions 1,2"
    );
    console.log(
      "  npx tsx scripts/scrape-llresearch-translations.ts --lang es --all"
    );
    process.exit(0);
  }

  console.log(`\nScraping ${sessions.length} sessions in ${lang}...\n`);

  for (const sessionNumber of sessions) {
    await scrapeSession(lang, sessionNumber);
    // Rate limiting: 1 second between requests
    if (sessions.indexOf(sessionNumber) < sessions.length - 1) {
      await delay(1000);
    }
  }

  console.log("\nDone!");
}

main().catch(console.error);
