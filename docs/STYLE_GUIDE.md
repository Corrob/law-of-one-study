# Law of One Study - Brand Style Guide

## Brand Essence

**Mood:** Cosmic & Mystical
**Feel:** Expansive, ethereal, infinite - like gazing into the night sky
**Tone:** Wise, gentle, inviting exploration of deeper truths

> **Note:** The app supports both dark and light themes. Dark theme is the default and embodies the cosmic aesthetic described here. Light theme uses the Starlight/Cosmic White palette for comfortable daytime reading.

---

## Color Palette

### Primary Colors

| Name              | Hex       | RGB          | Usage                            |
| ----------------- | --------- | ------------ | -------------------------------- |
| **Cosmic Indigo** | `#1a1f4e` | 26, 31, 78   | Primary background, header       |
| **Deep Space**    | `#0f1235` | 15, 18, 53   | Darker accents, depth            |
| **Ra Gold**       | `#d4a853` | 212, 168, 83 | Primary accent, CTAs, highlights |

### Secondary Colors

| Name               | Hex       | RGB           | Usage                          |
| ------------------ | --------- | ------------- | ------------------------------ |
| **Starlight**      | `#e8e6f2` | 232, 230, 242 | Page background, light areas   |
| **Nebula**         | `#6b5b95` | 107, 91, 149  | Secondary accent, hover states |
| **Celestial Blue** | `#4a5899` | 74, 88, 153   | Links, interactive elements    |

### Neutral Colors

| Name             | Hex       | RGB           | Usage                   |
| ---------------- | --------- | ------------- | ----------------------- |
| **Cosmic White** | `#f5f4f8` | 245, 244, 248 | Backgrounds, cards      |
| **Stardust**     | `#9a98a9` | 154, 152, 169 | Secondary text, borders |
| **Void**         | `#2a2d3e` | 42, 45, 62    | Primary text            |

### Semantic Colors

| Name               | Hex       | Usage                    |
| ------------------ | --------- | ------------------------ |
| **Harvest Gold**   | `#f0c75e` | Success states, positive |
| **Service Orange** | `#e07b4c` | Warnings, attention      |
| **Catalyst Red**   | `#c45c5c` | Errors, destructive      |

---

## Typography

### Font Stack

**Primary (Headings):** `Cormorant Garamond`

- Elegant serif with mystical quality
- Use weights: 400 (regular), 500 (medium), 600 (semibold)
- Letter-spacing: 0.02em for headings

**Secondary (Body):** `Inter`

- Clean, highly readable sans-serif
- Use weights: 400 (regular), 500 (medium)
- Optimal for long-form reading

**Accent (Quotes):** `Cormorant Garamond Italic`

- For Ra quotes and spiritual passages
- Creates visual distinction for source material

### Type Scale

| Element | Size            | Weight     | Font               |
| ------- | --------------- | ---------- | ------------------ |
| H1      | 2.5rem (40px)   | 600        | Cormorant Garamond |
| H2      | 2rem (32px)     | 500        | Cormorant Garamond |
| H3      | 1.5rem (24px)   | 500        | Cormorant Garamond |
| Body    | 1rem (16px)     | 400        | Inter              |
| Small   | 0.875rem (14px) | 400        | Inter              |
| Quote   | 1.25rem (20px)  | 400 italic | Cormorant Garamond |
| Caption | 0.75rem (12px)  | 500        | Inter              |

---

## Favicon & Logo

### Favicon Concept

**Design:** A stylized eye within a circle, representing:

- The all-seeing eye (subtle Egyptian reference to the Eye of Ra)
- The circle of unity/oneness
- Awareness and consciousness

**Specifications:**

- Simple geometric form that reads well at 16x16, 32x32, and 192x192
- Primary: Ra Gold (`#d4a853`) eye/symbol
- Background: Cosmic Indigo (`#1a1f4e`) or transparent
- Style: Minimal line art, not filled - suggests openness and light

**Alternative concept:** A seven-pointed star or spiral representing the densities

### Logo Mark

**Primary Logo:**

- Text: "Law of One Study" in Cormorant Garamond
- Subtitle: "THE RA MATERIAL" in Inter, letterspaced
- Icon: Stylized eye or concentric circles suggesting unity

**Logo Variations:**

1. Full horizontal (header)
2. Stacked (mobile, compact)
3. Icon only (favicon, app icon)

---

## UI Components

### Cards (Quote Cards)

