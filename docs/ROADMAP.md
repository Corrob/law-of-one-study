# Law of One Study Tool - Product Roadmap

**Vision:** Build the most comprehensive study companion for the Ra Material, helping seekers deepen their understanding through innovative tools while maintaining the integrity of the original teachings.

**Last Updated:** March 2026

---

## Guiding Principles

1. **Accessibility First** - Core features remain free and open
2. **Respect the Source** - Never distort or commercialize Ra's teachings
3. **Progressive Enhancement** - Advanced features for dedicated students
4. **Privacy by Design** - Minimal data collection, user control
5. **Community-Driven** - Let users guide feature priorities

---

## Current State

**Phase 1 Complete!** All discovery and learning tools are now live.

**Shipped Features:**
- Interactive Concept Explorer — graph of 100+ concepts with relationships
- Guided Study Paths — curated lessons with quizzes and reflections
- Daily Quote — rotating wisdom on the home page
- Guided Meditations — browse and play meditation audio with looping
- PWA Support — installable progressive web app
- Multilingual Support — English, Spanish, German, French
- Dark and light theme support

> **Note:** AI chat (Seek) and semantic search features were previously available but were removed in March 2026 at the request of L/L Research, the copyright holders of the Ra Material. We respect their stewardship of these teachings.

---

## Product Evolution

The app evolves from a **study tool** into a **study platform** across phases:

```
Phase 1                    Phase 2
───────────────────────────────────────────
Study & Discovery Tools →  + Personal Library
(No auth required)         (Auth unlocks sync)

Concept Explorer           Favorites
Guided Paths              Reading Progress
Daily Quote               Study Notes
Meditations
```

**Key Insight:** Phase 1 enhances discovery without persistence needs. Phase 2+ requires reliable storage (auth), especially for Safari users where localStorage is aggressively cleared.

---

## Phase 1: Learning & Discovery (Complete)

**Theme:** Enhance the learning experience without requiring accounts.

**Status:** All Phase 1 features are shipped and live at [lawofone.study](https://lawofone.study).

### 1.1 Daily Quote
Start each day with wisdom from Ra.

- Beautiful quote displayed on first visit each day
- Rotates at midnight (user's timezone)
- "Random Quote" button for on-demand inspiration

### 1.2 Concept Explorer
Visualize how concepts in the Ra Material interconnect.

- Interactive graph with zoom, pan, search
- Click any node to expand with related concepts
- Visual clusters by category (densities, chakras, archetypes)
- Concept definitions and key quotes

### 1.3 Guided Study Paths
Curated learning journeys for different levels and interests.

- Grid of available paths with progress indicators
- Categories: Beginner, Intermediate, Advanced, Topics
- Sequential lessons with key quotes
- Reflection prompts after each lesson

### 1.4 Guided Meditations
Browse and play guided meditation audio.

- Browse-first UX for discovering meditations
- Audio player with looping support
- Available in 4 locales (en, es, de, fr)

### 1.5 PWA Support
Installable progressive web app experience.

- One-tap install prompt with platform detection
- Auto-reload on resume after backgrounding
- Works offline for cached content

---

## Phase 2: Personal Library (Future)

**Theme:** User accounts enable reliable persistence and sync.

**Prerequisite:** User authentication system

### 2.1 User Authentication
Sign in to sync your data across devices.

- Passwordless email login (magic links)
- Social auth (Google, GitHub)
- **Never required** for Phase 1 features
- Privacy-focused: minimal data, full export, one-click delete

### 2.2 My Library Hub
Central home for all personal content.

- Favorites
- Reading Progress (track journey through 106 sessions)
- Study Notes
- Export capabilities

### 2.3 Favorites
Build a personal library of meaningful quotes.

- Heart icon on all quote cards
- Organize into collections/folders
- Search within favorites
- Export (PDF, Markdown)

### 2.4 Reading Progress
Track your journey through all 106 sessions.

- Visual progress grid (106 sessions)
- Tap to mark: unread / reading / complete
- "Continue where you left off" suggestions

### 2.5 Study Notes
Attach personal insights to quotes, sessions, and concepts.

- Notes attached to any quote, session, or concept
- Rich text / Markdown support
- Tag notes with concepts
- Search across all notes

---

## Future Considerations

Features to revisit based on community demand:

| Feature | Notes |
|---------|-------|
| Guided Meditations (expanded) | More meditation content and categories |
| Weekly Newsletter | Editorial overhead, but high engagement potential |
| Community Paths | User-contributed study paths (moderation needed) |
| Native Mobile Apps | Perfect web experience first |
| Discussion Boards | Significant moderation resources |
| Journaling | AI-free journaling prompts based on Ra's teachings |
| Cycle Tracker | Track personal rhythms aligned with Ra's teachings |

---

## Community Input

Help shape this roadmap:

- **Feedback:** [GitHub Issues](https://github.com/Corrob/law-of-one-study/issues)
- **Ideas:** [Feature Requests](https://github.com/Corrob/law-of-one-study/issues/new?labels=feature-request)

---

## How You Can Help

1. **Share Feedback** - Open issues
2. **Contribute Code** - See [CONTRIBUTING.md](CONTRIBUTING.md)
3. **Spread the Word** - Tell other seekers about this tool
4. **Support the Project** - Help cover hosting costs (coming soon)

---

*"In truth there is no right or wrong. There is no polarity for all will be, as you would say, reconciled at some point in your dance through the mind/body/spirit complex which you amuse yourself by distorting in various ways at this time." — Ra, 18.5*
