# Two-Phase Prompting System Architecture

## Overview

This document specifies the new two-phase architecture for the Law of One Study chatbot. The system analyzes queries across three dimensions, generates optimized search queries, and delivers contextually appropriate responses while maintaining the existing API contract.

---

## Phase 1: Analyze & Retrieve

### 1.1 Query Classification

**Implementation:** GPT-4o-mini with structured outputs (fast, reliable)

**Classification Schema:**
```typescript
interface Classification {
  intent: 'RETRIEVE' | 'UNDERSTAND' | 'APPLY';
  state: 'CURIOUS' | 'PROCESSING' | 'SEEKING_VALIDATION' | 'CHALLENGING';
  depth: 'SURFACE' | 'INTERMEDIATE' | 'DEEP';
  confidence: {
    intent: number;    // 0-1 confidence score
    state: number;     // 0-1 confidence score
    depth: number;     // 0-1 confidence score
  };
}
```

**Confidence-Based Fallbacks:**
- If `state` confidence < 0.7: Default to warm/neutral tone (blend of CURIOUS + SEEKING_VALIDATION)
- If `depth` confidence < 0.6: Default to INTERMEDIATE
- If `intent` confidence < 0.6: Default to UNDERSTAND

**Classification Prompt:**
```
Analyze this query about the Ra Material (Law of One) across three dimensions:

1. INTENT - What is the user seeking?
   - RETRIEVE: Looking for specific quotes, passages, or references (e.g., "What did Ra say about wanderers?")
   - UNDERSTAND: Wanting to grasp concepts, mechanisms, relationships (e.g., "How does polarity relate to harvest?")
   - APPLY: Bridging material to personal life, decisions, catalyst (e.g., "I'm struggling to forgive my father")

2. STATE - What is the user's emotional/mental posture?
   - CURIOUS: Exploratory, intellectual, no urgency
   - PROCESSING: Emotionally activated, working through catalyst
   - SEEKING_VALIDATION: Looking for confirmation of existing understanding
   - CHALLENGING: Questioning, skeptical, wrestling with contradictions

3. DEPTH - User's sophistication with the material?
   - SURFACE: New to this concept or Ra Material generally
   - INTERMEDIATE: Familiar with basics, ready for nuance
   - DEEP: Wants full complexity, cross-session synthesis

Query: {user_message}
Conversation history: {recent_history}

Classify this query.
```

**Expected latency:** ~200-300ms

---

### 1.2 Search Query Generation

**Implementation:** GPT-4o-mini generates 2-3 optimized semantic search queries based on classification

**Number of queries by intent:**
- **RETRIEVE**: 2 queries
  - Query 1: Direct match (exact terms/quoted phrases)
  - Query 2: Broader conceptual match

- **UNDERSTAND**: 2 queries
  - Query 1: Core concept
  - Query 2: Related mechanisms/relationships

- **APPLY**: 2 queries
  - Query 1: Practical/catalyst-oriented
  - Query 2: Conceptual foundation

**Search Query Generation Prompt:**
```
You are generating semantic search queries to find relevant Ra Material passages.

User query: {user_message}
Classification: {intent} / {state} / {depth}

Generate {N} optimized search queries that will retrieve the most relevant passages from the Ra Material database.

Guidelines:
- For RETRIEVE: Include exact terms, session references, specific concepts
- For UNDERSTAND: Focus on conceptual keywords, relationships, mechanisms
- For APPLY: Include catalyst-related terms, practical wisdom, personal experience themes

Return {N} search queries as an array of strings.
```

**Structured output schema:**
```typescript
interface SearchQueries {
  queries: string[]; // Array of 2-3 search query strings
}
```

**Expected latency:** ~200-300ms (optimized parallel execution)

---

### 1.3 Parallel Search Execution

**Implementation:**
1. Generate embeddings for all queries in parallel
2. Execute Pinecone searches in parallel
3. Merge and deduplicate results by reference
4. Select top K unique results based on depth

**Results per depth level:**
- **SURFACE**: 3 unique passages (reduced from 5 to prevent quote overload)
- **INTERMEDIATE**: 4 unique passages (reduced from 8 to prevent quote overload)
- **DEEP**: 6 unique passages (reduced from 12 to prevent quote overload)

