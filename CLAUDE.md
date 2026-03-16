# Law of One Study Tool

A study companion for the Ra Material. Community-funded, open source, free for all.

**Live site:** https://lawofone.study

---

## Tech Stack

| Component | Technology              |
| --------- | ----------------------- |
| Frontend  | Next.js 16 (App Router) |
| Analytics | PostHog                 |
| Hosting   | Vercel                  |

---

## Project Structure

```
src/
├── app/                    # Next.js app router pages
│   └── [locale]/           # Locale-specific routes (en, es, de, fr)
├── components/             # React components with co-located tests
├── contexts/               # React context providers (Language)
├── hooks/                  # Custom React hooks with tests
├── i18n/                   # Internationalization config (next-intl)
├── lib/                    # Business logic and utilities
│   ├── graph/              # Concept graph layout and rendering
│   └── schemas/            # Zod validation schemas
├── providers/              # App-level providers (PostHog, Theme)
messages/                   # UI translation files (en/, es/, de/, fr/)
scripts/                    # Data processing scripts
e2e/                        # Playwright E2E tests
```

---

## Features

- **Explore** - Interactive concept graph visualization
- **Study Paths** - Guided lessons through the Ra Material
- **Meditations** - Guided meditation audio player
- **Daily Quote** - Rotating daily wisdom quotes
- **PWA** - Installable progressive web app

---

## Quality Standards (9/10 Codebase)

This codebase maintains high quality standards. Follow these guidelines to preserve them.

### Type Safety

- **Strict TypeScript**: `strict: true` in tsconfig.json
- **No `any`**: ESLint errors on `@typescript-eslint/no-explicit-any`
- **Zod validation**: Runtime validation for external data
- **Prefer `unknown` over `any`**: For truly dynamic data, use `unknown` and narrow

### Testing Requirements

- **Coverage thresholds enforced**: 60% lines/statements, 55% branches/functions
- **Co-located tests**: Place `__tests__/` directories next to source files
- **Test patterns**:
  - Unit tests for utilities and pure functions
  - Component tests with React Testing Library
  - E2E tests with Playwright for critical user flows
- **Run before commit**: Pre-commit hook runs lint, tests, build, and E2E

### E2E Testing Philosophy

E2E tests are slow (~30s+) and run on every commit, so be strategic:

- **Cover critical user journeys**: Feature interactions, navigation, locale support
- **One test per feature area**: Don't duplicate what unit tests cover
- **Keep tests independent**: Each test should work in isolation
- **Avoid testing implementation details**: Focus on user-visible behavior

```
e2e/
├── concept-explorer.spec.ts    # Concept graph interactions
├── study-paths.spec.ts         # Guided study paths
├── spanish-locale.spec.ts      # Spanish locale smoke tests
├── french-locale.spec.ts       # French locale smoke tests
└── german-locale.spec.ts       # German locale smoke tests
```

**When to add E2E tests:**
- New user-facing feature with complex interactions
- Bug fix for an issue that unit tests couldn't catch

**When NOT to add E2E tests:**
- Pure utility functions (use unit tests)
- Component styling/layout (use component tests)
- Edge cases already covered by unit tests

### Architecture Patterns

- **Modular design**: Keep files under 300 lines; extract when larger
- **Single responsibility**: Each module has one clear purpose
- **Re-export for compatibility**: When splitting files, keep original as re-export

### Error Handling

- **Error boundaries**:
  1. Route-level (`app/error.tsx`)
  2. Component-level (`ErrorBoundary.tsx`)

### Code Style

- **Functional components**: Use hooks, avoid class components
- **Small components**: Extract when a component exceeds ~150 lines
- **Explicit returns**: Prefer explicit over implicit for complex logic
- **Cursor pointer**: Always add `cursor-pointer` class to clickable elements (buttons, links, interactive divs)

---

## Coding Guidelines

### TypeScript

```typescript
// GOOD: Explicit types, Zod validation
const result = SomeSchema.safeParse(data);
if (!result.success) {
  throw new Error("Validation failed");
}

// BAD: Using any
const data: any = await response.json(); // ESLint error
```

### React Components

```typescript
// GOOD: Small, focused, typed props
interface FeatureCardProps {
  title: string;
  description: string;
}

export function FeatureCard({ title, description }: FeatureCardProps) {
  // Component logic
}

// BAD: Large monolithic components, inline types
```

### Styling

- Tailwind CSS for all styling
- Dark theme is the default; light theme also supported
- Use design tokens from Tailwind config

---

## Adding New Features

1. **Plan first**: Consider which modules are affected
2. **Extract early**: If adding >100 lines to a file, create a new module
3. **Add tests**: New modules need corresponding test files
4. **Validate inputs**: Use Zod schemas for external data
5. **Update exports**: Add to index.ts files for clean imports

---

## Working With This Repo

**Don't run browser automation** unless explicitly asked - this is a code-focused project.

**Environment variables** are in `.env.local` (not committed). See `.env.local.example` for required vars.

**Commands:**

```bash
npm install          # Install dependencies
npm run dev          # Start development server
npm run build        # Production build
npm run lint         # Run ESLint (must pass with 0 warnings)
npm test             # Run Jest tests
npm run test:coverage # Run tests with coverage (must meet thresholds)
npm run test:e2e     # Run Playwright E2E tests
```

---

## Pre-commit Checklist

Before committing, the pre-commit hook verifies:

1. `npm run lint` - No ESLint errors or warnings
2. `npm test` - All Jest tests pass
3. `npm run build` - TypeScript compiles, Next.js builds
4. `npm run test:e2e` - Playwright E2E tests pass

If any step fails, fix the issues before committing.

---

## Git Commit Rules

- **NEVER use `--no-verify` on main branch** - All commits to main must pass the pre-commit hooks
- **Feature branches**: `--no-verify` is acceptable for work-in-progress commits, but ensure all issues are resolved before merging to main
- **Before merging to main**: Run the full pre-commit checklist manually to catch any issues
