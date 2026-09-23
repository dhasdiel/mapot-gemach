---
name: mapot-gemach
description: Hebrew RTL tablecloth-lending gemach — a phone-first tool for tracking who has which cloth and when it's due back
colors:
  parchment: "#f6f3ee"
  ink: "#2d2a26"
  walnut: "#6d5c44"
  card-paper: "#ffffff"
  card-edge: "#e6e0d6"
  field-edge: "#d8d0c4"
  muted-warm: "#6f665a"
  label-warm: "#5c544a"
  stone: "#eee9e0"
  stone-hover: "#e3dac9"
  late-red: "#b3261e"
  late-wash: "#fbe4e2"
  late-card: "#fdf6f5"
  late-edge: "#e5a09a"
  ok-green: "#1e7a3c"
  ok-wash: "#e6f4ea"
  warn-amber: "#7c4a00"
  warn-wash: "#fdf0e0"
  linen-pick: "#e5d9be"
  shabbat-wash: "#efe7d8"
  chag-wash: "#f9f0da"
  chag-shabbat-wash: "#f3e9d2"
  selected-wash: "#f3ede3"
  holiday-ink: "#6d4a00"
  holiday-wash: "#f4ead5"
  shabbat-chip: "#e4dbcb"
typography:
  headline:
    fontFamily: "\"Segoe UI\", \"Helvetica Neue\", Arial, sans-serif"
    fontSize: "1.6rem"
    fontWeight: 700
  title:
    fontSize: "1.15rem"
    fontWeight: 700
  body:
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.45
  label:
    fontSize: "0.85rem"
    fontWeight: 400
  micro:
    fontSize: "0.72rem"
    fontWeight: 600
rounded:
  cell: "8px"
  control: "10px"
  card: "12px"
  pill: "999px"
spacing:
  cell-gap: "4px"
  element-gap: "10px"
  card-pad: "14px 16px"
  screen-pad: "16px"
components:
  button-primary:
    backgroundColor: "{colors.walnut}"
    textColor: "#ffffff"
    rounded: "{rounded.control}"
    padding: "10px 18px"
    height: "44px"
  button-secondary:
    backgroundColor: "{colors.stone}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "10px 18px"
    height: "44px"
  button-secondary-hover:
    backgroundColor: "{colors.stone-hover}"
  button-danger:
    backgroundColor: "transparent"
    textColor: "{colors.late-red}"
    rounded: "{rounded.control}"
    padding: "10px 12px"
  button-danger-hover:
    backgroundColor: "{colors.late-wash}"
  input:
    backgroundColor: "{colors.card-paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "10px 12px"
    height: "44px"
  card:
    backgroundColor: "{colors.card-paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "14px 16px"
  card-overdue:
    backgroundColor: "{colors.late-card}"
  badge-late:
    backgroundColor: "{colors.late-wash}"
    textColor: "{colors.late-red}"
    rounded: "{rounded.pill}"
    padding: "2px 10px"
  badge-ok:
    backgroundColor: "{colors.ok-wash}"
    textColor: "{colors.ok-green}"
    rounded: "{rounded.pill}"
    padding: "2px 10px"
  badge-warn:
    backgroundColor: "{colors.warn-wash}"
    textColor: "{colors.warn-amber}"
    rounded: "{rounded.pill}"
    padding: "2px 10px"
  cal-cell:
    backgroundColor: "{colors.card-paper}"
    rounded: "{rounded.cell}"
    padding: "4px"
  cal-cell-shabbat:
    backgroundColor: "{colors.shabbat-wash}"
  cal-cell-chag:
    backgroundColor: "{colors.chag-wash}"
---

# Design System: mapot-gemach

## Overview

**Creative North Star: "The Shabbat Table"**

The cloths this app tracks exist for one moment: a table set for Shabbat, a simcha, a family meal. The design borrows that warmth — parchment background, walnut brown, the colors of folded linen — but stays quiet about it. This is a working tool used one-handed on a phone, often mid-conversation at the door. Warmth lives in the palette; the structure stays out of the way.

Everything is soft and thumb-friendly: 44px touch targets, gently rounded cards, generous padding, one column. The visual hierarchy serves a single job — *who has what, and is it late* — so the only loud elements are the status colors: red for overdue, green for returned, amber for caution.

