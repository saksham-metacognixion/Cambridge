# QC report (scope section 4, automated part)

Generated 5 Oct 2026 on the staging build (`PUBLIC_SHOW_PENDING_NOTE=true`, Turnstile test key, `INDEXABLE=false`), served by `tools/qc/serve.mjs` (gzip + cache headers like the nginx / Cloudflare targets). Re-run everything with:

```
npm run build && node tools/qc/serve.mjs 4400 &
node tools/qc/static.mjs            # every page: meta, hreflang, canonical, headings, images   -> docs/qc/static.json
node tools/qc/links.mjs             # link audit                                                -> docs/link-audit.md
node tools/qc/browser.mjs           # responsive, Find a Doctor, forms, keyboard (Chrome)        -> docs/qc/browser.json
node tools/qc/lighthouse.mjs        # Lighthouse mobile + desktop                                -> docs/qc/lighthouse.json
npm test                            # form function, doctor / condition filters, sanitiser
```

## Summary

| Area | Check | Result |
|---|---|---|
| SEO | Title + meta description on every page (450 pages, 6 editions) | PASS 450/450 |
| SEO | Canonical URL from the one config value (`site.config.mjs`) | PASS 450/450 |
| SEO | hreflang set between editions (+ x-default); hospital pages list only the editions that have them; 404 pages none | PASS 450/450 |
| SEO | One sitemap per edition (`/sitemaps/<edition>.xml`, 6 files) with the same alternates; 404 and legal-free | PASS |
| SEO | 404 pages `noindex`; staging build `noindex` everywhere | PASS |
| Links | 444 crawled pages, 20 772 internal links, 3 270 pop-up links, 28 in-page hashes, 1 752 language / region switches | PASS, 0 broken, 0 `href="#"` (docs/link-audit.md) |
| Structure | Exactly one `h1` per page | PASS 450/450 |
| Structure | Heading order inside `main` (no skipped level) | PASS 450/450 |
| Images | `alt` on every `<img>` (empty for decoration) | PASS 450/450 |
| Images | `width` + `height` on every `<img>` | PASS 450/450 (3 decorative SVGs fixed) |
| Images | Every raster image below the hero is `loading="lazy"`; hero `eager` + `fetchpriority="high"` | PASS 450/450 |
| Images | 1x + 2x, AVIF + WebP fallback for every raster `<Picture>` | PASS (build pipeline) |
| Responsive | No horizontal scroll at 360, 390, 414, 768, 1024, 1200, 1280, 1366, 1440, 1536, 1920 on one page per template (30 pages incl. RTL) | PASS 30/30 |
| Responsive | 1440-wide stages centred (equal side margins) at 1440, 1536, 1920 | PASS 30/30 |
| Find a Doctor | country persists when speciality / name change; URL round trip; back button; empty state; `/ae` + `/sa` defaults | PASS 9/9 |
| Forms (8 forms x EN + AR) | required errors in EN / AR, consent required, Turnstile slot present, mocked submit shows the success message, consent posted, nothing stored in the browser | PASS 96/96 |
| Forms (server) | validation, consent, Turnstile, origin, unknown form, per-region inbox (`npm run test:functions`) | PASS 25/25 |
| Keyboard | header menu order, Book pop-up (Enter opens, focus trapped, Escape closes + restores focus), tabs arrow keys, contact form, mobile menu | PASS 5/5 |
| Performance | Lighthouse mobile / desktop on Home, Find a Doctor, hospital page | PASS performance 99-100, accessibility 100 (table below) |
| Unit tests | doctor filters, condition filters, HTML sanitiser | PASS |

### Browser suite (tools/qc/browser.mjs, Chrome 154)

140 checks, **140 pass, 0 fail** (docs/qc/browser.json).

| Group | Checks | Result | What it covers |
|---|---|---|---|
| Responsive | 30 | 30 pass | one page per template (30 incl. `/ar`, `/sa/ar/our-hospitals/al-khobar`, `/ae/ar/find-a-doctor`) x 11 widths: no horizontal scroll; 1440-wide stages centred at 1440 / 1536 / 1920 |
| Find a Doctor | 9 | 9 pass | country narrows the list and stays selected when the speciality or the name query changes; state in the URL; URL round trip; back button; empty state; `/ae` and `/sa` list only their doctors by default |
| Forms | 96 | 96 pass | 8 forms (Contact page, Home "Get in touch", Book / Inquiry / Opinion pop-ups, Patient Feedback, Refer a Patient, International) x EN + AR: Turnstile slot present, required errors incl. consent, error text shown, mocked `/api/forms/*` submit shows the success message, consent posted, no cookie / storage written |
| Keyboard | 5 | 5 pass | Tab order through the header; Book pop-up opens with Enter, traps focus, Escape closes and returns focus; tabs follow Arrow / End; contact form fields reachable, consent toggles with Space; mobile menu opens with Space and its links are reachable |

Arabic error texts are the English fallback until B4 (the test accepts either and records the text).

### Lighthouse 12 (simulated mobile throttling / desktop preset)

| Page | Form factor | Performance | Accessibility | Best practices | SEO | LCP | CLS | TBT |
|---|---|---|---|---|---|---|---|---|
| / | mobile | 100 | 100 | 96 | 58* | 1.7 s | 0 | 0 ms |
| / | desktop | 100 | 100 | 96 | 58* | 0.4 s | 0 | 0 ms |
| /find-a-doctor | mobile | 100 | 100 | 96 | 58* | 1.9 s | 0 | 0 ms |
| /find-a-doctor | desktop | 100 | 100 | 96 | 58* | 0.4 s | 0 | 0 ms |
| /our-hospitals/abu-dhabi | mobile | 99 | 100 | 96 | 58* | 1.9 s | 0 | 0 ms |
| /our-hospitals/abu-dhabi | desktop | 100 | 100 | 96 | 58* | 0.5 s | 0 | 0 ms |

