# Open decisions log

Replaces the old "Pramod list" (docs/audit-and-plan.md §7). Pramod is unavailable, so every open question has a **default we built with** and a note on **what changes if the answer differs**. Every default can be changed by editing config or JSON only, never code.

Last updated: 5 Oct 2026 (About Cambridge + Why Cambridge pages, Careers page, mobile/tablet review). Confirmers: **Pratik** = scope and content, **Padmavathi** = design / QC approval, **Manager** = cost items.

## Default rules (apply everywhere)
| Situation | Default |
|---|---|
| Content we don't have | "Content pending" on staging only (env flag `PUBLIC_SHOW_PENDING_NOTE=true`, ignored on an indexable build), never in production |
| Unknown destination of a link or button | A config value pointing to an existing page |
| Element with no Figma design | Built in the exact Figma style and flagged here |
| Text conflict or typo | Keep the Figma text and flag it |
| Unknown region data | Show it in every edition, `region` field ready in the JSON |
| Contrast fails | Keep the Figma colours and flag it |
| Unknown URL pattern | Placeholder in the edition config / `src/lib/paths.ts` and flag it |

## Blocking for go-live (cannot be defaulted)
| # | Item | Status | Confirms |
|---|---|---|---|
| B1 | **Gotham web font files (Light 300, Book 400, Medium 500, and Bold 700 / Italic used in Figma) and their web licence.** Without them the `font-family` rule stays but a fallback font renders. | open | Manager (licence cost), Padmavathi |
| B2 | **Email provider and the form inboxes.** Route: SMTP relay on the client's mail system, or a provider with content retention off ("nothing stored"). Inboxes: `FORM_TO_BOOK_APPOINTMENT`, `FORM_TO_SEND_ENQUIRY`, `FORM_TO_FEEDBACK`, `FORM_TO_REFER_PATIENT`, `INTERNATIONAL_INBOX`, plus `CAREERS_INBOX` only if an apply form is ever wanted. | open | Pratik, Manager |
| B3 | **Real data JSON:** doctors, hospitals, specialties, news (~259 posts), FAQ answers, testimonials, conditions mapping. Today these are Figma samples or placeholders. | open | Pratik |
| B4 | **Arabic text for every page and form** (labels, errors, success, country names). All `*.ar.json` files are empty by design (no translating). | open | Pratik |
| B5 | **Welcome / country pop-up flow** (scope 2.3 says Global only, offering Global / UAE / KSA; Figma has only the UAE version). | open | Pratik, Padmavathi |
| B6 | **Production domain, hosting target (Cloudflare Pages assumed) and URL patterns** (current site returns 403 to scripts, so Arabic and page slugs are guesses). Needed for canonical, hreflang, sitemaps and 301 redirects. | open | Pratik, Manager |
| B7 | **Original full-size photos and KSA image sets.** Figma images are 1052 px wide (soft at 1440 and on retina). People images need KSA versions (e.g. red ghutra) for `/sa`. | open | Padmavathi, Pratik |
| B8 | **Turnstile site and secret keys**, and the Cloudflare account for the Pages Functions. | open | Manager |
| B9 | **Analytics decision** (Google Analytics + cookie consent banner, or none). Room is left for a banner; nothing is built. | open | Pratik |
| B10 | **Legal pages content** (privacy policy, cookies, others). The consent row on every form and the footer link to "#" until they exist. | open | Pratik |
| B11 | **"We are listening" section is missing from every About frame** (45:4982, 307:494, 46:5841, 116:311). Scope 2.5 and 2.9 require the section on About, its link in the navigation, and the Contact/Feedback form (2.7). Nothing was invented: the header link exists and opens the Your Opinion Matters pop-up (the feedback form) until the section is designed. No "We are here to listen" text exists in any frame, so the one approved copy edit (2.9) had nothing to change. | open | Pratik (design), Padmavathi |

## Decisions to confirm

