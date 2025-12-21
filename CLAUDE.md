# Law of One Study Tool - Project Plan

An AI-powered RAG chatbot for the Ra Material. Community-funded, open source, free for all.

> See [lawofone-study-prd.md](./lawofone-study-prd.md) for full requirements.

---

## Foundation

Building on the ACIM Helper project: `/Users/cory/Documents/fip/ai-experiment/acim-helper`

**Reusable from ACIM Helper:**
- Chat UI with streaming animations
- Pinecone integration + embedding pipeline
- 3-phase response system (initial → search → continuation with quotes)
- SSE streaming with animation queue
- Quote card components (`{{QUOTE:N}}` marker system)
- Starters pattern (welcome quotes + conversation prompts)

---

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | Next.js (Vercel) |
| Database | Firestore |
| Vector DB | Pinecone |
| AI Model | GPT-5 mini |
| Payments | Stripe Checkout |
| Hosting | Vercel |

---

## Data Source

**Ra Material:** `sections/` directory
- 105 JSON files (sessions 1-105)
- Format: `{ "SESSION.QUESTION": "content" }` (e.g., `"50.12": "Ra: I am Ra..."`)
- ~1,200-1,500 Q&A pairs total
- Links format: `https://lawofone.info/s/SESSION#QUESTION`

---

## Build Progress

### Phase 1: Beta (MVP)

**Setup & Data:**
- [x] Copy ACIM helper codebase as foundation
- [x] Create indexing script for Ra material (`scripts/index-ra.ts`)
- [ ] Set up Pinecone index for Law of One
- [ ] Index all 105 sessions

**Adapt for Law of One:**
- [x] Update `starters.ts` with Ra quotes and prompts
- [x] Update links to lawofone.info format
- [x] Update system prompts for Law of One philosophy
- [x] Update branding (header, icon)

**Infrastructure:**
- [ ] Pool tracking (Firestore)
- [ ] Deploy to Vercel

### Phase 2: Community Donations

- [ ] Stripe account setup
- [ ] Checkout integration
- [ ] Webhook endpoint (`/api/webhook`)
- [ ] Donation UI

### Phase 3: Polish

- [ ] Share on r/lawofone for feedback
- [ ] Iterate based on usage data
- [ ] Add optional auth if abuse occurs
- [ ] "Just quotes" toggle mode

---

## Key Directories

```
/app              # Next.js app
/components       # React components
/lib              # Firebase, Pinecone, OpenAI helpers
/scripts          # Embedding generation scripts
/sections         # Ra material source (105 JSON files)
```

---

## Quick Reference

- **Pool system:** Community-funded queries, graceful degradation to semantic-search-only when empty
- **Cost per query:** ~$0.00263 (GPT-5 mini)
- **Queries per $1:** ~380
- **Seed funding:** $50/month (~19,000 queries)
- **Link format:** `https://lawofone.info/s/{session}#{question}`
