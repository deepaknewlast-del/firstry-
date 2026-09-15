# Design System Master File — ChurchPress

> **LOGIC:** When building a specific page, first check `design-system/churchpress/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** ChurchPress
**Category:** Church / Religious organisation — print-first publishing tool
**Generated with:** `ui-ux-pro-max` (style: Editorial Grid / Magazine · typography: Classic Elegant · pattern: Hero + Testimonials + CTA)
**Design dials:** Variance 3/10 (Centered / Minimal) · Motion 3/10 (Subtle) · Density 5/10 (Standard)

---

## The idea, in one line

This is a **print studio for the local church**. It should read like something a
designer set by hand for one congregation — warm paper, plum ink, gold foil, and
real physical depth. It must never read as a generic software product.

## Non-negotiable: no AI-product clichés

This rule outranks every other visual preference here.

- ❌ **No sparkle / wand / "magic" icons.** Ever. They are the single strongest
  "made by a machine" signal.
- ❌ **No violet-to-blue gradient washes**, no mesh-gradient hero on a lavender
  background, no glassmorphism cards over a neon glow.
- ❌ **No "AI-powered", "AI-generated", or "Powered by AI" copy**, and no model
  names in the UI. Describe what the church gets, not how it is made.
- ❌ **No emoji as icons** anywhere.
- ✅ Use meaning and momentum: an open book, a bell, a calendar, a pen, a dove.
- ✅ When a feature is described, describe the church's benefit
  ("written up properly, with the dates and times in place"), not the mechanism.

Honesty note: the FAQ answers still answer "how is the content produced?" plainly.
Removing *marketing* clichés is a branding decision; lying about what the product
does is not.

---

## Color Palette

Every pair verified against WCAG AA (4.5:1) before use.

| Role | Hex | Token |
|------|-----|-------|
| Deep panel surface | `#1e0d22` | `primary-950` |
| Headings | `#4e2456` | `primary-700` |
| Primary button fill | `#632f6d` | `primary-600` |
| Lightest text-safe on paper | `#8b4f96` | `primary-400` |
| Text on deep panels | `#e2d0e4` | `primary-200` |
| Secondary text on deep panels | `#c9aecd` | `primary-300` |
| Gold foil on deep panels | `#d9a93b` | `gold-400` |
| Gold CTA fill (under white) | `#8a6114` | `gold-700` |
| Page background (paper) | `#fbf7f0` | `cream` / `paper` |
| Card surface | `#fffdf9` | `parchment` |
| Body ink | `#241528` | `ink` |
| Muted body text | `#5b4a5e` | `ink-muted` |
| Rules / hairlines | `#ece3e6` · `#ded0d8` · `#c9aecd` | `rule-light` · `rule` · `rule-strong` |
| Destructive | `#b3261e` | red-700 |

**Verified ratios:** ink on paper 16.21 · muted on paper 7.60 · primary-700 on paper
11.50 · white on primary-600 9.73 · white on gold-700 5.53 · gold-400 on deep 8.53 ·
primary-200 on deep 12.66 · primary-400 on paper 5.38.

### Shade contract — read before picking a shade

The ramp is **split by where a shade may be used**:

- `50`–`300` — light tints. Use as text and icons **on the deep `primary-950` panels**.
- `400`–`700` — use as text and icons **on `cream` and `parchment`**.
- `primary-400` (`#8b4f96`) is the lightest step that is safe on paper. It does
  **not** work on the deep panels — use `primary-200` / `primary-300` there.

This split exists because an earlier version used light creams as text on light
backgrounds (~1.1:1) and shipped invisible labels.

---

## Typography

- **Display:** Playfair Display (500–800) — Georgia, Times New Roman fallback
- **Body / UI:** Inter (400–700) — system fallback
- Google Fonts: `family=Playfair+Display:wght@500;600;700;800&family=Inter:wght@400;500;600;700`