### Scope and content (Pratik)
| # | Question | Default used and why | If the answer differs | Status |
|---|---|---|---|---|
| D1 | **Careers page built from Figma (112:7295): is it in scope?** It is not in the scope's template list (2.5). | Built, because the frame exists in Figma and the nav/footer link to it. | Remove the route from `PAGE_PATHS` / `allRoutes()` in `src/lib/paths.ts` and point the nav links to `#`. | open |
| D2 | **Careers URL pattern.** | `/careers` plus edition prefixes (`/ae/careers`, `/sa/careers`, `/ar/careers`...). Placeholder in `src/lib/paths.ts`. | Change the `careers` entry in `PAGE_PATHS`; add a 301 in `_redirects`. | open |
| D3 | **Job listings and apply flow: needed?** Figma shows no job list, filters, detail page or apply form. Is there a design? Is the data source a JSON file or an external portal? If a form is wanted: careers inbox, CV rules (proposed: PDF/DOC/DOCX, max 5 MB, sent as an email attachment only, nothing stored). | None built. All careers buttons point to the Contact page. | Set `careers.joinUrl`, `careers.openRolesUrl`, `careers.applyUrl` in `src/data/careers.json` to the portal URL. A form or list needs a Figma design first. | open |
| D4 | **Careers button and dropdown destinations** ("Join our Team", "View Open Roles", "Apply Now"). | All three go to the Contact page. "View Open Roles" is a dropdown-look link, not a real select. | Edit the three URLs in `src/data/careers.json`. | open |
| D5 | **Careers tab panel content.** Figma shows panel text only for the active tab in each of the two tab lists (the other 4 + 3 panels have none). | Those panels show "Content pending" on staging only (`PUBLIC_SHOW_PENDING_NOTE=true`). In production they stay empty (tabs kept as in Figma, nothing hidden), so content must arrive before go-live. | Fill the `blocks` of each tab in `src/data/content/careers/page.en.json` (`multi.tabs`, `why.tabs`). | open |
| D6 | **Arabic URL pattern.** | `/ar`, `/ae/ar`, `/sa/ar` (placeholder in `src/data/editions.json`). | Edit `editions.json`. | open |
| D7 | **Page slugs** for Patient Hub links (conditions, refer, international, insurance, testimonials, FAQ, patient feedback...). | Slugs from Figma frame names, in `src/lib/paths.ts`. Doctor paths in `src/lib/doctors.ts`. | Edit `paths.ts` / `DOCTOR_PATHS`; add 301s. | open |
| D8 | **Copy edit list.** Typos kept as in Figma: "Inquiry" vs "Enquiry"; "Rober Hanna Kassab" vs "Robert Kassab"; "Improved Impatients"; "Our specialists provides"; "Breif History:"; "Adu Dhabi National Insurance Company"; "DeutscheAssistance"; "www.info@cmrc.ae"; first Quick Link reads "Cambridge". Spelling choice: Inquiry/Enquiry, Speciality/Specialty, E-mail/Email. | Figma text kept everywhere. | Edit the content JSON. | open |
| D9 | **Hero: is it a slider?** Where are the region frames and motion specs? | Single static hero with the cursor-follow layers as in the motion spec. | Content JSON + hero component props. | open |
| D10 | **Home contact section:** which of the 4 forms? Footer / Media Hub newsletter form: keep (sending where?), link, or remove? Newsletter is not one of the scope's forms and a mailing list means storing data. | Home contact = its own form id `home-contact` using the Send an Enquiry inbox. Newsletter forms are rejected by the function. | `src/data/forms.json`. | open |
| D11 | **Form field lists** for all forms (from Pratik's list). Fields in `forms.json` are the Figma ones. | Figma fields. Contact form got Hospital + Subject added. Referring-doctor block on Refer a Patient is not in Figma. | Edit `src/data/forms.json` and `content/forms/*.json`. | open |
| D12 | **Book an Appointment pop-up:** Option 1 (106:246, built) or Option 2 (106:510)? | Option 1. | New Figma fetch + component change. | open |
| D13 | **"We are listening" / Opinion link:** pop-up or the Patient Feedback page? | Header opens the pop-up; footer goes to the page. | Link values in `header.en.json` / `footer.en.json`. | open |
| D14 | **Dial codes:** list and order for the Mobile fields; flags (Figma has only UAE). | Full country list; +971 default (Global, UAE), +966 (KSA); no flags for other countries. | `src/data/dial-codes.json`. | open |
| D15 | **Region of data:** news / testimonials / hospitals / insurers shown by region (e.g. SAICO listed under UAE in Figma, probably an error). | Show all in every edition; `region` fields ready. | `region` in each data JSON. | open |
| D16 | **Condition to specialty mapping** for Conditions & Specialities. | Figma order, no filtering rule beyond what Figma shows. | `src/data/conditions.json` / `condition-filters.ts` config. | open |
| D17 | **Page titles and meta descriptions** (placeholders on the pages built from Figma). | Invented from the page name, flagged `meta.* = PLACEHOLDER`. | `meta` in each page JSON. | open |
| D18 | **Gotham Bold / Italic:** used in Figma (headings, textarea placeholders) but outside the three weights in CLAUDE.md. | Rendered as Bold 700 / Italic from the same family. | Font files in `public/fonts/`. | open |
| D19 | **Health Article template (Figma 170:839) is not built yet**, so the Media Hub posts have no article page, and it is not in the mobile review. Needs the ~259 posts (B3) before it is useful. | Not built; the Figma frame and spec (`figma-cache/article-layout-spec.md`) are cached and ready. | Build as the next template; post URL pattern needs D7. | open |

### About Cambridge (built 5 Oct 2026 from Figma 45:4982; Why Cambridge 116:311 is next)
| # | Question | Default used and why | If the answer differs | Status |
|---|---|---|---|---|
| A1 | **Which About frame is final: 45:4982 or 307:494?** 307:494 (second version) is identical plus a "Journey of Excellence" timeline (2012, 2014, 2015, 2016 cards with two arrows). Neither frame says which is newer. | Built 45:4982. The timeline is built as its own section and switched OFF: `src/data/about.json` -> `showTimeline: false`. Checked against 307:494 at 1440, 390, 768 and in RTL. | Set `showTimeline` to `true`. Nothing else changes (the Explore band moves down 338 Figma px on its own). | open (Pratik / Padmavathi) |
| A2 | **Header link "We are listening"** (not in the Figma header): approve the addition and its position. | Added as the first link of the top row, same Gotham Book 9 cyan as the other top links, in the free space between the logo and the Opinion icon (x305, 72 wide, 9 Figma px from the logo). Also first in the mobile menu. Fits from 1200px up (checked 1200 to 1920). Target = the Your Opinion Matters pop-up (scope 2.7 form), from `src/data/nav.json` -> `weAreListeningTarget`. | When the About section exists, set `weAreListeningTarget` to `{ "page": "about", "hash": "we-are-listening" }` (= `/about#we-are-listening`). Text: `topLinks[0].label` in `layout/header.en.json`. Move it: `topLinkBoxes[0]` in `Header.astro`. | open (Padmavathi) |
| A3 | **Intro video: source and host** (YouTube, Vimeo or self-hosted). Figma shows only a poster and a play button. | Poster + play button exactly as in Figma. `src/data/about.json` -> `video: { host, id }` is empty, so the button does nothing. When filled, the player (iframe or `<video>`) is created only on click, no third-party request on page load. | Fill `host` (`youtube`, `vimeo` or `file`) and `id` (video id, or the file URL for `file`). | open (Pratik) |
| A4 | **"Who We Are" (46:5841): older About draft, or a separate page?** It repeats the About hero, then has an intro text, six stats ("Six Hospitals. Two Countries. One Standard Care."), "Our Foundation of Care" tabs (Mission / Vision / Values) and "Expanding Services to Communities Regionally". No About card links to it. | Not built. | If it is a page: add a route and a card/menu link, build from the saved screenshot (`figma-cache/pages/who-we-are-46-5841.png`). | open (Pratik) |
| A5 | **About card destinations.** | "About Cambridge" = this page, "Careers Hub" = `/careers`, "Why Choose Cambridge" = `why-cambridge` (Figma 116:311, **built**, see W1-W7), "Accreditations & Partnerships" = `accreditations-partnerships` (Figma 55:12215, **not built yet**: planned next, listed in the missing pages below). Slugs are placeholders (`src/lib/paths.ts`). | Change the three keys in `PAGE_PATHS`; add 301s. | open |
| A6 | **About URL and footer link.** | `/about` (+ edition prefixes). Header "About Cambridge" and the footer's first Quick Link ("Cambridge", see D8) both point to it. | `PAGE_PATHS.about`; `layout/footer.en.json` first quick link. | open |
| A7 | **Numbers and spelling conflicts.** | None on this page: it has no stats or facility names beyond the shared header/footer. (Stats appear in Who We Are / Why Cambridge: 715 beds, 1200+ professionals, 85% discharge rate, 13+ years: compare with the landing page when Why Cambridge is built.) Typos kept as in Figma: "Lear more about how we deliver care" (Explore sub), "Facility Go LIve" (timeline, OFF). | Edit `content/about/page.en.json`. | open (D8 list) |
| A8 | **Images.** Hero banner (one flattened PNG 1052x500), the four card photos (888 x 976) and the video poster (429 x 264, 1x only, soft at 1440 and retina). People images need KSA versions (hero banner, all four cards). Card 2's photo is 1 Figma px higher than the others in Figma (1122 vs 1123): kept per card (`imageTop`). "Inpatient 3" in Figma (d3f04) is hidden under the handshake photo and is not used. | UAE / Global images on every edition. | Add `src/assets/regions/sa/about/*` (see P5, P6, B7). | open |

**Missing pages (linked but not built):** Accreditations & Partnerships (`accreditations-partnerships`, Figma 55:12215; linked from the About card and the Why Cambridge "Read More"), Our Hospitals (`our-hospitals`, Figma 101:6247; linked from the Why Cambridge "Our Hospitals" button). The links return 404 until they exist.
**Fixed on the way:** the Book an Appointment link's tap layer covered the whole mobile menu, so no menu link could be tapped (mobile review M11).

### Why Cambridge (built 5 Oct 2026 from Figma 116:311)
| # | Question | Default used and why | If the answer differs | Status |
|---|---|---|---|---|
| W1 | **Number conflicts with the landing page.** Why Cambridge shows "715+ Beds Across the Network"; the landing Facilities section shows "720 Operational Beds" (same fact, two numbers and two labels). Also "13+ Years of Care", "60% Female Workforce" and "85% Discharge Rate" appear only here. 5,000+, 30,000+, 300,000+ and 1200+ are identical on both pages. | Each page kept as in Figma. The four identical stats are read from the one landing JSON (`home/facilities`, `{ "shared": key }`, `src/lib/stats.ts`), so number and spelling ("Improved Impatients") cannot drift. The beds figure is page-specific (`why/page.en.json`). | Edit the number in `why/page.en.json` or in `home/facilities.en.json`; or make the beds stat `{ "shared": "beds" }` to show 720 here. | open (Pratik) |
| W2 | **Button destinations.** "Our Hospitals" (provider band), "Read More" (Multidisciplinary Professionals) and "Read More" (Trusted Standards) have no target in Figma. | Our Hospitals = `our-hospitals` (not built), Multidisciplinary Read More = `conditions` (existing Conditions & Specialities page), Trusted Read More = `accreditations-partnerships` (not built). All in `why/page.en.json` (`page` keys in `PAGE_PATHS`). | Change the three `page` values. | open |
| W3 | **Third CTA tile reads "Search Conditions"** (the other pages say "Refer a Patient"). | Kept as in Figma; links to the Conditions page. | `recovery.tiles` in `why/page.en.json`. | open |
| W4 | **Images.** Hero banner is one flattened 1052 x 500 PNG (soft at 1440 and on retina). The other photos are high-resolution originals (1080 x 1350, 1788 x 922, building drawing 4096 x 2048, handshake 2928 x 2845). People images that need KSA versions: hero banner (UAE national in white ghutra), team photo (check), handshake photo (white kandura). The Specialized/pill art and pattern SVGs are shared decoration. | UAE / Global images on every edition. | `src/assets/regions/sa/why/*` (P5, P6, B7). | open |
| W5 | **Text kept as in Figma** (D8 list): double space in the hero text ("hospital and home  with"), straight apostrophe in "The Region's Most Clinically...", British "Specialised Programmes" next to American "Specialized" on the same page (one spelling per name: confirm which). | As in Figma. | `why/page.en.json`. | open |
| W6 | **Small screens.** No Figma. Below 1024px sections stack; the three stat groups wrap; the "Multidisciplinary Professionals" and "Trusted Standards" headings step down with the width (7.6vw / 8.4vw, never above 37 Figma px) because the long words do not fit at full size; the pill bars and the pattern art are hidden. | See docs/mobile-review. | CSS in `components/why/*`. | open (Padmavathi) |
| W7 | **URL.** `why-cambridge` (+ edition prefixes). | Placeholder in `PAGE_PATHS`. | `src/lib/paths.ts`, 301 in `_redirects`. | open |


### Design and QC (Padmavathi)
| # | Question | Default used and why | If the answer differs | Status |
|---|---|---|---|---|
| P1 | **Approve mobile / tablet layouts** (docs/mobile-review/index.html: 15 pages, 3 pop-ups, the open menu, 10 bugs found and fixed). Figma has no small-screen frames, so they are our adaptation. Points to look at: hero photo shown above the text below 1024 px (text no longer sits over the photo); text sizes do not step down on phones; footer is one long column with 44 px link rows. | Stack columns, hamburger below 1200 px, same colours, fonts and text. | New Figma frames replace our adaptation and are built with the same exact-match process. | open |
| P2 | **Elements built without a Figma design:** form close "×", error style (navy text, red dot, thin red line), success message and wording, consent row (Contact page style, above each submit button), unselected radio circles on the feedback page, FAQ empty/pending states, Careers "Content pending" state. | Built in the Figma style. | Styles in `forms.css` / tokens. | open |
| P3 | **Contrast fails:** white on cyan `#00b8ff` 2.26:1 (buttons), cyan text on white 2.26:1 (header links, outline buttons, "Consult for a Care Plan", Careers outline buttons and cyan sub-heading), grey radios 1.24:1. Keep Figma colours or approve darker versions? | Figma colours kept. | Change the `--color-cyan` token (or add a dark-cyan token) in `src/styles/global.css`. | open |
| P4 | **Country pop-up glass effect, unselected defaults, 70% Name box:** approved by the client contact on 2 Oct; Padmavathi to confirm at QC. | As approved. | `forms.css`. | open |
| P5 | **People images needing KSA versions:** Home hero, Find a Doctor hero, Patient Hub hero, International, Insurance, Testimonials, Refer cards, Feedback hero (red ghutra), **Careers hero (Emirati doctor), "Be Part of a Purpose" (two women: hijab version), National Talent Development (Emirati couple)**. | UAE / Global images used on every edition for now. | Add region image keys in the content JSON (`img()` region lookup). | open |
| P6 | **Images available only at 1x** (hero banners 1052x500, Careers photos): soft at 1440 and retina. | Shipped at the Figma resolution. | Replace the source files (B7). | open |
| P7 | **Hero text over the photo on phones** (Find a Doctor, Patient Hub, Careers). | Text stacked over the photo with a readable column. | Content/props. | open |

### Cost items (Manager)
| # | Question | Default | If different | Status |
|---|---|---|---|---|
| M1 | Gotham web licence (B1) | Fallback font until files arrive | Add woff2 to `public/fonts/` | open |
| M2 | Email provider with retention off, or client SMTP (B2) | Provider adapter behind an env variable, `EMAIL_PROVIDER=none` locally | Env + adapter | open |
| M3 | Cloudflare Pages / Functions plan and Turnstile (B6, B8) | Cloudflare assumed | `deploy/` config | open |
| M4 | Figma Dev seat | Paid Dev seat in use (200 calls/day, 10/min) | n/a | confirmed |

## Resolved
- Figma budget: paid Dev seat since 2 Oct 2026 (confirmed).
- Country pop-up: switched ON for UAE visitors only (user decision 2 Oct 2026); KSA and other countries wait for B5.
- Testimonials and Care Support rows auto-scroll in a slow loop (user decision 2 Oct 2026, matches the live site).