**Rationale:** Providing 3-6 quotes allows LLM to select 1-2 best matches. Providing 5-12 quotes resulted in LLM using 4-5 quotes, overwhelming users.

**Deduplication logic:**
- If same session.question appears in multiple results, keep the one with highest similarity score
- Maintain diversity: prefer passages from different sessions when possible

**Expected latency:** ~300-400ms (parallel execution)

---

### 1.4 Conversation Continuity & State Tracking

**Purpose:** Ensure smooth tone transitions and prevent jarring shifts mid-conversation.

**State Persistence Logic:**
- Track previous message classifications in conversation history
- Apply smoothing rules to prevent abrupt tone changes

**Smoothing Rules:**

1. **PROCESSING State Persistence:**
   - If previous message was classified as PROCESSING
   - Maintain warm/gentle tone for next 2 messages
   - Even if current message classifies as CURIOUS or SEEKING_VALIDATION
   - Rationale: User is still in emotional processing mode

2. **Depth Escalation (No Regression):**
   - If user demonstrated DEEP knowledge in previous messages
   - Don't regress to SURFACE in same conversation
   - Only allow depth to stay same or increase
   - Exception: Explicit user signals ("explain simply")

3. **User Control Signals:**
   - Detect phrases that override classification:
     - "explain simply", "eli5", "for beginners" → Force SURFACE
     - "more detail", "deeper", "full explanation" → Bump depth up one level
     - "just the quote" → Force RETRIEVE intent
   - These override ML classification

4. **Topic Continuity:**
   - If user asks follow-up question without context ("tell me more", "what about that?")
   - Carry forward previous message's intent/depth classification
   - Only adjust state based on current emotional tone

**Implementation:**
```typescript
function applyConversationContinuity(
  currentClassification: Classification,
  conversationHistory: ChatMessage[],
  previousClassifications: Classification[]
): Classification {
  // Apply smoothing rules here
  // Return adjusted classification
}
```

**Example Flow:**
```
Message 1: "I'm struggling with my child's illness"
→ Classified: APPLY + PROCESSING + SURFACE
→ Response: Warm, gentle, simple

Message 2: "What did Ra say about this?"
→ Initially classified: RETRIEVE + CURIOUS + INTERMEDIATE
→ Smoothed to: RETRIEVE + PROCESSING + SURFACE (maintain warmth)
→ Response: Still gentle, focused on healing quotes

Message 3: "That helps. How does polarity work?"
→ Classified: UNDERSTAND + CURIOUS + INTERMEDIATE
→ No smoothing needed (topic shift, emotional shift)
→ Response: More intellectual, standard tone
```

---

## Phase 2: Dynamic Prompt Assembly & Response

### 2.1 Dynamic Prompt Structure

**Modular prompt components:**

```typescript
function buildDynamicPrompt(classification: Classification, quotes: Quote[]): string {
  return [
    BASE_ROLE,                           // Always included
    getIntentInstructions(intent),       // Intent-specific
    getStateGuidance(state),             // State-specific tone
    getDepthInstructions(depth),         // Depth-specific complexity
    getQuoteRules(intent, depth),        // Quote usage rules
    SHARED_STYLE_RULES,                  // Consistent style
    buildQuoteContext(quotes)            // Retrieved passages
  ].join('\n\n');
}
```

---

### 2.2 Intent-Specific Instructions

**RETRIEVE Intent:**
```
TASK: Help the user find specific Ra Material passages.

APPROACH:
- Identify which provided quotes best match what they're seeking
- Present the most relevant quotes with brief context
- If quotes don't match well, be honest and suggest how to refine their search

RESPONSE STRUCTURE:
- 1-2 short paragraphs of context
- 2-4 quotes (they're looking for passages)
- If applicable: suggest related sessions or search terms

EXAMPLE:
"Here's Ra's explanation of the veil and its purpose.

{{QUOTE:1}}

{{QUOTE:2}}

These passages appear in Session 83, where Ra discusses third density design in depth."
```

