# Client Website Images folder (14 Oct 2026): what was used

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
| `Cambridge-Hospital-Jeddah.png` (1672px), Jeddah / Dhahran / Al Khobar 900px cards | different photos from ours: ask |
| `MAP-Front-Page-Global-1.avif`, `Our-Hospital-MAP-*` | the live site's white-outline map, not our Figma Our Hospitals banner |

## Still soft, nothing larger supplied
Most page-banner cut-outs (about 100 of 126: Home, About, Careers, Why, Our Care and care pages, hospital banners, KSA),
Motor Neuron + TBI condition banners, the pill shape, Abu Dhabi / Jeddah gallery photos (1024px), Media Hub tiles (960px),
insurer logos (325px), Our Hospitals banner (1052px; can be re-exported from Figma at 2x on our side).
