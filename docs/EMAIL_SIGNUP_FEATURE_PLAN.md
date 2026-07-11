# Email Signup & Daily Ra Quote Feature Plan

## Overview

A lightweight email subscription feature that lets seekers receive a Ra Material quote
in their inbox on a regular cadence. Visitors enter their email in a signup form, get
added to a [MailerLite](https://www.mailerlite.com) list, and receive a beautifully
formatted email built from one of our existing daily quotes.

The feature is **no-auth** (consistent with all Phase 1 features), privacy-respecting,
and — critically — carries full attribution and credit to **L/L Research**, the
copyright holders of the Ra Material, while making clear that lawofone.study is an
independent, community-run project not affiliated with them.

This document is a **design specification only**. No signup form, API route, cron job,
or MailerLite integration has been built yet.

---

## Cadence: Daily or Weekly? → **Start Weekly**

**Recommendation: launch with a weekly email, with the architecture designed so daily
can be offered later (ideally as a subscriber-selectable option).**

The content pipeline itself is cadence-agnostic — we already have 365+ deterministic
daily quotes in `src/data/daily-quotes.ts`, so producing daily content costs us nothing
editorially. The decision is therefore about **the recipient experience and sender
reputation**, not workload.

| Factor | Daily | Weekly |
| --- | --- | --- |
| **Sender reputation (new list)** | High risk — a brand-new sending domain blasting daily invites spam-folder placement and volume-based throttling | Lower risk — gentler ramp lets the domain warm up |
| **Unsubscribe / fatigue risk** | Higher — daily devotional email is a big commitment; easy to feel "behind" | Lower — a weekly rhythm is a well-established newsletter norm |
| **Perceived value per send** | Lower — easy to skim past | Higher — feels like a considered moment |
| **Inbox deliverability** | Daily sends to non-openers erode reputation fast | Weekly gives engagement signals time to accumulate |
| **Alignment with the source** | — | Ra's teaching rewards contemplation over consumption; a weekly cadence models "sit with it" |

**Plan:**

1. **Phase 1 — Weekly.** One quote every week (suggested: **Sunday morning**, a natural
   reflective moment). Simplest to operate and safest for deliverability.
2. **Phase 2 — Let subscribers choose.** Offer **Daily** and **Weekly** as MailerLite
   groups selected at signup. Subscribers who want daily wisdom opt in explicitly, which
   keeps engagement high and protects reputation. This is the recommended long-term
   state.

The cron and template design below support both cadences with no structural change — a
weekly send is simply a daily send that runs once every seven days.

---

## Where to Ask for Signups

We want the ask to feel like a natural extension of the daily-quote experience, never
an interruption. Ranked by priority:

### 1. Below the Daily Quote on the home page (Dashboard) — **primary**

The strongest placement. A visitor who just read today's quote has demonstrated exactly
the intent this feature serves. Add a compact, dismissible signup card directly beneath
the quote card in `src/components/Dashboard.tsx`.

- Copy: *"Receive a quote from the Ra Material in your inbox each week."*
- Single email input + "Subscribe" button (Ra Gold primary button per Style Guide).
- Collapses to a one-line "You're subscribed 🙏" confirmation on success.
- Dismissible; remember dismissal in `localStorage` (pattern already used:
  `lo1-notice-dismissed`, `lo1-dashboard-seen`). Suggested key: `lo1-email-signup-dismissed`.

### 2. Footer / site-wide — **secondary**

A slim signup field in a global footer (or the existing navigation surface) so the ask
is reachable from every page without being pushy. Lower conversion but always available.

### 3. About page — **tertiary**

`src/app/[locale]/about/AboutSections.tsx` already explains the project and credits L/L
Research. A signup block here reaches the most invested readers. Natural fit next to the
existing L/L Research and donate sections.

### 4. Post-completion moments — **later / optional**

After finishing a Study Path lesson or a meditation, a gentle "Keep the practice going —
get a weekly quote" prompt. Higher intent, but adds surface area; defer to a later phase.

**Anti-patterns to avoid:** no modal/popup overlays, no exit-intent interstitials, no
email gate on any content. Everything on this site is free and open; the signup must
honor that.

---

## Architecture

```
┌─────────────────┐     POST /api/subscribe      ┌──────────────────────┐
│  Signup form     │ ───────────────────────────▶ │  Next.js Route Handler│
│ (Dashboard/Footer)│    { email, locale, group }  │  (server, App Router) │
└─────────────────┘                               └──────────┬───────────┘
                                                              │ MailerLite API
                                                              │ (server-side key)
                                                              ▼
                                                   ┌──────────────────────┐
                                                   │      MailerLite        │
                                                   │  Subscribers + Groups  │
                                                   └──────────┬───────────┘
                                                              ▲
        Vercel Cron (daily/weekly)                            │ create + schedule
        ┌──────────────────────────┐   builds email HTML     │ campaign
        │ GET /api/cron/quote-email │ ───────────────────────▶┘
        │  (protected by CRON_SECRET)│   from daily-quotes.ts
        └──────────────────────────┘
```

Two server surfaces, both new App Router Route Handlers (the project currently has **no**
`src/app/api` directory — this introduces the first one):

1. **`POST /api/subscribe`** — accepts a signup, validates it, and creates the subscriber
   in MailerLite.
2. **`GET /api/cron/quote-email`** — invoked on schedule by Vercel Cron; selects the
   quote, renders the email, and sends the campaign via MailerLite.

Both keep the MailerLite API key strictly server-side. The client never talks to
MailerLite directly.

---

## Component 1: Signup Flow

### Client: `EmailSignup` component

New component `src/components/EmailSignup.tsx` (keep under 150 lines per architecture
guidelines; extract a `useEmailSubscribe` hook into `src/hooks/` if it grows).

- Controlled email input, client-side format check for fast feedback.
- States: `idle` → `submitting` → `success` | `error`.
- A honeypot field (hidden input bots fill) to deter spam without a CAPTCHA.
- `cursor-pointer` on the submit button (per CLAUDE.md style rule).
- Fully localized — strings added to `messages/{en,es,de,fr}/` under an `emailSignup` key.
- Fire a PostHog event on success (`email_signup_completed`) and on view
  (`email_signup_viewed`) for conversion tracking.

### Server: `POST /api/subscribe`

`src/app/api/subscribe/route.ts`

1. Parse and validate the body with a **Zod schema** (`src/lib/schemas/`):
   ```ts
   const SubscribeSchema = z.object({
     email: z.string().email(),
     locale: z.enum(["en", "es", "de", "fr"]).default("en"),
     cadence: z.enum(["weekly", "daily"]).default("weekly"), // Phase 2
     website: z.string().max(0).optional(), // honeypot: must be empty
   });
   ```
2. Reject if the honeypot is filled.
3. Basic rate limiting by IP (in-memory token bucket is fine to start; note the
   limitation under a serverless model and revisit if abuse appears).
4. Call MailerLite **Create/Upsert Subscriber**
   (`POST https://connect.mailerlite.com/api/subscribers`) with the email, assigned
   **group** (locale and/or cadence), and any custom fields (e.g. `locale`).
5. Return a normalized `{ status: "ok" }` / `{ status: "error", message }` — never leak
   MailerLite internals or whether the email already existed (avoids enumeration).

### Double opt-in (recommended)

Enable **double opt-in** in MailerLite. The subscriber receives a confirmation email
before being added to the active sending list. This protects deliverability, keeps the
list clean, and is the right consent posture for a spiritual-content list. The confirmation
email should also carry L/L Research credit (see template section).

---

## Component 2: Cron Job (Scheduled Send)

### Scheduling: Vercel Cron

The project is hosted on Vercel, so use **Vercel Cron Jobs**. Add to `vercel.json`:

```json
{
  "crons": [
    { "path": "/api/cron/quote-email", "schedule": "0 13 * * 0" }
  ]
}
```

`0 13 * * 0` = 13:00 UTC every Sunday (≈ Sunday morning in the Americas; adjust after
picking a target audience timezone). For a future daily cadence, add a second entry
(`0 13 * * *`) targeting the daily group.

> Note: Vercel Cron schedules are evaluated in **UTC**. Pick the hour deliberately with
> the primary audience in mind, and document the choice.

### Route: `GET /api/cron/quote-email`

`src/app/api/cron/quote-email/route.ts`

1. **Authorize.** Verify the request carries the Vercel-provided
   `Authorization: Bearer $CRON_SECRET` header; reject anything else with `401`. This
   prevents anyone from triggering sends.
2. **Select the quote.** Reuse existing logic in `src/lib/daily-quote.ts`
   (`getRawQuoteForDay` / `getDailyQuote`) so the emailed quote matches the site's
   deterministic day-of-year selection. The email quote-of-the-week can simply be *that
   day's* quote — no new content system needed.
3. **Render the email HTML** (see template section) — one render per locale group so
   each subscriber gets their language, with the source-material link localized via the
   existing `getRaMaterialUrlFromReference`.
4. **Send via MailerLite.** Create a campaign and schedule/deliver it to the target
   group(s):
   - `POST /api/campaigns` (type `regular`, subject, from name/email, HTML body)
   - `POST /api/campaigns/{id}/schedule` with `delivery: instant`
   - One campaign per locale group so subject line and content are localized.
5. **Idempotency.** Guard against double-sends (e.g. a retry firing the cron twice):
   include the day-of-year in the campaign name and skip if a campaign for that key
   already exists, or record the last-sent day in a small persisted value.
6. Return a summary `{ sent: n, locales: [...] }` and log failures for observability.

### Alternative considered: MailerLite native automation

MailerLite can send on its own schedule via Automations/RSS. We deliberately drive it
from our own cron instead, because **the quote selection lives in our codebase** and must
stay in sync with the on-site daily quote. Generating the HTML ourselves keeps a single
source of truth (`daily-quotes.ts`) and full control over the template.

---

## Component 3: Email Template

A single responsive, email-client-safe HTML template (inline styles, table-based layout,
max width ~600px, dark-text-on-light for maximum inbox compatibility). It embodies the
cosmic/mystical brand from `STYLE_GUIDE.md` without relying on external CSS.

### Layout (top to bottom)

1. **Header band** — Cosmic Indigo (`#1a1f4e`) background, "Law of One Study" wordmark in
   a serif face (Cormorant Garamond with Georgia/serif fallback — custom fonts don't load
   reliably in email, so fall back gracefully), Ra Gold (`#d4a853`) accent rule.
2. **Greeting line** — short, warm, localized (e.g. *"A quote to sit with this week:"*).
3. **The quote** — the star of the email. Large Cormorant-Garamond-italic-styled text
   (serif fallback), generous padding, subtle left border in Ra Gold to echo the on-site
   quote card. Below it, the citation (e.g. *"— Ra, 1.7"*) linking to the passage on
   **lawofone.info** (locale-aware).
4. **Two clear links:**
   - **Read more on lawofone.study** → the home/explore experience (with `?utm_source=email`).
   - **Read the full session on lawofone.info** → the source text at L/L Research's
     lawofone.info.
5. **Credit block (required).** A distinct, always-present section (see exact copy below).
6. **Footer** — unsubscribe link (MailerLite merge tag, legally required), a one-line
   reminder of what this list is, and the sender postal address (CAN-SPAM requirement —
   MailerLite provides a merge field).

### Required credit / attribution copy

Every email — the weekly/daily send **and** the double opt-in confirmation — must include
a credit block. Draft copy (to be localized):

> **About the Ra Material**
> The Ra Material (The Law of One) was channeled and is published by **L/L Research**.
> All quotes are shared with gratitude and full credit to L/L Research, the copyright
> holders and stewards of this material.
>
> lawofone.study is an independent, community-funded study tool and is **not affiliated
> with or endorsed by L/L Research**.
>
> Learn more and support the original source:
> [llresearch.org](https://www.llresearch.org) · [lawofone.info](https://www.lawofone.info)

This mirrors the language already used on the About page (`AboutSections.tsx`) and in the
`app/layout.tsx` metadata, keeping messaging consistent across the site and email.

### Template implementation notes

- Store the template as a function in `src/lib/email/quote-email-template.ts` that takes
  `{ quote, citation, quoteUrl, siteUrl, sourceUrl, locale, unsubscribeTag }` and returns
  an HTML string. Co-locate a unit test that asserts the quote text, both links, and the
  L/L Research credit are all present in the output.
- Provide a **plain-text alternative** (better deliverability, accessibility).
- Keep the template well under the design-token brand palette; inline all colors from the
  Style Guide CSS variables as literal hex values (email clients ignore `:root` vars).
- Test rendering across major clients (Gmail, Apple Mail, Outlook) before launch — an
  Email-on-Acid/Litmus pass or manual checks.

---

## Internationalization

The site supports **en, es, de, fr**, and quotes are already multilingual. The email
feature must honor this:

- Capture `locale` at signup and store it (MailerLite custom field + per-locale group).
- Send each subscriber their language; fall back to English where a quote translation is
  missing (the daily-quote data already does `text[locale] || text.en`).
- Localize all template chrome (greeting, link labels, credit block, footer) via the
  `messages/` files.

---

## Environment Variables

Add to `.env.local.example` (documented, not committed) and to Vercel project settings:

| Variable | Purpose |
| --- | --- |
| `MAILERLITE_API_KEY` | Server-side MailerLite API token (never `NEXT_PUBLIC_`) |
| `MAILERLITE_GROUP_EN` / `_ES` / `_DE` / `_FR` | Group IDs per locale (and per cadence in Phase 2) |
| `MAILERLITE_FROM_EMAIL` | Verified sending address |
| `MAILERLITE_FROM_NAME` | e.g. "Law of One Study" |
| `CRON_SECRET` | Shared secret Vercel Cron sends in the `Authorization` header |

---

## Privacy & Compliance

- **Minimal data:** collect only the email address and locale. No names required.
- **Consent:** double opt-in; clear statement of what subscribers will receive and how
  often, shown at the point of signup.
- **Unsubscribe:** one-click, in every email (MailerLite handles the mechanics).
- **CAN-SPAM / GDPR:** physical mailing address in the footer, honest subject lines, honor
  unsubscribes promptly. MailerLite provides the compliance primitives; we must use them.
- **Privacy note:** add a short line near the signup form and/or link to a privacy
  statement describing what we collect and that we use MailerLite as processor. This aligns
  with the roadmap's "Privacy by Design" principle.

---

## Testing Plan

Following the project's testing requirements (60% lines, co-located tests):

- **Unit:** email-template renderer (asserts quote, both links, L/L Research credit,
  unsubscribe tag present); Zod subscribe schema (valid/invalid emails, honeypot); quote
  selection reuse.
- **Route handlers:** `POST /api/subscribe` (valid → MailerLite called with right group;
  honeypot filled → rejected; malformed → 400) and `GET /api/cron/quote-email` (missing/
  wrong `CRON_SECRET` → 401; happy path builds and sends). Mock the MailerLite client.
- **Component:** `EmailSignup` idle → submitting → success/error transitions with RTL.
- **E2E (one, strategic):** on the home page, the signup card is visible, accepts an email,
  and shows the success state (mock the network call). Do **not** add per-locale E2E for
  this — unit tests cover localization. Keep to the "one test per feature area" philosophy.

---

## Rollout Phases

1. **Phase 1 — Weekly MVP**
   - MailerLite account, verified sender domain, one weekly group per locale, double opt-in on.
   - `EmailSignup` component below the daily quote + `POST /api/subscribe`.
   - Email template + `GET /api/cron/quote-email` on a weekly Vercel Cron.
   - Analytics events, tests, `.env.local.example` update.
2. **Phase 2 — Cadence choice**
   - Add Daily groups; let subscribers pick Daily or Weekly at signup and manage it via a
     preferences link (MailerLite hosted page).
   - Second cron entry for the daily group.
3. **Phase 3 — Expansion (optional)**
   - Footer + post-lesson/post-meditation signup placements.
   - Preference center (topic/cadence), richer editorial (e.g. a themed intro line).

---

## Open Questions

- **Send time & timezone:** which audience timezone anchors the UTC cron hour? (Default
  assumption: Americas morning.)
- **Sending domain:** which verified from-address/domain? (SPF/DKIM/DMARC setup needed
  before first send.)
- **Privacy statement:** does the site want a dedicated `/privacy` page, or an inline
  disclosure near the form to start?
- **List naming / segmentation:** one list with locale+cadence groups (recommended) vs
  separate lists.
- **Confirmation-email copy:** confirm exact wording of the double opt-in email and its
  L/L Research credit block.

---

## Cross-References

- `docs/ROADMAP.md` — "Weekly Newsletter" is already listed under *Future Considerations*;
  this document is its concrete design.
- `src/data/daily-quotes.ts` / `src/lib/daily-quote.ts` — the quote source of truth reused
  by the cron job.
- `src/app/[locale]/about/AboutSections.tsx` — existing L/L Research credit language to
  mirror in the email.
- `docs/STYLE_GUIDE.md` — brand palette and typography the email template draws from.

---

*"I am Ra. I leave you in the love and the light of the one infinite Creator. Go forth,
therefore, rejoicing in the power and the peace of the one infinite Creator." — Ra*

*The Ra Material is published by L/L Research. lawofone.study is an independent,
community-run project and is not affiliated with L/L Research.*
