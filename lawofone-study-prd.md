# Law of One Study Tool - Product Requirements Document

## Overview

**Product:** lawofone.study
**Type:** AI-powered RAG chatbot for the Ra Material (Law of One)
**Model:** Community-funded, open source, free for all users

A semantic search and AI chat tool that helps seekers study the Ra Material by interleaving AI explanations with exact quotes from the original channeled sessions.

---

## Core Philosophy

- **Service-to-others:** Free for everyone, funded by community donations
- **Transparency:** Pool balance visible to all users
- **Fidelity to source:** AI supplements, never replaces, primary study of the material
- **Graceful degradation:** Tool remains useful even when pool is empty

---

## User Experience

### When Pool Has Funds

User asks a question → System returns:

1. AI-generated introductory paragraph (contextualizing the question)
2. Semantic search finds relevant Ra quotes
3. AI generates 3-4 paragraphs interleaved with exact Ra quotes and session links

**Example response flow:**

> _User: Why do we forget our past lives?_
>
> **[AI intro paragraph]** setting context about the veil of forgetting...
>
> **Ra 36.12:** "The forgetting is the veil..." _[link to lawofone.info]_
>
> **[AI weaving]** connecting that to the user's question...
>
> **Ra 21.9:** "The purpose of incarnation..." _[link to lawofone.info]_
>
> **[AI synthesis]** tying it together.

### "Just Quotes" Toggle

Users can optionally enable "Just quotes mode" to receive semantic search results only, without AI-generated content. This:

- Saves community pool for others
- Appeals to purists who prefer unfiltered Ra
- Costs essentially nothing (Pinecone only)
- Respects L/L Research's emphasis on primary study

**UI:**

```
[Toggle] Just quotes mode (saves community pool)
```

When enabled, responses show only the most relevant Ra passages with session links—no AI interpretation.

---

### When Pool Is Empty

User asks a question → System returns:

- Semantic search results only (relevant Q&As from Ra)
- No AI-generated content
- Prompt to donate to restore AI functionality

**Example:**

> "The community pool is empty. Here are the Ra passages most relevant to your question:"
>
> **[Ra 52.7]** "The heart of the discipline of the personality..."
> **[Ra 18.5]** "The purpose of incarnation is..."
>
> _[Donate to restore AI summaries →]_

---

## Technical Architecture

### Stack

| Component | Technology                       |
| --------- | -------------------------------- |
| Frontend  | Next.js (Vercel)                 |
| Auth      | Firebase Auth (optional for MVP) |
| Database  | Firestore                        |
| Vector DB | Pinecone                         |
| AI Model  | GPT-5 mini                       |
| Payments  | Stripe Checkout                  |
| Hosting   | Vercel                           |

### Data Model

```
config/
  pool/
    queriesRemaining: number
    lastUpdated: timestamp

donations/
  {donationId}/
    amount: number
    queriesAdded: number
    timestamp: timestamp
    stripeSessionId: string
```

### API Routes

| Route               | Purpose                                    |
| ------------------- | ------------------------------------------ |
| `POST /api/query`   | Handle user questions, decrement pool      |
| `POST /api/webhook` | Stripe webhook, increment pool on donation |
| `GET /api/pool`     | Return current pool status                 |

---

## Semantic Search Setup

### Pinecone Configuration

- **Index:** Ra Material Q&As
- **Document granularity:** Each Ra response as a separate document
- **Metadata:** Session number, question number, category/topic
- **Embedding model:** OpenAI text-embedding-3-small

### Optional Enhancement

- Embed session-level summaries as separate documents
- Allows broader thematic questions to pull summary first, then specific Q&As

---

## AI Implementation

### Models & Costs

| Model      | Use Case         | Cost/Query |
| ---------- | ---------------- | ---------- |
| GPT-5 mini | All AI responses | ~$0.00263  |
| Pinecone   | Semantic search  | ~$0.00001  |

**Cost breakdown per AI query:**

| Component                  | Tokens | Rate     | Cost          |
| -------------------------- | ------ | -------- | ------------- |
| Input (prompt + Ra quotes) | ~2,500 | $0.25/1M | $0.000625     |
| Output (response)          | ~1,000 | $2.00/1M | $0.002        |
| **Total**                  |        |          | **~$0.00263** |

### System Prompt Guidelines

- Helper/guide persona, not mimicking Ra directly
- Always cite specific session.question numbers
- Link to lawofone.info for full context
- Encourage primary study of source material
- Acknowledge limitations and potential inaccuracies

---

## Community Pool System

### How It Works

1. Pool starts with seed funding (your $50/month = ~19,000 queries)
2. Every AI query decrements the pool by 1
3. Donations add queries to the pool
4. When pool hits 0, AI disabled, semantic search still works

### Conversion Rate

| Amount | Queries |
| ------ | ------- |
| $1     | ~380    |
| $5     | ~1,900  |
| $10    | ~3,800  |
| $25    | ~9,500  |
| $50    | ~19,000 |

### UI Display

Always visible on the interface:

> "🌀 Community pool: 12,847 queries available"
>
> [Donate to add more →]

---

## Donation Flow

### Stripe Integration

**User flow:**

