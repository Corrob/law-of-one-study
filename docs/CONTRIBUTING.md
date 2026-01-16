# Contributing to Law of One Study Companion

Thank you for your interest in contributing to the Law of One Study Companion! This project is built with love by seekers, for seekers. We welcome contributions from developers, designers, writers, and anyone passionate about making the Ra Material more accessible.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Submitting Changes](#submitting-changes)
- [Style Guidelines](#style-guidelines)
- [Community](#community)

---

## Code of Conduct

This project is dedicated to exploring the Law of One teachings with respect, love, and unity. We expect all contributors to:

- Be kind and respectful in all interactions
- Welcome newcomers and help them get started
- Focus on what is best for the community and the teachings
- Accept constructive criticism gracefully
- Show empathy toward other community members

In the words of Ra: *"The heart of the discipline of the personality is threefold. One, know yourself. Two, accept yourself. Three, become the Creator."* Let's embody these principles in our collaboration.

---

## How Can I Contribute?

### 🗳️ Vote on Features

The easiest way to contribute is to [vote on the roadmap](/roadmap)! Your input helps us prioritize what to build next.

### 🐛 Report Bugs

Found a bug? Please [open an issue](https://github.com/Corrob/law-of-one-study/issues/new?template=bug_report.md) with:

- A clear, descriptive title
- Steps to reproduce the issue
- Expected vs. actual behavior
- Screenshots (if applicable)
- Your browser and OS

### 💡 Suggest Features

Have an idea for a new feature? [Open a feature request](https://github.com/Corrob/law-of-one-study/issues/new?template=feature_request.md) or vote on existing ones in the [roadmap](/roadmap).

### 📝 Improve Documentation

Documentation improvements are always welcome! This includes:

- Fixing typos or unclear wording
- Adding examples or tutorials
- Improving the README or other docs
- Writing guides for using the tool

### 💻 Write Code

Ready to contribute code? Here's how:

1. Check the [roadmap](/roadmap) or [open issues](https://github.com/Corrob/law-of-one-study/issues) for something to work on
2. Comment on the issue to let us know you're working on it
3. Fork the repository and create a branch
4. Make your changes following our [style guidelines](#style-guidelines)
5. Test your changes thoroughly
6. Submit a pull request

---

## Development Setup

### Prerequisites

- Node.js 18 or higher
- npm, yarn, or pnpm
- Git

### Local Setup

1. **Fork and clone the repository:**

   ```bash
   git clone https://github.com/YOUR_USERNAME/law-of-one-study.git
   cd law-of-one-study
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Set up environment variables:**

   Copy `.env.local.example` to `.env.local` and fill in the required values:

   ```bash
   cp .env.local.example .env.local
   ```

   You'll need:
   - OpenAI API key
   - Pinecone API key and environment
   - PostHog API key (optional, for analytics)

4. **Run the development server:**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

5. **Run tests:**

   ```bash
   npm test
   ```

6. **Lint your code:**

   ```bash
   npm run lint
   ```

### Project Structure

```
src/
├── app/                    # Next.js app router pages and API routes
│   ├── [locale]/           # Locale-specific routes (en, es)
│   └── api/chat/           # Chat API route
├── components/             # React components with co-located tests
├── contexts/               # React context providers (Language, Popover)
├── hooks/                  # Custom React hooks with tests
├── i18n/                   # Internationalization config
├── lib/                    # Business logic and utilities
│   ├── chat/               # Chat pipeline modules
│   ├── prompts/            # LLM prompts
│   └── schemas/            # Zod validation schemas
├── providers/              # App-level providers (PostHog, Theme)
├── data/                   # Static data (concepts, study paths, etc.)
messages/                   # UI translation files (en/, es/)
scripts/                    # Data processing scripts
public/sections/            # Ra Material source (en/, es/)
e2e/                        # Playwright E2E tests
```

---

## Submitting Changes

### Pull Request Process

1. **Create a feature branch:**

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes:**
   - Write clean, readable code
   - Follow the [style guidelines](#style-guidelines)
   - Add tests if applicable
   - Update documentation if needed

3. **Test thoroughly:**
   - Run `npm test` to ensure all tests pass
   - Run `npm run lint` to check for style issues
   - Test manually in the browser

4. **Commit your changes:**

   ```bash
   git add .
   git commit -m "Add feature: brief description"
   ```

   Use clear, descriptive commit messages:
   - `Add feature: favorite quotes with localStorage`
   - `Fix bug: quote card not expanding on mobile`
   - `Update docs: add contributing guide`

5. **Push to your fork:**

   ```bash
   git push origin feature/your-feature-name
   ```

6. **Open a pull request:**
   - Go to the [main repository](https://github.com/Corrob/law-of-one-study)
   - Click "New Pull Request"
   - Select your fork and branch
   - Fill out the PR template with:
     - Description of changes
     - Related issue (if applicable)
     - Screenshots (for UI changes)
     - Testing done

7. **Respond to feedback:**
   - Be open to constructive criticism
   - Make requested changes promptly
   - Ask questions if anything is unclear

---

## Style Guidelines

### TypeScript/JavaScript

- Use TypeScript for all new code
- Use functional components with hooks (no class components)
- Prefer `const` over `let`, avoid `var`
- Use descriptive variable and function names
- Add comments for complex logic
- Keep functions small and focused

**Example:**

```typescript
// Good
const calculateDensityProgress = (currentDensity: number): number => {
  return (currentDensity / 7) * 100;
};

// Avoid
function calc(d) {
  return (d / 7) * 100;
}
```

### React Components

- One component per file
- Use TypeScript interfaces for props
- Keep components small and composable
- Use meaningful component and prop names

**Example:**

```typescript
interface QuoteCardProps {
  quote: string;
  reference: string;
  url: string;
  onFavorite?: () => void;
}

export function QuoteCard({ quote, reference, url, onFavorite }: QuoteCardProps) {
  // Component implementation
}
```

### Styling

- Use Tailwind CSS for all styling
- Use CSS variables for theme colors (defined in `globals.css`)
- Maintain the dark cosmic theme
- Ensure mobile responsiveness

**Example:**

```tsx
<div className="bg-[var(--lo1-indigo)]/40 border border-[var(--lo1-gold)]/20 rounded-xl p-6">
  <h2 className="text-[var(--lo1-starlight)] text-xl font-semibold">Title</h2>
</div>
```

### Git Commits

- Use the imperative mood ("Add feature" not "Added feature")
- Keep the first line under 72 characters
- Reference issues when applicable

**Examples:**

```
Add favorite quotes feature with localStorage support

Fix quote card expansion on mobile devices (#42)

Update README with new contribution guidelines
```

---

## Testing

- Write tests for new features
- Ensure existing tests pass before submitting PR
- Test on multiple browsers (Chrome, Firefox, Safari)
- Test on mobile devices

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run E2E tests (Playwright)
npm run test:e2e
```

---

## Community

### Getting Help

- **GitHub Discussions:** Ask questions, share ideas
- **GitHub Issues:** Report bugs, request features
- **Pull Requests:** Code reviews and feedback

### Recognition

All contributors will be recognized in our README. Significant contributions may be highlighted on the website.

---

## Questions?

If you have any questions about contributing, feel free to:

- Open a [GitHub Discussion](https://github.com/Corrob/law-of-one-study/discussions)
- Comment on an existing issue
- Reach out via the contact information in the README

---

*"In forgiveness lies the stoppage of the wheel of action, or what you call karma." - Ra, 18.12*

Thank you for helping make the Law of One more accessible to seekers everywhere! 🙏
