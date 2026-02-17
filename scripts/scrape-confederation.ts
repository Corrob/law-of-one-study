/**
 * Scrape Confederation Channeling Library from L/L Research
 *
 * Scrapes ~1,700+ channeling transcripts from llresearch.org and stores
 * them locally as JSON for later indexing into Pinecone.
 *
 * Usage:
 *   npx tsx scripts/scrape-confederation.ts --discover
 *   npx tsx scripts/scrape-confederation.ts --scrape --all
 *   npx tsx scripts/scrape-confederation.ts --scrape --years 2024,2023
 *   npx tsx scripts/scrape-confederation.ts --stats
 */

import * as fs from "fs";
import * as path from "path";

// ─── Configuration ───────────────────────────────────────────────────────────

const BASE_URL = "https://www.llresearch.org";
const DATA_DIR = path.join(process.cwd(), "data", "confederation");
const MANIFEST_PATH = path.join(DATA_DIR, "manifest.json");
const RATE_LIMIT_MS = 1000; // 1 request per second
const START_YEAR = 1972;
const END_YEAR = new Date().getFullYear();

// Known Confederation entities (used for speaker classification)
// Note: Q'uo appears in HTML with both straight (') and curly (\u2019) apostrophes
const KNOWN_ENTITIES = new Set([
  "Q'uo",
  "Q\u2019uo",
  "Hatonn",
  "Latwii",
  "Laitos",
  "Oxal",
  "Yadda",
  "Nona",
  "Monka",
  "Quanta",
  "L/Leema",
  "Amira",
  "Telonn",
  "Hatton", // alternate spelling
  "Latui", // alternate spelling
]);

// Known human instruments (not entities, not questioners)
const KNOWN_INSTRUMENTS = new Set([
  "Jim",
  "Austin",
  "Gary",
  "Carla",
  "Don",
  "Steve",
  "S",
  "K",
]);

// ─── Types ───────────────────────────────────────────────────────────────────

interface ManifestEntry {
  id: string;
  date: string;
  year: number;
  type: string;
  topics: string[];
  url: string;
  wordCount?: number;
  chunkCount?: number;
  entity?: string;
}

interface Manifest {
  scrapedAt: string;
  totalTranscripts: number;
  transcripts: ManifestEntry[];
}

interface TranscriptChunk {
  index: number;
  speaker: string;
  text: string;
  type: "channeling" | "question" | "comment";
}

interface Transcript {
  id: string;
  date: string;
  entity: string;
  type: string;
  topics: string[];
  url: string;
  chunks: TranscriptChunk[];
}

// ─── Utilities ───────────────────────────────────────────────────────────────

/**
 * Normalize curly/smart apostrophes to straight apostrophe
 */
function normalizeApostrophes(text: string): string {
  return text.replace(/[\u2018\u2019\u201B\u2032]/g, "'");
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function cleanText(text: string): string {
  return text
    .replace(/<[^>]+>/g, "") // Remove HTML tags
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&rsquo;/g, "\u2019")
    .replace(/&lsquo;/g, "\u2018")
    .replace(/&rdquo;/g, "\u201C")
    .replace(/&ldquo;/g, "\u201D")
    .replace(/&mdash;/g, "\u2014")
    .replace(/&ndash;/g, "\u2013")
    .replace(/&hellip;/g, "\u2026")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
    .replace(/\s+/g, " ")
    .trim();
}

