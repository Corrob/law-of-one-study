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
src/
├── app/                    # Next.js app router pages and API routes
│   └── api/chat/           # Chat API route (thin orchestrator)
├── components/             # React components with co-located tests
├── contexts/               # React context providers
├── hooks/                  # Custom React hooks with tests
├── lib/                    # Business logic and utilities
│   ├── chat/               # Chat pipeline modules (modular, testable)
│   │   ├── orchestrator.ts # Main chat pipeline orchestration
│   │   ├── sse-encoder.ts  # SSE response encoding utilities
│   │   ├── error-response.ts # Unified error event formatting
│   │   ├── augmentation.ts # Query augmentation with intent detection
│   │   ├── concept-processing.ts # Hybrid concept detection
│   │   ├── context.ts      # Conversation context building
│   │   ├── errors.ts       # Typed error handling
│   │   ├── off-topic.ts    # Off-topic query handling
│   │   ├── search.ts       # Search orchestration
│   │   ├── stream-processor.ts # SSE stream processing
│   │   ├── suggestions.ts  # Follow-up suggestion generation
│   │   └── validation.ts   # Input validation
│   ├── prompts/            # LLM prompts (modular)
│   │   ├── constants.ts    # Shared prompt building blocks
│   │   ├── query-augmentation.ts
│   │   ├── response.ts
│   │   ├── suggestions.ts
│   │   └── utils.ts
│   └── schemas/            # Zod validation schemas
├── providers/              # App-level providers (PostHog, Theme)
scripts/                    # Data processing scripts
public/sections/            # Ra material source (106 JSON files)
e2e/                        # Playwright E2E tests
openapi.yaml                # API documentation (OpenAPI 3.1)
```

---

## Data Source

**Ra Material:** `sections/` directory

- 106 JSON files (sessions 1-106)
- Format: `{ "SESSION.QUESTION": "content" }` (e.g., `"50.12": "Ra: I am Ra..."`)
- ~1,200-1,500 Q&A pairs total
- Links format: `https://lawofone.info/s/SESSION#QUESTION`

---

## Quality Standards (9/10 Codebase)

This codebase maintains high quality standards. Follow these guidelines to preserve them.

### Type Safety

- **Strict TypeScript**: `strict: true` in tsconfig.json
- **No `any`**: ESLint errors on `@typescript-eslint/no-explicit-any`
- **Zod validation**: Runtime validation for external data (API responses, user input)
- **Type guards**: Use `isChatError()` pattern instead of type assertions
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

- **Cover critical user journeys**: Chat flow, error recovery, keyboard navigation
- **One test per feature area**: Don't duplicate what unit tests cover
- **Test integration points**: SSE streaming, rate limiting, multi-turn conversations
- **Keep tests independent**: Each test should work in isolation
- **Avoid testing implementation details**: Focus on user-visible behavior

```
e2e/
├── chat-flow.spec.ts        # Happy path: send message, receive response
├── error-states.spec.ts     # Error handling and recovery
├── keyboard-navigation.spec.ts  # Accessibility
├── multi-turn.spec.ts       # Conversation context
└── rate-limit-recovery.spec.ts  # Rate limit UX
```

**When to add E2E tests:**
- New user-facing feature with complex interactions
- Bug fix for an issue that unit tests couldn't catch
- Integration between multiple systems (API + UI + streaming)

**When NOT to add E2E tests:**
- Pure utility functions (use unit tests)
- Component styling/layout (use component tests)
- Edge cases already covered by unit tests

### Architecture Patterns

- **Modular design**: Keep files under 300 lines; extract when larger
- **Thin route handlers**: API routes orchestrate, modules do the work
- **Single responsibility**: Each module has one clear purpose
- **Re-export for compatibility**: When splitting files, keep original as re-export

### Error Handling

- **Three-level error boundaries**:
  1. Route-level (`app/error.tsx`)
  2. Component-level (`ErrorBoundary.tsx`)
  3. Domain-specific (`ChatError` with codes)
- **Typed errors**: Use error codes, user messages, and retryable flags
- **Graceful degradation**: Rate limiting falls back to in-memory when Redis fails

### Code Style

- **Functional components**: Use hooks, avoid class components
- **Small components**: Extract when a component exceeds ~150 lines
- **Explicit returns**: Prefer explicit over implicit for complex logic
- **No magic numbers**: Use config constants from `lib/config.ts`

---

## Coding Guidelines

### TypeScript

```typescript
// GOOD: Explicit types, Zod validation
const result = SomeSchema.safeParse(data);
if (!result.success) {
  throw createChatError("VALIDATION_FAILED");
}

// BAD: Using any
const data: any = await response.json(); // ESLint error
```

### React Components

```typescript
// GOOD: Small, focused, typed props
interface QuoteCardProps {
  quote: Quote;
  isAnimated?: boolean;
}

export function QuoteCard({ quote, isAnimated = false }: QuoteCardProps) {
  // Component logic
}

// BAD: Large monolithic components, inline types
```

### API Routes

```typescript
// GOOD: Thin orchestrator using extracted modules
import { validateChatRequest, detectConcepts, performSearch } from "@/lib/chat";

export async function POST(request: NextRequest) {
  const validation = validateChatRequest(body.message, body.history);
  if (!validation.valid) return validationErrorResponse(validation);

  const concepts = await detectConcepts(message);
  const { passages } = await performSearch(query);
  // ...
}

// BAD: All logic inline in route handler
```

### Error Handling

```typescript
// GOOD: Typed errors with context
throw createChatError("EMBEDDING_FAILED", originalError);

// GOOD: Error type guards
if (isChatError(error)) {
  send("error", { code: error.code, message: error.userMessage });
}

// BAD: Generic error throwing
throw new Error("Something went wrong");
```

### Styling

- Tailwind CSS for all styling
- Dark theme is the default/only theme
- Use design tokens from Tailwind config

### Quote System

- Quotes use `{{QUOTE:N}}` markers in AI responses
- Sentence ranges: `{{QUOTE:N:s3:s7}}` for long quotes
- QuoteCard components render the actual quote content

---

## API Documentation

The chat API is documented in `openapi.yaml` (OpenAPI 3.1 specification).

**Keep it updated when:**
- Adding/removing API endpoints
- Changing request/response schemas
- Adding new SSE event types
- Modifying error codes or validation rules
- Changing rate limit configuration

**SSE Event Types** (documented in openapi.yaml):
- `meta` - Initial metadata (quotes, intent, confidence, concepts)
- `chunk` - Streaming content (text or quote)
- `suggestions` - Follow-up question suggestions
- `done` - Stream complete
- `error` - Error with code, message, retryable flag

---

## Adding New Features

1. **Plan first**: Consider which modules are affected
2. **Extract early**: If adding >100 lines to a file, create a new module
3. **Add tests**: New modules need corresponding test files
4. **Validate inputs**: Use Zod schemas for external data
5. **Handle errors**: Add appropriate error codes and user messages
6. **Update exports**: Add to index.ts files for clean imports
7. **Update API docs**: If changing the API, update `openapi.yaml`

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

**To index Ra material to Pinecone:**

```bash
npx ts-node scripts/index-ra.ts
```

---

## Pre-commit Checklist

Before committing, the pre-commit hook verifies:

1. `npm run lint` - No ESLint errors or warnings
2. `npm test` - All Jest tests pass
3. `npm run build` - TypeScript compiles, Next.js builds
4. `npm run test:e2e` - Playwright E2E tests pass

If any step fails, fix the issues before committing.