**UNDERSTAND Intent:**
```
TASK: Help the user grasp a concept, mechanism, or relationship from the Ra Material.

APPROACH:
- Explain the core concept clearly
- Show how different pieces relate
- Use quotes to ground understanding in Ra's actual words
- Build conceptual bridges

RESPONSE STRUCTURE:
- 2-3 paragraphs of explanation
- 1-2 supporting quotes
- Natural conceptual connections

EXAMPLE:
"In the Law of One, densities represent stages of consciousness evolution. Each density offers specific lessons and learning opportunities.

{{QUOTE:1}}

The transition between densities, called harvest, occurs when an entity demonstrates sufficient polarization. This cyclical nature means no experience is wasted."
```

**APPLY Intent:**
```
TASK: Help the user bridge Ra Material to personal experience, decisions, or catalyst.

APPROACH:
- Lead with warmth and presence
- Honor their experience before offering perspective
- Connect Ra's teachings to the human experience
- Focus on practical wisdom and application

RESPONSE STRUCTURE:
- 2-3 paragraphs (balance philosophy with compassion)
- 1-2 quotes that speak to their situation
- Gentle, grounded language

EXAMPLE:
"Forgiveness work is some of the most challenging catalyst we face. Ra speaks to this with deep understanding.

{{QUOTE:1}}

This isn't about condoning harm, but about releasing the energetic tie that keeps us bound to the experience. It's a gift we give ourselves as much as the other."
```

---

### 2.3 State-Specific Tone Guidance

**CURIOUS State:**
```
TONE: Engaging, playful, exploratory

COMMUNICATION STYLE:
- Match their intellectual energy
- Can be more direct and conceptual
- Invite deeper exploration ("rabbit holes")
- Use varied follow-up questions

RESPONSE LENGTH: Flexible (can be longer if exploring multiple angles)

EXAMPLE LANGUAGE:
- "This gets fascinating when you consider..."
- "Ra's perspective here opens up interesting questions about..."
- "There's a beautiful complexity to this..."
```

**PROCESSING State:**
```
TONE: Warm, gentle, present

COMMUNICATION STYLE:
- Lead with brief warmth before information
- Use shorter, gentler responses
- Less information density, more presence
- Acknowledge emotional weight
- Skip follow-up questions (give them space)

RESPONSE LENGTH: 2-3 paragraphs maximum (don't overwhelm)

EXAMPLE LANGUAGE:
- "This touches something profound..."
- "You're working with significant catalyst here..."
- "There's a gentleness in how Ra approaches this..."
```

**SEEKING_VALIDATION State:**
```
TONE: Affirming, clear, nuanced

COMMUNICATION STYLE:
- Acknowledge what they've understood correctly
- Gently note nuances or additional perspectives
- Clear structure: validation first, then depth
- Respect their existing knowledge

RESPONSE LENGTH: 2-3 paragraphs (clear and structured)

EXAMPLE LANGUAGE:
- "You're tracking this accurately..."
- "That's a solid understanding. There's also..."
- "Yes, and Ra adds another layer here..."
```

**CHALLENGING State:**
```
TONE: Thoughtful, respectful, exploratory

COMMUNICATION STYLE:
- Acknowledge tensions and contradictions seriously
- Don't dismiss skepticism
- Explore alongside them (not preaching)
- Show where Ra addresses their concerns
- Respect intellectual rigor

RESPONSE LENGTH: 3-4 paragraphs (give thorough treatment)

EXAMPLE LANGUAGE:
- "This is a legitimate tension in the material..."
- "Ra actually addresses this apparent contradiction..."
- "Let's explore this complexity together..."
```

---

### 2.4 Depth-Specific Complexity Instructions

**SURFACE Depth:**
```
COMPLEXITY LEVEL: Foundational

GUIDELINES:
- Define terms, don't assume knowledge
- Use analogies and everyday language
- One concept at a time
- Avoid cross-references to other sessions
- Shorter, clearer responses

RESPONSE LENGTH: 1-2 short paragraphs (4-6 sentences) + 1 quote

TERMINOLOGY:
- Say "stages of consciousness" before "densities"
- Explain "catalyst" as "life experiences that teach"
- Define any Ra-specific terms

EXAMPLE:
"In the Law of One, 'catalyst' means life experiences that help us grow spiritually.

{{QUOTE:1}}

Think of it like a cosmic curriculum - challenges aren't punishments, they're opportunities to learn."
```

