# Bug 109: Post-Acute Rehabilitation hero image, regional subtitle, heading

Investigation 14 Oct 2026, then the user's decisions the same day (B109a-d in `docs/open-decisions.md`):
UAE / Global Post-Acute photo -> woman + nurse (done); Paediatric Care (inpatient) -> the live UAE hero (done); subtitles -> keep the
client document wording (no change); heading spelling -> not decided (no change).

## Sources used

| Source | What it is | Status |
|---|---|---|
| Figma 41:1730 "Post Acute Care" (`figma-cache/pages/post-acute-41-1730.png`) | approved design, one frame, no KSA frame | hero = man in grey shirt + male physio; title "Post Acute Care." |
| Client content folder `~/Downloads/Website Content - Suhad 4` (13 Oct) | declared text source since 5 Oct (user decision) | `EN-Main Page.docx` title "Post-Acute Rehabilitation", one region-neutral subtitle, no KSA document |
| Client image folder `~/Downloads/Website Assets/I1 Banners - care & section pages` | client-supplied originals; 9 Oct user decision R066: folder wins over Figma for images | `I1_Post-Acute-Rehabilitation.png` = woman + nurse; `-2` = KSA men |
| Live pages saved 9 Oct (`docs/cambridge-images-live/_pages/{ae,sa}/care/**`) | live behaviour / content at that date | live site not reopened (standing rule: no live-site browsing) |
| Staging (`cambridge-hospital-staging.vercel.app`, fetched 14 Oct) | deployed build | matches the local source |

## Post-Acute Rehabilitation: live vs staging

| | Live (9 Oct capture) | Staging (14 Oct) | Source of the staging value |
|---|---|---|---|
| UAE hero photo | elderly woman with dumbbell + female nurse (`Post-Acute-Care-Banner-UAE.avif`, 579x450) | man in grey + male physio | Figma 41:1730 |
| KSA hero photo | two men, seated stretch (`Post-Acute-Care-guy-Banner-KSA.avif`) | same photo (`regions/sa/care/banner-post-acute-care-subject.png`) | live KSA = client folder `-2` |
| Global hero photo | (no Global page saved) | same as UAE (Figma) | Figma |
| UAE subtitle | "24/7 inpatient care with expert medical supervision, nursing support, and rehabilitation services tailored to your recovery in the UAE" | "24/7 inpatient care with expert medical supervision, nursing support and rehabilitation programmes tailored to each patient's condition." | client document (13 Oct) |
| KSA subtitle | "Round-the-clock inpatient care ... shaped around your recovery in Saudi Arabia" | same as UAE | client document (no KSA version exists) |
| H1 | "Post Acute Rehabilitation" | "Post-Acute Rehabilitation" | client document title |
| Browser title | — | "Post Acute Rehabilitation - Cambridge Hospital UAE / KSA" | live SEO titles (`seo.json`, D17) |
| Inpatient card title | — | "Post Acute Care" | Inpatient document |
| Arabic H1 / subtitle (/ae/ar, /sa/ar) | not saved | "إعادة التأهيل ما بعد الحالات الحادة" + the AR document's line | `AR-Main Page.docx` (13 Oct), word for word |
| Region separation | — | /ae and /sa load different people layers; AR = EN per region | correct |

Crop and responsive behaviour: the staging hero uses the shared PageHero (cover 322, cursor-follow people layer, mobile strip).
Applied 14 Oct: `tools/client-assets/swap-hero.py care/banner-post-acute-care docs/client-assets/heroes/I1_Post-Acute-Rehabilitation.png -`
(the client's original PNG; same photo as the live AVIF). The cut-out sits where the old people stood (scale 0.89), the
background's right edge is refilled; gradient, pills, crop and cursor-follow unchanged. KSA layer untouched.

## All care pages (71 saved live pages: 36 UAE + 35 KSA (no KSA In-School page), EN; plus the 3 Our Care hub pages)

Script: `.astro/qc-bug109/cmp.py` (live H1 / first paragraph / first upload vs staging content file + hero key). Image sheets:
`.astro/qc-bug109/sheet-ae.png`, `sheet-sa.png`, `sheet-paed.png`.

| Finding | Pages | Client confirmation |
|---|---|---|
| Hero photo differs from live / client folder | **Post-Acute UAE + Global** (B109a, fixed); **Paediatric Care inpatient, all editions**: adult placeholder men instead of its own photo (B109d, fixed: live /ae hero `2026/07/Pediatric-Care-UAE.avif`, mother + boy + doctor; /sa = live KSA, same people. Correction: the first sheet showed the same-named `2026/06` card photo, not the hero) | decided by the user 14 Oct |
| Hero photo uses the Figma image, but the people match live and the folder | Our Care hub (UAE, KSA), Inpatient Care (UAE, KSA) | no |
| Hero photo = the live cut-out (9 Oct audit) | the other 32 care pages; KSA PM&R keeps the UAE photo (live file 404, R068) | no |
| Live subtitle names the region ("in the UAE" / "in Saudi Arabia"); staging uses the region-neutral document line | Post-Acute, Inpatient Care | user: keep the document wording (B109b) |
| Every subtitle differs from live | every saved page | no: staging = client documents by design |
| Heading spelling: document vs live | Post-Acute, Long-Term Care & Rehabilitation (hyphen); Paediatric x6, Programme x2, Neurorehabilitation, PM&R full name, Paediatric Care vs live "Pediatric Rehabilitation" | yes, for one site-wide rule (B109c) |

Arabic live care pages were not saved, so Arabic was checked against the client's Arabic documents only.

## QA (14 Oct, scratch build `.astro/qc-bug109/dist`, 1592 pages, no build errors)

- Built HTML: only the six Post-Acute pages (Global, /ae, /sa x EN / AR) reference `banner-post-acute-care`; /sa and /sa/ar keep
  the unchanged KSA layer hash; the six Paediatric Care pages load `pediatric-rehab-subject` (UAE file on Global / ae, KSA file on sa).
- `.astro/qc-bug109/shots.mjs`: 2 pages x 6 editions x 9 widths (320, 360, 390, 440, 768, 1024, 1366, 1440, 1920), Chrome and
  WebKit (Playwright; not a real iPhone): hero images loaded, no horizontal scroll, H1 inside the viewport, no console / JS
  errors, no 4xx: **0 problems** in 216 loads. Screenshots in `.astro/qc-bug109/shots/` (grids `pa-grid.png`, `paed-grid.png`):
  people uncropped at every width, mobile strip centred on them, RTL mirrored.
- Not tested: Firefox, real iOS Safari device.

## Status

Fixed locally: B109a, B109d. Closed with no change: B109b. Open (client): B109c spelling. Not committed, not deployed.
