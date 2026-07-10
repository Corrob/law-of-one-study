# Ask feature — concept-graph enrichment notes

The Ask feature grounds the LLM in `src/data/concept-graph.json`. This doc tracks
enrichment status and the plan for adding more source-validated passages.

## Current coverage (validated)

Run `npm run validate:citations`:

- **128 concepts**, every one with at least one key passage (0 gaps).
- **145 key passages**, **107 unique** `session.question` references.
- **0 thin** English definitions; all four locales populated.
- All references well-formed and within the real session range (1–106).

The graph is already broad. The remaining enrichment is _depth_: adding more of
the most-cited passages for the highest-traffic topics.

## Source of truth for new quotes

- **lawofone.info** — the only site L/L Research authorized to host full session
  text. Every new `keyPassage.reference` and `excerpt` must be verified here.
- **lawofone.info/favorite-quotes.php** — a curated list of the community's
  favorite passages; an excellent shortlist to draw enrichment from.
- Reddit (r/lawofone) surfaces which questions are asked most often and which
  passages people cite — use it to _prioritize_, then verify wording on
  lawofone.info before adding anything.

## ⚠️ Network constraint in CI/sandbox

lawofone.info blocks automated clients (Cloudflare WAF → HTTP 403 / reset), so
excerpt wording **cannot be verified from the build sandbox**. To keep every
citation accurate, do NOT add excerpts you cannot verify against the source.

`scripts/validate-ra-citations.ts --online` performs a best-effort live
reachability check with a browser user-agent and skips gracefully when blocked.
Run it (and do the manual excerpt verification) from a network/IP that can reach
lawofone.info.

## How to add a validated passage

1. Pick a high-value reference (from favorite-quotes.php or a common Reddit
   question) for a concept in `concept-graph.json`.
2. Open `https://www.lawofone.info/s/{session}#{question}` and copy the short
   excerpt (1–3 sentences) exactly.
3. Add a `keyPassage` to the concept: `reference`, `excerpt` (all four locales —
   match the site's translations where available, else translate faithfully),
   and a `context` written in our own words.
4. Run `npm run validate:citations` — it re-syncs `src/data/known-references.json`
   (which the Ask citation renderer uses) and fails on structural problems.
5. Run `npm run validate:citations -- --online` from a permitted network to
   confirm the reference resolves.

## Common topics to prioritize (from research)

Frequently asked / frequently cited themes to deepen first: the harvest and
the 51%/95% polarity thresholds, catalyst and how it drives growth, the
densities (esp. 3rd→4th), the veil of forgetting, wanderers, service to
others vs. service to self, and the archetypal mind / tarot. Several already
have strong passages; add the canonical "favorite" quotes where missing.
