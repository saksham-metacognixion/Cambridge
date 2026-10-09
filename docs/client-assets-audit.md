# Client image assets — audit and replacements (9 Oct 2026)

The client's folder `~/Downloads/Website Assets` (380 files, 91 MB, 12 sub-folders) was compared with every image slot on the site. This is an image-only change: no copy, data, animation, layout or interaction was touched. The originals that were used are kept in `docs/client-assets/`; the rest stay in the client folder (nothing was copied blindly).

## 1. What the folder contains and how it was matched

Each file was compared with `src/assets/` and the earlier live-site crawls (`docs/cambridge-images-live`, `-ksa`, `-conditions`) by file hash and then by a pixel comparison of the cut-out's own bounding box (so a transparent PNG matches the same photo composed into a banner). Result: 311 raster files, of which 290 are the same photos the site already uses (the client's folder is largely the live WordPress media library, which the 9 Oct missing-image audit had already pulled in). The genuinely new material is listed in sections 3 and 5.

| Folder | Files | Subject | Outcome |
|---|---|---|---|
| DR1 Doctor photos | 57 | portraits, 1024² (KSA) and 500² (UAE) | 56 identical to the portraits in use; Dr Ahmad Al Khayer's replaced (see 3) |
| I1 Banners – care & section pages | 110 | transparent people cut-outs; `-2` / `-3` suffixes = UAE / KSA variants | all 34 care-page heroes identical to those in use (UAE + KSA); 10 section-page alternatives differ from Figma (see 5) |
| I2-R8 Hospital photos & gallery | 75 | gallery photos, 1024×680 | all already in the five live galleries; 16 Abu Dhabi photos not used (Figma gallery kept, see 5) |
| I3 Video covers | 3 | the About video poster | identical to `about/video-thumbnail` |
| I4 Testimonial photos | 12 | testimonial portraits + the Testimonials banner | identical to the files in use |
| I5 Banners – condition pages | 20 | condition cut-outs | identical to the 9 Oct live cut-outs (bug 042); the client's Traumatic Brain Injury file confirms R042 |
| I6 Programme icons | 47 SVG | navy line icons, KSA = UAE byte-identical; plus 12 tiny cyan Tabler icons and a Threads icon | 13 programme icons added to the care cards (see 3); the four post-acute ones are the Figma icons already in use |
| L1 Accreditation seals | 9 | CARF, JCI, CBAHI, CAP, Kozyavkin, OSHAD, ADHICS, JAWDA, + the Accreditations banner | 7 seals added to the accreditation tabs (see 3) |
| L3 Insurance logos | 18 | 325×180 live tiles | KSA tiles already in use; UAE tiles differ in style from the Figma logos (see 5) |
| L6 Logos | 5 | horizontal logo (3 copies: Global = UAE = KSA, byte-identical), vertical logo, JPG | same artwork as the Figma header / footer SVGs; nothing to change |
| M8 Social sharing images | 24 | 11 leadership portraits, 4 doctor portraits, 5 news images, pill shapes | news images identical to the posts' images; portraits have no page (see 5) |
| R6-R7 Banners – hospital pages | 6 | hospital hero cut-outs with the outlined pills | Abu Dhabi / Al Ain / Al Mudeef identical to the banners in use; Al Khobar, Dhahran, Jeddah replaced (see 3) |

## 2. Regional mapping

- KSA (`/sa`, `/sa/ar`): the three KSA hospital heroes are the client's R6-R7 files for those hospitals. Every `-3` (KSA) people cut-out in I1 is byte-identical to the `src/assets/regions/sa/...` layer already in place (red shemagh men, KSA abaya styles), so `/sa` keeps its own people on every hero. KSA doctor portraits unchanged (same files).
- UAE (`/ae`, `/ae/ar`): no UAE file in the folder differs from the UAE image in use; the UAE hospital banners (Abu Dhabi, Al Ain, Al Mudeef) are the same artwork. Dr Ahmad Al Khayer (UAE) gets the sharper file.
- Global (`/`, `/ar`): Figma images kept. The client's suffix-less I1 files equal the Global Home hero (`hero/banner3`), Patient Hub, FAQ, Refer, Find a Doctor and Our Care images already in use.
- Arabic pages inherit the hero and the images from the English content file of the same edition, so `/ar`, `/ae/ar` and `/sa/ar` show the same regional images (verified in the browser: `dir="rtl"`, mirrored layout, same files).
- Nothing from the UAE folder names went on `/sa` and nothing KSA-specific on `/ae`.

## 3. Replaced or added

