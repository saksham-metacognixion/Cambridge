# Client Website Images folder (14 Oct 2026): what was used

Second pass (15 Oct): every unmatched file feature-matched (SIFT) against every site image regardless of framing; nothing further usable.

Source: Pramod's `Website Images - Global , UAE, KSA` (536 files, 391 unique; same as `OneDrive_2026-10-14 (1).zip`).
404 of its 502 raster files are already on the site at the same size or smaller. The originals actually used are
copied (unchanged) to `docs/client-assets/website-images-oct14/`.

## Replaced (sharper, same picture, same framing and layout)

Aligned to the current image with `tools/banners/hd.py` (SIFT + RANSAC, scale/offset only). Where the original's content differs
(retouching), the current pixels are patched back; where the original is framed tighter, the edge is filled from the current
image. Every result was checked visually (worst 12 px block vs the current image, logo spots, hair edges).

| Image | Before | After | Source |
|---|---|---|---|
| 16 condition banner cut-outs (all but Stroke, Motor Neuron, TBI, main) | 579x450 | 1158x900 (Shoulder 1115x867) | client green-screen studio shots, keyed |
| Care ICU / Neurorehabilitation / Home Healthcare cut-outs (Global/UAE) | 500x450 / 500x450 / 311x496 | 2x | client cut-outs |
| Why page Trusted Standards (Global/UAE) | 1276x798 | 1915x1197 | client |
| About + hospital video cover | 429x264 | 1131x696 | saved live original (client file is 429) |
| Home card Abu Dhabi, Al Mudeef | 464x364 | 928x728 | client / saved live original |
| News: 16th Hot Topics, 3rd International Paediatric conference | 1400x675 | 1820x878 / 1537x741 | client |

Banner cut-outs: `tools/banners/banners.json` `hd` entries, `python3 -I tools/banners/prepare.py` (or `--hd-only`).
Other images: `python3 -I tools/images/hd-replace.py` (trial run: pass an output folder).
Code: `BannerArt.astro` now lists 2x widths (only those the file has, so 1x banners are unchanged); About video (`Intro.astro`),
hospital video (`EnvironmentBand.astro`) and Why Trusted got a 2x width. Built AVIF at 2x: 15-40 KB per banner.

Notes
- The condition studio shots predate the live retouching: the Cambridge Hospital logo on the scrubs (plain or "Physiotherapist"
  text in the originals) and the Parkinson's tablet screen (green). Those areas keep the current pixels (soft blend).
- Multiple Sclerosis: the live cut-out had a faint stray white logo floating beside the patient's arm (retouching leftover); the new copy does not.

## Hospital page banners (15 Oct): building + pills split

The six live hospital banner files had the building and 3-5 pill outlines in one raster, the pills behind the building.
`tools/banners/split_pills.py` (run by `prepare.py` for `hospital-detail/*`) now writes the building alone as `<key>-cutout` and
the pills as `<key>-pills.svg` (rounded rectangles fitted to the live pixels: position, size, stroke, colour; a lighter pill
drawn behind a darker one where the live art shows an inner arc; ends hidden behind the building run on under it). BannerArt
draws the SVG under the building inside one cursor-follow subject, so the pills are vector-sharp at every size and the
building can take any larger photo of the same framing. With that, Al Khobar (908 px, 1.57x) and Dhahran (884 px, 1.53x)
took the client's 900x975 photos. Checked: Chrome renders of SVG + building vs the live file for all six (.astro/qc-hd/pills-render.mjs),
hospital pages dev vs staging (hosp-shots.mjs), edge zooms.

## Not used

| File | Why |
|---|---|
| Daman logo (1024px) | brighter blue, slightly narrower mark than ours (navy): a different version. Ask which is current |
| Thiqa logo (682px) | horizontal "Managed by Daman" lockup; ours is the stacked logo |
| Neuron logo (359px) | only 1.18x |
| Al Ain card (live 900px) | sky differs from ours: visible seam |
| Stroke condition original | ours is a different (Figma) picture |
| Neck-Pain.png | a different picture from our news image |
| UAE `Exterior-1..4.png` (one 1920px photo x4), `Reception.png` | not any photo on the site: ask where they go |
| Jeddah 900x975 (`KSA/Other`) | the hospital-page banner building at 1.88x, but it sits 2-3 px off our cut (131 matched points): sky pixels inside the tower edge. Kept at 1x |
| `Cambridge-Hospital-Jeddah.png` (1672px) | the Home / Our Hospitals Jeddah card building, shot at another moment (crowd, other sky): 45% patched back, blotchy sky (tried, reverted) |
| 13 leadership portraits (1024px, `Global/I1 Page banners`) | Meet the Team page is not built (WP6, no Figma frame); Dr Ahmad / Dr Wael Sary are the suit portraits, not the doctor-profile photos |
| CARF 720x520, Speech-Language KSA 579px, Media-Hub 540px | same pictures, no useful gain |
| `MAP-Front-Page-Global-1.avif`, `Our-Hospital-MAP-*` | the live site's white-outline map, not our Figma Our Hospitals banner |

## Still soft, nothing larger supplied
Most page-banner cut-outs (about 100 of 126: Home, About, Careers, Why, Our Care and care pages, hospital banners, KSA),
Motor Neuron + TBI condition banners, the pill shape, Abu Dhabi / Jeddah gallery photos (1024px), Media Hub tiles (960px),
insurer logos (325px), Our Hospitals banner (1052px; can be re-exported from Figma at 2x on our side).

## Prateek's banner composites (16 Oct 2026): `Cambridge Hospital - Website Images`

47 files (`docs/client-assets/website-images-oct16/`): 44 full-banner composites 2880x1370 (gradient + outline pills + people at
2.5-3.4x our live size, opaque), a Jeddah photo (1536px), a Careers portrait (two nurses, 1107x1421) and a raw Abu Dhabi
exterior (DSC07831.JPG, 7008px).

`tools/banners/composite.py` (mapping `composites.json`, from a SIFT sweep of every file against every cut-out): aligns each
composite to the current cut-out, takes the composite's pixels at 2x the display size and keys the people by difference against
the shared background `_bg.png` (per-pixel mode across all composites where >=16 files agree, the row gradient elsewhere,
strokes interpolated; stroke-coloured horizontal runs masked explicitly). The current cut-out's alpha bounds the key (nothing
outside the live silhouette; solid interior kept, so pale coats on the pale gradient do not key out); colours straight from the
composite (its gradient is ours). Result: 35 banners at 2x (Global 17, KSA 6, UAE/Global care 12), same framing and layout.

Not applied: Media Hub (the hand at another angle: our outline does not fit it, tried with rotation), Insurance (a different
picture: a woman in abaya replaces the man), International "Global" (KSA dress, as on 9 Oct, R067), the six hospital composites
(NEW building pictures, not sharper copies: a design change to confirm), Jeddah.png / DSC07831.JPG (no identified slot),
Be-Part-of-a-Purpose (the same two nurses as careers/nurse, 1.6x, but cut out on transparency while the Careers section shows
the full photo with the building behind, as in Figma: not a drop-in).
Verified 16 Oct (second pass): every banner-art entry tabled by file width vs 2x target (50 at 2x, 4 at 1.5x+, 72 at 1x: UAE Home,
KSA care pages, the 4 calculators, ~20 care pages, Motor Neuron / TBI / Conditions, hospitals, Insurance, International, Media Hub);
name-vs-match doubts (Paediatric Care/Outpatient, Long-Term Care) confirmed by eye.
