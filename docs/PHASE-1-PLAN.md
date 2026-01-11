# Phase 1 Implementation Plan

> **Status:** Draft - Ready for Review
> **Branch:** `feature/phase-1` (to be created)
> **Target:** Learning & Discovery features (no auth required)

---

## Overview

Transform the Law of One Study Tool from a single-page chat app into a multi-feature study platform using a **dashboard-first navigation pattern**.

**Why Dashboard-First?**
- Chat needs full-screen focus with input at bottom (no competing elements)
- Daily quote becomes a daily engagement hook on the dashboard
- Users consciously choose their study mode (intentional learning)
- Avoids bottom tab safe-area complexity across mobile browsers
- Simpler, cleaner mobile experience

**Branch Strategy:**
```
feature/phase-1 (all development)
       ↓
    main (release when Phase 1 complete)
```

---

## Implementation Order

| Step | Feature | Priority | Complexity | Status |
|------|---------|----------|------------|--------|
| 0 | Dashboard & Navigation | P0 | Foundation | Pending |
| 1 | New Chat Button | P0 | Very Low | Pending |
| 2 | Semantic Search | P0 | Low-Medium | Pending |
| 3 | Daily Quote (on Dashboard) | P0 | Low | Pending |
| 4 | Concept Explorer | P1 | Medium-High | Pending |
| 5 | Guided Study Paths | P1 | Medium | Pending |
| 6 | Knowledge Checks | P2 | Medium | Optional |

---

## Step 0: Dashboard & Navigation (Foundation)

**Why first:** Creates the home base and navigation shell for all features. Dashboard becomes the new landing page; chat moves to `/chat`.

### Routes
```
/           → Dashboard (new home page)
/chat       → Chat (moved from /)
/explore    → Concept Explorer (placeholder initially)
/paths      → Study Paths (placeholder initially)
/search     → Semantic Search (placeholder initially)
/support    → About (existing)
```

### Navigation Pattern

```
Dashboard (/) ←→ Feature Pages (full screen, immersive)
     │
     ├── /chat      ← Back arrow returns to dashboard
     ├── /explore   ← Back arrow returns to dashboard
     ├── /paths     ← Back arrow returns to dashboard
     │     └── /paths/[id]  ← Back returns to paths list
     └── /search    ← Back arrow returns to dashboard

Burger menu: Available on all pages for quick navigation
```

### Dashboard Layout (Mobile & Desktop)

```
┌─────────────────────────────────────────────────────────────┐
│  ∞  Law of One Study                               [≡]     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  "The heart of the discipline of the personality    │   │
│  │   is threefold..."                                  │   │
│  │                                    — Ra, 52.7   →   │   │
│  └─────────────────────────────────────────────────────┘   │
│                        Daily Quote                          │
│                                                             │
│  ┌───────────────────┐  ┌───────────────────┐              │
│  │  💬               │  │  🔮               │              │
│  │  Seek             │  │  Explore          │              │
│  │  Ask questions    │  │  Concept graph    │              │
│  └───────────────────┘  └───────────────────┘              │
│                                                             │
│  ┌───────────────────┐  ┌───────────────────┐              │
│  │  📚               │  │  🔍               │              │
│  │  Study            │  │  Search           │              │
│  │  Guided paths     │  │  Find passages    │              │
│  └───────────────────┘  └───────────────────┘              │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Continue: "Understanding Densities" ──────────→    │   │
│  └─────────────────────────────────────────────────────┘   │
│                    (if in progress)                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Chat Page Layout (Full Immersion)

**Welcome State (no messages yet):**
```
┌─────────────────────────────────────────────────────────────┐
│  ←  Seek                                                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                                                             │
│                                                             │
│                    ∞                                        │
│           What would you like to                            │
│             explore today?                                  │
│                                                             │
│         ┌─────────────────────────────────┐                │
│         │  Explore the Ra Material...     │                │
│         └─────────────────────────────────┘                │
│                                                             │
│         [Starter 1]  [Starter 2]  [Starter 3]              │
│                                                             │
│                                                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```
- Input centered vertically with welcome message above
- Conversation starters as chips below input
- Clean, focused, inviting

**Active Conversation State (after first message):**
```
┌─────────────────────────────────────────────────────────────┐
│  ←  Seek                                           [New]    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                    Chat messages                            │
│                    Full height                              │
│                    Scrollable                               │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  [Type your message...]                            [Send]   │
└─────────────────────────────────────────────────────────────┘
     ↑ Input animates down to bottom after first message
