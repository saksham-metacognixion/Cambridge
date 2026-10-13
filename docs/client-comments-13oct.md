# Client sheet "CH Website Comments.xlsx" — checklist (13 Oct 2026)

Source: `docs/CH Website Comments.xlsx`, one sheet, 17 pointers (rows 3–19; columns Site / Page / Description / Screenshot / Status).
Statuses: **Fixed** = built and verified · **Pending** = not done · **Blocked** = needs client input.
Open questions for the client: `docs/open-decisions.md` → CW1–CW6. QA scripts and screenshots: `.astro/qc-xlsx/`.

| Row | Site / page | Client comment | Status | What changed (files) |
|---|---|---|---|---|
| 3 | Global · Home | Menu is too big | **Fixed** (CW4) | Above 1440 the header keeps its 1440 size (~163px tall; was ~200 at 1920, ~270 at 2560) but still spans the full width: logo at the start, menu group at the end, margins scale. 1440 and below pixel-identical. `Header.astro`, `global.css` ("Header capped") |
| 4 | Global · Home | Book an Appointment: font to be white | **Fixed**, contrast flagged (CW1) | White label on the cyan header button (2.2:1, below AA; user-approved). `Header.astro` |
| 5 | Global · Home | "Integrated Care…" text centre-aligned | **Fixed** | Paragraph centred. `sections/Services.astro` |
| 6 | Global · Home | Cards: UAE and KSA, not "Start Your Care" | **Fixed** (CW2: KSA image needed) | Global edition: one button per country where the service exists. In-School made KSA-only (user decision 13 Oct, client wording): KSA button only, /sa In-School pages built, /ae In-School 301 to /ae Our Care. /ae, /sa keep "Start Your Care". `lib/region-buttons.ts`, `shared/CareCard.astro`, `sections/Services.astro`, `data/care.json`, `vercel.json` |
| 7 | Global · Who We Are | Tabs smaller, like the live site | **Fixed** | Foundation tabs use the shared ICU look. `who-we-are/Foundation.astro` |
| 8 | Global · Who We Are* | Text aligned with the picture (Continuum) | **Fixed** | Text centred vertically on the photo card. `why/Features.astro` |
| 9 | Global · Who We Are* | Text aligned with the picture (Pioneer) | **Fixed** | Same component as row 8 |
| 10 | Global · Accreditations | Smaller tabs; logos the same size | **Fixed** | ICU tab look; logos trimmed to their artwork and sized for equal area, one shared centre. `accreditations/Standards.astro`, `assets/accreditations/*.png`, `content/accreditations/page.en.json` |
| 11 | Global · Careers Hub | Rectangle and footer glued together | **Fixed** | 41-Figma-px gap above the footer, as on the other About pages. `pages/[...base]/about/careers.astro` |
| 12 | Global · Our Care | Missing outlines; UAE and KSA, not Start Your Care | **Fixed** | Full-card outline over the photo, at least 1 device px; country buttons on the hub and the Inpatient / Outpatient cards (Global). `care/SubServiceGrid.astro`, `hospital/CareCards.astro`, `pages/[...base]/care.astro` |
| 13 | Global · Outpatient | Text not aligned across the cards; missing outlines | **Fixed** | Desktop: cards share rows (photo / title / text / button) via subgrid, so texts start level; outline as row 12. `care/SubServiceGrid.astro` |
| 14 | Global · Our Hospitals | No space between header (hero) and video | **Fixed** | Margin collapse removed: 31 Figma px gap restored on every hospital page. `hospital/EnvironmentBand.astro` |
| 15 | Global · Insurance | Double check with the live website only | **Fixed** (CW3 open) | List = live insurer records (8 UAE + 9 KSA), live names; 11 others hidden (data kept, `onLive: false`). `data/insurers.json`, `lib/insurers.ts`, `sections/Insurance.astro` |
| 16 | UAE · Home | Needs alignment (stats out of the band) | **Fixed** | Facilities offsets from the hospital count: stats inside the band, short list centred. Global unchanged. `sections/Facilities.astro` |
| 17 | UAE · Neurorehabilitation | Add the icons; small text grey (live) | **Fixed** (CW6) | Live icons (Stroke = neuro, TBI = musculoskeletal, Spinal = post-surgical); card text #6b6b6b. `data/care.json`, `care/ConditionCards.astro` |
| 18 | All website | All tabs like this (ICU tabs) | **Fixed** | Who We Are, Accreditations, FAQ now match; detail pages + Careers already did. |
| 19 | FAQs | Needs alignment | **Fixed** | FAQ category tabs = ICU look, one size for every tab, labels on one edge. `faq/FaqSection.astro` |

\* Rows 8–9 are filed under "Who we are"; both screenshots are from the Why Cambridge Hospital page (About), which is where they were fixed.

## Verification (13 Oct 2026)
- Every pointer screenshotted against the client's image at 1440 (Chrome), plus 360 / 390 / 768 / 1024 / 1280 (Chrome) and
  390 / 1440 (WebKit = Safari engine, Firefox); Arabic (RTL) for the care hub, Who We Are, FAQ and Outpatient. No horizontal
  scroll and no page errors on any of them. Header at 1441 / 1920 / 2560 in all three engines (dropdowns open).
- Production build (1592 pages, as before) and `npm test` (45 checks) pass. All 76 new country-button links resolve to a built page.
- Not tested: real iOS / iPadOS devices and Microsoft Edge (Edge uses Chrome's engine; WebKit stands in for Safari).