1. User clicks donation button ($5 / $10 / $25 / Custom)
2. Redirected to Stripe Checkout (hosted page)
3. Completes payment
4. Stripe webhook fires to `/api/webhook`
5. Vercel function adds queries to Firestore pool
6. User redirected back with thank you message

**Webhook handler logic:**

```typescript
// api/webhook.ts
const QUERIES_PER_DOLLAR = 380;

if (event.type === "checkout.session.completed") {
  const amount = event.data.object.amount_total / 100;
  const queries = Math.floor(amount * QUERIES_PER_DOLLAR);

  await adminDb.doc("config/pool").update({
    queriesRemaining: FieldValue.increment(queries),
  });
}
```

### Donation UI

> "☀️ Add to the community pool"
>
> [$5] [$10] [$25] [Custom]
>
> _$1 ≈ 380 queries for all seekers_

---

## L/L Research Copyright Compliance

### Requirements (from llresearch.org/copyright)

| Requirement                       | Implementation                                    |
| --------------------------------- | ------------------------------------------------- |
| Not mimicking Ra directly         | ✅ AI explains, quotes are verbatim with citation |
| Not charging for access           | ✅ Free for all, donations fund capacity          |
| Proper attribution + link         | ✅ Link to llresearch.org on every page           |
| Disclaimer about AI inaccuracy    | ✅ Include on interface                           |
| Disclaimer about supplemental use | ✅ Include on interface                           |

### Required Disclaimers

**AI Accuracy Disclaimer:**

> "This tool uses AI which may provide inaccurate or misleading information. Always verify against the original source material."

**Supplemental Study Disclaimer:**

> "This chatbot is intended to supplement, not replace, direct study of the Ra Material. For primary study, visit llresearch.org and lawofone.info."

### Attribution

> "The Ra Material © L/L Research. Used with permission. Visit llresearch.org for the complete library."

---

## MVP Launch Plan

### Phase 1: Beta (Week 1-2)

| Task                        | Effort  |
| --------------------------- | ------- |
| Pinecone setup + embeddings | 4-6 hrs |
| Basic chat UI               | 4-6 hrs |
| AI query logic              | 4-6 hrs |
| Pool tracking (Firestore)   | 2-3 hrs |
| Deploy to Vercel            | 1-2 hrs |

**MVP features:**

- Chat interface
- AI + semantic search responses
- Global pool counter (manual management)
- No auth, no donations yet

### Phase 2: Community Donations (Week 3-4)

| Task                 | Effort  |
| -------------------- | ------- |
| Stripe account setup | 30 min  |
| Checkout integration | 1-2 hrs |
| Webhook endpoint     | 2-3 hrs |
| Donation UI          | 2-3 hrs |

### Phase 3: Polish (Week 5+)

- Share on r/lawofone for feedback
- Iterate based on usage data
- Add optional auth if abuse occurs
- Consider session-level summaries for broader questions

---

## Success Metrics

### Track During Beta

| Metric                      | Purpose           |
| --------------------------- | ----------------- |
| Total queries               | Overall usage     |
| Queries per user (IP-based) | Abuse detection   |
| Average tokens per query    | Cost validation   |
| Pool depletion rate         | Sustainability    |
| Donation conversion         | Community support |

### Goals

- Validate demand with r/lawofone community
- Confirm cost estimates match reality
- Determine if community will sustain the pool
- Gather feedback on response quality

---

## Budget

### Your Commitment

| Item         | Monthly Cost       |
| ------------ | ------------------ |
| Seed funding | $50                |
| Vercel       | Free tier          |
| Firebase     | Free tier          |
| Pinecone     | Free tier (likely) |
| Domain       | ~$12/year          |

### Sustainability Scenarios

| Scenario     | Monthly Queries | Cost  | Funded By       |
| ------------ | --------------- | ----- | --------------- |
| Low usage    | 5,000           | ~$13  | You alone       |
| Medium usage | 19,000          | ~$50  | You alone       |
| High usage   | 50,000          | ~$130 | You + donations |

---

## Open Source Considerations

### Repository Structure

```
lawofone-study/
  /app              # Next.js app
  /components       # React components
  /lib              # Firebase, Pinecone, OpenAI helpers
  /scripts          # Embedding generation scripts
  README.md         # Setup instructions
  LICENSE           # MIT or similar
```

### What to Open Source

- All application code
- Embedding generation scripts
- System prompts

### What NOT to Include

- API keys (use env variables)
- Pinecone index (others can generate their own)
- Firebase config (others deploy their own instance)

---

## Future Considerations (Post-MVP)

| Feature               | When to Consider                      |
| --------------------- | ------------------------------------- |
| User accounts         | If abuse becomes a problem            |
| Personal query limits | If pool drains too fast               |
| Subscriber tier       | If L/L Research approves monetization |
| Mobile app            | If demand warrants                    |
| Additional materials  | Q'uo transcripts, Carla's books       |

---

## Summary

**Build a simple, community-funded tool:**

1. AI + semantic search when pool has funds
2. Semantic search only when empty
3. Donations refill the pool
4. Transparent, free, service-to-others

**Start with $50/month seed funding (~19,000 queries), validate with r/lawofone, iterate based on real usage.**
