# Design Doc: Extending the Concept Graph — Lessons from Understand-Anything

**Status:** Proposal
**Date:** 2026-07-11
**Reference:** [Egonex-AI/Understand-Anything](https://github.com/Egonex-AI/Understand-Anything) (MIT, v2.9.0)

---

## Summary

Understand-Anything is a plugin for AI coding tools (Claude Code, Cursor, etc.) that
turns codebases and knowledge bases into interactive, explorable knowledge graphs. It
combines deterministic parsing (tree-sitter) with a multi-agent LLM pipeline (scanner,
file analyzer, architecture analyzer, tour builder, graph reviewer, domain analyzer),
and ships a local dashboard with fuzzy/semantic search, focus mode, guided tours, and
diff impact analysis.

**Can we use it directly?** Mostly no — it analyzes *code* and Karpathy-pattern
*wikis*, and its output is a standalone local viewer, not an embeddable library. It is
not a runtime dependency we can drop into our Next.js explore page.

**Can it help us?** Yes, in two ways:

1. **As design inspiration.** Several of its viewer interactions map cleanly onto our
   concept graph and fill real gaps — most notably search, focus mode, and guided
   tours. Our data model (`src/data/concept-graph.json`) already contains everything
   these features need; no data work is required for the highest-value items.
2. **As a pattern for data tooling.** Its "graph reviewer" agent and incremental
   pipeline are a good template for a `scripts/` tool that validates and extends our
   hand-curated concept graph.

There is also a minor dev-experience use: contributors could run `/understand` on this
repo for onboarding. Harmless, but the codebase is small and well-documented, so this
doc doesn't pursue it further.

---

## Where We Are Today

Our concept graph (`/explore`):

- **Data:** 128 hand-curated concepts in `src/data/concept-graph.json`, each with
  localized `term`/`aliases`/`definition` (en/es/de/fr), `category` (8 categories),
  `teachingLevel` (foundational/intermediate/advanced), typed `relationships`
  (`prerequisite`, `leads_to`, `related`, `contrasts`, `part_of`, `contains`),
  `sessions` (primary/secondary Ra session numbers), `keyPassages`, and `searchTerms`.
- **Rendering:** D3 force simulation (`src/lib/graph/layout.ts`) with
  cluster → subcluster → concept expansion, a Sugiyama DAG layout for hierarchy, zoom
  controls, and a category legend. Node selection opens `ConceptPanel`.
- **Related features:** Study Paths (guided lessons, `src/data/study-paths/`) and
  concept-aware search expansion for embeddings
  (`buildSearchExpansion` in `src/lib/concept-graph.ts`).

**Gaps Understand-Anything highlights:**

- No way to search the graph itself — finding one of 128 concepts means expanding
  clusters and hunting visually.
- Selecting a node highlights it but doesn't isolate its neighborhood; relationship
  *types* are only distinguishable by subtle dash patterns.
- Study Paths and the graph are disconnected experiences — the graph never shows you
  "where you are" in a learning journey, and paths never show you the map.
- The graph data is maintained by hand with no consistency validation (e.g., asymmetric
  `related` links, `contains` without a matching `part_of`, dangling ids).

---

## Proposed Features

Ordered by value-to-effort. Items 1–2 are quick wins; 3 is the flagship; 4–6 are
follow-ons.

### 1. Graph Search (their "fuzzy search") — **P0**

A search input on the explore page that matches against `term`, `aliases`, and
`searchTerms` for the active locale, with results in a dropdown. Selecting a result:

1. Expands the concept's category cluster (and subcluster if applicable).
2. Pans/zooms to the node (we already hold the `ZoomBehavior` in a ref in
   `ConceptGraph.tsx` for programmatic control).
3. Selects it, opening `ConceptPanel`.

**Implementation notes:**

- Pure client-side; the dataset is tiny (128 entries). A simple scoring function
  (exact > prefix > substring on normalized strings) is enough — no need for a fuzzy
  search dependency, though `fuse.js` is acceptable if diacritic handling gets fiddly
  (relevant for es/de/fr aliases).
- New module `src/lib/graph/search.ts` (pure function, unit-testable) + a
  `GraphSearch.tsx` component in `src/components/graph/`.
- Expose a `focusNode(id)` imperative handle from `ConceptGraph` (forwardRef) so the
  explore page can drive expansion + zoom.
- i18n strings in `messages/{en,es,de,fr}/`.

**Effort:** Small. **Data changes:** none.

### 2. Focus Mode (their node-select focus view) — **P1**

When a concept is selected, dim non-adjacent nodes/edges (lower opacity, not removal —
keeps spatial context) and label the surviving edges by relationship type. Add a small
"connections" summary to `ConceptPanel` grouped by relationship
(prerequisites, leads to, related, contrasts, part of, contains) with click-to-navigate
— turning the panel into the "code, relationships, and plain-English explanation"
focus view Understand-Anything ships.

**Implementation notes:**

- Adjacency is derivable from the existing `links` array at selection time; no new
  state model needed. A `getNeighborhood(nodeId, links)` helper in `src/lib/graph/`
  keeps it testable.
- Edge relationship labels only render in focus mode (they'd be noise globally).
- Escape/backdrop click clears focus — same gesture that closes `ConceptPanel` today.

**Effort:** Small–medium. **Data changes:** none.

### 3. Guided Graph Tours (their "tour builder") — **P1, flagship**

Understand-Anything auto-generates walkthroughs "ordered by dependency" so you learn a
codebase in the right order. We have the exact analog already curated: Study Paths, and
a `prerequisite`/`leads_to` DAG in the concept data.

Two layers, shippable independently:

**3a. Path-on-graph.** Each study path gets an ordered list of concept ids
(most path steps already reference concepts implicitly). On the explore page, a tour
mode renders Previous/Next controls, steps through concepts — expanding, panning,
focusing, and opening the panel for each — and draws the path's edges as a highlighted
trail. Study path pages get a "View on concept map" link; `ConceptPanel` gets
"Part of: <path>" backlinks. This finally bridges the two flagship features.

**3b. Auto-generated tours.** For any concept, generate "the road to X": a topological
order over its transitive `prerequisite` ancestors (we already build this DAG in
`computeSugiyamaLayout` in `src/lib/graph/layout.ts` — extract the parent-map logic
into a shared helper). One button in `ConceptPanel`: *"Learn the path to this
concept"*.

**Implementation notes:**

- New `tours` field is **not** needed in `concept-graph.json`; 3a needs a
  `conceptSequence: string[]` per study path (in the existing study-path JSONs, with a
  Zod schema update in `src/lib/schemas/study-paths.ts`), and 3b is derived at runtime.
- Tour state (active tour, step index) lives in `ExploreContent.tsx`; deep-linkable via
  query params (`?tour=densities&step=3`) so paths can link in.
- This is a new user-facing flow with multi-step interaction → warrants one E2E test
  per the testing philosophy in CLAUDE.md.

**Effort:** Medium. **Data changes:** small, additive, per-path.

### 4. "What This Unlocks" Ripple View (their diff impact analysis) — **P2**

Their diff analysis answers "what does changing this file affect?" Our analog: from a
selected concept, show the transitive closure of `leads_to` — "understanding this opens
up…" — as a one-click overlay (distinct highlight color radiating outward, 2–3 hops
max). Pairs naturally with focus mode (item 2) and reuses its dimming machinery; the
inverse direction ("what you need first") is item 3b.

**Effort:** Small once item 2 exists. **Data changes:** none.

### 5. Teaching-Level Lens (their persona-adaptive UI) — **P2**

Their dashboard adapts detail to junior devs vs. power users. Our data already has
`teachingLevel`. Add a three-position filter (Foundational / +Intermediate / All) that
progressively reveals nodes, defaulting to All so nothing changes for existing users.
Good for newcomers overwhelmed by 128 nodes; cheap because node filtering already
happens in the expand/collapse pipeline.

**Effort:** Small. **Data changes:** none.

### 6. Graph Reviewer Script (their multi-agent pipeline, applied to data) — **P2, dev tooling**

Adopt their scanner → analyzer → **reviewer** pattern as a `scripts/validate-concept-graph.ts`
tool run in CI / pre-commit:

- **Deterministic checks (no LLM):** dangling relationship ids; `contains`/`part_of`
  and `related` symmetry; `prerequisite` cycles (which would silently trigger the grid
  fallback in `computeSugiyamaLayout`); locale completeness across
  term/aliases/definition; orphan concepts (no relationships at all); session numbers
  within valid range.
- **Optional LLM-assisted pass (manual, not CI):** given the Ra session references in
  each concept, suggest missing relationships or concepts mentioned in `keyPassages`
  that aren't in the graph — mirroring their "article-analyzer finds implicit
  relationships" agent. Output is a report for human curation, never auto-applied;
  the graph stays hand-curated.

**Effort:** Small for deterministic checks (highest value); LLM pass is exploratory.

---

## What We Should *Not* Take

- **The plugin as a runtime dependency.** Its viewer is a standalone Node dashboard for
  `.ua/knowledge-graph.json`; embedding it would fight our Next.js/i18n/theming stack
  for no gain — our D3 renderer is already more tailored (energy-center color spectrum,
  cluster expansion, four locales).
- **Its knowledge-base ingestion.** It expects Karpathy-pattern wikis with an
  `index.md`; reshaping our curated, localized, session-referenced data to fit would be
  a downgrade in fidelity.
- **Community-detection clustering.** We have deliberate, meaningful categories
  (energy centers); algorithmic clustering would erase curation.
- **Semantic search over the graph.** 128 well-aliased concepts don't need embeddings;
  fuzzy matching on existing `searchTerms` covers it. (Embeddings already serve the
  separate passage-search feature via `buildSearchExpansion`.)

Since the project is MIT-licensed, we may also borrow specific viewer code if useful,
but the features above are all small enough to implement natively in our stack.

---

## Suggested Sequencing

| Phase | Items | Rationale |
| ----- | ----- | --------- |
| 1 | Search (1) + deterministic reviewer script (6a) | Immediate UX win; data safety net before further graph work |
| 2 | Focus mode (2) + path-on-graph tours (3a) | The flagship bridge between Explore and Study Paths |
| 3 | Auto tours (3b), ripple view (4), level lens (5) | Derived features building on phases 1–2 |

Each phase is independently shippable and touches no existing behavior by default
(search is additive, focus/tours are opt-in interactions, filters default to All).

---

## Risks & Open Questions

- **Mobile:** tour controls and focus-mode edge labels need a mobile layout pass; the
  graph is already responsive but screen real estate is tight with `ConceptPanel` open.
- **Curation load:** `conceptSequence` for 7+ study paths (plus 27 archetype lessons)
  is manual work; start with 2–3 paths (densities, polarity, energy-centers) to
  validate the UX before back-filling.
- **DAG hygiene:** 3b depends on the `prerequisite` graph being acyclic and reasonably
  complete; the reviewer script (6) should land first to confirm.
