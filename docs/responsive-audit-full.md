# Complete responsive audit, fixes and cross-browser QA — 10 Oct 2026

Brief: audit every route, every section and interactive component, in all six editions, at every scope width (320 → 1920,
intermediate widths, landscape), in Chrome, Safari (WebKit), Firefox and Edge; fix what is broken without redesigning; retest;
report honestly what could not be tested. This builds on the two 9 Oct sweeps (`docs/responsive-browser-audit.md`): those are
not repeated here except where re-verified.

QC tooling for this audit: `.astro/qc-resp3/` (not committed). Builds were made to scratch folders so other sessions' `dist/`
stayed untouched: `dist` = the tree before this audit's fixes (port 4470), `dist2` = after (port 4471).

| Script | What it does |
|---|---|
| `lib.mjs` | `measure()` runs in the page: horizontal scroll + the outermost unclipped element causing it; nav state (full nav ≥ 1200, hamburger below); nav items overlapping; touch targets ≤ 1024 (hit layers, labels counted); off-centre max-width boxes ≥ 1280; text past its box; distorted `<img>` (rendered vs natural aspect); overlapping text blocks on the same layer; fixed / sticky boxes outside the viewport. `boxCheck()` for open panels. |
| `all.mjs` | **Every route** from the six sitemaps + the six 404 pages (1592 pages) × 320 / 390 / 768 / 1024 / 1366 / 1920 in Chrome, hamburger opened at 320. |
| `interact.mjs` | 117 template pages (every template in Global EN, the Arabic set, and the key pages of UAE / KSA in both languages) × 320, 360, 390, 414, 600, 767, 768, 1024, 1280, 1366, 1440, 1600, 1920 + landscape 844×390 and 1024×768, in Chrome, WebKit and Firefox. At 390, 768, 1024, 1440 and 844×390 every interactive state is opened and re-measured: hamburger with each submenu, fly-out and the region menu; desktop dropdowns, fly-outs and the region menu (items must be on top, inside the viewport); the three pop-up forms (fit, scrollable, close button, fields inside the panel, empty submit → error state); the country pop-up on Global (no cookie); tabs / FAQ accordion; the doctor comboboxes; the video lightbox; the hospital gallery (every area); calculator submit; page forms (empty submit); the About timeline arrows. |
| `probe-menu.mjs`, `probe-font.mjs`, `probe-touch1024.mjs`, `probe-nbsp.mjs`, `probe-radio.mjs` | Targeted checks for the fixes below (three engines, touch emulation). |
| `shots.mjs` + `crop.mjs` | Full-page screenshots of 35 templates at 320×568, 600×900, 767×1000, 768×1024, 1023×800, 1024×768, 1600×900 and 844×390, reviewed by eye. |

## 1. Routes audited

All 1586 sitemap URLs plus the six 404 pages = **1592 routes**, i.e. every page the build produces:

| Edition | Routes | Templates covered |
|---|---|---|
| Global EN `/` | 289 | Home, About, Who We Are, Why Cambridge, Accreditations, Careers, Our Care hub + 4 service pages + sub-service + condition pages (4 levels), Patient Hub, Conditions & Specialities list + 20 condition pages, Find a Doctor + 69 profiles, Refer a Patient, International Patients, Insurance Providers, Testimonials, Our Hospitals + 6 hospital pages, Media Hub + 258 articles, Contact Us, Your Opinion Matters, FAQs, 4 calculators, 6 legal pages, 404 |
| Global AR `/ar` | 289 | same, RTL |
| UAE EN `/ae` | 241 | same minus KSA hospitals / doctors, plus In-School Care |
| UAE AR `/ae/ar` | 241 | same, RTL |
| KSA EN `/sa` | 263 | same minus UAE hospitals / doctors |
| KSA AR `/sa/ar` | 263 | same, RTL |

Per-route results are in `.astro/qc-resp3/all-chromium.json` (one row per route and width) and
`interact-{chromium,webkit,firefox}.json` (one row per template page, with the states opened per viewport). The route checklist
in §7 summarises them per template; a template's result applies to every route built from it, and the all-routes sweep confirms
that no individual route (long titles, Arabic, missing images, empty bodies) breaks the template.

## 2. Fixes