The app speaks Hebrew, runs RTL, and treats the Jewish calendar as data, not decoration — Shabbat and chagim are visibly shaded, Hebrew dates appear next to civil ones, and due-date picks warn when they land on a holy day.

**Key Characteristics:**
- Warm parchment field, white paper cards, walnut actions
- Status color carries all urgency; chrome stays calm
- One narrow column (720px max), phone-first, RTL throughout
- Dual dates everywhere: civil + Hebrew
- Tactile minimums: 44px targets, 10–12px radii, visible focus

## Colors

The palette is warm paper-and-ink with three reserved status accents. Neutrals do most of the work; status colors appear only where they mean something.

### Primary
- **Walnut** (`#6d5c44`): The one action color — primary buttons, the active tab, today's calendar border, contact links, focus outline. Warm brown, like the wooden shelf the cloths live on.

### Neutral
- **Parchment** (`#f6f3ee`): The page background. Warm, never gray-blue.
- **Ink** (`#2d2a26`): Primary text. Warm near-black.
- **Card Paper** (`#ffffff`): Card and input surfaces; cards get a 1px Card Edge border (`#e6e0d6`).
- **Stone** (`#eee9e0`, hover `#e3dac9`): Secondary buttons, inactive tabs, quantity steppers.
- **Muted Warm** (`#6f665a`): Secondary text — due dates, hints, Hebrew dates on calendar. Held at ≥4.5:1 contrast.
- **Label Warm** (`#5c544a`): Form labels and day-of-week headers.
- **Linen Pick** (`#e5d9be`): Text selection and the selected-day wash family.

### Status
- **Late Red** (`#b3261e` on washes `#fbe4e2`/`#fdf6f5`, edge `#e5a09a`): Overdue. The pinned "באיחור" section title, late badges, overdue card tint and border, delete actions, errors.
- **OK Green** (`#1e7a3c` on `#e6f4ea`): Returned, the return-confirmation notice, due-date calendar chips.
- **Warn Amber** (`#7c4a00` on `#fdf0e0`): Shabbat/chag warnings in the loan form.

### Calendar washes
- **Shabbat Wash** (`#efe7d8`), **Chag Wash** (`#f9f0da`), combined (`#f3e9d2`): day-cell shading that distinguishes holy days at a glance without competing with status color.
- **Holiday Ink** (`#6d4a00` on `#f4ead5`) and **Shabbat Chip** (`#5c544a` on `#e4dbcb`): in-cell chips naming the day.

**The Status-Only-Color Rule.** Red, green, and amber appear only where they carry meaning — overdue, returned, caution. Never use them decoratively; a red heading that isn't about lateness breaks the app's one signal.

## Typography

**Body/Display Font:** Segoe UI → Helvetica Neue → Arial → sans-serif (one stack for everything — chosen for clean Hebrew rendering on iOS/Android, not for personality).

**Character:** A quiet system font that lets the Hebrew text and the dual dates carry the identity. Weight does the hierarchy work; there is no display face and shouldn't be.

### Hierarchy
- **Headline** (bold, 1.6rem): App title "גמח מפות" only.
- **Title** (bold, 1.15rem): Section headers — "באיחור (n)", "השאלות פעילות", month name.
- **Body** (regular, 1rem): Loan/person/item card text, form fields.
- **Label** (regular, 0.85rem, Label Warm): Form labels, muted metadata lines.
- **Micro** (600, 0.72–0.75rem): Hebrew dates and chips inside calendar cells, badges (0.8rem).

**The Dual-Date Rule.** Anywhere a civil date appears, the Hebrew date appears with it — same line or directly beneath, in Muted Warm. Never show `23.9` alone when the app knows it's `א׳ בתשרי`.

## Layout

Single column, `#root` capped at 720px, 16px screen padding — the app is a phone tool that also works on desktop, not a desktop layout squeezed down. Cards stack with 10px gaps and `14px 16px` internal padding. Forms are vertical: label, 44px field, next label.

The calendar is the only grid: 7 columns, 4px gaps, day cells ≥64px tall. On phones it stays 7-across — density is the point of a month view; legibility is preserved by keeping in-cell text to a number, a Hebrew date, and one chip.

RTL is structural, not cosmetic: `dir="rtl"` on the document, `text-align: start`, flex rows that flip naturally. Never pin text or icons to a physical side.

## Elevation & Depth

Nearly flat. Depth is tonal layering — parchment under white cards — plus a single faint warm shadow on cards.

