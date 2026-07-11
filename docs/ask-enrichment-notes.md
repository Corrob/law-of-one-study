# Ask feature — concept-graph enrichment notes

The Ask feature grounds the LLM in `src/data/concept-graph.json`. This doc tracks
enrichment status and the plan for adding more source-validated passages.

## Current coverage

Run `npm run validate:citations` (structure) and `-- --online` (wording):

- **128 concepts**, every one with at least one key passage (0 gaps).
- **145 key passages**, **107 unique** `session.question` references.
- **0 thin** English definitions; all four locales populated.
- All references well-formed and within the real session range (1–106).

### Reference-resolution status (as of the last `--online` run)

- **145 / 145 references resolve** — every citation points to a real Q&A that
  exists on llresearch.org. This is the property that matters.
- Excerpt style split (informational): **85 verbatim** quotes, **60 our-words
  summaries**. Both are acceptable — see the principle below.

### Principle: paraphrase-first, verbatim as a small curated subset

We do **not** reproduce the Ra Material. The `excerpt` field is normally a short
**summary in our own words**; a small curated subset may be a genuine short
**verbatim quote**. Either way the `reference` links to the exact Q&A on
llresearch.org, which is where the reader goes for the original. Two rules:

- If an `excerpt` is shown as a literal quote (quotation marks), it must be
  **verbatim**; if it's our summary, it must **not** be dressed up as a quote.
- Every `reference` must resolve (enforced by `--online`).

## Source of truth for quotes

- **llresearch.org** (`/channeling/ra-contact/{session}#{question}`) — L/L
  Research's own site and the canonical home of the Ra Material. This is the
  exact page the Ask feature links, and what `--online` validates against. It
  has locale-aware paths (`/es`, `/de`, `/fr`) for the translated excerpts.
- **lawofone.info** — a community searchable archive; still useful for finding
  passages, but verify final wording on llresearch.org (our citation target).
- Reddit (r/lawofone) surfaces which questions are asked most often and which
  passages people cite — use it to _prioritize_, then verify wording on
  llresearch.org before adding anything.

## Validation: what `--online` checks

`scripts/validate-ra-citations.ts --online` fetches each referenced
llresearch.org page and confirms the reference **resolves** — the session page
loads and that question's anchor exists. A reference that doesn't resolve is an
error. It also *reports* how many excerpts are verbatim vs. our-words summaries
(informational only — summaries are expected and fine). It caches each session
page and skips gracefully when the network is unreachable (some CI/sandboxes
can't reach the site).

## How to add a passage

1. Pick a high-value reference for a concept in `concept-graph.json` (from a
   common Reddit question, for example).
2. Open `https://www.llresearch.org/channeling/ra-contact/{session}#{question}`,
   read the Q&A, and confirm it says what you think.
3. Add the `keyPassage`: the correct `reference`, an `excerpt` that is a short
   **summary in our own words** (all four locales) — or, for a small curated
   subset, a genuine short **verbatim** quote — plus a `context` in our words.
4. Run `npm run validate:citations` — it re-syncs
   `src/data/known-references.json` (used by the Ask citation renderer) and
   fails on structural problems.
5. Run `npm run validate:citations -- --online` and confirm the reference
   resolves.

## Common topics to prioritize (from research)

Frequently asked / frequently cited themes to deepen first: the harvest and
the 51%/95% polarity thresholds, catalyst and how it drives growth, the
densities (esp. 3rd→4th), the veil of forgetting, wanderers, service to
others vs. service to self, and the archetypal mind / tarot. Several already
have strong passages; add the canonical "favorite" quotes where missing.
