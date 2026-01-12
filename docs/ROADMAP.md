# Law of One Study Tool - Product Roadmap

**Vision:** Build the most comprehensive, AI-powered study companion for the Ra Material, helping seekers deepen their understanding through innovative tools while maintaining the integrity of the original teachings.

**Last Updated:** January 2026

---

## Guiding Principles

1. **Accessibility First** - Core features remain free and open
2. **Respect the Source** - Never distort or commercialize Ra's teachings
3. **Progressive Enhancement** - Advanced features for dedicated students
4. **Privacy by Design** - Minimal data collection, user control
5. **Community-Driven** - Let users guide feature priorities
6. **Chat as the Heart** - Every feature connects back to conversational discovery

---

## Current State

**Phase 1 Complete!** All discovery and learning tools are now live.

**Shipped:**
- AI-powered chat with streaming responses and quote attribution
- Interactive quote cards with source links
- Concept detection and linking in responses
- Suggestion chips for follow-up questions
- Animated, personality-driven UI
- Dark and light theme support
- Onboarding modal for new users
- About page

**Phase 1 Features (Shipped):**
- Semantic Search — search by sentence or passage across all 106 sessions
- Concept Explorer — interactive graph of 100+ concepts with relationships
- Guided Study Paths — curated lessons with quizzes and reflections
- Daily Quote — rotating wisdom on the home page

---

## Product Evolution

The app evolves from a **chat-first tool** into a **study platform** across three phases:

```
Phase 1                    Phase 2                    Phase 3
───────────────────────────────────────────────────────────────────
Chat + Learning Tools  →   + Personal Library    →   + Deep Practice
(No auth required)         (Auth unlocks sync)       (Builds on library)

Concept Explorer           Favorites                  Journaling
Guided Paths              Reading Progress           Cycle Tracker
Semantic Search           Study Notes
Daily Quote               Conversation History
New Chat
```

**Key Insight:** Phase 1 enhances discovery without persistence needs. Phase 2+ requires reliable storage (auth), especially for Safari users where localStorage is aggressively cleared.

---

## Design Philosophy

### Chat Remains Central

Every feature can **launch into chat with context**. Chat is the conversational heart; features are structured entry points.

| From | Action | Chat Behavior |
|------|--------|---------------|
| Concept Explorer | "Discuss this concept" | Chat seeded with concept context |
| Guided Paths | "Discuss this lesson" | Chat knows your path progress |
| Search Results | "Ask about this quote" | Chat focuses on that quote |
| Favorites | "Explore this quote" | Chat expands on saved material |
| Journal | "Reflect deeper" | Chat as reflection partner |
| Cycle Tracker | "Why am I feeling this?" | Chat with cycle context |

### Navigation Architecture

**Phase 1: Four-tab navigation**
```
Desktop:
┌─────────────────────────────────────────────────────────┐
│  ∞ Law of One Study    [Chat] [Explore] [Paths] [Search] │
└─────────────────────────────────────────────────────────┘

Mobile (bottom tabs):
┌─────────────────────────────────────────────────────────┐
│                      (content)                          │
├─────────────────────────────────────────────────────────┤
│    💬 Chat     🔮 Explore     📚 Paths     🔍 Search     │
└─────────────────────────────────────────────────────────┘
```

**Phase 2+: Add profile icon (no new tabs)**
```
Desktop:
┌─────────────────────────────────────────────────────────┐
│  ∞ Law of One Study    [Chat] [Explore] [Paths] [Search]  👤 │
└─────────────────────────────────────────────────────────┘
```

Profile opens **"My Library"** — a personal hub that grows across phases.

### Mobile-First Patterns

| Pattern | Implementation |
|---------|----------------|
| Concept panel | Bottom sheet (swipe to dismiss) |
| Lesson navigation | Swipe between lessons |
| Filters | Horizontal chip bar |
| Quick actions | Thumb-zone placement |
| Feedback | Haptic on key actions |

---

## Phase 1: Learning & Discovery ✓ Complete

**Theme:** Enhance the learning experience without requiring accounts.

