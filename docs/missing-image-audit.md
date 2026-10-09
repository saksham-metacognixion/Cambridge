# Missing-image audit — 9 Oct 2026

Every image slot in `src/data` was compared with the `src/assets` files, and the live pages (cambridgehospital.com `/ae` + `/sa`, EN) were saved and parsed to find the image each slot uses there. Only empty slots and placeholders were filled. Figma images that already display stay as they are.

**Sources.** The live site was reached through a Chrome the user started by hand (Cloudflare blocks scripted downloads, NW1), using `tools/live-images/fetch.mjs`. Files are in `docs/cambridge-images-live/` (pages in `_pages/`, images under their URL path). Also used: the earlier KSA download in `docs/cambridge-images-ksa/` and the WordPress export (media ids).

**Tools** (re-runnable, all in `tools/live-images/`): `fetch.mjs` (save pages and images), `parse-pages.py` (live page → which image goes in which slot), `care-banners.py`, `hospital-heroes.py`, `wire-hospitals.py`. `tools/import-wp-images.mjs` now also reads `_map.json` (slug → file, for folders without WordPress media ids) and adds to `docs/wp-images-import.md` instead of overwriting it.

## Restored

| Page / section | Images | Source | Fix | Verified |
|---|---|---|---|---|
| Outpatient Care `/care/outpatient/` (all editions), service cards | 6 card photos (PMNR, Paediatric, Physiotherapy, OT, SLT, Cerebral Palsy) | live `/ae` page (UAE / Global), live `/sa` page (KSA, `regions/sa/...`) | `image` on the 6 children in `care.json`. CarePage switches to the photo-card layout (Figma 83:226), as on Inpatient | ✅ 1440 / 768 / 390, EN + AR, 3 editions |
| 34 care pages (UAE / Global; 32 with their own KSA people), hero banner (were the Post Acute / Inpatient placeholder, CT4) | the live page's own people cut-out, UAE + KSA versions | live `/ae` + `/sa` pages | `care-banners.py`: cut-out placed where the Figma people stand, over a cleaned Figma background; KSA = `regions/sa/care/heroes/*-subject.png`. `heroLayout.small` = the crop used on phones | ✅ |
| Hospital pages (Al Ain, Al Mudeef, Jeddah, Dhahran, Al Khobar), hero (was the Abu Dhabi family banner) | the live hero image of each hospital | live hospital pages | `hospital-heroes.py`: placed over the live hero gradient, no cursor-follow (it's a building, not people). Abu Dhabi keeps its Figma banner | ✅ |
| Same 5 hospitals, "Designed for Comfort" gallery (was text only) | 52 photos in the live tabs (Outdoor / Indoor / Amenities / Gyms, or Radiology / Laboratory / CT Scan & Laboratory / Blood Bank for KSA) | live hospital pages, `docs/cambridge-images-ksa` | `wire-hospitals.py` → `healing.areas`. Arabic tab labels taken from the live Arabic pages | ✅ |
| Doctor cards and profiles | 33 portraits (20 KSA from the earlier download, 13 from the live profiles: 4 UAE + 9 KSA) | live `/sa/patient-hub/find-a-doctor/`, live profile pages, WordPress media ids | `photo` in `doctors.json` via `import-wp-images.mjs` | ✅ |
| News / Media Hub cards and article heroes | 121 featured images (129/129 posts now have their own image, and the temporary sample photos no longer show) | WordPress export `image_source` URLs | `import-wp-images.mjs` → `src/assets/news/` | ✅ |

Verification: a scratch build (`.astro/qc-images/dist`) checked in Chrome with `.astro/qc-images/check.mjs`. 19 pages × Global/UAE/KSA × EN/AR, at 1440, 768 and 390 on the key pages: 130 page views. No failed image requests, no console errors, no horizontal overflow, Arabic pages RTL. The check flagged 20 views (Home, Media Hub, Jeddah at 768/390), but every flagged file returns 200 and the browser logged no failed requests: these are `loading="lazy"` images not yet loaded (off-screen carousel cards, images hidden at that width), not broken files. Screenshots in `.astro/qc-images/shots/`. Image handling unchanged: `<Picture>` AVIF + WebP fallback, 1x/2x, width/height set, lazy below the fold.

## Not restored (and why)

| Item | Reason |
|---|---|
| 12 KSA doctors (Mehnaz Abdul Ghafoor, Ahmad Almohamady, Wafaa Farag, Abdulaziz Alqutub, Majed Osaylan, Wissam Al Safi, Omar Baaqil, Ahmed Rohoma, Abdulrahman Batarfi, Ahmed Morsy, Wael Mabruk, Mohamed Kallash) | Their live profile pages have no photo either. Needs the client. |
| KSA Physical Medicine hero (`PMNR-KSA.png`) | The live page links it, but the file returns 404 on the live site. `/sa` shows the UAE cut-out. |
| Testimonial Abdullah Jayoul | No photo on the live testimonial (`featured_media 0`). His 2024 news post has its own image, now on the article. |
| Al Ain gallery tabs | The live page lists the same 10 photos under all 4 tabs. They were sorted into Outdoor / Indoor / Gyms by file name (Amenities left empty). Client to confirm. |
| Jeddah "CT Scan & Laboratory" tab (Arabic) | The live Arabic page leaves this label in English, so it is kept in English. |
| Our Hospitals list photos, Our Care hub cards, page banners (Who We Are, FAQ, Media Hub, Find a Doctor, calculators), video poster | Not missing: Figma images are in place (the live site shows other shots of the same subjects). Left unchanged. |
| 8 Global-only news images | All 129 post keys now have files. Nothing left. |

## For the client
- Care and hospital heroes are composed from the live cut-outs in the Figma style; Figma has no frames for these pages. Real layered exports from the designer would replace them file for file.
- Hospital heroes are static (no cursor-follow): the subject is a building.
