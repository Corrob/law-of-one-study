# Law of One Study

An AI-powered study companion for the Ra Material (Law of One). Ask questions, explore concepts, and discover relevant passages from all 105 sessions.

**Live site:** [lawofone.study](https://lawofone.study)

---

## Features

- **Conversational AI** — Ask questions in natural language and receive thoughtful responses grounded in the Ra Material
- **Smart Quote Integration** — Relevant passages are automatically retrieved and beautifully displayed with links to the source
- **Intelligent Intent Detection** — Automatically adapts responses based on whether you're searching for quotes or seeking explanations
- **Query Augmentation** — Your questions are enhanced with Ra Material terminology for better semantic search results
- **Concept Linking** — Key terms (densities, polarity, catalyst, etc.) are subtly highlighted; hover for definitions, click to explore
- **Streaming Responses** — Real-time word-by-word animation for a natural reading experience
- **Dark Cosmic Theme** — Immersive UI designed for contemplative study
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

This processes all 105 sessions from the `sections/` directory and creates embeddings in your Pinecone index.

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
│   │   ├── api/chat/        # Streaming chat endpoint
│   │   ├── globals.css      # Global styles & theme
│   │   ├── layout.tsx       # Root layout with fonts
│   │   └── page.tsx         # Home page
│   ├── components/          # React components
│   │   ├── ChatInterface.tsx
│   │   ├── Message.tsx
│   │   ├── StreamingMessage.tsx
│   │   ├── QuoteCard.tsx
│   │   ├── ConceptPopover.tsx
│   │   └── ...
│   ├── data/
│   │   ├── concepts.ts      # Law of One glossary (80+ terms)
│   │   ├── starters.ts      # Welcome screen prompts
│   │   └── placeholders.ts  # Input placeholders
│   ├── hooks/               # Custom React hooks
│   │   ├── useAnimationQueue.ts
│   │   └── useTypingAnimation.ts
│   ├── providers/           # React context providers
│   │   └── PostHogProvider.tsx
│   └── lib/
│       ├── openai.ts        # OpenAI client
│       ├── pinecone.ts      # Vector search
│       ├── prompts.ts       # AI system prompts
│       └── types.ts         # TypeScript types
├── scripts/
│   └── index-ra.ts          # Pinecone indexing script
├── sections/                # Ra Material source (105 JSON files)
└── public/                  # Static assets
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

The app maintains a glossary of 80+ Law of One terms (`src/data/concepts.ts`). When these appear in AI responses:

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
- [ ] Internationalization

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
