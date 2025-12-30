/**
 * Session 106 Scraper for Law of One
 *
 * Scrapes session 106 from llresearch.org and creates JSON file
 * matching the format of existing session files.
 */

import * as fs from "fs";
import * as path from "path";

interface SessionData {
  [key: string]: string;
}

function parseSession106HTML(html: string): SessionData {
  const sessionData: SessionData = {};

  // The L/L Research site structure for Q&A:
  // <h4 id="N">106.N Questioner</h4>
  // <p>Question text...</p>
  // <h4>Ra</h4>
  // <p>Ra's answer...</p>
  //
  // For opening (106.0), it's just:
  // <h4 id="0">106.0 Ra</h4>
  // <p>I am Ra. I greet you...</p>

  function cleanText(text: string): string {
    return text
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
      .trim();
  }

  // Match each numbered section
  const sectionRegex = /<h4[^>]*id="(\d+)"[^>]*>[\s\S]*?<a[^>]*>106\.(\d+)<\/a>[\s\S]*?<span[^>]*>(Questioner|Ra)<\/span>[\s\S]*?<\/h4>([\s\S]*?)(?=<h4[^>]*id="\d+"|$)/g;

  let match;
  while ((match = sectionRegex.exec(html)) !== null) {
    const questionNum = `106.${match[2]}`;
    const speaker = match[3];
    const content = match[4];

    // Extract all <p> tags in this section
    const paragraphs: string[] = [];
    const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/g;
    let pMatch;

    while ((pMatch = pRegex.exec(content)) !== null) {
      const text = cleanText(pMatch[1]);
      if (text && !text.match(/^\[.*\]$/)) {
        // Skip stage directions in brackets
        paragraphs.push(text);
      }
    }

    if (paragraphs.length > 0) {
      // For section 0 (opening), just use Ra's greeting
      if (match[2] === "0") {
        sessionData[questionNum] = paragraphs.join(" ");
      } else {
        // For other sections, we expect:
        // First paragraph(s) = Questioner's question
        // Then Ra's response after an unmarked <h4>Ra</h4> header

        // Find where "Ra" speaker header appears (unmarked)
        const raHeaderMatch = content.match(/<h4[^>]*><span[^>]*>Ra<\/span><\/h4>/);
        if (raHeaderMatch) {
          const raHeaderIndex = raHeaderMatch.index!;
          const beforeRa = content.substring(0, raHeaderIndex);
          const afterRa = content.substring(raHeaderIndex);

          // Extract question
          const questionParagraphs: string[] = [];
          const qRegex = /<p[^>]*>([\s\S]*?)<\/p>/g;
          let qMatch;
          while ((qMatch = qRegex.exec(beforeRa)) !== null) {
            const text = cleanText(qMatch[1]);
            if (text && !text.match(/^\[.*\]$/)) {
              questionParagraphs.push(text);
            }
          }

          // Extract answer
          const answerParagraphs: string[] = [];
          const aRegex = /<p[^>]*>([\s\S]*?)<\/p>/g;
          let aMatch;
          while ((aMatch = aRegex.exec(afterRa)) !== null) {
            const text = cleanText(aMatch[1]);
            if (text && !text.match(/^\[.*\]$/)) {
              answerParagraphs.push(text);
            }
          }

          // Combine question and answer
          const question = questionParagraphs.join(" ");
          const answer = answerParagraphs.join(" ");

          if (question && answer) {
            sessionData[questionNum] = `Questioner: ${question} Ra: ${answer}`;
          } else if (answer) {
            sessionData[questionNum] = answer;
          }
        } else {
          // No Ra header found, just use all paragraphs
          sessionData[questionNum] = paragraphs.join(" ");
        }
      }
    }
  }

  return sessionData;
}

async function main() {
  const htmlPath = "/tmp/session106.html";
  const outputPath = path.join(__dirname, "..", "sections", "106.json");

  // Read the HTML file
  console.log("Reading HTML file...");
  const html = fs.readFileSync(htmlPath, "utf-8");

  // Parse the session data
  console.log("Parsing session 106...");
  const sessionData = parseSession106HTML(html);

  const entryCount = Object.keys(sessionData).length;
  console.log(`Extracted ${entryCount} Q&A entries`);

  if (entryCount === 0) {
    console.error("No data extracted! Check HTML structure.");
    process.exit(1);
  }

  // Show sample
  console.log("\nSample entries:");
  const keys = Object.keys(sessionData).slice(0, 2);
  for (const key of keys) {
    const preview = sessionData[key].substring(0, 100);
    console.log(`  ${key}: "${preview}..."`);
  }

  // Write JSON file
  console.log(`\nWriting to ${outputPath}...`);
  fs.writeFileSync(
    outputPath,
    JSON.stringify(sessionData, null, 2),
    "utf-8"
  );

  console.log("✓ Session 106 successfully saved!");
}

main().catch((error) => {
  console.error("Scraping failed:", error);
  process.exit(1);
});