### Shadow Vocabulary
- **Card lift** (`box-shadow: 0 1px 3px rgba(80,66,45,0.08)`): Cards only. Warm-tinted, barely there; it separates paper from parchment, nothing more.

**The Flat-By-Default Rule.** Surfaces are flat at rest. Depth comes from the background/surface contrast and 1px borders — reserve shadows for the card lift; never add drop shadows to buttons, badges, or chips.

## Shapes

Soft and friendly throughout: cards at 12px, controls and inputs at 10px, calendar cells at 8px, badges and pills fully rounded (999px). Corners are always rounded — nothing sharp; the sharpest edge in the app is the 1px card border.

## Components

### Buttons
- **Shape:** Gently rounded (10px), ≥44px tall, `10px 18px` padding.
- **Primary:** Walnut fill, white text. The affirmative action — שמירה, הוספה.
- **Secondary:** Stone fill, Ink text; hover shifts to Stone Hover. Toggles, dismissals, +שבוע.
- **Danger:** Transparent ghost, Late Red text; hover fills Late Wash. מחיקה only — kept visually lighter than primary so it's never the biggest thing on the card.
- **Small** (`.btn-sm`, 36px): Per-item החזרה inside loan lines — allowed below the 44px floor because it sits inline, not as a primary target.
- **Hover/focus:** Primary brightens (`brightness(1.05)`); all controls get a 2px Walnut `focus-visible` outline.

### Badges
- Pill (999px), Micro-adjacent size (0.8rem, 600). Three meanings: **late** (Late Wash/Red — "באיחור n ימים"), **ok** (OK Wash/Green — returned), **warn** (Warn Wash/Amber — visitor, caution).

### Cards / Containers
- Corner: 12px. Background: Card Paper on Parchment, 1px Card Edge border, Card lift shadow.
- **Overdue variant:** Late Card fill + Late Edge border — the whole card goes warm-red so the pinned section reads at a glance.
- **Notice:** OK Wash/Green bar with an inline underlined **בטל** action — the undo lives inside the confirmation it reverses.

### Inputs / Fields
- White on Field Edge border (`#d8d0c4`), 10px radius, 44px tall, 1rem text (prevents iOS zoom).
- Labels sit above in Label Warm at 0.85rem, always `htmlFor`-associated.
- **Quantity stepper:** −/+ Stone buttons flanking a centered count — replaces typed number input for phone use.
- **Hint line:** Muted Warm, 0.8rem; `hint.warn` upgrades to Warn Amber 600, and may carry an inline underlined action ("הזיזי ליום א׳").

### Navigation
- Three equal-width tabs (השאלות / אנשים / מלאי — calendar lives inside loans): Stone when inactive, Walnut when active, `role="tablist"`/`aria-controls` wired.

### Calendar cells
- Real `<button>`s, 8px radius, 64px minimum height. Contents top-aligned: day number (600), Hebrew date (Muted, 0.72rem), one chip (due-count in OK colors, holiday name in Holiday colors, "שבת" chip on Shabbat).
- **Today:** 2px Walnut border. **Selected:** Selected Wash fill. **Shabbat/Chag:** the washes above.

## Do's and Don'ts

### Do:
- **Do** keep every touch target ≥44px (the `.btn-sm` per-item exception aside — it stays inline, never primary).
- **Do** pair every civil date with its Hebrew date in Muted Warm.
- **Do** keep Muted Warm (`#6f665a`) as the darkest allowed muted text — it passes 4.5:1 on both Parchment and Card Paper.
- **Do** shade Shabbat and chagim on any date-related surface; a due date on a holy day should always get a Warn hint.
- **Do** put undo inside the confirmation notice, not in a separate dialog.
- **Do** keep the interface Hebrew and RTL end-to-end, including error strings.

### Don't:
- **Don't** use Late Red, OK Green, or Warn Amber decoratively — status colors mean status.
- **Don't** add shadows beyond the card lift; depth is tonal layering.
- **Don't** introduce a second accent or a display typeface; Walnut and Segoe UI are the whole voice.
- **Don't** shrink calendar in-cell text below 0.72rem or muted text below `#6f665a` — both floors were hit and fixed once already.
- **Don't** put a destructive action at primary weight; danger stays a ghost.
- **Don't** show bare `confirm()`-style friction on reversible actions while irreversible deletes share the same affordance — friction follows reversibility.