| Page / section | Before | After | Source |
|---|---|---|---|
| KSA hospital heroes: Al Khobar, Dhahran, Jeddah (EN + AR, `/sa` and Global) | live list photo faded into the gradient (`hospital-heroes.py`, 9 Oct) | the client's hero cut-out (building + outlined pills) at native size, right- and bottom-aligned over the live hero gradient; static (no cursor-follow) as before; mobile strip recentred (`heroLayout.small.x` 604 → 538) | `docs/client-assets/hospital-banners/R6-R7_Advanced-Care-in-<City>.png` → `src/assets/hospital-detail/banner-<slug>.png` via `tools/client-assets/hospital-hero.py` |
| Dr Ahmad Al Khayer: Find a Doctor card, Home / care-page doctor rows, profile | `doctors/dr-ahmad.png` 281×319 (Figma export, upscaled on retina: the profile asks for 480 px) | same photo and framing from the client's 500² file, cropped to the cut-out box: 422×475 | `docs/client-assets/doctors/DR1_Dr-Ahmad-Al-Khayer.png` |
| Accreditations page, tabs 2–8 (JCI, CBAHI, CAP, Kozyavkin, OSHAD, ADHICS, JAWDA), EN + AR, all editions | only the CARF tab had its seal (Figma 55:12215 draws one tab) | each tab shows its seal in the CARF seal's slot (589, 729), 146 × 146; the white JPEG background made transparent, trimmed and padded like the Figma CARF export | `docs/client-assets/accreditation-seals/L1_*.jpg` → `src/assets/accreditations/<seal>.png`; `tabs[i].image` in `content/accreditations/page.en.json` |
| Programme cards on Long-Term Care & Rehabilitation (4), Ventilated Patients Care (2), Paediatric Care (7) and Post-Acute Rehabilitation (4), EN + AR, all editions | text-only cards (CT6: no icons were supplied) on 13 cards; the 4 Post-Acute cards already had the Figma icons | the Figma card layout with its icon (41:1730): the client's icon per programme | `docs/client-assets/programme-icons/I6_*-UAE.svg` → `src/assets/care/icons/icon-*.svg` (svgo, width/height/viewBox kept); `icon` on the node in `src/data/care.json`; `CarePage` passes it, `ConditionCards` resolves an image key as well as the four named Figma icons |

Code touched (image mapping only): `src/lib/care.ts` (`icon?` on the node type), `src/components/care/CarePage.astro` (one line: `icon: k.icon`), `src/components/care/ConditionCards.astro` (resolve the key with `img()`), content JSON (`hero.banner` note + `heroLayout.small.x` for the three hospitals, `tabs[].image` for seven tabs), `src/data/care.json` (`icon` on 17 programme nodes). No script, animation, style or layout rule changed.

## 4. Optimisation and performance

Same pipeline as the rest of the site: `<Picture>` AVIF with WebP fallback, 1x / 2x, width/height set, lazy below the fold, the hero eager with `fetchpriority="high"`. Sizes as emitted by the build (largest AVIF variant):