\* SEO 58 is the staging build on purpose: every page carries `noindex` and robots.txt disallows crawling until `INDEXABLE` is flipped at go-live (site.config.mjs). Nothing else fails in the SEO category. Best practices 96 = the Turnstile test key's third-party script and the `console` warnings of the fallback-font preload; both disappear with the production key and the Gotham files.

What still holds a point back, and what it needs:

| Lighthouse note | Where | Why | Action |
|---|---|---|---|
| "Properly size images" 28-145 KiB | doctor cards (2x source served at 1x), hospital banner on desktop | the 2x candidates are picked on a 1x viewport because the `sizes` attribute of a few cards is wider than the rendered box | tune `sizes` on `DoctorCard` / hospital `PageHero`; cosmetic, no score impact |
| "Defer offscreen images" 23 KiB (Home mobile) | the second screen of the Home hero follow-layers | they are `eager` on purpose (the cursor-follow animation needs both layers at once) | leave |
| Text compression | - | measured against `tools/qc/serve.mjs` with gzip; nginx (`gzip on`) and Cloudflare do the same. Without it mobile performance drops to 76-80 (HTML is 120-220 KB uncompressed because the four pop-up forms and the dial-code lists are inlined on every page) | keep compression on at the host; a later win is to inline the pop-ups once per page instead of per form |
| HTML weight | all pages | see above; the country / dial-code `<select>`s are repeated per form | optional follow-up (not a score issue once compressed) |

## Fixes made during QC (no decision needed)

- Contact page form had no client validation wiring (it relied on native browser messages and reloaded the page on submit): it now uses the shared form script like every other form — EN/AR required errors under each field, consent error, Turnstile slot, JSON submit, success message, `aria-describedby`.
- Three decorative SVGs without `width`/`height` (CTA tab divider line, the International consent icons).
- The Home contact form's consent link and the Contact page consent link pointed to `#` after the legal pages were added: both resolve the privacy page now.
- Language / region switches on hospital pages that do not exist in the target edition landed on a 404: they go to the nearest existing parent (see link audit).
- Browser-side form test harness: respects per-field `max` (International "age" = 3 characters).

## Open items from QC (logged in docs/open-decisions.md)

- P3 contrast (white on cyan, cyan on white): Figma colours kept; Lighthouse's accessibility audit passes because the affected text is in buttons it rates as large / decorative, but WCAG AA is not met for the 13 px labels. Decision pending (Padmavathi).
- Social icons are one image, no links (LA6).
- The Gotham fonts are not in the repo (B1): all screenshots use the fallback font, so line breaks differ from Figma; Lighthouse shows a font preload warning until the files arrive.

## Fidelity re-check against Figma at 1440 (24 pages, side by side)

Method: cached Figma frame (1052 px, scaled) next to the build at 1440, every built page with a frame. Remaining differences and their reason:

| Page | Difference | Reason |
|---|---|---|
| all | line breaks of headings / paragraphs differ by a word here and there; hero titles wrap differently (e.g. "Your Path to Recovery." fits one line) | fallback font (B1): Gotham Book / Medium are narrower or wider than the system font; resolves with the woff2 files |
| all | header shows "We are listening" as the first top link; Figma has no such link | scope 2.5 requirement, flagged A2 |
| Home | the "Get in touch" form shows a consent row and the testimonial quote icon sits 1-2 px lower | consent row required by scope 2.7 (P2); icon position is sub-pixel rounding at 1440/1052 |
| Home / About / all forms | unselected radio circles instead of Figma's pre-selected "Male" | a form cannot pre-select a gender (P2) |
| Contact, Patient Feedback, Refer, International | consent row + Turnstile slot (invisible) instead of Figma's reCAPTCHA box (International only) | scope 2.7: consent on every form, Turnstile instead of reCAPTCHA (P2) |
| Patient Feedback | the Figma form card ends 60 px lower because its SUBMIT sits under an empty area; build puts consent + SUBMIT directly under the textarea | consent row added (P2) |
| Doctor profile | CTA / footer gap 1 px | rounding |
| Our Hospitals | hero map labels 1 px off at 1440 | rounding of the 8.112 px Figma label size |
| Hospital detail (Abu Dhabi) | left gallery thumbnails vertically centred (Figma: 10 px higher than the right ones); map band full width (Figma: 5 px off the frame edge); "Open in Google Maps" centred (Figma: 9 px left); address line under the button | normalised (HD6); address / phone / hours required by scope 2.5 (HD4) |
| Health Article | date line, body typography, hero photo not mirrored in RTL | AR3 / AR4 / AR6 |
| Post Acute Care | condition card titles at a single top offset (Figma: 77-84); card gaps 15/16/15 kept | OC5 |
| Inpatient Care | second card row same height as the first (Figma: 11.8 px taller) | OC5 |
| Careers, Accreditations, Why, About | none beyond the font | - |
| Media Hub, Conditions, Patient Hub, Find a Doctor, Insurance, Testimonials, FAQ | none beyond the font | - |
| 404, Legal | no Figma frame | NF1 / L1 |

Mobile / tablet (768 and 390) for every template incl. the seven new pages: `docs/mobile-review/index.html` (Figma | 768 | 390, decisions per page, automatic text-style comparison with 1440: 0 differences on every new page).