| Element | Treatment |
|---|---|
| `h1` hero | `text-4xl sm:text-5xl md:text-6xl`, `leading-[1.08]` |
| `h2` section | `text-3xl sm:text-4xl` |
| Body | 16px minimum, `line-height 1.65` |
| `.eyebrow` | 12px / 600 / uppercase / `tracking-[0.22em]` / primary-400 |
| `.eyebrow-on-dark` | same, in gold-400 |
| `.lede` | Playfair italic, `text-lg sm:text-xl`, primary-800 |

**Letterpress:** `h1` and `h2` carry `text-shadow: 0 1px 0 rgba(255,255,255,0.55)` so
the type reads as pressed into the paper rather than floating above it.

---

## Depth system (the "3D touch")

Depth is what stops a flat rectangle from looking template-generated. Every raised
surface gets **a light top edge plus a soft drop shadow**; every well gets an
**inset** shadow.

| Token | Effect | Use |
|---|---|---|
| `shadow-paper` | inset white top edge + 2px + 20px drop | cards, sheets |
| `shadow-raised` / `-hover` | top highlight, bottom lip, two-layer drop | hovered cards |
| `shadow-pressed` | `inset 0 2px 5px` | active buttons, wells |
| `shadow-deboss` | `inset 0 1px 3px` | inputs at rest |
| `shadow-foil` / `-lg` | white top inset, dark bottom inset, warm glow | gold seal, gold CTA |
| `shadow-panel-lg` | deep 50px drop | deep panels |

- **Buttons** — `.btn-primary` (plum, raised, sinks 1px on `:active` with a pressed
  shadow), `.btn-gold` (gold foil gradient, ink text, brightest element on a page),
  `.btn-secondary` (parchment with a letterpress rule), `.btn-ghost`.
- **Inputs** — `.input-field` is a *debossed well* on the paper, 3px focus ring.
- **`.seal`** — the gold-foil badge (used for "MOST CHOSEN").
- **`.ornament`** — hairline rule with a centred gold lozenge ✦.

## Radius

`sm 3` · `DEFAULT 4` · `md 6` · `lg 8` · `xl 10` · `2xl 14` · `3xl 20` · `pill 9999`.
Paper is squared off; only buttons and the seal get generous rounding.

---

## Motion

Subtle, 280–380ms, `cubic-bezier(0.34, 1.3, 0.64, 1)`.
`.stagger > *` reveals children at 60ms intervals. `.animate-shimmer` for skeletons.
Motion is **not decoration** — no bouncing, no parallax. All of it is disabled under
`prefers-reduced-motion`.

## Accessibility rules (non-negotiable)

- Every text/background pair ≥ 4.5:1; decorative-only glyphs also darkened so a
  strict audit returns zero.
- `:focus-visible` ring, 3px primary-400, offset 2px — never removed.
- 44×44px minimum on every interactive control (inline links in prose exempt).
- Real `<label for>` on every input. No placeholder-only fields.
- Every icon-only button has an `aria-label`; every decorative icon is `aria-hidden`.
- `.skip-link` to `#main-content` on every page, and each page's `<main>` carries
  `id="main-content"`.
- No horizontal scroll at 375px, 768px, 1024px, 1440px.

## Anti-patterns

- ❌ Emoji as icons · ❌ low-contrast text · ❌ layout-shifting hovers
- ❌ arbitrary `z-[9999]` (use the `sticky/overlay/dropdown/modal/toast` ladder)
- ❌ instant state changes · ❌ invisible focus states
- ❌ the AI clichés listed at the top of this file

## Discovery layer

The brand is also expressed in structured data, so search engines and assistants
describe it correctly: `SoftwareApplication`, `Organization`, `WebSite`, `HowTo`
and `FAQPage` in `frontend/index.html`, plus `/llms.txt`, `/robots.txt` (AI
crawlers explicitly allowed) and `/sitemap.xml`.
