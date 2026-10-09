# Performance audit (scope 2.10 / 10) — 9 Oct 2026

Requirements audited: PageSpeed 95+ mobile and desktop, image optimisation (1x/2x, WebP/AVIF, width/height, srcset/sizes),
lazy loading, each library loaded once. Everything below was measured on the built site, not inferred from the code.

Evidence: `docs/qc/performance-audit/` (Lighthouse before/after summaries, staging baseline, image-size check, HTML scans).
Scripts: `.astro/qc-perf/` (not tracked: lh-matrix, lh-repeat, lh-table, compare, scan-html, img-sizes, lazy-check, svg-diff).

## How it was measured

- Build: `astro build` into a scratch directory, served by `tools/qc/serve.mjs` (gzip + immutable cache headers, HTTP/1.1).
- Lighthouse 12.8 via `npx lighthouse@12`, default mobile (simulated Moto G Power, 4G, 4x CPU) and `--preset=desktop`,
  39 URLs = every page template x editions (Global EN/AR, UAE EN/AR, KSA EN/AR), one run each before and after
  (`lighthouse-before.json`, `lighthouse-after.json`), plus 3-run medians on the key pages.
- Real host: the SAME Lighthouse against the staging link (Vercel, HTTP/2) for the before state (`staging-before.jsonl`).
  Google's PageSpeed Insights API was tried for both states and refused every call (shared anonymous quota exhausted:
  `Queries per day` for pagespeedonline.googleapis.com); a Google API key would be needed to use it from here.
- Noise: identical content scored 91-96 across repeated mobile runs, so single-run differences under ~3 points are noise.
  The local HTTP/1.1 server scores LOWER than the real HTTP/2 host (Home mobile: 94 local vs 96 median on staging) because
  Lighthouse's simulator charges a round trip per request on HTTP/1.1; the local numbers are the conservative bound.

## Status by requirement

| Requirement | Status | Evidence |
|---|---|---|
| PageSpeed 95+ desktop, every template | **Pass** | 38/38 pages 100 after (99-100 before). |
| PageSpeed 95+ mobile, every template | **Partial → mostly Pass** | Local HTTP/1.1: before avg 93.5, 25/38 pages under 95 (min 90); after avg 96.5, 35/38 at 95+ (Home 94, `/ar` 93, `/ae/ar` 93). On the real HTTP/2 host the before build already scored Home 96 / About 99 / Find a Doctor 97 (3-run medians); the after build is expected to be ≥ 97 there but could not be measured (see blockers). |
| Core Web Vitals | **Pass** | CLS 0-0.011 everywhere (the /ae/ar hero shift 0.014 is gone), TBT 0-28 ms, LCP mobile 2.1-2.8 s simulated (desktop 0.4-0.7 s). |
| Images: 1x + 2x for the rendered size | **Partial** | Every raster `<Picture>` emits 2-3 width candidates with `sizes`. Where the SOURCE file is only Figma-frame size the 2x cannot exist: hero banners (1052 px source shown at 1440 = 0.73x on desktop, 0.55x at 1920), the About / hospital video thumbnail (429 px source shown at 587-773 px), the hospital map band (1052 px), the Media Hub tile overlay (222 px), the "Dr Ahmad" placeholder (281 px) and the insurer logos (1x WebP from the live site). All need higher-resolution exports (Figma at 2x / client originals); nothing was fabricated. Phones get the 2x candidate (3x screens are capped at 2x by design). |
| Images: WebP / AVIF | **Pass** | 7 718 `<picture>` elements on 1 592 pages, every one AVIF + WebP fallback (`html-scan-*.json`: pictureNoAvif 0). Only the WordPress logo imports are WebP-only (lossless sources). |
| Images: width + height on every image | **Pass** | 123 564 `<img>` tags, 0 without both attributes (static scan, after). |
| Images: srcset + sizes | **Pass** | 0 `<source>` with width descriptors and no `sizes`. One oversized case: hospital gallery side slides get the 885 px main-slide size (2.4x at 370 px) because they rotate into the main slot; left as is. |
| Lazy loading below the fold, eager + fetchpriority on the LCP image | **Pass (fixed)** | Before: 13 304 lazy of 123 564 img tags; every hidden pop-up icon, footer logo and below-fold decoration loaded eagerly. After: 110 246 lazy; the only eager images are the header logo/rules and the hero layers (`fetchpriority="high"` on the hero subject, 1 368 pages; the remaining 224 pages are the ones whose hero is text/map). Verified in Chrome at 390 px: images load as they scroll into view on every template (Home 52 → 107 of 196 after a full scroll, the rest are horizontally off-screen carousel copies; all other pages 100 %), the three video facades stay a poster until clicked. |
| Each library loaded once | **Pass** | No third-party bundle on page load. Google Maps JS loads only on the Contact page map when a key exists, Turnstile only when a form is used (guarded against a second `<script>`), YouTube only on click (facade). All Astro `<script>`s are hoisted modules: 0 duplicate script URLs on any page, shared code (`autoscroll`, `hero-follow`, `countup`, `pagination`, `forms`) is one chunk each (total JS 18 KB gzipped across the whole site), 2 stylesheets per page (global 30 KB gz + page). Carousel setups run once per module and guard with `data-ready`. |
| Lightweight CSS animations | **Pass** | All motion is CSS transitions / `requestAnimationFrame` in first-party scripts; no animation library. |
| Render-blocking | **Partial (by design)** | One global stylesheet (Tailwind + global.css, 152 KB raw / 30 KB gz) is the only blocking resource; it serves all 1 592 pages and is cached immutable. Splitting it per page is not possible with Tailwind v4 without a build change. |

