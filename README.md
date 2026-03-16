# Law of One Study

A study companion for the Ra Material (Law of One). Explore concepts, follow guided study paths, meditate, and discover daily wisdom from all 106 sessions.

**Live site:** [lawofone.study](https://lawofone.study)

Community-funded, open source, free for all.

---

## Features

### Discovery Tools
- **Concept Explorer** — Interactive graph visualization of 100+ Law of One concepts and their relationships
- **Guided Study Paths** — Curated learning journeys with lessons, quizzes, and reflection prompts
- **Daily Quote** — Fresh wisdom from Ra each day on the home page

### Experience
- **Guided Meditations** — Browse and listen to guided meditation audio with looping support
- **Dark & Light Themes** — Choose your preferred reading experience
- **Mobile Friendly** — Fully responsive design with PWA support (installable on mobile)
- **Multilingual** — Available in English, Spanish, German, and French

> **Note:** The AI chat (Seek) and semantic search features were removed in March 2026 at the request of L/L Research. See the [About page](https://lawofone.study/en/about) for details.

---

## Tech Stack

| Layer     | Technology                                     |
| --------- | ---------------------------------------------- |
| Framework | [Next.js 16](https://nextjs.org/) (App Router) |
| Styling   | [Tailwind CSS](https://tailwindcss.com/)       |
| i18n      | [next-intl](https://next-intl-docs.vercel.app/) |
| Analytics | [PostHog](https://posthog.com/)                |
| Hosting   | [Vercel](https://vercel.com/)                  |

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm

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
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_key  # Optional: for analytics
```

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
│   │   └── [locale]/        # Locale-specific routes (en, es, de, fr)
│   ├── components/          # React components with co-located tests
│   ├── contexts/            # React context providers
│   ├── hooks/               # Custom React hooks with tests
│   ├── i18n/                # Internationalization config
│   ├── lib/                 # Business logic and utilities
│   │   ├── graph/           # Concept graph layout and rendering
│   │   └── schemas/         # Zod validation schemas
│   ├── providers/           # App-level providers (PostHog, Theme)
│   └── data/                # Static data (concepts, study paths, etc.)
├── messages/                # UI translation files (en/, es/, de/, fr/)
├── e2e/                     # Playwright E2E tests
└── docs/                    # Project documentation
```

---

## Internationalization

The app supports multiple languages.

### Supported Languages

- **English** — `/en/` (default)
- **Spanish** — `/es/` (Español)
- **German** — `/de/` (Deutsch)
- **French** — `/fr/` (Français)

### How It Works

- **UI translations** are in `messages/{locale}/`
- Each locale has its own set of translation JSON files for different pages and components

### Adding a New Language

See [docs/adding-a-new-language.md](docs/adding-a-new-language.md) for details.

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
- [ ] Additional language translations
- [ ] New guided study paths
- [ ] Meditation content

---

## Data Source

The Ra Material is sourced from [lawofone.info](https://www.lawofone.info/), the authoritative online resource for the Law of One sessions. All quotes link back to the original source.

---

## Philosophy

This tool is built with respect for the Ra Material and its students:

- **Illuminate, not indoctrinate** — Present Ra's teachings without pushing interpretation
- **Honor the seeker's journey** — Meet users where they are
- **Let Ra's words speak** — Use quotes as primary evidence
- **Acknowledge uncertainty** — Be honest when information is limited

---

## License

This project is open source under the [MIT License](LICENSE).

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
