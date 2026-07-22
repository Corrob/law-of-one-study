/**
 * Follow-up suggestion generation for the Ask feature.
 *
 * After an answer streams, a small extra model call proposes three short
 * follow-up questions the seeker might ask next. It always degrades gracefully:
 * any failure returns a localized static fallback, so the UI can always show
 * three chips.
 */

import { getOpenAIClient } from "./openai";
import { ASK_MODEL, ASK_REASONING_EFFORT } from "./config";
import { type AvailableLanguage, LANGUAGE_NAMES_FOR_PROMPTS, DEFAULT_LOCALE } from "@/lib/language-config";

const MAX_SUGGESTION_LENGTH = 100;
const SUGGESTION_COUNT = 3;

/** Static, localized fallbacks used when the model call fails. */
const FALLBACKS: Record<AvailableLanguage, string[]> = {
  en: [
    "Can you explain this further?",
    "How does this connect to other teachings?",
    "What does Ra say about the harvest?",
  ],
  es: [
    "¿Puedes explicar esto más?",
    "¿Cómo se conecta con otras enseñanzas?",
    "¿Qué dice Ra sobre la cosecha?",
  ],
  de: [
    "Kannst du das näher erklären?",
    "Wie hängt das mit anderen Lehren zusammen?",
    "Was sagt Ra über die Ernte?",
  ],
  fr: [
    "Peux-tu développer ceci ?",
    "Quel lien avec d'autres enseignements ?",
    "Que dit Ra sur la moisson ?",
  ],
};

/**
 * Static fallbacks for conscious-channeling mode — never mention Ra. Channeling
 * is English-only, so a single set suffices.
 */
const CHANNELING_FALLBACKS: string[] = [
  "Can you explain this further?",
  "How can I bring this into daily life?",
  "What does Q'uo say about meditation?",
];

export function getFallbackSuggestions(
  locale: AvailableLanguage = DEFAULT_LOCALE,
  source: "ra" | "channeling" = "ra"
): string[] {
  if (source === "channeling") return CHANNELING_FALLBACKS;
  return FALLBACKS[locale] ?? FALLBACKS.en;
}

/**
 * Parse the model's JSON reply into up to three clean suggestion strings, or
 * return null if it doesn't look valid.
 */
export function parseSuggestions(raw: string): string[] | null {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  const items = (data as { suggestions?: unknown })?.suggestions;
  if (!Array.isArray(items)) return null;
  const cleaned = items
    .filter((s): s is string => typeof s === "string")
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && s.length <= MAX_SUGGESTION_LENGTH)
    .slice(0, SUGGESTION_COUNT);
  return cleaned.length > 0 ? cleaned : null;
}

function buildPrompt(
  locale: AvailableLanguage,
  conceptTerms: string[],
  source: "ra" | "channeling"
): string {
  const language = LANGUAGE_NAMES_FOR_PROMPTS[locale];

  if (source === "channeling") {
    // Channeling mode: steer toward the curated conscious-channeling themes and
    // never reference the Ra material.
    const topicHint = conceptTerms.length
      ? `\n- Prefer follow-ups about themes this tool's conscious-channeling library covers well, especially: ${conceptTerms.join(", ")} — or other pastoral themes (grief, faith, meditation, service, wanderers, the open heart).`
      : `\n- Prefer follow-ups about pastoral themes this tool's conscious-channeling library covers well (grief, faith, meditation, catalyst, service, wanderers, the open heart).`;
    return `You generate follow-up questions for a chat grounded in L/L Research's conscious channeling (Q'uo, Latwii, Hatonn).
Given the seeker's question and the assistant's answer, propose exactly ${SUGGESTION_COUNT} short, natural follow-up questions the seeker might tap next.
- Make them varied: one that goes deeper, one that broadens to a related theme, and one that clarifies or applies the idea.${topicHint}
- Each must be a concise question of at most 12 words, phrased in the seeker's voice ("What…", "How…", "Can you…"). No numbering, no quotes.
- Do NOT mention Ra or the Ra Material — this conversation draws on the conscious channeling. You may reference Q'uo by name.
- Write them in ${language}.
Return ONLY JSON in this exact shape: {"suggestions": ["...", "...", "..."]}`;
  }

  // Steer follow-ups toward topics the study tool has real grounding for, so a
  // tapped chip doesn't lead to a question the tool answers poorly.
  const topicHint = conceptTerms.length
    ? `\n- Prefer follow-ups about topics this study tool covers well, especially: ${conceptTerms.join(", ")} — or other core Law of One concepts (densities, polarity, catalyst, energy centers, the harvest).`
    : `\n- Prefer follow-ups about core Law of One concepts the study tool covers well (densities, polarity, catalyst, energy centers, the harvest).`;
  return `You generate follow-up questions for a Law of One (Ra Material) study chat.
Given the seeker's question and the assistant's answer, propose exactly ${SUGGESTION_COUNT} short, natural follow-up questions the seeker might tap next.
- Make them varied: one that goes deeper, one that broadens to a related teaching, and one that clarifies or applies the idea.${topicHint}
- Each must be a concise question of at most 12 words, phrased in the seeker's voice ("What…", "How…", "Can you…"). No numbering, no quotes.
- Write them in ${language}.
Return ONLY JSON in this exact shape: {"suggestions": ["...", "...", "..."]}`;
}

/**
 * Generate three follow-up suggestions. Never throws — returns the localized
 * fallback on any error or malformed response.
 */
export async function generateSuggestions(
  message: string,
  answer: string,
  locale: AvailableLanguage = DEFAULT_LOCALE,
  conceptTerms: string[] = [],
  source: "ra" | "channeling" = "ra"
): Promise<string[]> {
  try {
    // Keep the answer context bounded.
    const answerContext =
      answer.length > 1200 ? `…${answer.slice(-1000)}` : answer;
    const client = getOpenAIClient();
    const completion = await client.chat.completions.create({
      model: ASK_MODEL,
      reasoning_effort: ASK_REASONING_EFFORT,
      max_completion_tokens: 400,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: buildPrompt(locale, conceptTerms, source) },
        {
          role: "user",
          content: `SEEKER'S QUESTION:\n${message}\n\nASSISTANT'S ANSWER:\n${answerContext}`,
        },
      ],
    });
    const parsed = parseSuggestions(completion.choices[0]?.message?.content ?? "");
    if (parsed && parsed.length >= 1) {
      // Pad to three from the fallback if the model returned fewer.
      const padded = [...parsed];
      for (const f of getFallbackSuggestions(locale, source)) {
        if (padded.length >= SUGGESTION_COUNT) break;
        if (!padded.includes(f)) padded.push(f);
      }
      return padded.slice(0, SUGGESTION_COUNT);
    }
    return getFallbackSuggestions(locale, source);
  } catch (error) {
    console.error("[api/ask] suggestion generation failed:", error);
    return getFallbackSuggestions(locale, source);
  }
}