## Fixes made (smallest safe change each)

1. **Hidden and below-fold images were eager** — `loading="lazy"` added to 79 `<img>` tags in 39 components
   (pop-up forms, country pop-up chrome, footer, form fields, section rules/icons, cards). Header and hero components untouched.
   Effect on Home mobile: requests started before the LCP paint 63 → 36, bytes 391 KB → 306 KB.
2. **Country pop-up map was the mobile LCP on every Global page and waited for the dialog to open** (Load Delay ~2 s on the
   hospital, Why, legal pages) — it is now `loading="eager" fetchpriority="high"` with `sizes` matching its 346 px box
   (it previously requested the 2x file on desktop: "Properly size images 28 KiB"). `src/components/forms/CountryPopup.astro`.
3. **Three logo SVGs at 64-67 KB each on every page** (header, footer, pop-up) and 22 other SVGs > 6 KB — optimised with
   svgo (precision 3, multipass). Header logo 24 KB → 11 KB gzipped; 25 files, 1.0 MB → 0.5 MB. Every file was
   pixel-compared against the original in Chrome at 1200 px: identical apart from edge antialiasing (≤ 1.4 % of pixels,
   none structural; Al-Buhaira and the logo checked by eye).
4. **Gotham woff2 carried 242 Greek/Cyrillic glyphs the site never uses** — subset to Latin (all Latin blocks, punctuation,
   currency, arrows, math, fi/fl; 637 → 365 code points). 36 KB → 21 KB per weight, 46 KB less on every page; metrics,
   kerning and the ascent/descent overrides unchanged (checked with fontTools: 0 advance-width differences). The site's text
   uses 162 distinct characters, all covered.
5. **Arabic pages shifted while GE SS Two loaded** (CLS 0.014 on /ae/ar) — the Medium face is preloaded on `dir="rtl"`
   pages. `src/layouts/BaseLayout.astro`.

Not changed on purpose: the Contact page logs `console.error` when no Google Maps key is set (Best Practices 96 on Contact
until the key arrives); `.cp-or` / `.cp-title` contrast in the country pop-up and the 24 px header fly-out buttons are
flagged by the accessibility audit (legal page 93, UAE/KSA pages 97) — brand colours / Figma sizes, raised not changed.

## Lighthouse 12, local server (simulated mobile / desktop preset), before → after

