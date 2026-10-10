# Images, hero backgrounds, speed and responsive QA — 10 Oct 2026

Two user briefs on 10 Oct ("Image Optimization, Performance, Responsiveness & Full QA", then "Urgent Image, Background, Speed &
Responsive Fixes"). The briefs say Next.js; the site is Astro (static), so the Astro image pipeline and build hooks were used.
Builds and evidence: `.astro/qc-opt/` (dist0 = before, dist5 = final; scripts listed at the end). Nothing committed or deployed.

## 1. Home hero background disappearing on phones (fixed)

**Symptom.** Below 768 px the Home hero showed the mother and baby on a blank white area: the pill artwork that sits behind
them in the banner (visible from 768 px up, and on the live site's phone layout) was gone. The user's screenshot was of the live
WordPress site; the new build had the same kind of fault.

**Root cause.** The hero has two layers made from the same 1052×500 banner: the background (gradient + pills) and the people.
On phones they were laid out independently: the background filled the whole stacked hero with `object-left`, which crops it to the
plain gradient side, while the people layer was enlarged to 162 % and moved into its own block under the text. Any size change
of one layer moved it away from the other, and the pills (right half of the banner) were always cropped out.

**Fix** (`src/components/sections/Hero.astro`). Below 768 px the background layer is drawn a second time inside the people's box with
exactly the people layer's geometry (same file, same width, so same height). The two can no longer drift apart at any width.
Its top fades in with a CSS mask, so the grey art meets the lighter stage without a seam. In RTL it is anchored at the right
like the in-flow people layer. The people layer is now marked `data-hero-subject` so the cursor-follow script keeps moving the
people only. Same URL and `sizes` as the stage background: one request (checked: 1 `banner3-bg` request at 390 and 1440).

**Verified.** Background copy box = people box on `/`, `/ar/`, `/ae/`, `/ae/ar/`, `/sa/`, `/sa/ar/` at 320, 360, 375, 390, 414, 440, 600,
640, 700, 767 px (66/66); hidden from 768 px. Real Safari.app 26: `/`, `/ar/`, `/sa/ar/` at 390–600 aligned, mask applied.

**Every other page hero** (811 non-news routes + 40 sampled news posts × 360/600/768/1024/1920 = 4,255 views): 0 hero layers apart,
0 broken hero images, 0 horizontal scroll. PageHero / ContactHero / FeedbackHero keep both layers in one box with the same
classes, so they were already safe. Flags left are by design: doctor profiles (portrait card, not a banner) and legal pages (no hero image, same as before).

## 2. Image optimisation

| Change | Where | Effect |
|---|---|---|
| Logo pattern as 32-colour palette PNG instead of AVIF (`tools/images/logo-pattern.mjs`) | Home Contact section (6 Home pages), Media Hub newsletter | 1430 px: 208 KB → 90 KB; 720 px: 79 KB → 46 KB. Closer to the source than the AVIF (mean error 0.15 vs 0.41 of 255 on the page pixels; the AVIF smudged the thin lines). |
| News post photos offered at their full 1400 px (were capped at 1052 and shown upscaled at 1440) | `PageHero.astro` (all post pages) | Sharp at 1440 / 2x screens; `sizes` = 55vw on desktop (the photo fills 55 % of the hero) |
| `sizes` that still assumed the old 1440 px cap → `vwSizes()` | Insurer cards, Home hospital cards, hospital cards, care cards, hospital gallery, Who We Are globe, article video poster, Media Hub post cards | 1920 screens get the right file (fit flags at 1920: 210 → 98, all remaining are source-limited); phones get the 2x post card (was 1x) |
| Phone-size candidates + measured phone `sizes` | Why (team, accreditation, wireframe), Who We Are network, Our Hospitals impact, Contact map | Phones no longer download desktop files |
| Media Hub tiles get a 2x candidate | `ExploreMedia.astro` | Sharp on retina |

Not changed on purpose: the Home insurer strip keeps 1x/2x density descriptors (with `fit="contain"` Astro makes smaller 2x files from
width descriptors: tried, reverted); hospital gallery side slides keep the main-slide size (they rotate into the main slot, 9 Oct decision).

Measured bytes (Chrome, full scroll, cache off, 38 pages):

| Viewport | Total before → after | Images before → after |
|---|---|---|
| 390 @3x (phone) | 16,270 → 15,761 KB | 10,498 → 9,951 KB (−5 %) |
| 768 @2x | 16,616 → 16,668 KB | 10,841 → 10,856 KB |
| 1440 @2x | 17,267 → 17,369 KB | 11,497 → 11,556 KB |
| 1920 @1x | 16,633 → 17,358 KB | 10,856 → 11,550 KB (sharper images, was 0.75x) |

Home on a phone: 763 KB → 652 KB per full scroll (each of the 6 editions −111 KB). Desktop grows slightly because images that
were blurry at 1920 / 2x now get the right size. Static scan of all 1,592 pages: 0 images without width/height, 0 `<picture>` without AVIF,
0 srcset without sizes, 0 duplicate scripts, 0 duplicate requests.

## 3. Caching

Fonts must stay in `public/fonts/` (project rule), so their names cannot carry a hash. Vercel served them `max-age=0` (revalidated
on every page view); the nginx config cached them a year with no version (a fixed font, like today's U+00A0 patch, would never
reach returning visitors). `fontVersions()` in `astro.config.mjs` now appends `?v=<content hash>` to every font URL in the built CSS
and HTML (preloads included), and `/fonts/*` + `/_astro/*` are cached `immutable` in `vercel.json` (also `tools/vercel-json.mjs`),
`public/_headers` (Cloudflare Pages) and nginx. Effect is on repeat visits (not visible in a cold Lighthouse run).

## 4. Lighthouse 12 (local build, simulated mobile / desktop, 38 pages × 2, one run each)

| | Before | After |
|---|---|---|
| Mobile performance avg / min | 96.3 / 94 | 96.4 / 92 (`/ar/`; run-to-run noise is ±3) |
| Desktop avg / min | 99.9 / 96 | 100 / 100 |
| CLS (all pages) | 0–0.011 | 0–0.011 |
| "Properly size images" pages | 10 | 5 (hospital galleries by design, Media Hub phone 2x cards) |
| Accessibility min / Best practices | 93 / 100 | 93 / 100 |

These are lab numbers on the local HTTP/1.1 server (2–4 points under the HTTP/2 staging host); no field (real-user) data exists.
The remaining mobile bottleneck is structural: the global stylesheet (31 KB gz) and the 48 KB gz Home HTML (four pop-up forms
rendered on every page) on the critical path, not images.

## 5. Responsive and browser checks

- Image layout regression: every `<img>` box and page size, before vs after, 38 pages × 390/768/1440/1920 (Chrome): identical (9 one-pixel
  differences on the first run were load timing; re-run 0).
- Static layout sweep (`.astro/qc-resp3/all.mjs`) on the 20 pages built from every changed component (all editions, EN + AR) × 320, 360, 375,
  390, 414, 440, 600, 768, 820, 1024, 1280, 1366, 1440, 1600, 1920, 2560 in Chrome, WebKit and Firefox: 0 horizontal scroll, 0 nav / overlap /
  broken image issues. Remaining flags are known: 1024 px touch density (R072) and Figma-offset headings; one WebKit-only "off-centre"
  hospital list was checked: identical boxes in all three engines (heuristic artefact).
- Real Safari.app 26 (macOS): Home EN/AR/KSA-AR heroes, Media Hub, About; versioned fonts and the new pattern load.
- Edge: same engine as Chrome (Blink); Edge.app not installed, NOT tested itself. Real iPhone: not re-tested today (the 10 Oct morning
  audit covered it before these changes). Landscape: covered by the 10 Oct audit, not re-run.
- `npm test`: all suites pass. Production build: succeeds (1,592 pages).

## 6. Open

- Live site (cambridgehospital.com) is WordPress and not part of this build; the screenshot's white band there is not fixed by this work.
- 2x sources still missing for the Figma-size banners and some logos (see the 9 Oct performance audit).
- Another session changed `Hero.astro`, `global.css`, `hero-edge.ts` and the newsletter files in parallel today; this work edited around
  their changes and did not touch their lines.

Scripts: `weight.mjs` (bytes + decoded width vs rendered), `srcset-headroom.mjs`, `boxes.mjs` / `firstdiff.mjs` (layout regression),
`hero-align.mjs`, `hero-all.mjs`, `hero-shots.mjs`, `shotdiff.mjs`, `safari-hero.mjs`, `pattern-enc.cjs`, `bgreq.mjs`.
