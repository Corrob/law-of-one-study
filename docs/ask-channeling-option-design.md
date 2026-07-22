# Ask "Include Conscious Channeling" Option — Design

Companion to `conscious-channeling-ask-feasibility.md`, which established the
strategy: **no RAG, no stored transcript text — a curated channeling-supplements
layer** (Option A) of hand-picked themes with our-words summaries and verified
links to llresearch.org. This document designs the actual feature: the user
option, request/prompt flow, citation format, data schema, validation, UI, and
rollout. It resolves the feasibility doc's open questions.

This is a design document; nothing here is built yet.

---

## 1. Summary of the solution

A user-controlled toggle on the Ask page — **"Include Confederation channeling
(Q'uo and friends)"** — that, when on, lets Ask weave in the later conscious
channeling *as clearly attributed, paraphrased perspective* alongside Ra,
citing dated transcripts with a new `{{QCITE:YYYY-MMDD}}` marker that renders
as a labeled link ("Q'uo · February 20, 2000") to the transcript on
llresearch.org.

Copyright posture is identical to the Ra pipeline, which is the whole point of
reusing it:

| Guarantee | Mechanism |
| --- | --- |
| No source text stored or served | Repo holds only **our-words theme summaries** (like `ask-supplements.json`); no transcript excerpts at all — stricter than the Ra pipeline, which stores short private excerpts |
| No verbatim output | Model never sees transcript text, so it *cannot* reproduce it; existing `NO_REPRODUCTION_RULES` extended to name the channeling |
| No hallucinated citations | `QCITE` whitelist file, validated against live llresearch.org URLs at curation time; unknown refs dropped at render, same as `CITE` |
| Traffic goes to the rights-holder | Every citation deep-links to L/L Research's own archive — the feature is an on-ramp to their site, not a substitute for it |
| Voices never blended | Prompt attribution rules + visually distinct citation style ("Q'uo · date" vs Ra's "6.14") |

**Permission status (July 2026): granted.** Gary of L/L Research confirmed in
writing that machine-generated summaries are acceptable provided they are (a)
clearly disclaimed as machine-generated interpretation with potential for
error or hallucination, and (b) properly linked to the source. Both are
already true of Ask (the rotating disclaimer in `messages/en/ask.json` and the
citation-link pipeline). The authoritative reference is the "Using Our
Material in AI Technologies" section of llresearch.org/copyright, which
additionally asks for positive orientation, **no mimicking of channeled
voices**, citations that link back to llresearch.org, and no systematic
translations — all satisfied by this design (the prompt attributes by name and
never speaks as Q'uo/Ra; the feature is English-only). What the policy does
NOT permit without further permission: storing/indexing/retrieving their text
(RAG, embeddings, vector stores) — "even excerpts." This design stores none.

## 2. The user-facing option

> **As implemented:** the option became a **source selector**, not an additive
> toggle — a segmented pill under the composer choosing "Ra Material" or
> "Conscious channeling (Q'uo)". The two libraries are never blended in one
> answer: channeling mode grounds ONLY in the channeling themes (no Ra
> citations are offered to the model, and the mode banner forbids
> {{CITE:...}}), while Ra mode is byte-identical to the pre-feature behavior.

- **Placement:** a segmented pill selector under the Ask composer, visible
  before and during a conversation, with per-option tooltips.
- **Default: Ra Material.** The channeling library is an invitation, not a
  change to existing behavior. Revisit after telemetry (see §9).
- **Persistence:** `localStorage` (same pattern as other Ask client prefs), so
  the choice sticks across visits. Mid-conversation flips apply from the next
  question; no need to restart the thread.
- **English-only:** the transcripts exist only in English, so the feature is
  too — the toggle renders only for the `en` locale, and the API ignores
  `includeChanneling` for other locales (schema accepts it; grounding skips
  it). This drops the four-locale summary/alias burden from curation entirely
  and avoids sending seekers to pages they can't read. If L/L ever publishes
  translations, localization is additive.
- Toggle strings still live in `messages/en/` per the i18n setup (other
  locales simply never show them).

Why a toggle rather than always-on: attribution is doctrinal in this community
(trance-channel Ra vs conscious channeling), some students deliberately study
Ra only, and a toggle gives us a clean A/B surface and a safe rollback.

## 3. Request flow

`AskRequestSchema` gains one field:

```ts
includeChanneling: z.boolean().optional().default(false),
```

`useAskStream` / `stream-client.ts` pass it through. That is the entire API
surface change.

## 4. Grounding pipeline

Mirror the supplements mechanism (`supplements.ts`) with a parallel module,
`src/lib/ask/channeling.ts`, reading `src/data/ask-channeling.json`:

- `identifyChanneling(text)` — English-only alias matcher (same compiled
  longest-first pattern as supplements, without the per-locale machinery),
  same message-then-recent-history fallback. Called only when
  `includeChanneling` is true **and** `locale === "en"`.
- `buildChannelingGrounding(matches, locale)` — a focused block:

```
CONFEDERATION CHANNELING TOPICS (later conscious channeling — our summaries; attribute to the named source and cite with the listed QCITE refs):
- [Q'uo] Meditation is presented less as technique than as consenting to silence … [refs: QCITE:2000-0220, QCITE:2009-0124]
```

`buildGrounding()` calls it **only when `includeChanneling` is true**, appends
the block to `focused`, and adds match ids/terms to `matchedConceptIds` /
`matchedTerms` (prefixed `chan:` so analytics and suggestions can tell them
apart). `excerpts` is untouched — there is no channeling source text to guard.

## 5. Prompt strategy — keep the cached prefix stable

The system prompt does **not** change with the toggle. Adding a per-toggle
variant would double the cached prefixes per locale for a block that is only
relevant when a theme actually matches. Instead:

- A short static paragraph is added to the **English** system prompt only
  (both toggle states) so the model knows the feature exists — the en cached
  prefix changes once and stays stable; other locales' prompts are untouched:

  > CONFEDERATION CHANNELING: Besides the Ra contact, L/L Research has published
  > decades of conscious channeling (Q'uo, Latwii, Hatonn). When a
  > CONFEDERATION CHANNELING TOPICS block appears in your grounding you may
  > draw on it; otherwise do not cite or characterize the conscious channeling.
  > Never blend the voices: Ra's teachings carry {{CITE:s.q}} markers; the
  > conscious channeling is attributed by name ("Q'uo suggests…") with
  > {{QCITE:date}} markers from the grounding only. If asked, note plainly that
  > the Ra contact was trance channeling and Q'uo/Latwii/Hatonn are conscious
  > channeling received by the same group.

- The per-query rules ride with the volatile user turn, only when the toggle is
  on **and** at least one theme matched: the grounding block itself (§4) plus
  one line appended to `CORE_REMINDER` (attribute by name, `QCITE` refs from
  the list only). When nothing matches, the request is byte-identical to
  today's.

Epistemic humility gets one added sentence: absence of a channeling topic from
grounding is not evidence Q'uo never discussed it — the archive holds 1,700+
transcripts and Ask carries only curated themes; point seekers to
llresearch.org's search and topic index for more.

## 6. Citations: the `QCITE` marker

**Reference format:** `YYYY-MMDD`, with an optional `_NN` suffix mirroring the
site's own same-day disambiguation (verified July 2026: same-day sessions use
underscore-numbered URLs like `/channeling/1974/0806_01` and `_02`; mostly a
1974–1990s phenomenon; note a `_02` can exist with no `_01` sibling, so never
synthesize suffixes). The URL is still not derived from the id by string math;
it comes from the whitelist entry's `path`, so whatever the live URL is, the
entry records it.

**Link granularity (verified):** transcript pages carry no heading/paragraph
anchors — page-level links are the finest stable granularity (footnote
anchors `#fn:N` exist where endnotes do, and browser text fragments
`#:~:text=` work but are best-effort; neither is worth designing around).
This confirms the label-only `QCITE` rendering below. For "explore more on
this theme," llresearch.org's site search is deep-linkable as
`https://www.llresearch.org/search?q=<term>` — a good target for Phase 2
"Explore further" cards.

**Whitelist:** `src/data/known-channeling-references.json`, a map keyed by
reference id:

```json
{
  "2000-0220": { "source": "Q'uo", "date": "2000-02-20", "path": "/channeling/2000/0220" }
}
```

Kept separate from `known-references.json` (which stays a plain Ra array) and,
like it, small and client-safe.

**Rendering** (`citations.ts`):

- New pattern `\{\{QCITE:\s*(\d{4}-\d{4}[a-z]?)\s*\}\}`; the partial-trailing-
  marker regex generalizes to cover `{{Q…` prefixes so half-streamed markers
  stay hidden.
- Known refs render as `[Q'uo · Feb 20, 2000](https://www.llresearch.org/channeling/2000/0220)`
  — entity + formatted date as the label. Unknown refs are dropped, exactly
  like unknown `CITE`s.
- The labeled-date style is itself the visual differentiator from Ra's bare
  `6.14` links; no extra styling is strictly required, though `AskAnswer` may
  later add a subtle icon. `extractCitedReferences` and `export-markdown.ts`
  learn the new marker so copied/exported answers keep working.

## 7. Data schema and validation

`src/data/ask-channeling.json`:

```json
{
  "note": "Curated Confederation-channeling themes for Ask. Our-words summaries only — never transcript text. References must exist in known-channeling-references.json and resolve on llresearch.org.",
  "themes": [
    {
      "id": "meditation-silence",
      "source": "Q'uo",
      "aliases": ["silence", "sitting in meditation", "..."],
      "summary": "Q'uo frames meditation less as a technique than as consenting to silence — the daily act of allowing the infinite to speak in its own language...",
      "references": ["2000-0220", "2009-0124"]
    }
  ]
}
```

Zod-validated in `channeling.ts` (same shape discipline as `SupplementSchema`);
each `references` entry must exist in the known-channeling-references file —
enforced by a Jest test so a typo fails CI, not production.

`scripts/validate-channeling-citations.ts` (sibling of
`validate-ra-citations.ts`): for every whitelist entry, fetch the llresearch.org
page, confirm it resolves and the page date/entity matches the entry. Run at
curation time; regenerates nothing (the whitelist is hand-maintained, it's
small).

**Curation workflow** follows §5 of the feasibility doc with one correction:
the A–Z topic "super index" that doc leaned on **has not actually launched**
(the 2022 announcement described it as a future volunteer project; no launch
since). The working sources instead, in order of authority:

1. **Light/Lines newsletter** (llresearch.org/newsletters/light-lines) — L/L's
   own official "best of the channeling," one full featured session per issue
   since 1982; recent issues verified (e.g. Q'uo Apr 25 2026 "Boundaries,
   Healing, and the Heart").
2. **Daily Q'uote** — the long-running Bring4th feature (volunteer-curated,
   draws exclusively from Q'uo) and its Discourse megathread with like counts.
3. **Bring4th quote threads** ("Most amazing thing Q'uo has said," "Q'uotes
   Discussions") — effectively pre-voted community favorites; see §11.
4. **llresearch.org site search** (`/search?q=…`) for locating candidate
   transcripts per theme.

Read the top transcripts; write the our-words summary (English only — see §2). LLM-assisted
drafting offline is fine — reading transcripts to write a summary is exactly
what a human curator does — but no transcript text is ever committed, and a
human reviews every entry before merge. Launch scope: the community-validated
consensus list in §11 (~15 themes, each with 1–3 verified references), which
supersedes the feasibility doc's provisional Tier 1.

## 8. What deliberately does not change

- `reproduction.ts` — nothing to check; no channeling source text exists
  server-side.
- The Explore graph, Study Paths, Daily Quote — channeling themes are
  Ask-only (hidden-supplement style). Extending the graph is the feasibility
  doc's Option B, a separate later decision.
- The Ra citation pipeline — `known-references.json`, `quote-utils.ts`, and the
  `CITE` regex are untouched; channeling is additive.
- Rate limiting, SSE protocol, model/config.

## 9. Analytics, eval, rollout

- **Telemetry:** send `includeChanneling` and matched `chan:` ids in the
  existing `meta`/LLM-analytics metadata; add `ask_channeling_no_match` (toggle
  on, zero themes matched) to steer alias/theme curation, mirroring
  `ask_no_focused_grounding`.
- **Eval:** add channeling-flavored queries (grief, meditation practice,
  faith/doubt, wanderer loneliness) to the eval set, run both toggle states;
  assert (a) toggle-off answers contain no `QCITE`, (b) toggle-on answers
  attribute by name and cite only whitelisted refs, (c) voices are not blended.
- **Tests:** unit tests for `channeling.ts` matching and grounding block,
  `citations.ts` QCITE rendering/partial-marker cases, schema round-trip;
  one E2E addition to an existing Ask journey toggling the option on.
- **Rollout:** Phase 1 — ship Tier 1 themes, toggle default-off, watch
  reproduction-adjacent telemetry and `ask_channeling_no_match`. Phase 2 —
  Tier 2 themes, richer "Explore further" cards linking matched transcripts,
  reconsider the default. L/L Research permission is already in hand (see §1);
  if scope ever grows to rendering verbatim quotes on-site or any form of
  stored/indexed source text, go back to them first — the copyright policy
  explicitly requires written permission for that.

## 10. Why this is the best available option (decision record)

- **RAG / embeddings over transcripts** — rejected: reverses the project's
  no-RAG decision, requires storing ~5–7M words of L/L's copyrighted text, and
  puts verbatim source in front of the model (the one thing the architecture
  is built to prevent).
- **Live fetch of llresearch.org at question time** — rejected: it's RAG with
  extra latency and fragility, and still serves copyrighted text to the model.
- **Rely on the model's training-data knowledge of Q'uo** — rejected as the
  mechanism: no citation whitelist can make its references real, and
  hallucinated "Q'uo quotes" are worse than none. (The prompt explicitly forbids
  citing channeling outside the grounding for this reason.)
- **Ask L/L Research for a license first** — worth doing in parallel (§9), but
  the design must not depend on it; this design is safe without it.
- **Curated supplements layer (this design)** — matches the proven Ra pattern,
  costs mainly editorial effort we control, keeps every copyright guarantee,
  and — because Q'uo revisits the same pastoral themes hundreds of times — a
  dozen well-chosen themes cover a large share of the real questions Ask
  receives.

## 11. Community validation of themes and flagship sessions (July 2026)

Web research across three sources: **Bring4th** (Daily Q'uote megathread with
like counts, "Q'uotes Discussions," the "Most amazing thing Q'uo has said"
archive), **r/lawofone** (~773 archived posts with scores, via the pullpush
Reddit archive — live Reddit blocks fetches), and **llresearch.org's own
Light/Lines curation**. The two communities skew differently and the launch
list should cover both registers:

- **Bring4th** favors the contemplative/devotional Q'uo canon (silence, open
  heart, acceptance, the beautiful illusion) and is almost exclusively
  Q'uo-centric.
- **Reddit** favors practical and contemporary material — the 4D transition,
  the ethics of service, catalyst, modern-life topics — and *does* hold a real
  Hatonn/Latwii canon (1970s–80s sessions), so launch scope should be
  Q'uo-first but include the handful of consensus Latwii/Hatonn entries below.

Consensus theme ranking (strength = combined cross-source evidence), with
flagship reference candidates for the whitelist:

| Theme | Flagship reference(s) | Evidence |
| --- | --- | --- |
| Wanderers: mission, risk, loneliness, "fully incarnate" | Q'uo 2007-07-31; Q'uo 2006-02-06 ("natives of Earth now"); Q'uo 2018-03-03 | Top-tier on BOTH sources: most beloved Bring4th passage (30+ thanks); 103-point Reddit post |
| Fourth-density transition / living "these times" with hope | Q'uo 2009-02-08; Hatonn 1980-05-25 (parable of freedom) | Reddit's single most recurrent theme (129-, 94-, 88-point posts) |
| Ethics & limits of service: "help only those who ask," not here to save the world | Latwii 1980-05-18; Q'uo 2005-09-18 | Reddit near-consensus favorites (86, 54); distinct from generic "service" |
| Working with catalyst: the "bitter cup," gratitude for hard things | Q'uo "bitter cup" (date TBD — locate via site search); Hatonn on repeated catalyst | 78-point Reddit post calls it "one of the most profound messages"; recurring appreciation threads |
| Meditation & silence as the core practice | Q'uo 2000-02-20 ("with you in the silence"); Hatonn 1974-04-15 | Signature on both: Daily Q'uote canon + 91/97-point Reddit posts |
| Open heart / love over deeds; self-love first | Q'uo 1997-01-19; Q'uo 2010-10-02 | Bring4th staple |
| Love before wisdom | Q'uo 2001-09-16 (post-9/11) | "Without love, wisdom is utterly devoid of content" (47) |
| Angels and unseen help | Q'uo 2011-02-12 | Highest-scoring Q'uo quote post on Reddit (120) |
| Acceptance of joy and sorrow as one | 1986-04-20 (Ra via the L/L circle — conscious session, attribute carefully); Latwii 1983-08-21; Q'uo 2010-11-13 | Bring4th favorites; Latwii has its own thread |
| Not-knowing, humility, the purpose of the veil | Q'uo 2006-08-25; Q'uo 2010-02-13 | 97/49-point Reddit posts; stronger community pull than a generic "faith/doubt" framing |
| The illusion as a beautiful dream of love | Q'uo 1992-09-13; 1997-02-09; 1993-05-30 | Multiple Bring4th favorites lists |
| Will and pure desire | Q'uo 2015-11-07 | Highest-liked Daily Q'uote megathread opener |
| Self-forgiveness / shadow work / the pilgrim's "divine discomfort" | Q'uo 2009-11-21; 2010-10-16; 1990-04-01 | Enthusiastic on both sources |
| Time as illusion / all is now | Latwii 1979 (cell metaphor); Q'uo 1996-09-15 | 99- and 41-point Reddit posts |
| Sacredness of ordinary daily life | Q'uo 2007-09-22; 2008-11-08 | Recurring Daily Q'uote theme |
| Relationships/mates as mirror catalyst | Q'uo 1986-11-16 | Extended Bring4th discussion |
| Synchronicity / hall of mirrors; gratitude as tuning | Q'uo 2010-09-11; 2004-11-28 | Daily Q'uote favorites; high-scoring Q'uotes Discussions post |

Cross-source adjustments to the feasibility doc's Tier 1: **add** ethics/limits
of service (arguably the most-quoted conscious-channeling lesson on Reddit),
not-knowing/veil humility, angels/unseen help, will/desire, self-forgiveness,
and illusion-as-beautiful-dream; **keep** grief and anxiety/peace even though
neither has one canonical session (Reddit answers grief posts with
catalyst/bitter-cup material — the grief theme should cite those plus the
Aaron/Q'uo Dialogues, L/L's dedicated grief/healing sub-collection).

Notable Tier-2 candidates the research surfaced: **modern-life topics** (the
community prizes Q'uo precisely for addressing what Ra couldn't — AI and
discernment, ADD as fourth-density wiring 2008-09-27, sexuality/sexual energy
— the most-requested underserved topic on both sources); **animals and second
density** (Q'uo on cats, 96 points; dolphins, 67 — beloved "delight" material);
and **discernment about channeling itself** (the Confederation's own tuning/
challenging teaching — healthy meta-grounding for an AI guide, and the top
comment in Reddit's sources thread urges exactly this discernment).

Caveats: session themes are researchers' paraphrases of forum posts — verify
every date/entity against the transcript during curation (e.g. 1986-04-20 is a
post-contact conscious session quoting Ra through the circle, NOT the trance
material — the summary's attribution must say so). Reddit scores are archival
snapshots skewed toward 2020–2025; Bring4th like-counts are small-N. Neither
changes the design — only the curation order.