| # | Issue (where seen) | Root cause | Fix (file) | Verified |
|---|---|---|---|---|
| F1 | Hamburger panel ends 5–23 px below the viewport on every page below 1200 px (320: 5 px, 390: 14 px, 768/600/844×390: 23 px) — the last menu row sits under the screen edge and cannot be scrolled into view; on iPhone Safari the toolbar hides more. | `.menu { max-height: calc(100vh - 80px) }` assumed an 80 px bar; the scaled logo makes it 85–103 px. `100vh` is the large viewport on iOS. | `src/components/Header.astro`: `max-height: calc(100vh - 100%)` with a `calc(100dvh - 100%)` twin (100 % = the header's own height, the panel's containing block). | `probe-menu.mjs`: panel bottom = viewport bottom at 10 viewports in Chrome, WebKit, Firefox; content scrolls inside. |
| F2 | iOS Safari zooms the page into a field on focus and stays zoomed: footer newsletter e-mail 12.3 px on every page, pop-up form fields (name / e-mail 12.3 px, message 9.6 px), feedback textarea 15 px, Media Hub and hospital-gallery selects 13.7 px. | Figma sizes (9–11 u) below Safari's 16 px zoom threshold. | `src/styles/global.css`: `@media (pointer: coarse)` every input / select / textarea / combobox is 16 px (`!important`, the component rules are more specific). Mouse devices keep the Figma sizes. | `probe-font.mjs` (touch emulation, 11 pages incl. the 3 pop-ups): all ≥ 16 px; screenshots of the footer box, pop-up and feedback form at 390 unchanged in layout. |
| F3 | Safari ≤ 17 / iOS 17: the pop-up forms and the country pop-up lose their glass blur (only `-webkit-backdrop-filter` works there). | The build's compat pass (`browserCompatCss`, 9 Oct) excluded `Features.VendorPrefixes`; with that flag Lightning CSS merges the hand-written `-webkit-` twin into the unprefixed declaration and generates no prefix at all — the shipped CSS had **no** `-webkit-backdrop-filter`. | `astro.config.mjs`: VendorPrefixes stays enabled, so the prefixes the targets need (Safari 16) are regenerated: `-webkit-backdrop-filter`, `-webkit-mask-*`, `-webkit-text-decoration`, `-webkit-user-select`. CSS +7 %. | Built CSS: 4 `-webkit-backdrop-filter` declarations (`.modal::backdrop`, `.modal-panel`, `.cp-card`, Tailwind utility). |
| F4 | Chrome and Firefox run words together around every non-breaking space in the 258 imported articles ("avoid**overburdening**the shoulder", "psychology-related**benefits**", 1173 `&nbsp;` on 167 pages). WebKit was unaffected (it synthesises U+00A0 from the space). | The live site's Gotham woff2 files (and the 9 Oct Latin subset made from them) map U+00A0 to a glyph with **zero advance**; the `.notdef`-style glyph is real, so no fallback font steps in. | `public/fonts/Gotham-{Book,Light,Medium}.woff2`: U+00A0 now carries the space's advance (614 units), set with fontTools; nothing else in the fonts changed (same glyphs, kerning, metrics; +~0 KB). GE SS Two (Arabic) untouched: its nbsp is 1275 vs 491 for space, but no Arabic page contains `&nbsp;`. | `probe-nbsp.mjs`: "a b" and "a&nbsp;b" measure the same in Chrome, WebKit, Firefox; article screenshot. |
| F5 | Phone testimonials panel: the decorative ellipse art (928×233) was stretched to the panel box (e.g. 358×319). | `width/height: 100%` without `object-fit`. | `src/components/sections/Testimonials.astro`: `object-fit: cover`. | Sweep `img-distorted` check clean. |
| F6 | "Go to top" button is 36 × 36 px on tablets (shown from 690 px up; 768–1023 is a touch width). | Figma / live size, no hit layer. | `src/styles/global.css`: `.to-top::before` 44 × 44 px tap layer (invisible). | `elementFromPoint` 3 px outside the button hits it; 6 px away does not. |
| F7 | **WebKit only:** the portrait (9:16) video lightbox at 390 × 800 was 383 px wide in a 342 px dialog and centred off-screen (frame −37…346; Arabic 44…427); at 360 × 640 it sat 11 px off-centre. Chrome and Firefox were correct. | The dialog's single `auto` grid track was sized by WebKit from the stage's `aspect-ratio` max-content (423 px from the 752 px height) instead of the container width, and `min(100%, …)` resolved against the dialog's outer box. | `src/styles/global.css`: `.video-lightbox[open] { grid-template-columns: minmax(0, 1fr) }` and the stage width `min(100%, calc(100vw - 2 × pad), calc(85dvh × ratio))`. | `probe-lightbox.mjs`: identical frame boxes in WebKit, Chrome and Firefox at 390 × 800, 360 × 640, 844 × 390, 1440 × 900 (24…366 / 27…333 / 329…515 / 505…935). |
| F8 | Above 1440 px the hospital gallery's outer photos were cut with a hard edge at the 1440 stage boundary, with white page margin beyond (found by the whitespace scan below). | The slide strip was the 1440 box with `overflow: hidden`. | `src/components/hospital/HealingGallery.astro`: the strip is widened by `--gutter` on both sides and every slide shifted by it (RTL mirrored), so the outer photos run to the screen edge like the Home rows. | Whitespace scan 0 hits on the hospital pages at 1440 / 1920 / 2560; gallery switching and no horizontal scroll re-verified in EN, AR and KSA. |