**Status:** All Phase 1 features are shipped and live at [lawofone.study](https://lawofone.study).

---

### 1.1 New Chat Button
**Complexity:** Very Low

A simple way to start fresh conversations.

**Features:**
- Clear "New Chat" button in header
- Confirmation dialog if conversation has messages
- Keyboard shortcut (Cmd/Ctrl + N)

---

### 1.2 Daily Quote
**Complexity:** Low

Start each day with wisdom from Ra.

**Features:**
- Beautiful quote displayed on first visit each day
- Rotates at midnight (user's timezone)
- "Random Quote" button for on-demand inspiration
- Share to social media with proper attribution
- One-click "Ask about this" → chat with context

**Mobile:** Full-screen modal on first visit, dismissible card after

---

### 1.3 Concept Explorer
**Complexity:** Medium-High

Visualize how concepts in the Ra Material interconnect.

**Desktop UX:**
- **Reactive mode:** Click concept in chat → right slide-over panel (chat stays visible)
- **Proactive mode:** Nav to Explore → full-page interactive graph

**Panel features:**
- Concept definition and key quotes
- Related concepts as clickable nodes
- "Open full explorer" link
- "Discuss this concept" → chat with context

**Full explorer features:**
- Interactive graph with zoom, pan, search
- Click any node → expand with related concepts
- Visual clusters by category (densities, chakras, archetypes)
- Suggested pathways: "Learning about X? Explore Y next"

**Mobile adaptation:**
- List view with expandable cards (graph is hard on small screens)
- Search + filter at top
- Optional: simplified zoomable graph in landscape

---

### 1.4 Guided Study Paths
**Complexity:** Medium

Curated learning journeys for different levels and interests.

**Paths page (`/paths`):**
- Grid of available paths with progress indicators
- Categories: Beginner, Intermediate, Advanced, Topics
- Estimated time for each path

**Example paths:**
- "Introduction to the Law of One" (beginners)
- "Understanding the Seven Densities"
- "Working with the Archetypes"
- "The Harvest: Preparation and Understanding"
- "Balancing Exercises and Techniques"
- "The Mind/Body/Spirit Complex"

**Individual path view:**
- Sequential lessons with key quotes
- AI-generated explanations in plain language
- Reflection prompts after each lesson
- Progress tracking (stored locally initially)
- "Discuss this with Ra" button → chat with lesson context

**Mobile:** Card-based lessons, swipe to navigate

**Why separate from chat:** Paths are structured, chat is conversational. Linear content in chat UI feels awkward. Structured learning deserves structured UI.

---

### 1.5 Semantic Search
**Complexity:** Low-Medium

Pure search mode for research and deep study.

**Search page (`/search`):**
- Clean search input with filter chips (session range, speaker)
- Results as scannable quote cards (not chat bubbles)
- 20-50 results ranked by relevance
- No AI interpretation — just the raw quotes

**Result interactions:**
- Click to expand full quote in context
- "Ask about this" → chat seeded with quote
- Copy quote with attribution
- (Phase 2) Save to favorites

**Why separate from chat:** Different intent. Chat is "help me understand X" (guided). Search is "show me everything about X" (exhaustive). Mode-switching in same UI causes confusion.

---

### 1.6 Knowledge Checks (Optional for Phase 1)
**Complexity:** Medium

Light quizzes integrated into Guided Paths.

**Features:**
- 3-5 questions at end of each path
- Multiple choice with AI-generated explanations
- No accounts needed — just learning reinforcement
- "Review this topic" → back to relevant lesson

**Defer to Phase 2:** Leaderboards, progress tracking, adaptive difficulty

---

## Phase 2: Personal Library

**Theme:** User accounts enable reliable persistence and sync.

**Prerequisite:** User authentication system

---

### 2.1 User Authentication
**Complexity:** Medium

Sign in to sync your data across devices.

**Features:**
- Passwordless email login (magic links)
- Social auth (Google, GitHub)
- **Never required** for Phase 1 features
- Clear value prop: "Save favorites, track progress, sync across devices"
- Privacy-focused: minimal data, full export, one-click delete

**UX:** Profile icon appears in header after auth. Opens "My Library" page.

---

### 2.2 My Library Hub
**Complexity:** Low

Central home for all personal content.

```
┌─────────────────────────────────────────────┐
│  My Library                          ⚙️     │
├─────────────────────────────────────────────┤
│                                             │
│  ⭐ Favorites (23)                     →    │
│  📖 Reading Progress (42/106)          →    │
│  📝 Study Notes (12)                   →    │
│  💬 Saved Chats (5)                    →    │
│                                             │
│  ─────────────────────────────────────────  │
│                                             │
│  📓 Journal (7 entries)                →    │  ← Phase 3
│  🌀 Cycle Tracker                      →    │  ← Phase 3
│                                             │
└─────────────────────────────────────────────┘
```

---

### 2.3 Favorites
**Complexity:** Medium

Build a personal library of meaningful quotes.

**Features:**
- Heart icon on all quote cards
- Organize into collections/folders
- Search within favorites
- Export (PDF, Markdown)
- Share individual quotes or collections

**Mobile:**
- Long-press quote for "Add to Collection" submenu
- Favorites page: masonry grid of cards
- Swipe left to remove

---

### 2.4 Reading Progress
**Complexity:** Low-Medium

Track your journey through all 106 sessions.

**Features:**
- Visual progress grid (106 sessions)
- Tap to mark: unread → reading → complete
- "Continue where you left off" suggestions
- Session notes (brief annotations)
- Share progress milestones

**Mobile:**
- 10×11 dot grid visualization
- Tap to toggle status
- Satisfying fill animation + haptic

---

### 2.5 Study Notes
**Complexity:** Medium-High

Attach personal insights to quotes, sessions, and concepts.

**Features:**
- Notes attached to any quote, session, or concept
- Rich text / Markdown support
- Tag notes with concepts
- Search across all notes
- Small 📝 indicator on items with notes

**Advanced (consider for later):**
- Bi-directional linking (Zettelkasten-style)
- Graph view of note connections
- AI summaries: "Summarize my notes on the harvest"

---

### 2.6 Conversation History
**Complexity:** Medium

Save and resume meaningful conversations.

**Features:**
- Auto-save conversations (with user consent)
- Resume past chats from My Library
- Delete individual conversations
- Export as Markdown

---

## Phase 3: Deep Practice

**Theme:** Tools for serious practitioners applying Ra's teachings.

**Prerequisite:** Phase 2 (auth + library infrastructure)

---

### 3.1 Journaling
**Complexity:** Medium

AI-powered journaling for spiritual growth.

**Features:**
- Dedicated journaling interface
- AI-generated prompts based on Ra's teachings:
  - "What catalyst did you experience today?"
  - "How can you show more compassion to yourself?"
  - "What patterns are you noticing?"
- Link entries to quotes/concepts
- Calendar heat map view (like GitHub contributions)
- Tags: catalyst, balancing, meditation, service
- Completely private and encrypted
- Export as PDF/Markdown

**Mobile:**
- Voice-to-text for easy capture
- Quick entry mode (prompt → response → done)
- Swipe between days

**Chat integration:** "Reflect deeper" → chat as reflection partner

---

### 3.2 Cycle Tracker
**Complexity:** Medium-High

Track personal rhythms aligned with Ra's teachings on cycles.

**Features:**
- Quick daily log: mood, energy, catalyst (3-tap entry)
- Visualization of patterns over time
- Correlations with sessions studied, journal entries
- Moon phase overlay (optional)
- Insights: "You often experience catalyst after studying X"
- Export data for personal analysis

**Mobile:**
- Dashboard with trend charts
- Quick-log widget on home screen (future)
- Haptic feedback on logging

**Chat integration:** "Why am I feeling X?" → chat with cycle context

---

## Future Considerations

Features to revisit based on community demand:

| Feature | Notes |
|---------|-------|
| Guided Meditations | Audio content requires production resources |
| Weekly Newsletter | Editorial overhead, but high engagement potential |
| Community Paths | User-contributed paths (moderation needed) |
| Native Mobile Apps | Perfect web experience first |
| Voice Mode | Complex infrastructure |
| Discussion Boards | Significant moderation resources |

---

## Development Workflow

**Branch Strategy:**
```
feature/concept-explorer
        ↓
    develop (staging)
        ↓
    main (production)
```

**Phase Releases:**
- Each phase is a cohesive release
- Features within a phase can ship incrementally to `develop`
- Full phase merges to `main` when complete
- Feature flags for dark launches if needed

**Testing:**
- Unit tests for utilities and hooks
- Integration tests for API routes
- Manual QA on `develop` before release

---

## Community Input

Help shape this roadmap:

- **Feedback:** [GitHub Issues](https://github.com/Corrob/law-of-one-study/issues)
- **Ideas:** [Feature Requests](https://github.com/Corrob/law-of-one-study/issues/new?labels=feature-request)
- **Discussion:** [GitHub Discussions](https://github.com/Corrob/law-of-one-study/discussions)

---

## How You Can Help

1. **Share Feedback** - Open issues or discussions
2. **Contribute Code** - See [CONTRIBUTING.md](CONTRIBUTING.md)
3. **Spread the Word** - Tell other seekers about this tool
4. **Support the Project** - Help cover hosting/API costs (coming soon)

---

*"In truth there is no right or wrong. There is no polarity for all will be, as you would say, reconciled at some point in your dance through the mind/body/spirit complex which you amuse yourself by distorting in various ways at this time." — Ra, 18.5*