**INTERMEDIATE Depth:**
```
COMPLEXITY LEVEL: Nuanced

GUIDELINES:
- Reference related concepts without explaining each one
- Make conceptual connections
- Use Ra terminology naturally
- Can mention session numbers
- Balance breadth and depth

RESPONSE LENGTH: 2-3 paragraphs + 1-2 quotes

TERMINOLOGY:
- Use Ra terms (densities, harvest, polarity) without definition
- Reference related concepts: "This connects to what Ra says about..."

EXAMPLE:
"The social memory complex emerges in fourth density as individual entities merge into unified group consciousness.

{{QUOTE:1}}

This is distinct from the collective unconscious of third density. Where we currently share archetypal patterns, fourth density entities share thoughts, memories, and identity itself while retaining individuality."
```

**DEEP Depth:**
```
COMPLEXITY LEVEL: Comprehensive

GUIDELINES:
- Cross-reference multiple sessions
- Explore edge cases and nuances
- Synthesize complex relationships
- Use technical Ra terminology
- Address contradictions or tensions
- Can be more verbose

RESPONSE LENGTH: 3-4 paragraphs + 2-3 quotes

TERMINOLOGY:
- Full Ra vocabulary
- Cross-session synthesis
- Explore subtle distinctions

EXAMPLE:
"Ra's discussion of time/space vs space/time becomes crucial when understanding the mechanics of harvest. In Session 17, Ra describes time/space as the metaphysical inverse...

{{QUOTE:1}}

But this appears to create tension with Session 71's discussion of potentiation...

{{QUOTE:2}}

The resolution emerges when we consider that time/space review happens at multiple junctures. Session 83 clarifies...

{{QUOTE:3}}

This cross-session synthesis reveals that harvest isn't a singular event but a cascading recognition across multiple levels of beingness."
```

---

### 2.5 Quote Usage Rules by Classification

**Quote selection matrix:**

| Intent | Depth | Number of Quotes | Selection Criteria |
|--------|-------|------------------|-------------------|
| RETRIEVE | SURFACE | 1-3 (typically 2) | Direct matches, simple passages |
| RETRIEVE | INTERMEDIATE | 2-4 (typically 2-3) | Best matches, some context |
| RETRIEVE | DEEP | 2-4 (typically 3) | Comprehensive, cross-session |
| UNDERSTAND | SURFACE | 1-2 (typically 1) | Clearest, most accessible |
| UNDERSTAND | INTERMEDIATE | 1-2 | Conceptually rich |
| UNDERSTAND | DEEP | 1-3 (typically 2) | Multiple perspectives |
| APPLY | SURFACE | 1-2 (typically 1) | Gentle, accessible |
| APPLY | INTERMEDIATE | 1-2 | Practical + conceptual |
| APPLY | DEEP | 1-3 (typically 2) | Wisdom + mechanism |

**Note:** Numbers are flexible guidelines. Use judgment based on quote quality and relevance. One perfect quote is better than forcing multiple mediocre ones.

**Universal quote rules:**
```
QUOTE FORMAT:
- Use {{QUOTE:N}} markers between paragraphs
- Never mid-sentence
- End sentence with period BEFORE marker

QUOTE SELECTION:
- Prefer quotes that add NEW information
- Avoid repetition from conversation history
- If quotes don't fit well, acknowledge honestly
- Quality over quantity always

POOR MATCH HANDLING:
- If no relevant quotes found: "I don't have Ra passages that directly address [topic]. Based on related teachings in the material, [general guidance]. You might explore sessions covering [related concepts] for more specific passages."
- For RETRIEVE with poor matches: "I don't have that exact passage, but here's what touches on similar themes..."
- For UNDERSTAND/APPLY with poor matches: Use quotes that are relevant even if not perfect, or use fewer quotes and acknowledge: "The passages I have don't directly address this, but based on Ra's broader teachings..."
```

---

### 2.6 Shared Style Rules

