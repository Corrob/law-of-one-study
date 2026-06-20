# "The Wanderer's Return" — Suno Generation Brief

Operational, copy-paste guide for generating the 7-track album. **Lyrics are canonical in `docs/album-lyrics.md`** — paste each song's lyric block (with its `[Section]` tags) into Suno's Lyrics field; paste the **Style prompt** below into the Style field. The per-song production notes here expand on (and supersede, for generation purposes) the shorter prompts in `album-lyrics.md`.

---

## How to read this

Each song below has four parts:
- **Style prompt** — paste into Suno's Style field.
- **Structure** — the section/dynamic shape (Suno honors bracketed tags in the lyrics; these mirror the tags already in `album-lyrics.md`).
- **The moment** — the one emotional beat that take *must* nail. If a generation misses it, regenerate.
- **Production notes** — reprises, dynamics, and post work.

---

## Album-wide settings (apply to every track)

- **One voice, all seven tracks.** A warm, expressive **male tenor**, intimate by default, powerful only at the peaks. Generate Song 2 or 3 first, then **save that vocal as a Suno Persona and reuse it** on every other track so the album sounds like one singer, not seven.
- **Constant palette, shifting density.** Acoustic guitar + one world instrument (sitar / harmonium / tabla) + tenor + tasteful electronic/orchestral color. The palette *thickens* from Song 1 to the Song 6 peak, then *dissolves* by Song 7.
- **Energy/loudness arc (master to preserve it):** 1 quietest → 2–3 rising → 4 warm lift → **5 cool dip** → **6 PEAK** → 7 settle to silence. Don't let Suno's auto-loudness flatten this; it's the album's emotional shape.
- **Key/tempo continuity.** Aim for compatible keys and tempo relationships so the **loop seam (7→1)** and the **reprises (2→6, 3→6)** sit naturally. If unsure, keep tracks within a couple of related keys.
- **Length.** Suno caps a single generation (~4 min). Songs 1, 6, 7 are long/dynamic — use **extend/continue** or stitch sections in a DAW.

---

## Generation order & workflow

1. **Song 2 first.** It introduces the album's recurring **melodic motif**. Generate, pick the take with the strongest, most singable hook, **save the Persona**, and **bounce the motif as a clean stem**.
2. **Song 3 second.** Weave a faint echo of Song 2's motif under the bridge (breadcrumb), and **bounce the bridge ("seed") melody as a stem** — it returns under Song 6.
3. **Songs 1, 4, 5, 7** in any order, using the Persona.
4. **Song 6 last.** Both reprises converge here (see its notes). Layer the Song 2 motif (now triumphant) and the Song 3 seed-melody stem under the reveal.
5. **DAW pass:** assemble, master to the energy arc above, and build the **seamless 7→1 loop** (crossfade or a dedicated seam clip).

### Honest note on the reprises (read before step 4)
Suno generates each song **independently** and will not, on its own, reuse a melody across separate generations. The two melodic reprises are achieved by:
- **Best:** layering the bounced **stems** (Song 2 motif, Song 3 seed melody) under Song 6 in a DAW; or
- **Approximate:** Suno's **audio-upload / cover / "add instrumental"** features to seed Song 6 with the prior melody; or
- **Fallback:** prompt Song 6 to "quote an earlier fragile folk motif" and hand-pick a take that happens to echo it.
The reviewers identified these reprises as the difference between *"I noticed the callback"* and *"involuntary chills."* Budget a light DAW pass for them — it's the highest-value production work on the record.

---

## Per-song briefs

### Song 1 — "First Breath" (1st density) · ~60 BPM, 4/4

**Style prompt:**
> *Ambient devotional meditation, 60 BPM. Opens from near-silence — low tanpura drone, field recordings of wind and flowing water, sparse finger-picked nylon-string guitar. Wordless vocal harmonics with faint pitched vocal-chop textures surfacing like first thoughts. Hushed, almost-spoken male tenor. Very slow patient build that never settles into a groove. Primordial, weightless, reverent.*

**Structure:** `[Intro` near-silence/drone/water] → `[Verse 1` hushed tenor, sparse guitar] → `[Verse 2` add wordless harmonics] → `[Outro` dissolve, leave hanging].

