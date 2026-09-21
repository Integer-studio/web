# Integer Studio — site design spec

Implementation spec for the redesigned integer studio website, derived from Figma.

**Source of truth:** [Figma → `Integer` → page `v2` → frame `Site current`](https://www.figma.com/design/kFdHwkwnxTfVWv5w8VqDxW/Integer?node-id=530-2)
(`fileKey: kFdHwkwnxTfVWv5w8VqDxW`, `nodeId: 530:2`, 1512 × 4214)

> Page `v2` contains three frames named `Site current` (`505:8`, `525:7`, `530:2`). **Only `530:2` is current** — it is the tallest and the only one with the About / CTA / footer sections. Ignore the other two.

**Scope:** this design replaces the entire current site. The site becomes a **one-pager**; the existing `/about`, `/contact` and `/projects` index pages and all `HomePage/*` components are superseded (see [Component inventory](#component-inventory)).

**Stack (unchanged):** Astro 5 + Tailwind 4 (`@tailwindcss/vite`), GSAP available, `@astrojs/node` adapter, content collections via `src/content.config.ts`.

---

## 1. Design tokens

### 1.1 Color

Figma exposes exactly one variable: `Accent = #80ef80`. Everything else is a raw hex in the file. The table below lists the literal Figma values and the token each one should map to in `src/styles/global.css` (`@theme`).

| Token | Value | Figma literal(s) | Used for |
|---|---|---|---|
| `--color-accent` | `#80ef80` | `Accent` variable | CTA button fill, all rules/grid lines, hero accent word |
| `--color-ink` | `#20211f` | `#20211f` | Dark section background (hero, About, footer) |
| `--color-ink-raised` | `#20201f` | `#20201f` | Card surface **on** a dark section (featured project card, person card) |
| `--color-paper` | `#f4f9f1` | `#f4f9f1` | Light page background; also primary text color on dark |
| `--color-card` | `#e4ecdf` | `#e4ecdf` | Small project card surface on light |
| `--color-card-border` | `rgba(48,64,38,0.2)` | same | Small project card 1px border |
| `--color-card-ink` | `#304026` | `#304026` | Small project card title |
| `--color-ink-strong` | `#202020` | `#202020` | Section heading on light (`Naše projekty`) |

Text-on-dark opacity steps (all derived from `--color-paper` / white):

| Token | Value | Figma literal | Used for |
|---|---|---|---|
| `--color-on-dark` | `#f5f5f5` | `#f5f5f5` | H1 |
| `--color-on-dark-muted` | `#d5d5d5` | `#d5d5d5` | Hero subtitle |
| `--color-on-dark-91` | `rgb(244 249 241 / 0.91)` | same | Project card subtitle |
| `--color-on-dark-65` | `rgb(244 249 241 / 0.65)` | same | Project card body |
| — | `#ffffff` | `#fff` | Person name, About body paragraphs |

**Flagged cleanup (do this, it is not a design change anyone will see):** the file contains near-duplicate darks (`#20211f` vs `#20201f`) and near-duplicate lights (`#f5f5f5`, `#f4f9f1`, `#ffffff`, `#202020`, `#000`). Keep `#20211f` / `#20201f` — that 1-unit difference is a real, intentional card-vs-background separation on dark. **Collapse the text colors**: use `--color-on-dark` (`#f5f5f5`) for all headings/names/body-on-dark and `--color-ink-strong` for all text on light. The literal `#000` on the CTA headline and `#ffffff` on person names should both become tokens.

**Relation to existing tokens:** `--color-primary-500` in `global.css` is already `rgb(128 239 128)` = `#80ef80`. Reuse it as the accent (or alias `--color-accent` to it). The `secondary-*` / `tertiary-*` ramps do **not** match the new design (`secondary-200` `#e2efe2` ≠ card `#e4ecdf`; `tertiary-900` `#232923` ≠ ink `#20211f`) — do not reach for them; add the tokens above instead.

### 1.2 Typography

Two families. **Instrument Serif is new and must be added; Google Sans Code is dropped entirely.**

- **Instrument Serif** — display: H1, project card titles, person names, the CTA email. Regular + Italic.
- **Host Grotesk** — everything else: section headings, body, subtitles, CTA headline. Weights used: Light (300), Regular (400), Medium (500), SemiBold (600). Already loaded from Google Fonts in `Layout.astro`.

Scale (Figma `letter-spacing` is given in px; the `em` column is what to write in code — note almost everything lands on `0.02em`):

| Role | Family / weight | Size | Line-height (Figma) | Tracking | `em` | Color |
|---|---|---|---|---|---|---|
| Display XL — CTA email | Instrument Serif Regular | 96px | 60px | +1.92px | `0.02em` | `--color-ink-raised` |
| Display L — H1 | Instrument Serif Regular | 84px | 78px (≈0.93) | +0.32px | `0.004em` | `--color-on-dark`, accent span italic |
| Section heading | Host Grotesk **Medium** on light / **SemiBold** on dark | 64px | 60px (≈0.94) | +1.28px | `0.02em` | `--color-ink-strong` / `--color-paper` |
| Card title | Instrument Serif Regular | 48px | 60px | +1.44px | `0.03em` | `--color-paper` (dark card) / `--color-card-ink` (light card) |
| Person name | Instrument Serif Regular | 48px | 60px | +0.96px | `0.02em` | white, centered |
| CTA headline | Host Grotesk Regular | 40px | 60px | +0.8px | `0.02em` | `--color-ink-strong` |
| Hero subtitle | Host Grotesk Light | 24px | 89.6% | −0.24px | `−0.01em` | `--color-on-dark-muted` |
| Card subtitle | Host Grotesk Regular | 16px | 86.36% | +0.16px | `0.01em` | `--color-on-dark-91` |
| Body (card / About) | Host Grotesk Light | 15px | 87.29% / normal | +0.3px | `0.02em` | `--color-on-dark-65` / white |
| Footer meta | Host Grotesk Regular | 12–14px | normal | — | — | `--color-on-dark-65` |

**Do not implement the sub-100% line-heights literally on body copy.** Figma reports `86–90%` on the 15/16/24px text, which as CSS `line-height` would overlap lines; the rendered Figma output is visibly looser than that. Use `leading-[1.3]`–`leading-[1.4]` for 15/16/24px body and reserve the tight ratios for display sizes (H1 `78/84 = 0.93`, headings `60/64 = 0.94`) where they are real and intentional.

### 1.3 Radii, borders, shape

| Thing | Value |
|---|---|
| Card radius (featured + small project cards, CTA button) | `12px` |
| Inner image radius (project screenshot) | `8px` |
| Card border (small light cards only) | `1px solid rgba(48,64,38,0.2)` |
| Rules / grid lines | `1px solid var(--color-accent)` |
| Person card | no radius, no border — defined purely by rules |

The existing `.shadow-hard` utility in `global.css` is not used by this design. Drop it unless something else needs it.

### 1.4 Layout grid — the defining structural motif

Every section is built on the same 1512px frame with a **160px gutter on each side**, marked by **visible 1px accent vertical rules at x = 160 and x = 1352**. Content column = **1192px**. These rules are real design elements, not Figma guides — they run the full height of each section and are the visual signature of the site. `Layout.astro` already does a weaker version of this (`mx-4 md:mx-12 border-x border-primary-500`); the new design makes it stricter and accent-colored.

Each dark section additionally carries a **pair of full-bleed horizontal accent rules**, inset from the section's own top and bottom edge:

| Section | Top inset | Bottom inset |
|---|---|---|
| Hero | 32px | 32px |
| About | 45.25px | 39.14px |
| Footer | 45.25px | 39.14px |

**Flagged cleanup:** unify to a single `--rule-inset: 32px` token for all sections. The 45/39px values in About and footer are drift from duplicating the frame, not an intentional difference. Confirm with the designer before shipping if in doubt, but implement one value.

### 1.5 Spacing

Figma uses absolute positioning throughout, so there is no auto-layout spacing to read. Derived values, rounded to a 4px scale:

- Content column padding inside the gutter rules: **32px** (hero content frame is `1192 × 810` with `p-32` → `1128 × 746` inner box).
- Card internal padding: **30px** (title offset). Body text is further indented to **50px** from the card's left edge — i.e. title at 30px, copy at 50px. This 20px hanging indent is deliberate; keep it.
- Gap between the featured card and the small-card row: **~23px** → use **24px**.
- Gap between the two small cards: **20px** → use **24px** (unify).
- Gap between person cards: **70px**.

---

## 2. Page structure

Top to bottom, with frame-relative Y coordinates from `530:2`.

| # | Section | Y range | Height | Background |
|---|---|---|---|---|
| 0 | Sticky nav | overlay | 48px | `--color-ink` |
| 1 | [Hero](#21-hero) | 0 – 874 | 874 | `--color-ink` |
| 2 | [Projects](#22-projects) | 874 – 2071 | ~1197 | `--color-paper` |
| 3 | [About](#23-about) | 2071 – 3442 | 1371 | `--color-ink` |
| 4 | [CTA](#24-cta) | 3442 – 3945 | ~503 | `--color-paper` |
| 5 | [Footer](#25-footer) | 3945 – 4215 | 270 | `--color-ink` |

### 2.0 Navigation

**Not present in the Figma frame** — this is an agreed addition. Build a **sticky anchor nav**:

- 48px tall, `--color-ink` background, 1px accent bottom rule, `position: sticky; top: 0`.
- `{integer}` logo left (reuse `Logo.astro`, restyled for dark), anchors right: `#projekty`, `#o-nas`, `#kontakt`.
- Reuse the existing `Navbar.astro` / `NavbarItem.astro` mechanics — including the mobile full-screen overlay, swipe-to-close and `aria-expanded` handling, which are already implemented and working. **Only restyle** (white → `--color-ink`, `border-primary-500` stays) and swap the four page links for the three anchors.
- **Remove** the `🚧 Stránka je stále ve vývoji` banner.
- Sections get `id="projekty"`, `id="o-nas"`, `id="kontakt"` and `scroll-margin-top: 48px`.

### 2.1 Hero

Figma: `530:5`. Full-bleed `--color-ink`, 874px tall. Content frame at x=160, 1192 wide, `p-32`.

- **H1** (`530:11`) — x=32 y=230 within the content box, max-width 580px.
  Copy: `Stavíme interní aplikace ` + `na míru`
  The second part is a **separate span: Instrument Serif *Italic*, color `--color-accent`**. The first part is Regular, `--color-on-dark`.
  > The Figma layer carries leftover `Fraunces` + `fontVariationSettings` metadata from an earlier iteration. **Ignore it** — the actual rendered spans are Instrument Serif.
- **Subtitle** (`530:10`) — x=32 y=410, max-width 443px, Host Grotesk Light 24px, `--color-on-dark-muted`.
  Copy: `Jsme Integer Studio, malý tým který vytváří webové aplikace pro firmy dělané na míru jejich procesům.`
- **ASCII art** (`530:12`) — a plant rendered as ASCII/dither. 819 × 823, positioned x=463 y=−77 (bleeds above the section's top edge), `object-fit: cover`, **`opacity: 0.66`**, `pointer-events: none`.
- Rules: horizontal pair at inset 32px; verticals at x=160 and x=1352.

### 2.2 Projects

Light section (`--color-paper`).

- **Heading** (`530:4`) — `Naše projekty`, Host Grotesk **Medium** 64px, `--color-ink-strong`, **centered on the page** (Figma centers it at x=756, the frame midpoint). Sits *above* a full-bleed 1px accent divider (`530:3`, at y=982).
- **Featured card** (`530:19`) — 1064 × 518, x=224. `--color-ink-raised`, radius 12, `overflow: hidden`.
  - Title `Tender Portál` — Instrument Serif 48px, `--color-paper`, at 30/30.
  - Subtitle at 50/110, max-width 335px: `Interní aplikace pro správu stavebních výběrových řízení`
  - Body at 50/163, max-width 321px, three paragraphs separated by one blank line:
    1. `RUBY pm měli na správu výběrek zastaralou a pomalou aplikaci. Přepsali jsme ji do nové architektury — je rychlejší a přehlednější.`
    2. `Aplikace spravuje dodavatele a jejich nabídky. Nabídky zůstávají do konce kola zapečetěné, takže je manažer ani klient nevidí dřív, než se kolo uzavře. Díky tomu zůstává výběrko férové.`
    3. `Aplikace je nasazená a používá se.`
  - Screenshot at x=413 y=30, 621 × 458, radius 8, cropped (`object-fit: cover`, slight left/top bleed in Figma — just center-crop it).
- **Small cards** (`530:24`, `530:26`) — 522 × 392 each, side by side. `--color-card`, 1px `--color-card-border`, radius 12. Title only: Instrument Serif 48px `--color-card-ink` at 29/29.
  - Card A: `MHD run` — **body copy missing in the design. TODO.**
  - Card B: `Volný` — a deliberate "free slot" placeholder. **TODO: decide what this renders (a third project, or a real "we have capacity" slot that links to the CTA).**

**Data source.** Cards come from the existing `projects` content collection (`src/content.config.ts`, files in `src/pages/projects/*.md`). Mapping:

| Card slot | Rule |
|---|---|
| Featured card | the entry with `featured: true` (currently `tender-portal.md`) |
| Small cards | remaining entries sorted by `priority` desc, take 2 |
| `Volný` | rendered when fewer than 2 remaining entries exist |

Collection fields available: `name`, `tags[]`, `year`, `description`, `image`, `priority`, `featured?`, `links[]?`.
**Gap:** the featured card needs a *subtitle* (short) **and** a longer multi-paragraph *body*. The schema has only `description`. Either add a `subtitle` field and use the markdown body for the long copy, or add `summary`. **TODO: pick one and migrate the three existing `.md` files.**
**TODO:** decide whether cards link to `/projects/<slug>` detail pages (`ProjectLayout.astro` exists) or are non-interactive. The design shows no affordance either way.

### 2.3 About

Figma: `538:118` (dark) + loose children of `530:2`. 1371px tall, `--color-ink`.

- **Heading** (`534:68`) — `O nás`, Host Grotesk **SemiBold** 64px, `--color-paper`, centered on the page, 104px from the section top.
- **Person card row** (`538:94`) — x=160, 1192 wide, three cards of 316 × 488 with **70px gaps**. Instances of component `536:70`.
- **Person card** (`536:70`) — `--color-ink-raised`, no radius. Structure is defined by rules, not a box:
  - Portrait 252 × 350 at 30/32 — a **dithered green portrait** (`object-fit: cover`).
  - Horizontal accent rule at y=32, full card width.
  - Horizontal accent rule 32px from the bottom, full card width.
  - Horizontal accent rule 106px from the bottom, spanning only x=30…282 (the portrait's width) — this is the divider between portrait and name.
  - Vertical accent rules at x=30 and 34px from the right.
  - Name centered in the 106↔32px band: Instrument Serif 48px, white, centered.
  - Names: `Tonda`, `Oskar`, `Matyáš`.
- **Body copy** — three Host Grotesk Light 15px white paragraphs, each 251px wide, **deliberately staggered** (offset left/right, not in a row):
  | # | Figma x / y | Copy |
  |---|---|---|
  | 1 | 314 / 2808 | `Jsme tři studenti Smíchovské střední průmyslové školy (SSPŠ) a Integer Studio děláme zhruba rok vedle školy. Sídlíme u softwarového domu Jetsoft, se kterým dlouhodobě spolupracujeme.` |
  | 2 | 495 / 3012 | `Nejsme agentura. Bereme si radši míň projektů a věnujeme se jim naplno. Než začneme stavět, chceme rozumět tomu, jak firma reálně pracuje — teprve podle toho aplikaci navrhujeme.` |
  | 3 | 314 / 3196 | `TenderPortal běží v reálném provozu, s Jetsoftem spolupracujeme dlouhodobě a na hackathonu ARCHA+ jsme za víkend postavili návrh i funkční MVP a vzali první místo.` |

  The stagger is the point — implement as three absolutely/grid-placed blocks on the 12-column grid, not as a prose column.
- **ASCII art** (`540:121`) — the same plant asset as the hero, **rotated −120°**, `opacity: 0.66`, sitting behind/right of the paragraphs.

### 2.4 CTA

On the light `--color-paper` background, no panel.

- **Headline** (`546:134`) — Host Grotesk Regular 40px, centered, `--color-ink-strong`.
  Figma copy is a placeholder joke (`Zaujali jsme vás? Claude vám odpoví.`) and **must not ship**. Use:
  > **`Máte proces, který vás zdržuje? Napište nám.`**

  Alternatives if that reads too long: `Ozvěte se. Rádi se podíváme, jak pracujete.` / `Pojďme se podívat, jak pracujete.` **TODO: confirm.**
- **Button** (`546:133` + `546:132`) — 837 × 149 accent rectangle, radius 12, containing `kontakt@intstudio.cz` in Instrument Serif **96px**, `--color-ink-raised`, centered.
  - **This is not a `mailto:` link — it is click-to-copy.** Port the existing interaction from `components/ContactPage/ContactDirect.astro` (see §2.4.1); the whole accent rectangle is the hit area.
  - `kontakt@intstudio.cz` is the correct address. The current footer's `tym@intstudio.cz` is stale — replace it.
  - In Figma the email text box (990px wide, centered at x=781) is wider than the button and neither is centered on the frame midpoint (756). **Center both on the page midpoint** and let the text be constrained by the button; the Figma offset is sloppiness, not intent.

#### 2.4.1 Click-to-copy interaction (port, do not rewrite)

The behaviour already exists in `components/ContactPage/ContactDirect.astro`. That page is going away, but **this interaction is kept** — move it into the new `Cta.astro`. What it does, and what must survive the move:

**Desktop (`≥768px`), GSAP-driven:**
- GSAP is **dynamically imported** only when `matchMedia('(min-width: 768px)')` matches — mobile never downloads it. Keep this; it is the reason the bundle stays small.
- A floating label (`#copy-cursor`) follows the pointer while it is over the email, via `gsap.quickTo` on `x`/`y` (`duration: 0.3`, `ease: power2.out`) — not a raw `mousemove` write.
- On `mouseenter`: fade/scale in (`opacity 0→1`, `scale 0.8→1`, `0.3s`, `back.out(1.7)`), positioned at the cursor.
- On `mouseleave`: fade/scale out (`0.2s`, `power2.in`), then the label text resets to `kopírovat`.
- On `click`: `navigator.clipboard.writeText(...)`, then the label swaps to **`máte ho ve schránce!`** with a `scale 1.1 → 1` pop (`back.out(2)` → `power2.out`).
- Listeners are torn down on `astro:before-swap` (view-transition safety). Keep this.

**Mobile (`<768px`):**
- A separate `Copy` icon button (`@lucide/astro`) next to the email, since there is no hover.
- Copy path: `navigator.clipboard.writeText()` with an `execCommand('copy')` fallback over an off-screen readonly `<input>` for older mobile browsers. On success the icon is swapped for a checkmark.

**Restyling needed for the new design:**
- The email itself becomes the 96px Instrument Serif text **inside the accent button**, replacing the old `text-[7vw] md:text-[4vw]` sizing — use the §3.2 clamp instead.
- The floating label currently uses `bg-tertiary-50 / text-tertiary-800 / border-tertiary-800` — retoken to `--color-ink` background, `--color-paper` text, 1px `--color-accent` border. Keep it square (no radius) — it reads as part of the rule system.
- The address changes to `kontakt@intstudio.cz` in **all four places**: the visible text, `data-email`, the hidden input's `value`, and the hardcoded string inside `handleMobileCopy()`. That last one is a duplicated literal in the current code — **read it from `data-email` instead** while porting.
- The old `<h2>` copy (`Nebo nám chcete napsat napřímo? Rádi od vás uslyšíme.`) is replaced by the §2.4 headline.
- `cursor: pointer` on the email stays; add a visible `:focus-visible` ring and make the button keyboard-activatable — the current implementation is mouse/touch only. **This is a real a11y gap in the existing code; fix it during the port.**

### 2.5 Footer

Figma: `546:135` — a 270px dark panel containing only the literal placeholder text `footer`, plus the standard rule pair and gutter verticals.

**Keep the existing footer from `Layout.astro` structurally unchanged** (3-column grid: brand + copyright / Navigace / Kontakt) and adapt it to the new design:

- Background `--color-ink`, text `--color-on-dark-65`, headings `--color-paper`.
- `{integer studio}` wordmark: braces in `--color-accent`, words in `--color-paper`. Drop `font-mono` (Google Sans Code is being removed) → Host Grotesk.
- Gutter verticals + rule pair per §1.4, replacing the current `border-x`/`border-t`.
- Link list: `Navigace` becomes the three anchors (`#projekty`, `#o-nas`, `#kontakt`) instead of page routes.
- `Kontakt` column: GitHub link stays (`https://github.com/Integer-studio`), email → `kontakt@intstudio.cz`.
- **TODO:** the design gives no footer content at all, so the above is carried over from the current site. Confirm the column set.

---

## 3. Responsive behaviour

**The Figma frame is desktop-only (1512px).** Everything below is a proposal to be implemented, not read out of the file. Tailwind default breakpoints; the design is the `xl`/2xl target.

### 3.1 Container & gutters

| Breakpoint | Gutter | Vertical accent rules |
|---|---|---|
| base (<768) | `px-4` (16px) | **hidden** — they would eat the viewport |
| `md` (≥768) | `px-12` (48px) | shown, on the container edges |
| `xl` (≥1280) | centered `max-w-[1192px]` | shown at the 1192px column edges (= 160px gutters at 1512) |

Horizontal rule pairs and the section-divider rules stay at **all** breakpoints — they carry the identity. Keep the rule inset at 32px throughout; do not scale it down.

### 3.2 Type

Fluid `clamp()`, floor values chosen so nothing overflows at 320px:

| Role | Clamp |
|---|---|
| H1 | `clamp(2.5rem, 9vw, 5.25rem)` (40 → 84px), `leading-[0.95]` |
| Section heading | `clamp(2rem, 6vw, 4rem)` (32 → 64px) |
| CTA email | `clamp(1.375rem, 6.4vw, 6rem)` (22 → 96px) — **must be allowed to wrap**; at 96px it is ~990px wide |
| Card title / person name | `clamp(1.75rem, 4vw, 3rem)` (28 → 48px) |
| CTA headline | `clamp(1.25rem, 3vw, 2.5rem)` (20 → 40px) |
| Hero subtitle | `clamp(1.0625rem, 2vw, 1.5rem)` (17 → 24px) |
| Body | fixed 15–16px |

### 3.3 Per-section

**Hero** — `min-height: 100svh` base, fixed 874px from `xl`. Text stacks to a single column at full gutter width. The ASCII plant becomes a **background layer**: absolutely positioned, right-aligned, bleeding off-canvas, `opacity: 0.25–0.35` (down from 0.66 so the headline stays legible over it), `pointer-events: none`. From `lg` it returns to the side-by-side Figma composition at `opacity: 0.66`.

**Projects** — single column below `md`.
- Featured card: image moves **below** the text block, full card width, `aspect-ratio: 621/458`. The 30px/50px title/body indent collapses to a uniform 24px below `md`.
- Small cards: 1 column base → 2 columns from `sm` (640). Height becomes `auto` with a `min-height`, not a fixed 392px.

**About** — person cards: 1 column base → 3 columns from `md` (`grid-cols-3`), gap `clamp(1.5rem, 5vw, 70px)`. The portrait keeps `aspect-ratio: 252/350`. The internal rules scale with the card; the 30px vertical-rule inset becomes 24px below `md`.
The three staggered paragraphs **drop the stagger below `lg`** and become a single stacked column at `max-w-[60ch]`; the rotated ASCII art goes to `opacity: 0.2` behind them. From `lg`, restore the Figma offsets.

**CTA** — button becomes full container width, `min-height: 88px` base / 149px at `xl`, `padding: 24px`. The email at the 22px floor fits 320px on one line.

**Footer** — `height: auto`; 3-column grid → 1 column below `md`, `gap-y-8`.

**Nav** — the existing mobile overlay pattern in `Navbar.astro` is kept as-is behaviourally.

### 3.4 Motion

Nothing is specified in Figma. GSAP is already a dependency. Treat motion as **out of scope for this pass** — build it static first. If added later, the obvious candidates are a scroll-triggered fade/rise on section entry and a reveal on the ASCII art. Respect `prefers-reduced-motion`.

---

## 4. Assets

All images are supplied as **static PNGs by the user** (`src/images/`). They may be procedurally generated in a later iteration — so keep them behind a component prop / collection field rather than hardcoding paths inside markup.

| Asset | Size | Target path | Notes |
|---|---|---|---|
| ASCII plant | 819 × 823 | `src/images/ascii/plant.png` | used twice: hero (as-is) and About (rotated −120°). One file, two transforms. `opacity: 0.66` |
| Portrait — Tonda | 252 × 350 | `src/images/team/tonda.png` | dithered green |
| Portrait — Oskar | 252 × 350 | `src/images/team/oskar.png` | dithered green |
| Portrait — Matyáš | 252 × 350 | `src/images/team/matyas.png` | dithered green |
| Tender Portál screenshot | 621 × 458 | `src/images/projects/tender.png` | **already in the repo** |

`src/images/team/placeholder.jpg` can be deleted once the three portraits land.

### 4.1 Fonts

- **Add** Instrument Serif (Regular + Italic) — Google Fonts, alongside the existing Host Grotesk `<link>` in `Layout.astro`. Add `--font-serif` to `@theme`.
- **Remove** Google Sans Code: both `@font-face` blocks in `global.css`, the `--font-mono` theme entry, `public/GoogleSansCode-Medium.ttf`, `public/GoogleSansCode-MediumItalic.ttf`, and every `font-mono` usage (currently the footer link columns).

---

## 5. Component inventory

### Build

| Component | Notes |
|---|---|
| `components/GridFrame.astro` | The gutter wrapper: renders the container plus the two vertical accent rules. Every section wraps in it. |
| `components/Rule.astro` | 1px accent rule; `orientation` + `inset` props. Renders the horizontal pair. |
| `components/sections/Hero.astro` | §2.1 |
| `components/sections/Projects.astro` | §2.2 — reads the `projects` collection |
| `components/sections/About.astro` | §2.3 |
| `components/sections/Cta.astro` | §2.4 |
| `components/ProjectCardFeatured.astro` | 1064 × 518 dark card |
| `components/ProjectCardSmall.astro` | 522 × 392 light card, incl. the `Volný` empty state |
| `components/PersonCard.astro` | 316 × 488, rule-defined |

### Keep and restyle

`layouts/Layout.astro` (footer + head), `components/Navbar.astro`, `components/NavbarItem.astro`, `components/Logo.astro`, `src/styles/global.css` (token rewrite per §1).

`components/ContactPage/ContactDirect.astro` — **not kept as a component, but its click-to-copy logic is ported wholesale into `sections/Cta.astro`** (§2.4.1). Read that file before writing `Cta.astro`; do not reimplement the interaction from scratch.

### Delete

`components/HomePage/` — `MainHero.astro`, `MainProjects.astro`, `MainWhy.astro`, `MainServices.astro`, `MainCTA.astro`, `ServiceCard.astro`
`components/AboutPage/Person.astro` (replaced by `PersonCard.astro`)
`pages/about/index.astro`, `pages/contact/index.astro`, `pages/projects/index.astro`
`components/ContactPage/` — `ContactForm.astro`, `FormInput.astro`, `ContactHero.astro` (and `ContactDirect.astro` **only after** its logic is ported per §2.4.1)
`pages/api/contact.ts` — the contact form is gone, so the endpoint is dead. **Consequence: nothing left is server-rendered.** Check whether `@astrojs/node` and `output: 'server'` can be dropped from `astro.config.mjs` in favour of a static build.
`components/ProjectCard.astro`, `components/Tag.astro`, `components/Button.astro` — **verify no other usage first**

### Open decisions

- [ ] Whether `@astrojs/node` / SSR can be dropped once `pages/api/contact.ts` is gone (see Delete list).
- [ ] `layouts/ProjectLayout.astro` + `pages/projects/*.md` as routes — keep `/projects/<slug>` detail pages (making the cards clickable), or reduce the `.md` files to pure content-collection data with no route of their own?
- [ ] Featured-card copy needs a schema change (§2.2) — `subtitle` + markdown body, or a `summary` field.
- [ ] `MHD run` card body copy is missing.
- [ ] What `Volný` actually renders.
- [ ] Final CTA headline (§2.4).
- [ ] Footer column set (§2.5).
