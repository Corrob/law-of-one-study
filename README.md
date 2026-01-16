# Law of One Study

An AI-powered study companion for the Ra Material (Law of One). Ask questions, explore concepts, and discover relevant passages from all 106 sessions.

**Live site:** [lawofone.study](https://lawofone.study)

---

## Features

### Core Experience
- **Conversational AI** — Ask questions in natural language and receive thoughtful responses grounded in the Ra Material
- **Smart Quote Integration** — Relevant passages are automatically retrieved and beautifully displayed with links to the source
- **Concept Linking** — Key terms (densities, polarity, catalyst, etc.) are subtly highlighted; hover for definitions, click to explore

### Discovery Tools
- **Semantic Search** — Search by sentence or passage with semantic matching across all 106 sessions
- **Concept Explorer** — Interactive graph visualization of 100+ Law of One concepts and their relationships
- **Guided Study Paths** — Curated learning journeys with lessons, quizzes, and reflection prompts
- **Daily Quote** — Fresh wisdom from Ra each day on the home page

### Experience
- **Streaming Responses** — Real-time word-by-word animation for a natural reading experience
- **Dark & Light Themes** — Choose your preferred reading experience
- **Mobile Friendly** — Fully responsive design

---

## Tech Stack

| Layer         | Technology                                     |
| ------------- | ---------------------------------------------- |
| Framework     | [Next.js 16](https://nextjs.org/) (App Router) |
| Styling       | [Tailwind CSS](https://tailwindcss.com/)       |
| AI Model      | OpenAI GPT-5-mini                              |
| Vector Search | [Pinecone](https://www.pinecone.io/)           |
| Embeddings    | OpenAI text-embedding-3-small                  |
| i18n          | [next-intl](https://next-intl-docs.vercel.app/) |
| Analytics     | [PostHog](https://posthog.com/)                |
| Hosting       | [Vercel](https://vercel.com/)                  |

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- OpenAI API key
- Pinecone API key and index

### Installation

```bash
# Clone the repository
git clone https://github.com/Corrob/law-of-one-study.git
cd law-of-one-study

# Install dependencies
npm install

# Copy environment variables
cp .env.local.example .env.local
```

### Environment Variables

Create a `.env.local` file with:

```env
OPENAI_API_KEY=your_openai_api_key
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX=law-of-one
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_key  # Optional: for analytics
```

### Indexing the Ra Material

Before running the app, you need to index the Ra Material into Pinecone:

```bash
npm run index
```

This processes all 106 sessions from the `public/sections/` directory and creates embeddings in your Pinecone index.

### Running Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Project Structure

```
law-of-one-study/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── [locale]/        # Locale-specific routes (en, es)
│   │   ├── api/chat/        # Streaming chat endpoint
│   │   └── api/search/      # Semantic search endpoint
│   ├── components/          # React components with co-located tests
│   │   ├── ChatInterface.tsx
│   │   ├── QuoteCard.tsx
│   │   ├── BilingualQuoteCard.tsx
│   │   └── ...
│   ├── contexts/            # React context providers
│   │   ├── LanguageContext.tsx
│   │   └── PopoverContext.tsx
│   ├── data/
│   │   ├── concepts.ts      # Law of One glossary (100+ terms)
│   │   ├── concept-graph.json
│   │   └── study-paths/     # Guided learning content
│   ├── hooks/               # Custom React hooks
│   ├── i18n/                # Internationalization config
│   ├── lib/                 # Business logic and utilities
│   │   ├── chat/            # Chat pipeline modules
│   │   ├── prompts/         # LLM prompts
│   │   └── schemas/         # Zod validation schemas
│   └── providers/           # App-level providers (PostHog, Theme)
├── messages/                # Translation files
│   ├── en/                  # English translations
│   └── es/                  # Spanish translations
├── scripts/                 # Data processing scripts
├── public/sections/         # Ra Material source
│   ├── en/                  # English (106 JSON files)
│   └── es/                  # Spanish translations
└── e2e/                     # Playwright E2E tests
```

---

## How It Works

### Unified Search-First Architecture

Every message flows through a streamlined pipeline:

1. **Query Augmentation** — A fast LLM call analyzes your question, detects intent (quote-seeking vs. conceptual), and enhances the query with Ra Material terminology for better search results
2. **Semantic Search** — The augmented query searches Pinecone for the most relevant Ra passages
3. **Adaptive Response** — The AI generates a response tailored to your intent:
   - **Quote searches** ("where does Ra talk about...") → Leads with quotes, minimal commentary
   - **Conceptual questions** ("what is harvest?") → Leads with explanation, weaves in supporting quotes

This architecture provides fast, relevant responses without requiring special syntax or keywords.

### Concept Auto-Linking

The app maintains a glossary of 100+ Law of One terms (`src/data/concepts.ts`). When these appear in AI responses:

- Terms get a subtle dotted underline
- Hovering shows a popover with the definition
- Clicking "Explore this concept" triggers a new search

### Quote Cards

Quotes from the Ra Material are displayed as formatted cards showing:

- The questioner's question
- Ra's response
- Session and question number (linked to lawofone.info)

---

## Customization

### Adding Concepts

Edit `src/data/concepts.ts` to add new terms:

```typescript
{
  term: "Your Term",
  aliases: ["your term", "alternate spelling"],
  definition: "Brief definition for the hover card."
}
```

### Modifying Prompts

AI behavior is controlled by `src/lib/prompts.ts`. Key prompts:

- `QUERY_AUGMENTATION_PROMPT` — Detects intent and enhances queries with Ra terminology
- `UNIFIED_RESPONSE_PROMPT` — Generates adaptive responses based on detected intent

### Theming

Colors are defined as CSS variables in `src/app/globals.css`:

```css
:root {
  --lo1-indigo: #1a1f4e;
  --lo1-deep-space: #0a0d1f;
  --lo1-gold: #d4a853;
  --lo1-starlight: #e8e6f2;
  /* ... */
}
```

---

## Internationalization

The app supports multiple languages with bilingual quote display.

### Supported Languages

- **English** — `/en/` (default)
- **Spanish** — `/es/` (Español)

### How It Works

- **UI translations** are in `messages/{locale}/common.json`
- **Ra Material translations** are in `public/sections/{locale}/`
- **Bilingual quotes** show the translated text with an option to view the English original
- **Semantic search** works cross-lingually (search in any language, find relevant quotes)

### Adding a New Language

1. Create translation files in `messages/{locale}/common.json`
2. Add translated Ra Material to `public/sections/{locale}/`
3. Update `src/i18n/config.ts` to include the new locale
4. Add the locale to the middleware matcher

See [docs/multilingual-implementation-plan.md](docs/multilingual-implementation-plan.md) for technical details.

---

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Areas for Contribution

- [ ] Additional concept definitions
- [ ] UI/UX improvements
- [ ] Accessibility enhancements
- [ ] Performance optimizations
- [ ] Mobile experience
- [x] Internationalization (Spanish live, more languages welcome!)
- [ ] Additional language translations

---

## Data Source

The Ra Material is sourced from [lawofone.info](https://www.lawofone.info/), the authoritative online resource for the Law of One sessions. All quotes link back to the original source.

---

## Philosophy

This tool is built with respect for the Ra Material and its students. The AI is designed to:

- **Illuminate, not indoctrinate** — Present Ra's teachings without pushing interpretation
- **Honor the seeker's journey** — Meet users where they are emotionally and intellectually
- **Let Ra's words speak** — Use quotes as primary evidence, not paraphrasing
- **Acknowledge uncertainty** — Be honest when information is limited

---

## License

This project is open source under the [MIT License](LICENSE).

The Ra Material itself is in the public domain, generously made available by L/L Research.

---

## Acknowledgments

- [L/L Research](https://www.llresearch.org/) for stewarding the Ra Material
- [lawofone.info](https://www.lawofone.info/) for the searchable online archive
- The Law of One community for continued study and discussion

---

## Support

If you find this tool helpful, consider:

- Starring the repo
- Sharing with fellow seekers
- Contributing improvements
- [Supporting L/L Research directly](https://www.llresearch.org/donate)

---

_"You are every thing, every being, every emotion, every event, every situation. You are unity. You are infinity. You are love/light, light/love. You are."_ — Ra, 1.7