```
Background: Cosmic White (#f5f4f8)
Border: 1px solid rgba(26, 31, 78, 0.1)
Border-radius: 12px
Shadow: 0 4px 20px rgba(15, 18, 53, 0.08)
Padding: 24px

Quote text: Cormorant Garamond Italic, 1.125rem
Citation: Inter, 0.875rem, Stardust color
```

### Buttons

**Primary Button:**

```
Background: Ra Gold (#d4a853)
Text: Deep Space (#0f1235)
Border-radius: 12px
Padding: 12px 24px
Hover: Lighten 10% (#ddb565)
```

**Secondary Button:**

```
Background: transparent
Border: 1px solid Celestial Blue (#4a5899)
Text: Celestial Blue
Hover: Background rgba(74, 88, 153, 0.1)
```

### Input Fields

```
Background: white
Border: 1px solid #d1d0d9
Border-radius: 12px
Focus ring: 2px solid Ra Gold (#d4a853)
Placeholder: Stardust (#9a98a9)
```

### Header

```
Background: Cosmic Indigo (#1a1f4e)
Text: Cosmic White (#f5f4f8)
Height: 64px
Logo accent: Ra Gold (#d4a853)
```

---

## Imagery & Iconography

### Visual Motifs

1. **Stars & Constellations** - Subtle star patterns, scattered dots suggesting cosmos
2. **Concentric Circles** - Unity, oneness, densities radiating outward
3. **Sacred Geometry** - Subtle use of the Flower of Life, Metatron's Cube
4. **Light Rays** - Emanating light, harvest imagery
5. **Egyptian Hints** - Simplified lotus, ankh references, pyramid silhouettes (use sparingly)

### Icon Style

- Line icons, 1.5px stroke weight
- Rounded caps and joins
- Consistent 24x24 grid
- Color: Void (#2a2d3e) or Celestial Blue (#4a5899)

### Background Patterns

- Subtle star field (very low opacity, 2-3%)
- Gradient: Deep Space to Cosmic Indigo
- Soft radial glow effects suggesting cosmic light

---

## Spacing System

Base unit: 4px

| Token | Value | Usage                      |
| ----- | ----- | -------------------------- |
| xs    | 4px   | Tight spacing, icon gaps   |
| sm    | 8px   | Component internal padding |
| md    | 16px  | Standard spacing           |
| lg    | 24px  | Section padding            |
| xl    | 32px  | Major sections             |
| 2xl   | 48px  | Page sections              |
| 3xl   | 64px  | Hero areas                 |

---

## Animation & Motion

- **Duration:** 200-300ms for micro-interactions
- **Easing:** `cubic-bezier(0.4, 0, 0.2, 1)` - smooth, natural
- **Streaming text:** Character-by-character reveal, 15-20ms per character
- **Quote cards:** Fade in + subtle slide up (200ms)
- **Hover states:** Gentle transitions, nothing jarring

---

## Accessibility

- Maintain WCAG 2.1 AA contrast ratios
- Ra Gold on Deep Space: 7.2:1 (AAA)
- Void on Starlight: 10.4:1 (AAA)
- Focus indicators: Always visible, Ra Gold ring
- Reduced motion support for animations

---

## Voice & Tone

- **Wise but approachable** - Like a patient teacher
- **Inviting exploration** - "Consider this..." not "You must..."
- **Humble** - Acknowledges the mystery, doesn't claim absolute truth
- **Service-oriented** - Free law of confusion, respects free will

---

## CSS Variables (Implementation)

```css
:root {
  /* Primary */
  --lo1-indigo: #1a1f4e;
  --lo1-deep-space: #0f1235;
  --lo1-gold: #d4a853;

  /* Secondary */
  --lo1-starlight: #e8e6f2;
  --lo1-nebula: #6b5b95;
  --lo1-celestial: #4a5899;

  /* Neutrals */
  --lo1-white: #f5f4f8;
  --lo1-stardust: #9a98a9;
  --lo1-void: #2a2d3e;

  /* Semantic */
  --lo1-success: #f0c75e;
  --lo1-warning: #e07b4c;
  --lo1-error: #c45c5c;

  /* Typography */
  --font-heading: "Cormorant Garamond", Georgia, serif;
  --font-body: "Inter", system-ui, sans-serif;

  /* Spacing */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  --space-2xl: 48px;
  --space-3xl: 64px;

  /* Borders */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-full: 9999px;
}
```

---

## Implementation Priority

1. **Phase 1:** Update CSS variables, colors, and fonts
2. **Phase 2:** Create new favicon and logo assets
3. **Phase 3:** Refine component styling (cards, buttons, inputs)
4. **Phase 4:** Add subtle background patterns/effects