Shared components updated: Header (F1), global.css (F2, F6, F7), HealingGallery (F8), Testimonials (F5), the build pipeline (F3), the web fonts (F4). All
other components passed. Nothing was removed, no data or text changed, no new dependency. `docs/open-decisions.md` R072 records the
deviations (F2 sizes on touch devices, the font patch) and the open questions of §4.

## 3. Test matrix

Widths actually loaded (every load is a fresh navigation at that viewport, scrolled through once so lazy content and observers settle):

| Sweep | Engine | Pages | Viewports | Loads | Result |
|---|---|---|---|---|---|
| All routes, static | Chrome 154 (Playwright, = Edge engine) | **1592** (every route) | 320, 390, 768, 1024, 1366, 1920 for 1305 routes (Global EN/AR, UAE EN/AR, 102 KSA); 390, 1024, 1920 for the remaining 287 KSA routes (the machine swapped; those routes reuse templates already covered at six widths) | ≈ 8,700 | **0 horizontal scroll**, 0 nav / hamburger faults, 0 overlapping text, 0 fixed elements outside the viewport, 0 distorted images after F5. Text past its box: 2 lead paragraphs by 2–4 px (trailing space). Touch targets: see §4 (1024 density, 24 px dots) — everything else ≥ 44 px. |
| Templates, interactive | Chrome | 117 | 15 (320 … 1920 + 844×390, 1024×768) static; 390, 768, 1024, 1440, 844×390 interactive | 1,321 static views; states opened: hamburger 388, desktop dropdowns 117 (every submenu, fly-out and the region menu), Book 505, Enquiry 505, Opinion 505, country pop-up 325, tabs / FAQ 105, comboboxes 24, lightbox 25, gallery 36, calculators 25, page forms 91, timeline 25 | **All states pass**: panels inside the viewport, items on top (`elementFromPoint`), pop-ups fit or scroll, close buttons reachable, every empty submit shows the error state, no horizontal scroll in any state. Only F1 (menu height) was flagged, now fixed. |
| Templates, interactive | WebKit 2359 (Safari 26 engine) | 41 (every template, EN + AR + UAE/KSA homes) | 320, 390, 1024, 1440, 1920, 844×390; interactive at 390 and 1440 | 240 views, 575 states | Same checks: pass except **F7** (portrait lightbox, now fixed) and F1. One harness click timeout on Our Hospitals re-checked by hand (opens in 64 ms). |
| Templates, interactive | Firefox 1543 | 41 | same as WebKit | 245 views, 580 states | Pass except F1. Arabic Home at 390: the forms module failed to download once under load (Firefox "error loading dynamically imported module"); re-run clean (3 pop-ups open, 6 / 4 / 3 invalid fields on empty submit). |
| Eye review | Chrome screenshots | 35 templates | 320×568, 600×900, 767×1000, 768×1024, 1023×800, 1024×768, 1600×900, 844×390 | 280 full-page shots | Layouts reviewed at the widths no earlier review covered: breakpoint transitions at 767/768 and 1023/1024 are clean, landscape phones stack like portrait with the two-column care grid, tablets at 600 show the phone layout (see §4.2). |
| Touch emulation | Chrome `hasTouch` | 11 pages incl. the 3 pop-ups | 390 × 844 | — | Every text field ≥ 16 px (F2); 1024 × 768 touch: see §4.1. |
| Fonts | Chrome, WebKit, Firefox | article page | — | — | `&nbsp;` width = space width in all three (F4). |
| **Real Safari.app 26.6.2** (safaridriver / WebDriver, after the user enabled Remote Automation) | Safari 26.6.2 on macOS 26.6.2 | 41 (every template, EN + AR + UAE/KSA homes) | window widths 336 (Safari's minimum), 390, 600, 768, 1024, 1280, 1440, 1920; interactive at 390, 768, 1024, 1440 | 328 views; states: hamburger + every submenu / fly-out / region 123, desktop dropdowns + fly-outs with the header **stuck** (bug 085 check) 41, Book / Enquiry / Opinion 164 each (fit, close button, fields, `-webkit-backdrop-filter` active, empty-submit errors), country pop-up 140, tabs 32, comboboxes 8, lightbox 8, gallery 8, page forms 44, `&nbsp;` width 1 | **All pass** — 0 findings beyond the 24 px pagination dots. Screenshots in `.astro/qc-resp3/shots/safari/`. The only oddity seen was the country pop-up's map painting ~1 s after the card at 390 (AVIF decode on first paint; the image is loaded and laid out, and painted by the next frame) — not a layout fault. |
| **Real iPhone, iOS 26.6.1 Safari** (USB, Remote Automation, safaridriver `platformName: iOS`; the user's phone, viewport 402 × 714 with the toolbar) | iOS Safari 26.6.1 | 41 (every template, EN + AR + UAE/KSA homes) | portrait, plus landscape (750 × 338, phone rotated by hand) on 14 templates | 41 + 14 views; states: hamburger + every submenu / fly-out / region 41, Book / Enquiry / Opinion 41 each (fit, close button, blur, empty-submit errors), country pop-up 40, tabs 7, combobox 1, lightbox 2, gallery 1, page forms 6, `&nbsp;` 1; plus the iOS-only checks: focusing the first text field keeps `visualViewport.scale` at 1 (no zoom, fields 16 px) and the open menu ends exactly at the visual viewport (714 px, above the toolbar; `100dvh` = 714) | **All pass** — 0 findings beyond the 24 px pagination dots. Screenshots in `.astro/qc-resp3/shots/ios/`. (The session dropped once after 31 pages when the phone went idle; the remaining 10 pages ran in a second session.) |
| Whitespace scan | Chrome, pixel scan of full-page screenshots | 32 templates (EN, AR, UAE, KSA) | 390, 1920, 2560 | 96 | Hard white gutters at the 1440 stage edge beside a coloured section: **0** after F8 (1 before: the hospital gallery). Blank bands ≥ 320 px across the full width: **0**. The pale left side of the heroes is the Figma gradient fading to white, not a gutter. |
| Regression pass on the final build | Chrome / WebKit / Firefox | 41 | 320, 390, 768, 1024, 1440, 1920, 844×390 (Chrome); 390, 1440 (WebKit, Firefox) | Chrome: 41 pages, 287 views, 681 states — **clean** (only the deliberate Figma `cx` offsets and one 2 px trailing space). WebKit: 41 pages, 82 views, 454 states — **clean**. Firefox: 41 pages, 82 views, 454 states — **clean**. No regression from F1–F7; the menu ends at the viewport bottom at 10 viewports in all three engines, the lightbox boxes are identical across engines, every field ≥ 16 px on touch, `&nbsp;` = space width. |

Cross-browser notes: Chrome and Edge share the Blink engine, so the Chrome results cover Edge's layout (Edge.app itself not installed,
§5). Safari was tested twice: headless WebKit (Playwright) for the full matrix and the real Safari.app for the template subset, which also
confirmed in the shipping browser what headless WebKit cannot show: the prefixed `backdrop-filter` blur on the pop-ups and the dropdowns
staying whole with the sticky header stuck (bug 085). iOS-only behaviours (toolbar, focus zoom) are handled by construction (§2, §5).

Note on the country pop-up: the "country" states above were opened under the configuration current at the time (every Global
visitor sees the UAE pop-up). At 09:37 on 10 Oct another session set `fallbackCountry` to `""` in `src/data/country-popup.json`
(only visitors detected in the UAE see it), so on a local QC server without geo detection it no longer opens; that is that
session's decision, not a layout change.

## 4. Open items (not changed — need a decision)

Recorded as R072 in `docs/open-decisions.md`:

1. **Exactly 1024 px on a touch tablet (iPad landscape):** the desktop Figma density applies from 1024 up, so footer link rows are 9 px, FAQ tabs 28 px, form fields 34 px, buttons 36 px, social icons ≈ 20 px, the back-to-top button and pagination dots < 44 px. Measured with a touch pointer (`probe-touch1024.mjs`): 29–48 small targets per page. Fixing means visible size changes at 1024 (the 9 Oct sweep left this open). Below 1024 everything is ≥ 44 px (hit layers; radios and checkboxes via their labels).
2. **440–767 px:** doctor, care, condition and insurer card lists are one centred 290 px column (the Figma phone layout stretched). Nothing breaks, but two columns would fit from ≈ 600 px. Design choice.
3. **Pagination dots** 24 px wide (44 px tall), as before.
4. **Arabic pages show English** for form labels / placeholders, the "ALL" filter pill, doctor designations and the pop-ups — B4 (no Arabic text supplied), not a layout issue.
5. **Legal pages are empty** (title + footer) — B10, content pending.
6. Centred intro headings 3–13 px off the page centre at 1280–1440 (Figma `cx` offsets, deliberate); UAE In-School lead paragraph measures 4 px past its box at 320 (trailing space of a `pre-wrap` line, nothing visible).

## 5. Not testable here

- **Safari.app (macOS):** TESTED — after the user enabled "Allow remote automation" the whole template subset ran in the real Safari 26.6.2 through safaridriver (§3). Safari's window cannot go below 336 px wide, so 320 was covered by WebKit only.
- **iPhone (iOS 26.6.1 Safari):** TESTED in portrait on the user's phone over USB (§3); landscape TESTED too (phone rotated by hand, viewport 750 × 338): 14 templates incl. Arabic / KSA / UAE homes, menu + submenus, the three pop-ups with validation, country pop-up, forms, tabs, combobox, lightbox, gallery — all pass.
- **iPad:** NOT TESTED — no iPad available (no Xcode, so no simulator either). The 768–1024 tablet widths were covered in Chrome, WebKit, Firefox and Safari.app windows.
- **Microsoft Edge:** not installed on this Mac. Edge shares Chrome's engine (Chromium); the Chrome 154 results apply to its layout, but Edge.app itself is NOT TESTED.
- **Real touch hardware:** touch was emulated (Playwright `hasTouch` / `isMobile`); scrolling momentum, the on-screen keyboard and the iOS toolbar collapse could not be exercised.
- **Portrait/landscape rotation in place** (resize without reload) was tested on the 9 Oct sweep (`resize.mjs`), not repeated.

## 6. Build, tests

- `astro build` (final tree): 1592 pages, compat pass applied; built to `.astro/qc-resp3/dist3` (the project `dist/` was left to the other sessions).
- `npm test`: all 6 node suites pass (functions, doctor filters, conditions, sanitize, news, calculators).
- `npx astro check`: NOT AVAILABLE — `@astrojs/check` and `typescript` are not installed in the project (the command only offers to install them); not added, to keep the dependency set unchanged.
- Lint: no ESLint / Prettier configuration in the repo (nothing to run).

## 7. Deployment readiness

Ready for the staging deploy from this tree: the fixes are CSS, one build-config flag and three patched font files; no content, data
or behaviour changed; build, tests and the three-engine regression pass are green. Before go-live the three open client decisions
in §4 (1024 touch density, the 600–767 single column, the dots) should be answered, and someone with a real iPhone / iPad and Safari
should walk the menu, a pop-up form and the About video once (§5). Nothing has been committed or deployed by this audit.

## 8. Route checklist (per template; a template's result covers every route built from it)

| Template (routes) | Editions / routes | Desktop 1280–1920 | Tablet 600–1024 | Mobile 320–440 + landscape | Chrome | Safari (WebKit) | Firefox | Edge | Issues found | Fixes | Retest |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Home | 6 editions | ✓ 1280–1920 + 1024×768 | ✓ 600–1024 | ✓ 320–440 + landscape | ✓ | ✓ | ✓ | Blink | menu height (F1); stretched testimonials art (F5); 16 px fields in pop-ups / footer (F2) | F1, F2, F5 | ✓ |
| About Cambridge | 6 | ✓ | ✓ | ✓ | ✓ | ✓ (lightbox F7) | ✓ | Blink | portrait lightbox off-screen in WebKit (F7); F1, F2 | F1, F2, F7 | ✓ |
| Who We Are | 6 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | Blink | F1, F2 | F1, F2 | ✓ |
| Why Cambridge | 6 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | Blink | F1, F2; 36 px buttons at 1024 touch (§4.1) | F1, F2 | ✓ |
| Accreditations & Partnerships | 6 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | Blink | F1, F2 | F1, F2 | ✓ |
| Careers | 6 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | Blink | F1, F2; Arabic lead 2 px trailing space (no visible effect) | F1, F2 | ✓ |
| Our Care hub | 6 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | Blink | F1, F2 | F1, F2 | ✓ |
| Care service pages (Inpatient, Outpatient, Home, In-School) | 22 routes | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | Blink | F1, F2; In-School / Home lead 4 px trailing space at 320 (no visible effect) | F1, F2 | ✓ |
| Care sub-service + condition pages (3rd / 4th level) | ≈ 500 routes | ✓ | ✓ | ✓ | ✓ (template) | ✓ (template) | ✓ (template) | Blink | F1, F2 | F1, F2 | ✓ |
| Patient Hub | 6 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | Blink | F1, F2 | F1, F2 | ✓ |
| Conditions & Specialities list | 6 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | Blink | F1, F2 (comboboxes) | F1, F2 | ✓ |
| Condition detail (20 conditions) | 120 routes | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | Blink | F1, F2 | F1, F2 | ✓ |
| Find a Doctor | 6 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | Blink | F1, F2 (comboboxes 16 px); single column 440–767 (§4.2) | F1, F2 | ✓ |
| Doctor profile (69 doctors) | 280 routes | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | Blink | F1, F2 | F1, F2 | ✓ |
| Refer a Patient | 6 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | Blink | F1, F2 (form fields 16 px); radios: 44 px via the label layer (sweep false positive) | F1, F2 | ✓ |
| International Patients | 6 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | Blink | F1, F2 | F1, F2 | ✓ |
| Insurance Providers | 6 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | Blink | F1, F2 | F1, F2 | ✓ |
| Testimonials | 6 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | Blink | F1, F2, F6 (back-to-top 36 px at 768) | F1, F2, F6 | ✓ |
| Our Hospitals | 6 | ✓ | ✓ | ✓ | ✓ | ✓ (hand re-check) | ✓ | Blink | F1, F2; WebKit harness click timeout (not a layout fault) | F1, F2 | ✓ |
| Hospital detail (6 hospitals) | 24 routes | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | Blink | F1, F2 (gallery select 16 px); gallery areas switch cleanly | F1, F2 | ✓ |
| Media Hub | 6 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | Blink | F1, F2 (category select 16 px) | F1, F2 | ✓ |
| Article (258 posts) | 774 routes | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ (F4 Firefox too) | Blink | words run together around `&nbsp;` in Chrome / Firefox (F4); inline credit links 15 px (inline exception); F1, F2 | F1, F2, F4 | ✓ |
| Contact Us | 6 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | Blink | F1, F2 (form 16 px); map and contact rows stack | F1, F2 | ✓ |
| Your Opinion Matters (feedback) | 6 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | Blink | F1, F2 (textarea 15 → 16 px); rating radios 44 px via label layer | F1, F2 | ✓ |
| FAQs | 6 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | Blink | F1, F2; tabs 28 px at 1024 touch (§4.1); accordion below 768 fine | F1, F2 | ✓ |
| Calculators (4) | 24 routes | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | Blink | F1, F2; submit / result area inside the page | F1, F2 | ✓ |
| Legal (6 pages) | 36 routes | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | Blink | empty body (B10 content); F1, F2 | F1, F2 | ✓ |
| 404 | 6 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | Blink | F1, F2 | F1, F2 | ✓ |
| Header / hamburger / dropdowns / region / language | shared | ✓ dropdowns, fly-outs, region menu on top and inside the viewport | ✓ accordion menu | ✓ accordion menu | ✓ | ✓ | ✓ | Blink | panel 5–23 px under the viewport (F1) | F1 | ✓ 3 engines, 10 viewports |
| Pop-up forms (Book / Enquiry / Opinion) + country pop-up | shared | ✓ | ✓ | ✓ full-screen, scroll inside | ✓ | ✓ (blur prefix F3) | ✓ | Blink | 9.6–12.3 px fields (F2); no `-webkit-backdrop-filter` (F3) | F2, F3 | ✓ |
| Footer | shared | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | Blink | newsletter box 12.3 px (F2); 9 px link rows at 1024 touch (§4.1) | F2 | ✓ |

Edge column: "Blink" = covered by the Chrome engine results; Edge.app NOT TESTED (not installed). Safari column: WebKit (Playwright) for every row, plus the real Safari.app for every template listed in §3. Retest = the fix re-verified on the final build (`dist3`) by the targeted probes and the regression pass in §3.

