/**
 * API route for fetching surrounding context for a Confederation sentence match.
 * Returns a few sentences before and after the matched sentence from the passage.
 */

import { NextRequest } from "next/server";
import { fetchConfederationPassage, findConfederationChunkBySentence } from "@/lib/pinecone";

const CONTEXT_SENTENCES = 4;

/**
 * Split text into sentences, preserving sentence boundaries.
 */
function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/**
 * Extract surrounding context around a matched sentence.
 * Returns CONTEXT_SENTENCES before and after the match.
 */
function extractContext(fullText: string, matchedSentence: string): string {
  const sentences = splitSentences(fullText);

  // Find the sentence that contains the matched text
  const matchIndex = sentences.findIndex((s) => s.includes(matchedSentence));

  if (matchIndex === -1) {
    // Fuzzy fallback: find best overlap by normalizing whitespace
    const normalize = (s: string) => s.replace(/\s+/g, " ").trim();
    const normalizedMatch = normalize(matchedSentence);
    const fuzzyIndex = sentences.findIndex((s) =>
      normalize(s).includes(normalizedMatch) ||
      normalizedMatch.includes(normalize(s))
    );
    if (fuzzyIndex === -1) {
      // Can't find the sentence — return a truncated excerpt
      return sentences.slice(0, CONTEXT_SENTENCES * 2 + 1).join(" ");
    }
    const start = Math.max(0, fuzzyIndex - CONTEXT_SENTENCES);
    const end = Math.min(sentences.length, fuzzyIndex + CONTEXT_SENTENCES + 1);
    return sentences.slice(start, end).join(" ");
  }

  const start = Math.max(0, matchIndex - CONTEXT_SENTENCES);
  const end = Math.min(sentences.length, matchIndex + CONTEXT_SENTENCES + 1);
  return sentences.slice(start, end).join(" ");
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const transcriptId = searchParams.get("id");
  const chunkIndexStr = searchParams.get("chunk");
  const matchedSentence = searchParams.get("sentence");

  if (!transcriptId || !chunkIndexStr) {
    return new Response(
      JSON.stringify({ error: "Missing id or chunk parameter" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const chunkIndex = parseInt(chunkIndexStr, 10);
  if (isNaN(chunkIndex)) {
    return new Response(
      JSON.stringify({ error: "Invalid chunk parameter" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const passage = await fetchConfederationPassage(transcriptId, chunkIndex);

    if (!passage && !matchedSentence) {
      return new Response(
        JSON.stringify({ error: "Passage not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    let passageText = passage?.text || "";

    // If sentence provided, check if it's in this chunk; if not, search all chunks.
    // The fallback is expensive (batch-fetches up to 620 IDs from Pinecone) but only
    // triggers when the sentence index's chunkIndex doesn't match the passage chunk.
    if (matchedSentence) {
      const anchor = matchedSentence.slice(0, 60).toLowerCase();
      if (!passageText.toLowerCase().includes(anchor)) {
        const found = await findConfederationChunkBySentence(transcriptId, matchedSentence);
        if (found) passageText = found;
      }
    }

    if (!passageText) {
      return new Response(
        JSON.stringify({ error: "Passage not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const text = matchedSentence
      ? extractContext(passageText, matchedSentence)
      : passageText;

    return new Response(
      JSON.stringify({ text }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Confederation passage fetch error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch passage" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