| Asset | Client file | Emitted before | Emitted after |
|---|---|---|---|
| banner-al-khobar (1052 w AVIF) | 376 KB PNG | 11 KB | 14 KB |
| banner-dhahran | 357 KB PNG | 7 KB | 14 KB |
| banner-jeddah | 310 KB PNG | 9 KB | 15 KB |
| dr-ahmad (480 w AVIF) | 237 KB PNG | 7 KB | 12 KB |
| 7 seals (292 w AVIF, lazy, inside hidden tab panels) | 380 KB JPEG | – | 12–21 KB each |
| 13 programme icons (SVG, lazy) | 440 KB | – | 427 KB (svgo; the client's paths are heavy line art, 15–46 KB each; a lower path precision crashed svgo, so they are kept as drawn) |

Lighthouse 12 (local static server, HTTP/1.1, so conservative; staging on Vercel scores higher), same pages before and after, one run each:

| Page | Mobile before | Mobile after | Desktop before | Desktop after |
|---|---|---|---|---|
| `/about/accreditations-partnerships/` | 97 (LCP 2.5 s) | 96 (LCP 2.4 s) | 100 | 100 |
| `/ae/care/inpatient/pediatric-rehab/` | 98 (LCP 2.1 s) | 99 (LCP 1.9 s) | 100 | 100 |
| `/ae/patient-hub/find-a-doctor/ahmad-al-khayer/` | 98 (LCP 2.1 s) | 98 (LCP 2.0 s) | 100 | 100 |
| `/sa/hospitals/cambridge-hospital-jeddah/` | 97 (LCP 2.4 s) | 96 (LCP 2.5 s) | 100 | 100 |

All stay at 95+; the 1-point moves are within run-to-run noise (CLS 0, TBT 0 ms on every run). Results in the session scratchpad (`lh-before/`, `lh-after/`).

## 5. Second pass: site matched to the folder (user decision, 9 Oct 2026)

The user asked for the website images to match the client folder everywhere, overriding Figma where the two differ. Done with `tools/client-assets/swap-hero.py` (the folder cut-out goes where the current people stand, via `tools/region-photos/compose-subject.py`; background right edge refilled with `fix-bg-edge.py`; flat banner rebuilt). Only the people layer changes, so the gradient, pills and cursor-follow stay as before. Originals in `docs/client-assets/heroes/` and `docs/client-assets/insurance/`.

| Page | Global + UAE now | KSA now |
|---|---|---|
| Why Cambridge | `I1_A-Different-Standard-of-Care` | unchanged (`-3`, already the folder file) |
| Who We Are | `I1_From-treatment-to-recovery-all-together` (own hero `who-we-are/banner`; Figma reused the Accreditations banner) | `-5` |
| About | `I1_From-treatment-to-recovery-all-together-2` | unchanged (`-4`) |
| Careers | `I1_Careers-at-Cambridge-Hospital` | same file (navy hijab; the old KSA layer was the International photo) |
| Accreditations | `I1_Standards-That-Define-Our-Care` | `-2` (red shemagh), fitted to the banner height by hand so both people show |
| Contact Us | `I1_Reach-Out-to-Our-Care-Team` (all three variants are this file) | unchanged (same file) |
| Your Opinion Matters | `I1_Your-Opinion-Matters` | unchanged (folder FAQ `-3` man): the single folder file has no head covering, KSA keeps its KSA image |
| Home Care | `I1_Home-Care` | unchanged (`-2`) |
| International Patients | unchanged: the only folder file wears a red shemagh, so it is KSA imagery and cannot go on UAE / Global | `I1_International-Patient-Care-at-Cambridge` (was a card photo cut-out) |
| Abu Dhabi hospital gallery | the 16 folder photos (`I2-R8_Advanced-Care-in-Abu-Dhabi*`, originals) in the live tabs Outdoor 6 / Indoor 5 / Amenities 3 / Gyms 2, Arabic tab labels from the live page; replaces the four Figma photos | n/a |
| Insurance Providers page | the folder 325x180 tiles for ADNIC, Almadallah, Daman, Enaya, Neuron, Nextcare, SAICO, Thiqa (tile box as Enaya); the eight insurers the folder lacks keep their Figma logo | the folder tiles (originals instead of the recompressed live copies) |
| Home insurer strip (Global, UAE) | the same seven folder logos trimmed to their artwork, fitted inside the Figma boxes (`fit="contain"`, no crop) | the folder tiles |

Code touched: `src/components/sections/Insurance.astro` (logos fitted, not cropped; `homeLogo` lets the strip find the insurers after their keys moved), `src/data/insurers.json`, `who-we-are/page.en.json` (hero key), `hospital-detail/abu-dhabi.{en,ar}.json` (gallery).

Lighthouse after (local, one run): `/ae/` 94 / 100 (Home was already 94 on mobile before, performance audit), Who We Are 95 / 100, Abu Dhabi 99 / 100, UAE Insurance Providers 96 / 100, Your Opinion Matters 96 / 100.

## 6. Still not matched to the folder

| Item | Why |
|---|---|
| Our Hospitals hero map (`I1_Six-Locations`, `I1_Three-Locations`, `-2`) | The folder maps have the city names and pins drawn into the image in English. The Arabic pages would show English city names (the site draws translated labels and region-filtered pins over the map), and the pins would double up. Needs the maps without baked labels, or a decision to accept English labels on Arabic pages. |
| SAICO in the Home strip | The folder logo is a wide wordmark; the Figma slot is a tall 37 x 62 box made for the round emblem, so it renders small. Widening the slot is a layout change. |
| International Patients Global / UAE | Folder has only the red-shemagh (KSA) version. |
| Your Opinion Matters KSA | Folder has one file, a nurse without head covering; KSA keeps the folder's KSA FAQ man. |
| Leadership portraits, Meet our Team, Dr Wael Alsayed, Tabler icons, Threads, second Dr Ahmed Elenani photo | No slot on the site. |
| 12 KSA doctors, KSA Physical Medicine hero, Abdullah Jayoul | Not in the folder. |

## 7. Verification

Scratch build of the working tree (`.astro/qc-client-assets/shots.mjs`, Chrome via playwright-core, served by `tools/qc/serve.mjs`): the three KSA hospital pages on `/sa`, `/sa/ar` and Global at 1440 / 768 / 390; Accreditations on Global, `/ae` and `/sa/ar` with every tab clicked at 1440 (EN + AR) and 768 / 390; Dr Ahmad Al Khayer's profile (EN + AR) and the Find a Doctor list; the four programme pages on `/ae` and `/sa/ar`. 51 page views: every hero, seal, icon and portrait loads from the expected file, no failed requests, no console errors, no horizontal overflow, Arabic pages `dir="rtl"`. Screenshots in `.astro/qc-client-assets/shots/`. Animations untouched: hospital heroes stay static as before, people heroes keep their cursor-follow layers, tabs / accordion, autoscroll rows and AOS entrances are unchanged code.

Second pass: `.astro/qc-client-assets/swap.mjs` (12 pages x Global / UAE / KSA / KSA Arabic / UAE Arabic at 1440, the UAE and KSA versions at 768 and 390: 84 page views, 0 problems) and `sections.mjs` (Home strip, insurer cards, Abu Dhabi gallery screenshots).