**The moment:** the first dim spark of awareness — keep it *weightless and pre-emotional*. Wonder, not feeling.

**Production notes:** This is the **loop entry point.** Its near-silent opening must match Song 7's near-silent close so the album loops seamlessly. Render the first ~10 seconds soft enough to crossfade with Song 7's tail.

---

### Song 2 — "The Reaching" (2nd density) · ~72 BPM, 4/4 — **GENERATE FIRST**

**Style prompt:**
> *Organic world-folk, 72 BPM. Finger-picked acoustic guitar, tabla and frame drum, harmonium drone, layered wordless vocal harmonies like a forest of voices. A fragile, yearning melodic hook introduced on a solo voice/woodwind and carried by the chorus vocal. Warm male tenor building from gentle to full-bodied. Earthy, alive, aching, reverent.*

**Structure:** `[Intro` guitar + distant voices] → `[Verse 1]` → `[Pre-Chorus` the motif, fragile] → `[Chorus` motif blooms, harmonies] → `[Outro` motif fades].

**The moment:** the **yearning hook** ("reaching toward a light I cannot name" / the moth-to-flame image). This melody is the **seed that returns triumphant in Song 6** — make it simple, singable, unforgettable.

**Production notes:** **Save the Persona** and **bounce the motif stem** here. Everything downstream reuses both.

---

### Song 3 — "Behind the Veil" (3rd density) · ~88 BPM, 4/4

**Style prompt:**
> *Cinematic folk-rock, 88 BPM. Acoustic guitar and piano foundation, soft kick and bass entering, building to a full-band emotional release at the chorus. Clear expressive male tenor — intimate in the verses, soaring in the chorus — with layered harmonies. Embryonic electronic textures hint at what's ahead. Searching, human; the album's most accessible track.*

**Structure:** `[Intro` guitar+piano] → `[Verse 1` intimate, lost] → `[Chorus` full band, the choice] → `[Bridge` THE SEED — pull back to hushed near-acoustic, a distinct melody] → `[Outro` build, "I choose the light"].

**The moment:** the **bridge (the seed)** — pull the arrangement *way down* so the "voice beneath the dark / the hand that pulls" lands as a distinct, memorable melody. It's planted to be recognized in Song 6, so it must stand out from the chorus around it.

**Production notes:** (1) Weave a faint **Song 2 motif breadcrumb** under the bridge. (2) **Bounce the bridge melody as a stem** — it returns under Song 6's reveal.

---

### Song 4 — "Known" (4th density) · ~104 BPM, 4/4

**Style prompt:**
> *Warm expansive devotional folk-gospel, 104 BPM. Acoustic guitar with orchestral pads and strings. DENSE self-harmonized vocal stacking — one tenor multiplied into a full choir, the social memory complex made audible — hitting hardest on "we are many voices singing." Intimate verses opening into a euphoric, light-filled chorus with a restrained uplifting electronic lift. Radiant, communal, joyful but never saccharine.*

**Structure:** `[Intro` choral hum] → `[Verse 1` intimate] → `[Chorus` choir-of-one explosion, lands on the title "known"] → `[Verse 2]` → `[Outro` choir, "fully known"].

**The moment:** the chorus — the lonely "I" dissolving into "we." **Stack the vocals into a congregation** right as the lyric says it ("many voices … a single rising tone"). Production and meaning fire together.

**Production notes:** The **"choir from one voice"** is the signature of this track — push the stacks hard. Verse 2 quietly plants the Song 5 setup ("love is only half the light; the colder half is what I seek") — keep it audible but don't oversell it.

---

### Song 5 — "Cold Light" (5th density) · ~100 BPM, **7/4**

**Style prompt:**
> *Cerebral art-folk in 7/4 time, ~100 BPM. Cool geometric crystalline synth tones, muted acoustic guitar and cello, a precise and slightly distant male vocal. Beautiful but unsettling. A brief dissonance that resolves imperfectly. Sparse, architectural, glassy. Ends on an unresolved open question — a held, unfinished chord.*

**Structure:** `[Intro` 7/4 crystalline synth] → `[Verse 1` precise, cold] → `[Chorus` austere] → `[Verse 2]` → `[Outro` unresolved, the ache].