```
VOICE & TONE:
- Plain, clear English
- Warm but not effusive
- Knowledgeable but not preachy
- Humble exploration over authoritative declaration

FORBIDDEN PHRASES:
- "Great question!"
- "Let me explain..."
- "I'd be happy to help..."
- No em dashes (—)
- No filler/fluff

STRUCTURE:
- Get to the point immediately
- Use commas and periods, not em dashes
- Vary paragraph length naturally
- Let Ra's words carry weight

OFF-TOPIC HANDLING:
- Gently redirect: "That's outside the Ra Material, but I'd love to explore [related Law of One topic] with you."

COMPARATIVE QUESTIONS:
- Can acknowledge parallels to other teachings
- Never claim Ra is "better" or "more complete"
- "Ra emphasizes that all paths seeking the One are valid"
```

---

## Phase 2.7: Response Streaming

**Implementation:**
- Single coherent response (no phases)
- Stream using existing SSE format
- Parse {{QUOTE:N}} markers during streaming
- Maintain existing chunk/meta/done/error events

**Flow:**
1. Classify + search complete (~500-600ms total, optimized)
2. Build dynamic prompt
3. Call GPT-4o-mini with streaming
4. Stream response with quote marker parsing
5. Send done event

**UX Impact:**
- Slight increase in time-to-first-token (~500-600ms vs current ~300ms)
- Response is more coherent, less repetitive
- Trade-off: worth it for quality improvement

**Loading State:**
- If latency > 400ms, consider showing "Searching Ra Material..." indicator
- Helps manage user expectations during classification + search

---

## Implementation Files

### New Files

**`/src/lib/classifier.ts`**
- `classifyQuery(message: string, history: ChatMessage[], previousClassifications?: Classification[]): Promise<Classification>`
- Uses GPT-4o-mini with structured outputs
- Returns classification object with confidence scores
- Implements conversation continuity logic (see section 1.4):
  - PROCESSING state persistence for 2 messages
  - Depth escalation (no regression)
  - User control signal detection
  - Topic continuity handling
- Includes `applyConversationContinuity()` helper function

**`/src/lib/search-optimizer.ts`**
- `generateSearchQueries(message: string, classification: Classification): Promise<string[]>`
- Uses GPT-4o-mini with structured outputs
- Returns 2 optimized search queries (not 3 - more focused)

- `executeParallelSearch(queries: string[], topK: number): Promise<Quote[]>`
- Creates embeddings in parallel (optimize with Promise.all)
- Searches Pinecone in parallel (optimize with Promise.all)
- Deduplicates and returns top K unique results
- Maintains diversity: prefer passages from different sessions when scores are similar

**`/src/lib/dynamic-prompts.ts`**
- `buildDynamicPrompt(classification: Classification, quotes: Quote[], history: ChatMessage[]): string`
- Assembles modular prompt components
- Returns complete system prompt

- Export all modular components:
  - `BASE_ROLE`
  - `getIntentInstructions(intent: Intent): string`
  - `getStateGuidance(state: State): string`
  - `getDepthInstructions(depth: Depth): string`
  - `getQuoteRules(intent: Intent, depth: Depth): string`
  - `SHARED_STYLE_RULES`

### Modified Files

**`/src/app/api/chat/route.ts`**
- Remove three-phase approach
- Remove quote search detection
- New flow:
  1. Classify query
  2. Generate search queries
  3. Execute parallel search
  4. Build dynamic prompt
  5. Stream response

**`/src/lib/prompts.ts`**
- Keep as reference/legacy
- Can be used as source material for dynamic-prompts.ts
- Or refactor into modular exports used by dynamic-prompts.ts

### Unchanged Files

- `/src/lib/pinecone.ts` - No changes
- `/src/lib/openai.ts` - No changes
- All frontend files - No changes
- API contract - No changes

---

## Migration Strategy

**Phase 1: Build new infrastructure**
1. Create classifier.ts
2. Create search-optimizer.ts
3. Create dynamic-prompts.ts
4. Test each module independently

**Phase 2: Integrate**
1. Update chat/route.ts to use new system
2. Remove old three-phase logic
3. Test thoroughly

**Phase 3: Monitor**
1. Compare response quality
2. Monitor latency
3. Gather user feedback
4. Iterate on prompts

---

## Success Metrics

**Quality:**
- Responses feel more appropriate to user's state
- Less repetition between initial/continuation
- Better quote selection

