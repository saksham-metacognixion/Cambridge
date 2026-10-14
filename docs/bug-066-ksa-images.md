# Bug 066: KSA-specific images on Saudi pages (9 Oct 2026)

Status: **confirmed fixes verified on staging** (commit 271ff60, deployed 9 Oct 2026 to https://cambridge-hospital-staging.vercel.app).
Two items are still waiting for the client (see "Waiting for the client").

**Reopened 14 Oct 2026** (see "Reopened 14 Oct 2026" at the end): K1 done (KSA Our Care doctor's hijab recoloured navy, user
decision), K2 kept as on the live KSA site (user's screenshot of cambridgehospital.com/sa/about/, 14 Oct), hospital banners and the
testimonials artwork re-checked.

Sources checked: the live KSA site's own files (`docs/cambridge-images-ksa/` + `_pages.json`, saved 8 Oct, and
`docs/cambridge-images-live/` + `_pages/sa/*.html`, saved 9 Oct), the WordPress export (`docs/cambridgehospital.WordPress.2026-10-06.xml`)
and the existing `src/assets/regions/sa/` set. No new downloads were needed. A contact sheet of every KSA people photo on disk is in
`docs/qc/bug066/ksa-source-contact-sheet.png`.

## Per page

| Page (EN + `/sa/ar/`) | Image | Before | Now | Source | Result |
|---|---|---|---|---|---|
| `/sa/hospitals/cambridge-hospital-jeddah/` | hero banner | `hospital-detail/banner-abu-dhabi` (HD1 placeholder: Emirati family, Abu Dhabi building) | `hospital-detail/banner-jeddah.png` | Live site: `/sa/hospitals/cambridge-hospital-jeddah/` hero = `Cambridge-Hospital-Jeddah.avif` (the hospital building), placed over the live hero gradient | **Fixed** (by the missing-image audit, 9 Oct, `tools/live-images/hospital-heroes.py`; verified here) |
| `/sa/hospitals/cambridge-hospital-dhahran/` | hero banner | same placeholder | `hospital-detail/banner-dhahran.png` | Live `Cambridge-Hospital-Dhahran.avif` | **Fixed** (same) |
| `/sa/hospitals/cambridge-hospital-al-khobar/` | hero banner | same placeholder | `hospital-detail/banner-al-khobar.png` | Live `Cambridge-Hospital-Al-Khobar.avif` | **Fixed** (same) |
| `/sa/care/` | hero people (doctor in a light-blue hijab) | `regions/sa/care/banner-our-care-subject.png` | unchanged | This file *is* the live KSA one: `/sa/care/` on the live site uses `Our-Care-Banner-KSA.avif`, the same nurse, patient and light-blue-hijab doctor as Global (`Our-Care-Global.avif`). No KSA version of this scene with a navy or black hijab exists in the live pages, the KSA uploads or the WordPress export. | **Waiting for the client** (K1) |
| `/sa/about/` | hero people (the woman on the far right in sage scrubs, no hijab) | `regions/sa/about/banner-subject.png` | unchanged | Live KSA file `About-Cambridge-Banner-KSA-1.avif`: the live KSA About page shows the same five people. No alternative exists. | **Waiting for the client** (K2), not edited, as instructed |
| `/sa/patient-hub/testimonials/` | hero background: light smudge beside the girl's head | `regions/sa/testimonials-page/banner-bg.png` (Global background + `fix-bg-edge.py`) | same path, edited | Existing project file. Cause: `split.py` filled in the top navy pill behind the *Global* girl's head, so it ended in a pale fade. On Global her head covers that fade; the KSA girl stands about 60px further right, which leaves the fade showing. Fix: the pill now runs solid `#004059` (with its own anti-aliased top and bottom edge) under the KSA girl's hair, to x = 930 of 1052. Her hair is opaque from x ≈ 860 to ≥ 967, so the pill's end stays hidden even with the ±7px cursor drift. | **Fixed**: `tools/region-photos/extend-pill.py`, called from `run-sa.sh`, KSA background only |
| Media Hub "Conferences" tile | real UAE event photo | `media-hub/tile-conferences` | unchanged | n/a | Kept on purpose (no KSA override) |

Global and UAE: nothing changed. The only asset this bug edits is `src/assets/regions/sa/testimonials-page/banner-bg.png`. The Global
`testimonials-page/banner-bg.png` and every `/ae` file are untouched, and the built pages show different file hashes for Global/UAE and KSA.

## Verification (scratch build `.astro/qc-bug066/dist`, 1592 pages; script `.astro/qc-bug066/shots.mjs`)

- Hero sources at 1440, 768 and 390, EN + AR. The KSA hospitals use `banner-jeddah`, `banner-dhahran` and `banner-al-khobar`, and no KSA
  hospital page references `banner-abu-dhabi`. `/ae/hospitals/cambridge-hospital-abu-dhabi/` still uses the Abu Dhabi layers.
- No console errors, failed requests or 4xx/5xx on any checked page. Every hero image loaded. At 768 and 390 the decorative pattern
  SVG is hidden by design.
- Evidence: `docs/qc/bug066/testimonials-before-after.png`, `desktop-1440.png` (Jeddah EN, Al Khobar AR, Testimonials EN + AR),
  `mobile-tablet.png` (390 and 768), `care-ksa-subject.png`.
- **Staging (9 Oct 2026, after deploying 271ff60):** the same script against https://cambridge-hospital-staging.vercel.app/ passed on
  all 40 page/width checks (KSA hospitals EN + AR show their own banners, testimonials pill clean, `/ae` Abu Dhabi unchanged), with no
  console errors or failed requests. Smoke checks: `/`, `/ae/` and `/sa/ar/` return 200, and `/events` returns a 301.

## Noted, not changed (outside this bug's files)

- **Tablet height of the KSA hospital heroes.** At 768 the new banners show as a 448 × 500 strip 768px wide, 857px tall. The Abu Dhabi
  hero is 411px tall (`docs/qc/bug066/tablet-768-hospital-height.png`). `hospital-heroes.py` writes `heroLayout.small` without
  `maxH`. About uses `maxH: 640` for the same case, and adding it to the generator would cap this. I didn't change it here because
  the missing-image audit session owns that generator and was running it during this bug.
- `hospital-heroes.py` appends its `_note` sentence on every run, so `jeddah.en.json` and the other hospital files now carry it twice
  (cosmetic only).

## Waiting for the client

- **K1, KSA Our Care hero.** The live KSA site uses the light-blue-hijab doctor (the same people as Global). Keep it, or send a KSA version
  (doctor in a navy or black hijab)?
- **K2, KSA About hero.** The live KSA banner shows the woman on the far right (sage scrubs) without a hijab. Keep it as on the live site,
  or send a replacement? We won't edit the person without written approval.

## Reopened 14 Oct 2026

- **K1, `/sa/care/` (EN + AR): fixed.** No navy or black hijab version of this scene exists anywhere (Global
  `src/assets/care/banner-our-care-subject.png`, live UAE `Our-Care-UAE.avif`, live KSA `Our-Care-Banner-KSA.avif` and the client
  folder all show the same light-blue hijab). The user chose to recolour it: `tools/region-photos/recolour-hijab.py care/banner-our-care
  sa 880 1051 60 499` (now part of `run-sa.sh`) turns only the doctor's hijab in `src/assets/regions/sa/care/banner-our-care-subject.png`
  navy, rgb(17, 32, 56) = the median of the navy hijabs already in the approved KSA set (palliative-care / inpatient-care subjects),
  with a soft hue/saturation mask, shading kept. The nurse's blue scrubs (x < 700) are outside the box; alpha, crop, position, pills,
  cursor-follow and the Global / UAE file are unchanged. **Client sign-off needed** on the edited photo (R064).
- **K2, `/sa/about/`: unchanged, by decision.** The user's screenshot of the live KSA About page (cambridgehospital.com/sa/about/,
  14 Oct) shows the same five people, the far-right woman without a hijab. Our layer is that file. Not edited; if the client wants her
  covered or removed, they need to say so in writing (or send a replacement under `about/banner`).
- **Hospital banners / testimonials:** Jeddah, Dhahran, Al Khobar (EN + AR) still use `banner-jeddah` / `banner-dhahran` /
  `banner-al-khobar`; no Abu Dhabi asset (`banner-abu-dhabi*`, `abu-dhabi`, `extrerior-image-abu-dhabi`, `cambridge-hospital-abu-dhabi-*`,
  Al Mudeef) is referenced by any `/sa` page in the build, news included. Testimonials banner: pill solid, no smudge.
- QA: `.astro/qc-bug067/ksa.mjs <engine> <base>` (KSA heroes EN + AR at 390 / 768 / 1366 / 1920: no broken or distorted images, no
  sideways scroll; screenshots in `.astro/qc-bug067/shots/ksa-*`).
