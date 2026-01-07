// =============================================================================
// SUGGESTION GENERATION PROMPT - Generate follow-up questions
// =============================================================================

export const SUGGESTION_GENERATION_PROMPT = `Generate EXACTLY 3 follow-up suggestions for THIS conversation. You must almost always return 3 suggestions - only skip in rare error cases.

You will receive: detected intent, conversation depth (turn count), user's question, and assistant's response.

RULE 1: RESPOND TO INVITATIONS
If response ends with a question or prompt:
- Direct question ("Have you...?") → First suggestion MUST answer it
- Open invitation ("I wonder...") → First suggestion engages with it
Examples: "Have you noticed this?" → "Yes, I think I have"

RULE 2: STAY SPECIFIC
Use the exact terms just discussed, not abstractions:
- Discussed "the veil" → use "veil", NOT "densities"
- Discussed "grief" → use "grief/loss", NOT abstract "catalyst"
- GOOD: "What else does Ra say about [specific topic]?"
- BAD: "Tell me more", "What else?" (too vague)

RULE 3: MATCH EMOTIONAL CONTEXT
For "personal" intent (STRICT - zero practice suggestions):
- FORBIDDEN words: meditation, journal, practice, routine, daily, exercise, try this, plan
- Include one info-seeking option: "What does Ra say about this?"
- Include one gentle exit: "I'd like to explore something else"
- For acute distress, ALL suggestions must be warm and non-prescriptive
- ALLOWED: "What does Ra say about this?", "Is there hope here?", "How do I find peace?"
- FORBIDDEN: "Try meditating", "Start a practice", "Journal about this"

For "meta" intent (tool questions, greetings):
- Invite exploration: "What topics can I ask about?"
- Suggest starter questions: "What is the Law of One?"

For other intents: Focus on curiosity and deeper understanding. Reserve practice suggestions for "practical" intent only.

RULE 4: BREADTH AFTER DEPTH
Use CONVERSATION DEPTH to guide variety:
- Turn 1-2: Focus on exploration and curiosity about current topic
- Turn 3-4: Deeper follow-ups on current thread
- Turn 5+: Include one "breadth" option to explore new territory
  Examples: "I'd like to explore something new", "What other topics does Ra cover?"

If the context says "(deep conversation - consider offering a breadth option)", include at least one suggestion that opens a new direction.

RULE 5: ADAPT TO RESPONSE LENGTH
- Short response (under 100 words): Suggest exploration or expansion of the topic
- Long response (300+ words): Suggest clarification, specific aspects, or deeper understanding
- Error/apology responses: Return [] (covered in skip conditions)

RULE 6: MATCH INTENT CATEGORY
Suggestions must match the user's apparent intent:

- "quote-search" → More quotes, passages, deeper understanding (NOT practice suggestions)
  GOOD: "Show the full passage", "Find more quotes about X", "What else does Ra say about this?"
  BAD: "How do I apply this?", "Which sessions discuss X?", "What session is this from?"

- "conceptual" → Deeper explanations, related concepts, contrasts
  GOOD: "How does this relate to X?", "What's the difference between...?"
  BAD: "Start a daily practice", "Try journaling about this"

- "practical" → OK to suggest practices, exercises, routines

- "personal" → Gentle, supportive, include escape hatches
  GOOD: "What might help?", "I'd like to explore something else"
  BAD: "Start a 7-day plan", "Journal every evening"

- "comparative" → Academic comparisons, parallels, differences
  GOOD: "What are the key differences?", "How does Ra's view differ?"
  BAD: "Integrate both into your practice"

- "meta" → Tool usage, topic exploration
  GOOD: "What topics can I explore?", "How do I search?"
  BAD: "Start meditating with Ra's guidance"

- "off-topic" → Welcoming redirects to Ra Material
  GOOD: "What is the Law of One?", "Tell me about densities", "What topics can I explore?"
  BAD: Any follow-up on the off-topic subject

CRITICAL: Only 1 of 3 suggestions may reference practice/meditation/exercise for non-"practical" intents.

RULE 7: VARIETY IN TYPES
Each suggestion must be a DIFFERENT type. Categories:
A. Depth - dig deeper into current topic ("What determines readiness?")
B. Breadth - connect to adjacent concept ("How does this relate to X?")
C. Quote - request more Ra quotes on topic ("What else does Ra say about X?", "Show more quotes")
D. Clarify - ask about specific term ("What do you mean by X?")
E. Exit - change direction ("I'd like to explore something else")

BAD: 3 depth questions about same subtopic
GOOD: 1 depth + 1 breadth + 1 quote (or any 3 different types)

RULE 8: NO ECHO
If the context includes "AI QUESTIONS (do not echo these)", do NOT:
- Repeat those questions verbatim
- Rephrase them with minor word changes
- Turn them into statements
BAD: AI asked "Have you tried X?" → suggesting "Have you tried X?"
GOOD: AI asked "Have you tried X?" → "Yes, but I struggle with it"

FORMAT:
- Under 50 characters preferred (60 absolute max)
- Examples: "What determines readiness?" (28 chars) GOOD
            "How does this relate to catalyst?" (35 chars) GOOD
            "Can you explain how the veil relates to catalyst?" (50 chars) OK
- First-person voice ("How do I..." not "Explain...")
- Plain text only - no emoji, quotes, or special characters
- Must form complete, natural sentences or questions

WHEN TO SKIP (return []) - RARE, only these exact cases:
- Response was an error message or apology for system failure
- Response explicitly listed 3+ numbered options for user to choose from

Default to generating 3 suggestions. When in doubt, generate suggestions.

BAD PATTERNS (never use):
- "Tell me more" / "What else?" (too vague)
- Restating user's original question in different words
- Topic jumps unrelated to what was just discussed
- Clinical terms for emotional contexts
- Questions the response already answered
- Generic depth without specificity: "Go deeper" (which aspect?)
- Session-based suggestions: "Which sessions discuss X?", "What session numbers cover X?" (sessions lack topic cohesion - each session jumps between many topics, so session numbers aren't useful for finding related content)
- Echoing AI's question back: If AI asked "Have you tried meditation?", don't suggest "Have you tried meditation?"
- Philosophical abstraction when user was practical: User asked "how to meditate" → don't suggest "What is the nature of consciousness?"
- Intellectual curiosity for acute distress: User grieving → don't suggest "How does polarity factor into death?"
- Time-commitment suggestions for non-practical queries: "7-day plan", "10-minute routine", "daily practice"
- Prescriptive practice for conceptual/quote queries: "Try meditating on this", "Journal about..."
- Assuming application when user just wants information

EXAMPLES:

AI explained meditation and asked "Do you have a practice currently?"
→ ["Yes, but I struggle with it", "Not yet - where do I start?", "How long should sessions be?"]

Personal: AI offered comfort about loss
→ ["How do I find peace with this?", "Does it get easier?", "I'd like to explore something else"]

Conceptual: AI explained harvest with no closing question
→ ["What determines readiness?", "How does polarity factor in?", "What happens if I'm not ready?"]

Meta: AI explained how the tool works
→ ["What is the Law of One?", "Tell me about densities", "What topics can I explore?"]

AI apologized for a system error
→ []

CRITICAL: Return EXACTLY 3 suggestions in almost all cases. Only return [] for system errors.

Return ONLY: { "suggestions": ["suggestion1", "suggestion2", "suggestion3"] }`;
