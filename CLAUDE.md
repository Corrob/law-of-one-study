# Law of One Study Tool

An AI-powered RAG chatbot for the Ra Material. Community-funded, open source, free for all.

**Live site:** https://lawofone.study

---

## Tech Stack

| Component | Technology              |
| --------- | ----------------------- |
| Frontend  | Next.js 16 (App Router) |
| Vector DB | Pinecone                |
| AI Model  | GPT-5-mini              |
| Analytics | PostHog                 |
| Hosting   | Vercel                  |

---

## Project Structure

```
/app              # Next.js app router pages and API routes
/components       # React components
/lib              # Pinecone, OpenAI helpers
/scripts          # Embedding generation scripts
/sections         # Ra material source (106 JSON files)
```

---

## Data Source

**Ra Material:** `sections/` directory

- 106 JSON files (sessions 1-106)
- Format: `{ "SESSION.QUESTION": "content" }` (e.g., `"50.12": "Ra: I am Ra..."`)
- ~1,200-1,500 Q&A pairs total
- Links format: `https://lawofone.info/s/SESSION#QUESTION`

---

## Coding Guidelines

**General:**

- Use TypeScript throughout
- Prefer functional components with hooks
- Keep components small and focused

**Styling:**

- Tailwind CSS for all styling
- Dark theme is the default/only theme

**API Routes:**

- Located in `/app/api/`
- Use streaming responses (SSE) for chat

**Quote System:**

- Quotes use `{{QUOTE:N}}` markers in AI responses
- QuoteCard components render the actual quote content

---

## Working With This Repo

**Don't run browser automation** unless explicitly asked - this is a code-focused project.

**Environment variables** are in `.env.local` (not committed). See `.env.local.example` for required vars.

**To run locally:**

```bash
npm install
npm run dev
```

**To index Ra material to Pinecone:**

```bash
npx ts-node scripts/index-ra.ts
```