| Page | Mobile before | Mobile after | LCP before → after (mobile) | Desktop before | Desktop after |
|---|---|---|---|---|---|
| `/` | 94 | **94** | 3.0 s → 2.7 s | 100 | **100** |
| `/about/` | 90 | **99** | 3.0 s → 2.1 s | 100 | **100** |
| `/about/accreditations-partnerships/` | 95 | **97** | 2.8 s → 2.4 s | 100 | **100** |
| `/about/careers/` | 91 | **96** | 3.1 s → 2.6 s | 100 | **100** |
| `/about/who-we-are/` | 94 | **96** | 2.9 s → 2.6 s | 100 | **100** |
| `/about/why-cambridge-hospital/` | 92 | **97** | 3.4 s → 2.6 s | 100 | **100** |
| `/hospitals/` | 93 | **96** | 2.9 s → 2.6 s | 100 | **100** |
| `/hospitals/cambridge-hospital-abu-dhabi/` | 90 | **96** | 3.5 s → 2.6 s | 100 | **100** |
| `/care/` | 95 | **96** | 2.8 s → 2.6 s | 100 | **100** |
| `/care/inpatient/` | 92 | **96** | 3.2 s → 2.6 s | 100 | **100** |
| `/care/inpatient/post-acute-rehab/` | 95 | **96** | 2.8 s → 2.5 s | 100 | **100** |
| `/care/inpatient/post-acute-rehab/neuro-rehab/` | 94 | **97** | 2.8 s → 2.4 s | 100 | **100** |
| `/patient-hub/` | 95 | **97** | 2.8 s → 2.6 s | 100 | **100** |
| `/patient-hub/find-a-doctor/` | 94 | **97** | 3.0 s → 2.5 s | 100 | **100** |
| `/patient-hub/find-a-doctor/ahmad-al-khayer/` | 95 | **98** | 2.9 s → 2.3 s | 100 | **100** |
| `/patient-hub/conditions-specialities/` | 95 | **98** | 2.7 s → 2.3 s | 100 | **100** |
| `/patient-hub/conditions-specialities/epilepsy/` | 94 | **97** | 3.0 s → 2.5 s | 100 | **100** |
| `/patient-hub/insurance-providers/` | 95 | **97** | 2.8 s → 2.6 s | 99 | **100** |
| `/patient-hub/international-patients/` | 93 | **97** | 3.1 s → 2.5 s | 100 | **100** |
| `/patient-hub/refer-a-patient/` | 93 | **96** | 3.1 s → 2.5 s | 100 | **100** |
| `/patient-hub/testimonials/` | 95 | **97** | 2.8 s → 2.6 s | 100 | **100** |
| `/contact-us/` | 95 | **97** | 2.9 s → 2.4 s | 100 | **100** |
| `/faqs/` | 93 | **96** | 2.8 s → 2.5 s | 100 | **100** |
| `/media-hub/` | 94 | **98** | 2.9 s → 2.2 s | 100 | **100** |
| `/media-hub/12-exercises-and-stretches-for-shoulder-pain/` | 95 | **97** | 2.8 s → 2.3 s | 100 | **100** |
| `/your-opinion-matters/` | 93 | **96** | 2.9 s → 2.4 s | 100 | **100** |
| `/bmi-calculator/` | 94 | **97** | 3.0 s → 2.5 s | 100 | **100** |
| `/legal/privacy-policy/` | 95 | **98** | 2.7 s → 2.1 s | 100 | **100** |
| `/ar/` | 91 | **93** | 3.1 s → 2.8 s | 99 | **100** |
| `/ae/` | 93 | **95** | 3.0 s → 2.6 s | 100 | **100** |
| `/ae/ar/` | 92 | **93** | 3.0 s → 2.7 s | 100 | **100** |
| `/ae/hospitals/` | 95 | **96** | 2.7 s → 2.5 s | 100 | **100** |
| `/ae/ar/contact-us/` | 94 | **96** | 2.8 s → 2.4 s | 99 | **100** |
| `/sa/` | 94 | **97** | 2.7 s → 2.5 s | 99 | **100** |
| `/sa/ar/` | 92 | **97** | 3.3 s → 2.2 s | 100 | **100** |
| `/sa/ar/about/` | 92 | **97** | 3.0 s → 2.4 s | 100 | **100** |
| `/sa/ar/patient-hub/find-a-doctor/` | 93 | **97** | 2.9 s → 2.3 s | 100 | **100** |
| `/sa/hospitals/cambridge-hospital-jeddah/` | 95 | **97** | 2.8 s → 2.3 s | 100 | **100** |

Mobile: average 93.5 → 96.5, minimum 90 → 93, pages under 95: 25 → 3. Desktop: 99.9 → 100.0.
Accessibility 93-100 and SEO unchanged by this work (SEO 58 on the staging build = `noindex`). The 404 page cannot be
scored by Lighthouse (it refuses a 404 status); its HTML follows the same template rules.

3-run medians on the after build (local): Home mobile 94 (LCP 2.7 s), About 97, hospital detail 96.

### Real host (staging link, Vercel HTTP/2), before build, 3-run medians

| Page | Mobile | Desktop |
|---|---|---|
| `/` | 96 (95, 96, 100) | 100 |
| `/about/` | 99 (99, 99, 95) | 100 |
| `/patient-hub/find-a-doctor/` | 97 (97, 97, 97) | 100 |

The after build was deployed as a Vercel preview, but preview deployments on this project are behind Vercel SSO
(302 to vercel.com/sso-api), so Lighthouse could not reach it; creating a protection-bypass token was not permitted from
this session. To record the after numbers on the real host: redeploy staging (commands in the Vercel memory note /
`BUILD.md`) and run `node .astro/qc-perf/lh-repeat.mjs https://cambridge-hospital-staging.vercel.app <dir> 3 mobile / /about/ /patient-hub/find-a-doctor/`.

## What still holds the mobile score back (structural, not bugs)

- Document size: Home 306 KB raw / 45 KB gz because the four pop-up forms and the country pop-up are rendered on every page
  (98 KB raw, ~10 KB gz); the per-element inline positioning (`style="--l:…"`, 1 192 scoped attributes) adds the rest.
- The global stylesheet (30 KB gz) and 2-3 font files (21 KB each) are on the critical path of every page.
- Home / Our Care: the four Care Support card images (16 KB each, lazy) sit inside Chrome's lazy-load threshold, so they
  still download before the hero finishes on a phone.
- Chrome's lazy threshold means icons just below the fold still load early; only hidden and far-down images were removed from
  the critical path.

## Blockers / to confirm with Pramod

1. Higher-resolution sources for the 2x requirement on desktop: 21 hero banners (export the Figma banners at 2x and re-run
   `tools/hero-layers/run-all.sh`), the About / hospital video thumbnail, the hospital map band, the Media Hub tile overlay,
   the "Dr Ahmad" placeholder photo and the insurer logos (live-site uploads, 1x).
2. PageSpeed Insights numbers from Google itself need an API key (or manual runs at pagespeed.web.dev against staging).
3. Google Maps API key (removes the Contact page console error, Best Practices 96 → 100).
4. Hosting target (B6): the final numbers depend on an HTTP/2 host with gzip/brotli and immutable caching for `/_astro/`
   and `/fonts/` (Vercel staging has both; the nginx config in `deploy/` and Cloudflare Pages do too).