function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function parseDate(dateText: string): string | null {
  // Parse "December 14, 2024" or "March 0, 1972" etc.
  const cleaned = dateText.trim();
  const d = new Date(cleaned);
  if (isNaN(d.getTime())) return null;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

async function fetchPage(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} fetching ${url}`);
  }
  return response.text();
}

// ─── Phase A: URL Discovery ─────────────────────────────────────────────────

/**
 * Parse how many pages exist for a year from pagination HTML
 */
function parsePaginationCount(html: string): number {
  const paginationMatch = html.match(
    /<nav class="pagination[^"]*">\s*<ul>([\s\S]*?)<\/ul>\s*<\/nav>/
  );
  if (!paginationMatch) return 1;

  const paginationHtml = paginationMatch[1];
  // Find all page numbers (both active and linked)
  const pageNumbers: number[] = [];
  const liPattern = /<li[^>]*>(?:<a[^>]*>|<span>)(\d+)(?:<\/a>|<\/span>)<\/li>/g;
  let match;
  while ((match = liPattern.exec(paginationHtml)) !== null) {
    pageNumbers.push(parseInt(match[1], 10));
  }

  return pageNumbers.length > 0 ? Math.max(...pageNumbers) : 1;
}

/**
 * Parse transcript entries from an index page
 */
function parseIndexPage(html: string, year: number): ManifestEntry[] {
  const entries: ManifestEntry[] = [];

  // Match each transcript entry: <a href="/channeling/YYYY/MMDD" ...> block
  const entryPattern =
    /<a\s+href="(\/channeling\/\d{4}\/\d{3,4})"\s+class="glass[^"]*"[^>]*>([\s\S]*?)<\/a>/g;
  let match;

  while ((match = entryPattern.exec(html)) !== null) {
    const urlPath = match[1];
    const entryHtml = match[2];

    // Extract date text (first <p> with text-indigo)
    const dateMatch = entryHtml.match(
      /<p[^>]*~text-indigo[^>]*>\s*([\s\S]*?)\s*<\/p>/
    );
    const dateText = dateMatch ? cleanText(dateMatch[1]) : "";

    // Extract session type (second <p> with font-medium)
    const typeMatch = entryHtml.match(
      /<p[^>]*font-medium[^>]*>\s*([\s\S]*?)\s*<\/p>/
    );
    const typeText = typeMatch ? cleanText(typeMatch[1]) : "";

    // Extract topics/description (third <p> with ~text-meta)
    const topicsMatch = entryHtml.match(
      /<p[^>]*~text-meta[^>]*>([\s\S]*?)<\/p>/
    );
    const topicsRaw = topicsMatch ? cleanText(topicsMatch[1]) : "";

    // Parse topics - newer entries have "Topics: ..." prefix
    let topics: string[] = [];
    if (topicsRaw.startsWith("Topics:")) {
      topics = topicsRaw
        .substring("Topics:".length)
        .split(/[;.]/)
        .map((t) => t.trim())
        .filter(Boolean);
    }

    // Parse date to ISO format
    const isoDate = parseDate(dateText);
    if (!isoDate) continue;

    const mmdd = urlPath.split("/").pop() || "";
    const id = `${year}-${mmdd}`;

    entries.push({
      id,
      date: isoDate,
      year,
      type: typeText,
      topics,
      url: `${BASE_URL}${urlPath}`,
    });
  }

  return entries;
}

/**
 * Discover all transcript URLs across all years
 */
async function discoverTranscripts(): Promise<Manifest> {
  console.log(`Discovering transcripts from ${START_YEAR} to ${END_YEAR}...\n`);
  const allEntries: ManifestEntry[] = [];

  for (let year = END_YEAR; year >= START_YEAR; year--) {
    process.stdout.write(`  ${year}: `);

    try {
      // Fetch first page to determine pagination
      const firstPageUrl = `${BASE_URL}/channeling/${year}/1`;
      const firstPageHtml = await fetchPage(firstPageUrl);
      const totalPages = parsePaginationCount(firstPageHtml);

      // Parse first page
      const firstPageEntries = parseIndexPage(firstPageHtml, year);
      allEntries.push(...firstPageEntries);
      let count = firstPageEntries.length;

      // Fetch remaining pages
      for (let page = 2; page <= totalPages; page++) {
        await delay(RATE_LIMIT_MS);
        const pageUrl = `${BASE_URL}/channeling/${year}/${page}`;
        const pageHtml = await fetchPage(pageUrl);
        const entries = parseIndexPage(pageHtml, year);
        allEntries.push(...entries);
        count += entries.length;
      }

      console.log(
        `${count} transcripts (${totalPages} page${totalPages > 1 ? "s" : ""})`
      );
    } catch (error) {
      console.log(
        `error - ${error instanceof Error ? error.message : String(error)}`
      );
    }

    await delay(RATE_LIMIT_MS);
  }

  // Sort by date (oldest first)
  allEntries.sort((a, b) => a.date.localeCompare(b.date));

  const manifest: Manifest = {
    scrapedAt: new Date().toISOString(),
    totalTranscripts: allEntries.length,
    transcripts: allEntries,
  };

  // Save manifest
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
  console.log(`\nManifest saved: ${MANIFEST_PATH}`);
  console.log(`Total transcripts discovered: ${allEntries.length}`);

  return manifest;
}

// ─── Phase B: Transcript Scraping ────────────────────────────────────────────

/**
 * Normalize a speaker name for consistent output
 * Converts curly apostrophes to straight and trims
 */
function normalizeSpeaker(name: string): string {
  return normalizeApostrophes(name).trim();
}

/**
 * Determine if a speaker name is a channeled entity
 */
function isEntity(name: string): boolean {
  const normalized = normalizeSpeaker(name);
  // Check known entities (direct + normalized)
  if (KNOWN_ENTITIES.has(name)) return true;
  if (KNOWN_ENTITIES.has(normalized)) return true;

  // Case-insensitive check
  const lower = normalized.toLowerCase();
  for (const entity of KNOWN_ENTITIES) {
    if (normalizeApostrophes(entity).toLowerCase() === lower) return true;
  }

  return false;
}

/**
 * Determine if a speaker is a questioner (not entity, not instrument)
 */
function isQuestioner(name: string): boolean {
  if (isEntity(name)) return false;
  if (KNOWN_INSTRUMENTS.has(name)) return false;
  // "Questioner" is explicitly a questioner
  if (name.toLowerCase() === "questioner") return true;
  // Short names (1-3 chars) or names with numbers are typically questioner IDs
  if (name.length <= 3) return true;
  // Default: treat as questioner
  return true;
}

/**
 * Parse a transcript page into structured chunks
 */
function parseTranscript(
  html: string,
  entry: ManifestEntry
): Transcript {
  // Extract the article content
  const articleMatch = html.match(
    /<article id="fountain">([\s\S]*?)<\/article>/
  );
  const contentHtml = articleMatch ? articleMatch[1] : html;

  // Extract topics from the hint/synopsis block
  let topics = entry.topics;
  if (topics.length === 0) {
    const synopsisMatch = contentHtml.match(
      /<div class="hint synopsis">\s*<p[^>]*>([\s\S]*?)<\/p>\s*<\/div>/
    );
    if (synopsisMatch) {
      const topicsText = cleanText(synopsisMatch[1]);
      if (topicsText.startsWith("Topics:")) {
        topics = topicsText
          .substring("Topics:".length)
          .split(/[;.]/)
          .map((t) => t.trim())
          .filter(Boolean);
      }
    }
  }

  // Find all h4 speaker headers and extract chunks
  const chunks: TranscriptChunk[] = [];
  let primaryEntity = "";

  // Split content by h4 speaker headers
  // Pattern: <h4 class="speaker" role="presentation"><span class="name" id="!N">NAME</span></h4>
  const speakerPattern =
    /<h4 class="speaker"[^>]*><span class="name"[^>]*>([^<]+)<\/span><\/h4>/g;

  // Collect all speaker positions
  interface SpeakerPosition {
    name: string;
    contentStart: number;
  }
  const positions: SpeakerPosition[] = [];
  let speakerMatch;

  while ((speakerMatch = speakerPattern.exec(contentHtml)) !== null) {
    positions.push({
      name: normalizeSpeaker(speakerMatch[1]),
      contentStart: speakerMatch.index + speakerMatch[0].length,
    });
  }

  // Determine the primary entity (most common entity speaker)
  const entityCounts = new Map<string, number>();
  for (const pos of positions) {
    if (isEntity(pos.name)) {
      const normalized = normalizeSpeaker(pos.name);
      entityCounts.set(normalized, (entityCounts.get(normalized) || 0) + 1);
    }
  }
  if (entityCounts.size > 0) {
    primaryEntity = [...entityCounts.entries()].sort(
      (a, b) => b[1] - a[1]
    )[0][0];
  } else if (positions.length > 0) {
    // Fallback: first speaker is likely the entity
    primaryEntity = positions[0].name;
  }

  // Extract text between speaker headers
  for (let i = 0; i < positions.length; i++) {
    const start = positions[i].contentStart;
    const end =
      i < positions.length - 1
        ? contentHtml.lastIndexOf("<h4", positions[i + 1].contentStart)
        : contentHtml.length;

    const blockHtml = contentHtml.substring(start, end);

    // Extract paragraphs (skip channel notes and editorial notes)
    const paragraphs: string[] = [];
    const pPattern = /<p(?:\s[^>]*)?>(?!<span class="channel">)([\s\S]*?)<\/p>/g;
    let pMatch;

    while ((pMatch = pPattern.exec(blockHtml)) !== null) {
      const pContent = pMatch[1];

      // Skip editorial notes paragraphs
      if (pContent.includes('class="notes"')) continue;

      const text = cleanText(pContent);
      // Skip empty, pure notes [inaudible], or channel markers
      if (!text) continue;
      if (text.match(/^\[.*\]$/)) continue;

      paragraphs.push(text);
    }

    if (paragraphs.length === 0) continue;

    const speakerName = positions[i].name;
    const fullText = paragraphs.join(" ");

    // Determine chunk type
    let chunkType: TranscriptChunk["type"];
    if (isEntity(speakerName)) {
      chunkType = "channeling";
    } else if (isQuestioner(speakerName)) {
      chunkType = "question";
    } else {
      chunkType = "comment";
    }

    chunks.push({
      index: chunks.length,
      speaker: speakerName,
      text: fullText,
      type: chunkType,
    });
  }

  // If no speaker headers found, treat entire content as one chunk
  if (chunks.length === 0) {
    const allParagraphs: string[] = [];
    const pPattern = /<p[^>]*>([\s\S]*?)<\/p>/g;
    let pMatch;
    while ((pMatch = pPattern.exec(contentHtml)) !== null) {
      const text = cleanText(pMatch[1]);
      if (text && !text.match(/^\[.*\]$/)) {
        allParagraphs.push(text);
      }
    }
    if (allParagraphs.length > 0) {
      chunks.push({
        index: 0,
        speaker: "Unknown",
        text: allParagraphs.join(" "),
        type: "channeling",
      });
    }
  }

  return {
    id: entry.id,
    date: entry.date,
    entity: primaryEntity,
    type: entry.type,
    topics,
    url: entry.url,
    chunks,
  };
}

/**
 * Scrape a single transcript and save to disk
 */
async function scrapeAndSaveTranscript(entry: ManifestEntry): Promise<boolean> {
  const mmdd = entry.id.split("-").slice(1).join("");
  const yearDir = path.join(DATA_DIR, String(entry.year));
  const outputPath = path.join(yearDir, `${mmdd}.json`);

  // Skip if already scraped
  if (fs.existsSync(outputPath)) {
    return true;
  }

  try {
    const html = await fetchPage(entry.url);
    const transcript = parseTranscript(html, entry);

    // Create year directory
    if (!fs.existsSync(yearDir)) {
      fs.mkdirSync(yearDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(transcript, null, 2));

    const wordCount = transcript.chunks.reduce(
      (sum, c) => sum + countWords(c.text),
      0
    );

    // Update manifest entry with scraped data
    entry.wordCount = wordCount;
    entry.chunkCount = transcript.chunks.length;
    entry.entity = transcript.entity;

    return true;
  } catch (error) {
    console.error(
      `  Error scraping ${entry.url}: ${error instanceof Error ? error.message : String(error)}`
    );
    return false;
  }
}

/**
 * Scrape transcripts for specified years
 */
async function scrapeTranscripts(years: number[] | "all"): Promise<void> {
  // Load manifest
  if (!fs.existsSync(MANIFEST_PATH)) {
    console.error("Manifest not found. Run --discover first.");
    process.exit(1);
  }

  const manifest: Manifest = JSON.parse(
    fs.readFileSync(MANIFEST_PATH, "utf-8")
  );

  // Filter by years
  let entries = manifest.transcripts;
  if (years !== "all") {
    const yearSet = new Set(years);
    entries = entries.filter((e) => yearSet.has(e.year));
  }

  console.log(`Scraping ${entries.length} transcripts...\n`);

  let scraped = 0;
  let skipped = 0;
  let failed = 0;

  for (const entry of entries) {
    const mmdd = entry.id.split("-").slice(1).join("");
    const outputPath = path.join(DATA_DIR, String(entry.year), `${mmdd}.json`);

    if (fs.existsSync(outputPath)) {
      skipped++;
      continue;
    }

    process.stdout.write(
      `\r  [${scraped + skipped + failed + 1}/${entries.length}] ${entry.date} ${entry.type}`
    );

    const success = await scrapeAndSaveTranscript(entry);
    if (success) {
      scraped++;
    } else {
      failed++;
    }

    await delay(RATE_LIMIT_MS);
  }

  // Save updated manifest with word counts and entities
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));

  console.log(`\n\nScraping complete:`);
  console.log(`  Scraped: ${scraped}`);
  console.log(`  Skipped (already exist): ${skipped}`);
  console.log(`  Failed: ${failed}`);
}

// ─── Stats ───────────────────────────────────────────────────────────────────

/**
 * Count sentences in text (rough estimate)
 */
function countSentences(text: string): number {
  return text.split(/[.!?]+\s+/).filter((s) => s.trim().length > 10).length;
}

/**
 * Show stats from scraped data
 */
function showStats(): void {
  if (!fs.existsSync(MANIFEST_PATH)) {
    console.error("Manifest not found. Run --discover first.");
    process.exit(1);
  }

  const manifest: Manifest = JSON.parse(
    fs.readFileSync(MANIFEST_PATH, "utf-8")
  );

  console.log("=== Confederation Channeling Library Stats ===\n");
  console.log(`Total transcripts in manifest: ${manifest.totalTranscripts}`);
  console.log(`Discovered at: ${manifest.scrapedAt}\n`);

  // Count scraped transcripts
  let totalScraped = 0;
  let totalChunks = 0;
  let totalWords = 0;
  let totalSentences = 0;
  const entityCounts = new Map<string, number>();
  const decadeCounts = new Map<string, number>();
  const typeCounts = new Map<string, number>();

  for (const entry of manifest.transcripts) {
    const mmdd = entry.id.split("-").slice(1).join("");
    const filePath = path.join(DATA_DIR, String(entry.year), `${mmdd}.json`);

    if (!fs.existsSync(filePath)) continue;

    totalScraped++;
    const transcript: Transcript = JSON.parse(
      fs.readFileSync(filePath, "utf-8")
    );

    totalChunks += transcript.chunks.length;
    const wordCount = transcript.chunks.reduce(
      (sum, c) => sum + countWords(c.text),
      0
    );
    totalWords += wordCount;
    const sentenceCount = transcript.chunks.reduce(
      (sum, c) => sum + countSentences(c.text),
      0
    );
    totalSentences += sentenceCount;

    // Entity
    const entity = transcript.entity || "Unknown";
    entityCounts.set(entity, (entityCounts.get(entity) || 0) + 1);

    // Decade
    const decade = `${Math.floor(entry.year / 10) * 10}s`;
    decadeCounts.set(decade, (decadeCounts.get(decade) || 0) + 1);

    // Type
    const type = entry.type || "Unknown";
    typeCounts.set(type, (typeCounts.get(type) || 0) + 1);
  }

  console.log(`Scraped transcripts: ${totalScraped}`);
  console.log(`Total chunks (would-be passage vectors): ${totalChunks}`);
  console.log(
    `Total sentences (would-be sentence vectors): ${totalSentences}`
  );
  console.log(`Total words: ${totalWords.toLocaleString()}`);

  // Pinecone estimates
  // text-embedding-3-small: 1536 dimensions * 4 bytes = 6,144 bytes per vector
  // Plus metadata overhead ~500 bytes per vector
  const bytesPerVector = 6144 + 500;
  const passageStorageMB = (totalChunks * bytesPerVector) / (1024 * 1024);
  const sentenceStorageMB = (totalSentences * bytesPerVector) / (1024 * 1024);

  console.log(`\n--- Pinecone Storage Estimates ---`);
  console.log(`  Passage-level: ~${passageStorageMB.toFixed(0)} MB (${totalChunks} vectors)`);
  console.log(`  Sentence-level: ~${sentenceStorageMB.toFixed(0)} MB (${totalSentences} vectors)`);
  console.log(`  Free tier limit: 2,048 MB`);

  // Entity breakdown
  console.log(`\n--- By Entity ---`);
  const sortedEntities = [...entityCounts.entries()].sort(
    (a, b) => b[1] - a[1]
  );
  for (const [entity, count] of sortedEntities.slice(0, 15)) {
    console.log(`  ${entity}: ${count}`);
  }
  if (sortedEntities.length > 15) {
    console.log(`  ... and ${sortedEntities.length - 15} more`);
  }

  // Decade breakdown
  console.log(`\n--- By Decade ---`);
  const sortedDecades = [...decadeCounts.entries()].sort((a, b) =>
    a[0].localeCompare(b[0])
  );
  for (const [decade, count] of sortedDecades) {
    console.log(`  ${decade}: ${count}`);
  }

  // Type breakdown
  console.log(`\n--- By Session Type ---`);
  const sortedTypes = [...typeCounts.entries()].sort((a, b) => b[1] - a[1]);
  for (const [type, count] of sortedTypes.slice(0, 10)) {
    console.log(`  ${type}: ${count}`);
  }
  if (sortedTypes.length > 10) {
    console.log(`  ... and ${sortedTypes.length - 10} more`);
  }
}

// ─── CLI ─────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log("Usage:");
    console.log(
      "  npx tsx scripts/scrape-confederation.ts --discover"
    );
    console.log(
      "  npx tsx scripts/scrape-confederation.ts --scrape --all"
    );
    console.log(
      "  npx tsx scripts/scrape-confederation.ts --scrape --years 2024,2023"
    );
    console.log(
      "  npx tsx scripts/scrape-confederation.ts --stats"
    );
    process.exit(0);
  }

  if (args.includes("--discover")) {
    await discoverTranscripts();
  } else if (args.includes("--scrape")) {
    if (args.includes("--all")) {
      await scrapeTranscripts("all");
    } else {
      const yearsIdx = args.indexOf("--years");
      if (yearsIdx === -1 || !args[yearsIdx + 1]) {
        console.error("Specify --all or --years YYYY,YYYY,...");
        process.exit(1);
      }
      const years = args[yearsIdx + 1].split(",").map(Number);
      if (years.some(isNaN)) {
        console.error("Invalid year format. Use: --years 2024,2023");
        process.exit(1);
      }
      await scrapeTranscripts(years);
    }
  } else if (args.includes("--stats")) {
    showStats();
  } else {
    console.error("Unknown command. Use --discover, --scrape, or --stats.");
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