**The moment:** "I can hold the shape of everything / and warm not even one" — the album's best line. Deliver it **cold and clear**, no vocal warmth.

**Production notes:** Deliberately the **coolest, most withdrawn track** — the dip before the peak. Pull back the reverb-warmth and the choir; let it feel a little lonely and architectural. The unresolved ending is intentional — do not button it up.

---

### Song 6 — "A Million Years Ahead" (6th density) · ~124 BPM, 4/4 — **GENERATE LAST** · the peak

**Style prompt:**
> *Epic devotional folk-electronic anthem, 124 BPM. Acoustic guitar and sitar foundation, driving electronic percussion, a massive melodic synth build. Intimate, conversational verses EXPLODING into a euphoric stacked gang-vocal chorus — a choir from one voice. Full emotional release, the album's peak; triumphant yet tender; sacred-geometry production.*

**Structure:** `[Intro` Song 2 motif returns, fuller] → `[Verse 1]` → `[Verse 2` THE REVEAL — Song 3 seed melody underneath] → `[Chorus` euphoric drop, full choir] → `[Bridge` motif fully triumphant] → `[Outro` "home to me"].

**The moment:** **THE REVEAL** (verse 2 → chorus): "I sent the pull / I lit the spark you couldn't see … the voice you couldn't place was mine, the hand you couldn't see." This is the cry moment. Keep verse 2 *intimate and restrained* so the chorus drop hits like a sunrise.

**Production notes — the most important task on the album:** **two reprises converge here.** (1) Song 2's **motif** returns, now fully orchestrated and triumphant (intro + bridge). (2) Song 3's **seed melody** plays *underneath* the verse-2 reveal vocal — the sonic fingerprint that makes the connection land on first listen. Layer both bounced stems. Do not ship Song 6 without the Song 3 seed melody audible under the reveal.

---

### Song 7 — "Gateway" (7th density) · ~72 BPM, 4/4 — the loop close

**Style prompt:**
> *Vast oceanic devotional ambient-orchestral, ~72 BPM. Opens full and serene, carrying the previous track's warmth into something immense and still — shimmering pads, a choir of stacked voices suggesting omniscient bliss, a single radiant male tenor. Gathers intention through the bridge and re-ignites with hope (NOT a fade-out), then in the final minute contracts to a single sustained tone and breath — pitched vocal chops folding into one held note — resolving into near-silence. Cosmic, blissful, the joyful choice to begin again.*

**Structure:** `[Intro` full ensemble from Song 6] → `[Verse 1` human handhold, intimate] → `[Verse 2` cosmic arrival] → `[Verse 3` the stirring] → `[Bridge` the choice] → `[Outro` glad dive → near-silence].

**The moment:** the **chosen dive** — "not pushed, but diving, glad and bright." It must read as a *glad, deliberate choice*, not exhaustion. The energy stays *up* through the choice, then contracts to a seed.

**Production notes:** This is the **loop close.** Its final sustained near-silent tone must match Song 1's near-silent opening for a **gapless loop** — render a crossfade or a dedicated `song-07-into-song-01` seam clip. The opening handhold verse should be the most *human/intimate* vocal moment on the track before it opens to the cosmic.

---

## One-screen cheat sheet

| # | Title | BPM | Generate | Must-nail moment | Reprise / seam |
|---|-------|-----|----------|------------------|----------------|
| 2 | The Reaching | 72 | **1st** | the yearning motif | source the motif stem + Persona |
| 3 | Behind the Veil | 88 | 2nd | the hushed bridge (seed) | Song 2 breadcrumb; bounce seed stem |
| 1 | First Breath | 60 | any | weightless first spark | loop entry (match S7 tail) |
| 4 | Known | 104 | any | choir-of-one chorus | — |
| 5 | Cold Light | 100 (7/4) | any | "warm not even one" | coolest track (pre-peak dip) |
| 7 | Gateway | 72 | any | the glad chosen dive | loop close (match S1 open) |
| 6 | A Million Years Ahead | 124 | **last** | THE REVEAL drop | **layer S2 motif + S3 seed melody** |
