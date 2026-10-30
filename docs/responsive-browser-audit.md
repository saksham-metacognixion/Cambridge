# Responsive + cross-browser audit — 9 Oct 2026

Brief: "the website is not responsive in Safari" with two reference images (a Safari screenshot at ~1667px with white gutters
either side of the Home hero; a photo of a Safari window whose desktop header overflows to the right). Scope: every page, every
width from 320 to 2560, Safari / Chrome / Edge / Firefox, English and Arabic.

QC tooling for this audit lives in `.astro/qc-resp2/` (not committed): `sweep.mjs` (per-engine sweep: h-scroll, nav / burger,
touch targets, off-centre boxes, text overflow, screenshots), `engine-diff.mjs` (same page in three engines, box-by-box diff),
`steps.mjs` (every 40px from 320 to 2560), `probe.mjs` / `resize.mjs` / `probe-dsf.mjs` (scale unit checks), `strip-media.mjs`
(simulates a browser that ignores range media queries). Builds were made to scratch folders (`astro build --outDir
.astro/qc-resp2/dist2`, served with `node tools/qc/serve.mjs 4453 .astro/qc-resp2/dist2`) so other sessions' `dist/` was untouched.

## 1. Root causes

| # | Finding | Root cause | Browsers |
|---|---|---|---|
| R1 | White gutters either side of the Home hero (and every inner hero) above 1440px; the Our Hospitals teal banner, the Contact banner etc. all stop at 1440 while the header and the section bands run full width. | The design canvas (`.stage`) is capped at the 1440 target width and centred; the hero art was inside it. Identical in Chrome, WebKit and Firefox, so NOT Safari-specific — the reference screenshot just happened to be taken in Safari on a wide window. | all |
| R2 | The Home Doctors, Care Support and Testimonials rows, which overflow the frame in Figma, were cut at an invisible line 240px inside the screen edge at 1920 (560px at 2560); the Media Hub tile and post rows were laid out from the viewport edge, so they sat far left under a centred heading. | Same cap as R1: the scrollers were as wide as the 1440 stage, or anchored to the viewport instead of the stage. | all |
| R3 | Who We Are: the grey "Six Hospitals" band stopped at 1440. | Band surface painted on the 1440 inner box, not the section. | all |
| R4 | Firefox rendered three Home headings (Testimonials, "Ready to Take the Next Step?", "Check Your Health in Seconds.") 10px taller per line than Chrome / Safari, pushing everything below them down by up to 42px on phones. | The headings had no `line-height`; Firefox's `normal` for Gotham is ~1.2em where Chrome / WebKit use the 0.95em from the font's metric overrides. | Firefox |
| R5 | Text past its box: Arabic footer copyright (every width ≥ 1024), About timeline card title at 320, Why Cambridge stat labels at 320-375, Media Hub newsletter heading at 320. | Fixed Figma box widths with a fixed phone font size (`--u` is constant below 1024). | all |
| R6 | Phone logo link 41px tall (touch target). | No hit layer on the logo link. | all |
| R7 | **Latent, catastrophic in older Safari:** the production CSS contains ONLY range-syntax media queries (`@media (width>=1024px)`), including the hand-written `min-width` ones. Safari 16.0-16.3, Chrome < 104 and Firefox < 63 do not parse that syntax, so every breakpoint is dropped at once: no fluid scale (`--u` stays at the 1440 value), no stacked layouts, no hamburger — the page is a 1440-wide desktop layout on any window. | Tailwind v4 optimises the final CSS with Lightning CSS for a Safari 16.4 floor and rewrites every query. Reproduced by stripping the `@media` blocks from a build (`.astro/qc-resp2/strip-media.mjs`). | Safari ≤ 16.3 (not confirmed as the photo's cause, see §6) |

## 2. Fixes (files)

- `astro.config.mjs` — new `browserCompatCss()` integration (`astro:build:done`): Lightning CSS lowers the range media-query syntax
  back to `min-width` / `max-width` in every built stylesheet and inlined `<style>` block (1292 files; only the media-query
  feature is enabled, logical properties / colours / nesting untouched; +7% CSS). R7.
- `src/styles/global.css` — `@supports not (width: 1cqw)` fallback for `--u` (viewport width) for engines without container
  units; new `--gutter` = the margin either side of the 1440 stage (`max(0px, (100cqw - 1440px) / 2)`, 0 below 1024). R2, R7.
- `src/components/sections/Doctors.astro`, `CareSupport.astro`, `Testimonials.astro` — the scroller is widened by `--gutter` on
  both sides and the row offset by it, so every card keeps its Figma position on the stage while the row runs off the real screen
  edge (the stage no longer clips; the section does). Testimonials' row margin moved from an inline style to CSS. R2.
- `src/components/media-hub/ExploreMedia.astro`, `LatestPosts.astro` — row start / scroll padding = Figma offset + `--gutter`. R2.
- `src/components/who-we-are/Network.astro` — grey band surface on a full-width `.band-wrap`. R3.
- `src/components/sections/Testimonials.astro`, `Calculators.astro`, `Recovery.astro` — `leading-27` on the three headings. R4.
- `src/components/Footer.astro` (`.bot.left` takes its own width), `src/components/about/Timeline.astro` (phone title
  `min(14u, 5.4vw)` + break-word), `src/components/why/Team.astro` (label `min(12u, 100cqi / 7.8)` + break-word),
  `src/components/media-hub/Newsletter.astro` (heading cap 12.8vw → 12.3vw). R5.
- `src/components/Header.astro` — `hit` class on the logo link (44px layer). R6.
- R1 (hero art to the viewport edges) is **bug 086, implemented in a parallel session** (`.hero-bleed` bands that repeat the
  banner's edge column; `Hero.astro`, `PageHero.astro`, `ContactHero.astro`, `global.css`). Its bands are in the builds tested
  here. Open point raised with that session: a subject layer that touches the frame edge (About staff, International, BMI) is
  cut hard at 1440 + gutter beside the band.

## 3. Test matrix

Widths: 320, 360, 375, 390, 414, 440, 480, 768, 820, 1024, 1280, 1366, 1440, 1536, 1600, 1680, 1920, 2560 (Chrome, 83 pages:
every template in Global / UAE / KSA, English and Arabic); 320, 360, 390, 414, 768, 1024, 1280, 1366, 1440, 1920, 2560 (WebKit and
Firefox, 39 pages = every template + Arabic key pages); every 40px from 320 to 2560 on Home, About, Find a Doctor, Contact,
Hospitals and Arabic Home (Chrome). Checks per load: horizontal scroll and the element causing it, full nav ≥ 1200 / burger
below (panel opens inside the viewport, items ≥ 44px), touch targets ≤ 1024, off-centre boxes ≥ 1280, text past its box;
full-page screenshots at 360 / 768 / 1024 / 1440 / 1920 / 2560 reviewed by eye for the wide layouts.

| Test | Chrome 141 (= Edge engine) | WebKit (Playwright 2359, Safari 26 engine) | Firefox (Playwright 1543) | Safari.app | Edge.app | iOS |
|---|---|---|---|---|---|---|
| Horizontal scroll, any page / width | PASS (0 / 1494 loads) | PASS (0 / 429) | PASS (0 / 429) | NOT TESTED | NOT TESTED | NOT TESTED |
| Nav: full ≥ 1200, burger below, panel usable | PASS | PASS | PASS | NOT TESTED | NOT TESTED | NOT TESTED |
| Intermediate widths (40px steps) | PASS (0 issues) | NOT TESTED | NOT TESTED | — | — | — |
| Text inside its box | PASS after fixes (re-swept) | PASS after fixes | PASS after fixes | — | — | — |
| Cross-engine box diff (9 pages × 6 widths, 6px tolerance) | reference | PASS (only innerText key artefacts) | PASS after R4 (re-verified on Home) | — | — | — |
| Hero / rows / bands beyond 1440 (1920 + 2560 screenshots, all templates, EN + AR) | PASS | PASS (1920) | PASS (1920) | — | — | — |
| RTL (Arabic pages in every sweep) | PASS | PASS | PASS | — | — | — |
| Touch targets ≤ 1024 | see §5 | see §5 | see §5 | — | — | — |
| `npm test` (6 node suites) | all passed | | | | | |
| Lint / type-check | NOT AVAILABLE (no eslint, tsc or astro check in the repo) | | | | | |
| Build | PASS (1592 pages, compat pass over 1292 files) | | | | | |

Edge: Microsoft Edge is not installed on this Mac; it shares Chrome's engine, so the Chrome results apply to its layout but
Edge.app itself is NOT TESTED. Real Safari: Remote Automation, "Allow JavaScript from Apple Events" and screen capture are all
disabled for this terminal, so Safari.app could only be opened, not driven or captured; WebKit via Playwright is the proxy.

## 4. Regression checks

Animations and behaviour that depend on the changed rows were exercised with motion enabled: the three Home rows loop
seamlessly in English and Arabic at 1920 (copies fill the wider scroller, dots recount), drag-scroll and pagination unchanged
(they read the scroller's own width). The hero cursor-follow, dropdowns, pop-up, forms and lightboxes were not changed.
Desktop layouts at 1280-1440 are byte-identical in the changed components (`--gutter` is 0 there).

## 5. Open / not fixed (by decision or out of scope)

- Pagination dots are 24px wide (44px tall) on phones — the open "24px dots" decision from the 9 Oct responsive sweep.
- Footer link lists are 9px rows at exactly 1024 (desktop layout starts there) and doctor-card name links 13px at 1024 —
  Figma density; the card buttons are the targets.
- Section headings with Figma-positioned boxes (Refer, Insurance, Testimonials, Feedback, BMI) are 3-7px off the page centre
  (Figma positions), not changed.
- UAE In-School page: the overview lead paragraph measures 4px past its box at 320 (trailing space of a `pre-wrap` line);
  nothing is visibly cut.
- Arabic 404 / legal pages share the same templates and passed; Arabic pop-up text remains English (B4).

## 6. The Safari photo

The photographed header (desktop nav scaled as for 1440 on a narrower window, Book button cut) could not be reproduced in
WebKit: viewport 1000-1920, in-place resizes, retina scale, staging and local builds all lay out correctly, and a build with
every media query removed looks completely different (collapsed, not scaled). The only mechanism found that produces exactly a
"1440 layout on a narrower window" is R7 — a Safari that does not parse range media queries (16.0-16.3; Safari 15 would also
lose the `cqw` unit, now covered by the `@supports` fallback). Please ask which Safari version / machine the photo came from;
the compat pass makes that scenario moot either way.

## 7. Follow-up (9 Oct 2026, late): Safari dropdowns and text over hero art

- **Safari dropdowns cut to one row** (user screen recording of staging): WebKit clips both axes when a sticky, composited box has a
  single-axis `overflow-x: clip` (WebKit bug 271457). Fix = bug 085 (`.hd .stage { overflow: visible }`, Header.astro, parallel
  session); staging was redeployed with it. Not reproducible in headless WebKit, which is why the sweeps had passed.
- **Text over the hero art** (user screenshot, Who We Are): a new alpha-sampling check (`.astro/qc-resp2/hero-overlap.mjs`: every
  title / paragraph / button line of every hero with a subject layer is sampled against the layer's alpha, 1024 + 1440, all 6
  editions from the sitemaps, 264 pages) found 2 templates: Who We Are (client title 4 lines at 39px + the Figma 374 paragraph box
  ran 83px into the doctor's arm) and Accreditations (two paragraph lines 54-57px into the art). Fixes: Who We Are title at 36
  (as Why Cambridge, bug 071) + paragraph box 290; Accreditations paragraph box 315 (`src/pages/[...base]/about/*.astro`).
  Flat building banners (no alpha layer, checked by eye + a column-variance scan of the PNGs): Al Ain (photo from Figma x 432),
  Al Mudeef (414) and Jeddah (474) ran under the 389 box — `heroLayout.textW` 320 / 300 / 360 in their content files, read by the
  hospital page. Re-check after the fixes: 0 overlapping lines on every edition and language.
- **Arabic hospital pages mirrored the building photos** (sign boards and the ambulance read backwards): the bug 021 rule now
  applies to them (`keepComposition` when the banner has no people layers; Abu Dhabi keeps its mirror).
- Jeddah / Dhahran / Al Khobar Arabic heroes still show the English paragraph (B4, Arabic content not supplied).