```
- Input animates from center → bottom (Framer Motion)
- "New" button appears in header
- Full message area for conversation

### Header Variants

**Dashboard Header:**
```
┌─────────────────────────────────────────────────────────────┐
│  ∞  Law of One Study                               [≡]     │
└─────────────────────────────────────────────────────────────┘
     Logo + Title                                    Burger
```

**Feature Page Header:**
```
┌─────────────────────────────────────────────────────────────┐
│  ←  Page Title                                     [≡]     │
└─────────────────────────────────────────────────────────────┘
   Back   Title                                      Burger
```

### Burger Menu (Slide-out Drawer)

```
┌──────────────────────────┐
│  ✕  Menu                 │
├──────────────────────────┤
│                          │
│  🏠  Home                │
│  💬  Seek                │
│  🔮  Explore             │
│  📚  Study               │
│  🔍  Search              │
│                          │
│  ──────────────────────  │
│                          │
│  ℹ️  About               │
│  🌙  Theme               │
│                          │
└──────────────────────────┘
```

**Icons:** Custom SVG or Lucide React (no emoji in actual implementation)

### Files to Create
| File | Purpose |
|------|---------|
| `src/app/page.tsx` | Dashboard (replaces current chat) |
| `src/app/chat/page.tsx` | Chat page (moved from /) |
| `src/components/Dashboard.tsx` | Dashboard layout & cards |
| `src/components/FeatureCard.tsx` | Clickable feature card |
| `src/components/Header.tsx` | Shared header component |
| `src/components/BurgerMenu.tsx` | Slide-out navigation drawer |
| `src/components/__tests__/Dashboard.test.tsx` | Unit tests |
| `src/components/__tests__/Navigation.test.tsx` | Unit tests |
| `src/app/explore/page.tsx` | Placeholder |
| `src/app/paths/page.tsx` | Placeholder |
| `src/app/paths/[pathId]/page.tsx` | Dynamic route |
| `src/app/search/page.tsx` | Placeholder |

### Files to Modify
| File | Changes |
|------|---------|
| `src/app/layout.tsx` | Add Header wrapper |
| `src/components/ChatInterface.tsx` | Add back button, adjust for /chat route |

### Acceptance Criteria
- [ ] Dashboard loads at `/` with feature cards
- [ ] Chat works at `/chat` with full-screen experience
- [ ] Back arrow on feature pages returns to dashboard
- [ ] Burger menu opens drawer with all nav options
- [ ] Placeholder pages show "Coming soon" message
- [ ] Deep linking works (e.g., `/chat` directly)
- [ ] Mobile: Clean header, no bottom tabs
- [ ] Desktop: Same layout (responsive cards)

---

## Step 1: New Chat Button

**Why:** Quick win, enhances existing chat experience. Now shown in chat page header.

### Implementation
The "New" button appears in the chat header only during active conversation:
```
Welcome state:                      Active conversation:
┌────────────────────────┐          ┌────────────────────────┐
│  ←  Seek               │    →     │  ←  Seek        [New]  │
└────────────────────────┘          └────────────────────────┘
```

### Changes to `src/app/chat/page.tsx` and `src/components/ChatInterface.tsx`
- Header shows "New" button when `messages.length > 0`
- Keyboard shortcut: `Cmd/Ctrl + N` (when on chat page)
- Confirmation dialog before clearing
- Clicking "New" animates back to centered welcome state

### Acceptance Criteria
- [ ] "New" button visible in header during active conversation
- [ ] Keyboard shortcut works on `/chat` page
- [ ] Confirmation prevents accidental data loss
- [ ] Resets to centered welcome state (input animates back to center)

---

## Step 2: Semantic Search

**Why:** Reuses existing Pinecone infrastructure, provides direct quote access.

### New Files
| File | Purpose |
|------|---------|
| `src/app/search/page.tsx` | Search UI |
| `src/app/api/search/route.ts` | Search API endpoint |
| `src/components/SearchInput.tsx` | Clean search input |
| `src/components/SearchResults.tsx` | Result cards |
| `src/lib/schemas/search.ts` | Zod validation |

**Note:** No filter UI needed - users can naturally include session numbers in their query (e.g., "harvest session 17").

### Reuse Existing
- `src/lib/pinecone.ts` → `searchRaMaterial()`
- `src/lib/openai.ts` → `createEmbedding()`
- `src/components/QuoteCard.tsx` → Display results

### API Design
```typescript
// POST /api/search
interface SearchRequest {
  query: string;
  filters?: { sessions?: number[] };
  limit?: number; // Default 20, max 50
}