**Performance:**
- Total latency: ~500-600ms (optimized, acceptable)
- Classification: ~200-300ms
- Search: ~300-400ms (parallel optimization)
- Streaming starts immediately after
- Target: <600ms to first token

**User Experience:**
- More coherent responses
- Better emotional attunement
- Appropriate depth level
- Relevant quote selection

---

## Example Flows

### Example 1: CURIOUS + UNDERSTAND + INTERMEDIATE

**User:** "How does polarity relate to harvest?"

**Classification:**
```json
{
  "intent": "UNDERSTAND",
  "state": "CURIOUS",
  "depth": "INTERMEDIATE"
}
```

**Search Queries:**
- "polarity harvest relationship requirements"
- "service to others service to self harvest mechanics"

**Response Character:**
- 2-3 paragraphs
- Engaging, conceptual tone
- 1-2 quotes
- Uses Ra terminology naturally
- Invites further exploration

---

### Example 2: PROCESSING + APPLY + SURFACE

**User:** "I'm struggling to forgive my father"

**Classification:**
```json
{
  "intent": "APPLY",
  "state": "PROCESSING",
  "depth": "SURFACE"
}
```

**Search Queries:**
- "forgiveness catalyst healing relationships"
- "acceptance releasing resentment love"

**Response Character:**
- 2-3 short paragraphs maximum
- Warm, gentle opening
- 1 quote (accessible passage)
- Simple language, no jargon
- No follow-up question (give space)

---

### Example 3: CHALLENGING + UNDERSTAND + DEEP

**User:** "Ra's concept of free will seems to contradict the idea that everything is predetermined. How do you reconcile this?"

**Classification:**
```json
{
  "intent": "UNDERSTAND",
  "state": "CHALLENGING",
  "depth": "DEEP"
}
```

**Search Queries:**
- "free will paradox determinism choice"
- "timeless state time/space simultaneity"

**Response Character:**
- 3-4 paragraphs
- Acknowledge the tension seriously
- 2-3 quotes from different sessions
- Cross-session synthesis
- Thoughtful, exploratory tone
- Doesn't shy away from complexity

---

### Example 4: SEEKING_VALIDATION + RETRIEVE + INTERMEDIATE

**User:** "I remember Ra saying wanderers chose to come here to help with harvest. Can you find that quote?"

**Classification:**
```json
{
  "intent": "RETRIEVE",
  "state": "SEEKING_VALIDATION",
  "depth": "INTERMEDIATE"
}
```

**Search Queries:**
- "wanderers chose incarnate help harvest"
- "wanderer mission purpose earth assistance"

**Response Character:**
- Brief affirming context
- 2-3 relevant quotes
- Clear session references
- Validates their memory
- Uses Ra terminology naturally

---

## Technical Notes

**Model Selection:**
- Classification: `gpt-4o-mini` with structured outputs
- Search query generation: `gpt-4o-mini` with structured outputs
- Response generation: `gpt-4o-mini` with streaming

**Token Budget:**
- Classification: ~500 tokens max
- Search query generation: ~300 tokens max
- Response: ~1000-1500 tokens average

**Error Handling:**
- If classification fails: default to UNDERSTAND + CURIOUS + INTERMEDIATE (log for debugging)
- If classification confidence is low: use safe defaults based on thresholds above
- If search returns no results: Explicitly state lack of direct passages and provide general Ra Material context
- If streaming fails: return error event (existing behavior)
- Log all classification decisions for monitoring and improvement

**Testing Checklist:**
- [ ] All 3×4×3 = 36 classification combinations
- [ ] Quote search queries work (RETRIEVE intent)
- [ ] Parallel search deduplication works
- [ ] Tone variations are noticeable but not jarring
- [ ] Response lengths match depth specifications
- [ ] Streaming with quote markers works
- [ ] Latency is acceptable (<1 second)
- [ ] API contract unchanged (frontend still works)

---

## Future Enhancements

**Possible additions:**
1. User profiling: Remember user's typical depth level
2. Session awareness: Track topic continuity across messages
3. Quote diversity: Ensure variety across conversation
4. Adaptive depth: Adjust depth based on user responses
5. Feedback loop: Learn from user engagement patterns

**Not in scope for v1:**
- User authentication
- Conversation persistence
- Analytics/tracking
- A/B testing framework