interface SearchResult {
  text: string;
  reference: string;
  url: string;
  score: number;
}
```

### Acceptance Criteria
- [ ] Search returns relevant passages
- [ ] Results link to lawofone.info
- [ ] "Explore this" → navigates to `/chat` with quote as context
- [ ] Loading state with ThinkingIndicator
- [ ] Empty state with suggested searches
- [ ] Search history in localStorage (last 10)

---

## Step 3: Daily Quote (Dashboard Feature)

**Why:** Creates a daily engagement hook. Prominently displayed on the dashboard as the first thing users see.

### New Files
| File | Purpose |
|------|---------|
| `src/components/DailyQuote.tsx` | Quote card component for dashboard |
| `src/lib/daily-quote.ts` | Deterministic selection logic |

### Files to Modify
| File | Changes |
|------|---------|
| `src/components/Dashboard.tsx` | Integrate DailyQuote at top |
| `src/data/starters.ts` | Add more curated quotes (goal: 365+) |

### Dashboard Placement
```
┌─────────────────────────────────────────────────────────────┐
│  ┌─────────────────────────────────────────────────────┐   │
│  │  "The heart of the discipline of the personality    │   │
│  │   is threefold..."                                  │   │
│  │                                                     │   │
│  │  [Explore this]                — Ra, 52.7   →      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [Feature cards below...]                                   │
└─────────────────────────────────────────────────────────────┘
```

### Logic
```typescript
// Deterministic quote based on day of year
const dayOfYear = getDayOfYear(new Date());
const quote = quotes[dayOfYear % quotes.length];
```

### Acceptance Criteria
- [ ] Same quote all day, changes at midnight (user timezone)
- [ ] "Explore this" → navigates to `/chat` with quote as context
- [ ] Quote links to lawofone.info source (arrow icon)
- [ ] Share button (copy with attribution)
- [ ] Works offline (quotes bundled)
- [ ] Beautiful typography with Cormorant font

---

## Step 4: Concept Explorer

**Why:** Uses existing `concept-graph.json` (202KB, ~50 concepts with relationships).

### New Dependency
```bash
npm install d3 @types/d3
```

### New Files
| File | Purpose |
|------|---------|
| `src/app/explore/page.tsx` | Full explorer page |
| `src/components/ConceptGraph.tsx` | D3 force-directed graph |
| `src/components/ConceptPanel.tsx` | Detail panel on node click |
| `src/hooks/useConceptGraph.ts` | Graph state management |
| `src/lib/graph/layout.ts` | D3 force configuration |
| `src/lib/graph/interactions.ts` | Zoom/pan/select handlers |

### Data Source
- `src/data/concept-graph.json` (already exists)
- Categories: cosmology, polarity, energy-work, incarnation, entities, metaphysics, practice, archetypes
- Relationships: prerequisite, leads_to, related, contrasts, part_of, contains

### Graph Design
- Force-directed layout with D3
- Nodes sized by teaching level (foundational > intermediate > advanced)
- Edges styled by relationship type
- Click node → show ConceptPanel
- Double-click → center and expand related nodes

### Mobile Approach
Start with D3 graph on mobile (touch-friendly zoom/pan). Only build list fallback if testing shows graph is unusable on small screens.

### Acceptance Criteria
- [ ] Graph renders all concepts with force layout
- [ ] Panel shows definition, passages, related concepts
- [ ] Zoom/pan works on desktop
- [ ] Mobile graph works with touch zoom/pan
- [ ] "Explore this concept" → navigates to `/chat` with context
- [ ] Filter by category

---

## Step 5: Guided Study Paths

**Why:** Structured learning experience, leverages AI for content generation.

### New Files
| File | Purpose |
|------|---------|
| `src/app/paths/page.tsx` | Path grid with progress |
| `src/app/paths/[pathId]/page.tsx` | Individual path view |
| `src/components/PathCard.tsx` | Path preview card |
| `src/components/LessonCard.tsx` | Lesson content display |
| `src/data/study-paths/*.json` | Path content (AI-generated) |
| `src/lib/schemas/study-paths.ts` | Zod validation schemas |
| `src/hooks/useStudyProgress.ts` | localStorage progress tracking |
| `scripts/generate-study-path.ts` | AI content generation |

### Initial Paths (AI-Generated, Human-Reviewed)
1. **Understanding Densities** (Beginner, ~30 min) - 7 lessons
2. **The Choice: Service to Others vs Self** (Beginner, ~25 min) - 5 lessons
3. **Energy Centers Exploration** (Intermediate, ~45 min) - 7 lessons

**Access:** All paths available from start (seekers come with varying experience).

### Data Structures
```typescript
interface StudyPath {
  id: string;
  title: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedMinutes: number;
  lessons: Lesson[];
}

interface Lesson {
  id: string;
  title: string;
  summary: string; // AI-generated plain language
  keyPassages: { reference: string; text: string; context: string }[];
  discussionQuestions: string[];
}

// localStorage schema
interface StudyProgress {
  [pathId: string]: {
    lessonsCompleted: string[];
    lastAccessed: string; // ISO date
  };
}
```

### AI Generation Workflow
1. Run `npx tsx scripts/generate-study-path.ts --path densities`
2. Script queries Pinecone for relevant passages
3. GPT-5-mini generates lesson summaries and context
4. Output JSON to `src/data/study-paths/`
5. **Human review before committing** (verify quotes are accurate)

### Acceptance Criteria
- [ ] Path grid shows available paths with progress indicators
- [ ] Lessons display key passages as QuoteCard components
- [ ] "Mark as complete" for each lesson
- [ ] Progress persists in localStorage
- [ ] "Explore this lesson" → navigates to `/chat` with lesson context
- [ ] Mobile: Card-based lessons, swipe navigation

---

## Step 6: Knowledge Checks (P2 - Optional)

**Why:** Reinforcement learning, can be deferred if timeline is tight.

### Files
| File | Purpose |
|------|---------|
| `src/components/QuizCard.tsx` | Question display |
| `src/components/QuizResult.tsx` | Answer feedback |
| `src/data/study-paths/quizzes/*.json` | Quiz data |

### Design
- 3-5 multiple choice questions at end of each path
- Immediate feedback with AI-generated explanations
- No scoring/grading - purely self-assessment
- "Review this topic" links back to relevant lesson

### Acceptance Criteria
- [ ] Quiz appears at end of completed path
- [ ] Each answer shows explanation
- [ ] Related passage shown with explanation
- [ ] Can skip and return later

---

## Testing Strategy

### Unit Tests (Jest)
- Dashboard renders feature cards
- Burger menu opens/closes
- Daily quote deterministic selection
- Study progress localStorage operations
- Search result formatting

### E2E Tests (Playwright) - Minimal additions
| File | Coverage |
|------|----------|
| `e2e/navigation.spec.ts` | Dashboard → feature pages, burger menu, back navigation, deep linking |

Following the existing philosophy: one test per feature area, don't duplicate unit tests.

---

## Analytics Events

Track user behavior with PostHog (already integrated). Events should help measure engagement and identify friction.

### Dashboard & Navigation Events
| Event | Properties | Purpose |
|-------|------------|---------|
| `dashboard_viewed` | `has_progress: boolean` | Track landing page visits |
| `feature_card_clicked` | `feature: string` | Which features are popular |
| `burger_menu_opened` | — | Navigation pattern usage |
| `burger_menu_item_clicked` | `destination: string` | Quick nav vs. dashboard preference |

### Chat (Seek) Events
| Event | Properties | Purpose |
|-------|------------|---------|
| `chat_started` | `source: 'dashboard' \| 'quote' \| 'search' \| 'direct'` | Entry points |
| `chat_message_sent` | `message_length: number, turn_number: number` | Engagement depth |
| `chat_new_conversation` | `previous_turn_count: number` | Session patterns |
| `chat_welcome_starter_clicked` | `starter_index: number` | Starter effectiveness |

### Search Events
| Event | Properties | Purpose |
|-------|------------|---------|
| `search_performed` | `query_length: number, results_count: number` | Search usage |
| `search_result_clicked` | `result_position: number, reference: string` | Result relevance |
| `search_explore_clicked` | `reference: string` | Search → chat conversion |

### Daily Quote Events
| Event | Properties | Purpose |
|-------|------------|---------|
| `daily_quote_viewed` | `reference: string` | Impression tracking |
| `daily_quote_explored` | `reference: string` | Quote → chat conversion |
| `daily_quote_shared` | `reference: string` | Viral potential |
| `daily_quote_source_clicked` | `reference: string` | External link usage |

### Concept Explorer Events
| Event | Properties | Purpose |
|-------|------------|---------|
| `concept_graph_viewed` | `device: 'mobile' \| 'desktop'` | Graph usability |
| `concept_node_clicked` | `concept: string, category: string` | Popular concepts |
| `concept_explored_in_chat` | `concept: string` | Graph → chat conversion |
| `concept_filter_applied` | `category: string` | Filter usage |

### Study Paths Events
| Event | Properties | Purpose |
|-------|------------|---------|
| `study_path_started` | `path_id: string, difficulty: string` | Path popularity |
| `study_lesson_viewed` | `path_id: string, lesson_id: string` | Progress tracking |
| `study_lesson_completed` | `path_id: string, lesson_id: string, time_spent: number` | Completion rate |
| `study_path_completed` | `path_id: string, total_time: number` | Full completion |
| `study_lesson_explored` | `path_id: string, lesson_id: string` | Lesson → chat conversion |

---

## Accessibility Requirements

All features must meet WCAG 2.1 AA standards. The Law of One community includes users of all abilities.

### Global Requirements
- [ ] All interactive elements reachable via keyboard (Tab, Shift+Tab)
- [ ] Visible focus indicators (gold outline matching brand)
- [ ] Skip link to main content on all pages
- [ ] Minimum touch target size: 44x44px on mobile
- [ ] Color contrast ratio: 4.5:1 for text, 3:1 for UI elements
- [ ] No information conveyed by color alone

### Navigation & Dashboard
- [ ] Burger menu: Escape key closes, focus trapped while open
- [ ] Feature cards: Arrow key navigation within grid
- [ ] Back button: Focusable, clear label for screen readers
- [ ] Page transitions: `aria-live` announcements for route changes

### Chat (Seek)
- [ ] Input field: Clear label, placeholder not sole instruction
- [ ] Messages: Proper heading hierarchy, `role="log"` for message list
- [ ] New message: `aria-live="polite"` announces new responses
- [ ] Conversation starters: Keyboard accessible chips

### Search
- [ ] Search input: `role="searchbox"`, clear label
- [ ] Results: `role="list"` with result count announced
- [ ] Loading state: `aria-busy="true"`, spinner has `aria-label`
- [ ] Empty state: Clear message, not just visual

### Concept Explorer
- [ ] Graph: Keyboard navigation between nodes (arrow keys)
- [ ] Graph: Screen reader alternative (list of concepts with relationships)
- [ ] Panel: Focus moves to panel on node selection
- [ ] Panel close: Escape key, focus returns to node

### Study Paths
- [ ] Progress: Announced to screen readers ("3 of 7 lessons complete")
- [ ] Lesson navigation: Arrow keys or swipe with screen reader support
- [ ] Mark complete: Clear feedback ("Lesson marked complete")

---

## Error States & Edge Cases

Every feature must handle failures gracefully. Users should never see blank screens or cryptic errors.

### Global Error Handling
| Scenario | Behavior |
|----------|----------|
| Network offline | Show toast: "You're offline. Some features may be limited." |
| API timeout | Show retry button with message: "Taking longer than expected..." |
| Unhandled error | Error boundary with "Something went wrong" + "Return to Home" button |
| localStorage unavailable | Graceful degradation: features work but progress won't persist |
| localStorage quota exceeded | Clear old search history, warn user if progress affected |

### Dashboard Errors
| Scenario | Behavior |
|----------|----------|
| Daily quote fails to load | Show fallback static quote (hardcoded inspirational quote) |
| Progress data corrupted | Reset progress with toast: "Progress data was reset" |

### Chat (Seek) Errors
| Scenario | Behavior |
|----------|----------|
| AI response fails | Show error in chat: "I couldn't respond. Please try again." + retry button |
| Streaming interrupted | Show partial response + "Response was interrupted" message |
| Rate limited | Show friendly message with countdown: "Please wait X seconds..." |
| Message too long | Inline validation before send, prevent submission |
| Context too long | Automatically trim old messages, notify user |

### Search Errors
| Scenario | Behavior |
|----------|----------|
| Search API fails | "Search is temporarily unavailable. Please try again." |
| Zero results | "No passages found for '[query]'. Try different keywords." + suggestions |
| Embedding generation fails | Fallback to keyword search if possible, or show error |
| Query too short | Inline validation: "Enter at least 3 characters" |

### Concept Explorer Errors
| Scenario | Behavior |
|----------|----------|
| Graph data fails to load | Show error state with retry button |
| Graph render fails (WebGL) | Fallback to simplified SVG or list view |
| Mobile performance issues | Detect low FPS, offer to switch to list view |
| Concept not found (deep link) | "Concept not found" + link to full explorer |

### Study Paths Errors
| Scenario | Behavior |
|----------|----------|
| Path data fails to load | "Couldn't load study path. Please try again." |
| Progress save fails | Toast: "Couldn't save progress" (non-blocking) |
| Invalid path ID (deep link) | "Study path not found" + link to all paths |
| Lesson content missing | Skip to next lesson with notice |

### Offline Behavior Summary
| Feature | Offline Capability |
|---------|-------------------|
| Dashboard | ✅ Full (quotes bundled, progress in localStorage) |
| Chat | ❌ Requires network (show clear offline message) |
| Search | ❌ Requires network (show clear offline message) |
| Concept Explorer | ✅ Full (graph data bundled) |
| Study Paths | ✅ Partial (content bundled, progress local, no AI features) |

---

## Local Storage Schema

```typescript
const STORAGE_KEYS = {
  STUDY_PROGRESS: "lo1_study_progress",
  SEARCH_HISTORY: "lo1_search_history",
  EXPLORER_STATE: "lo1_explorer_state",
} as const;
```

---

## Critical Files Summary

| File | Action | Step(s) |
|------|--------|---------|
| `src/app/page.tsx` | Rewrite | 0 (becomes Dashboard) |
| `src/app/chat/page.tsx` | Create | 0 (chat moves here) |
| `src/app/layout.tsx` | Modify | 0 |
| `src/components/Dashboard.tsx` | Create | 0, 3 |
| `src/components/FeatureCard.tsx` | Create | 0 |
| `src/components/Header.tsx` | Create | 0 |
| `src/components/BurgerMenu.tsx` | Create | 0 |
| `src/app/explore/page.tsx` | Create | 0, 4 |
| `src/app/paths/page.tsx` | Create | 0, 5 |
| `src/app/paths/[pathId]/page.tsx` | Create | 0, 5 |
| `src/app/search/page.tsx` | Create | 0, 2 |
| `src/app/api/search/route.ts` | Create | 2 |
| `src/components/ChatInterface.tsx` | Modify | 0, 1 |
| `src/components/DailyQuote.tsx` | Create | 3 |
| `src/lib/daily-quote.ts` | Create | 3 |
| `src/components/ConceptGraph.tsx` | Create | 4 |
| `src/components/ConceptPanel.tsx` | Create | 4 |
| `src/data/concept-graph.json` | Use (exists) | 4 |
| `src/components/PathCard.tsx` | Create | 5 |
| `src/components/LessonCard.tsx` | Create | 5 |
| `src/data/study-paths/*.json` | Create | 5 |
| `src/hooks/useStudyProgress.ts` | Create | 5 |
| `scripts/generate-study-path.ts` | Create | 5 |

---

## Decisions Made

| Question | Decision |
|----------|----------|
| Navigation pattern | Dashboard-first (no bottom tabs) |
| Mobile navigation | Burger menu → slide-out drawer |
| Navigation icons | Custom SVG or Lucide React |
| Chat feature name | "Seek" (not "Ask Ra" - we're asking AI about Ra, not Ra directly) |
| Chat welcome state | Centered input with welcome message, animates to bottom on first message |
| Search filters | None - users include context in query naturally |
| Path availability | All paths available from start |
| Mobile graph | Start with D3 graph, add list fallback only if needed |

---

## Next Steps

1. Review and finalize this plan
2. Create `feature/phase-1` branch
3. Begin Step 0: Dashboard & Navigation
