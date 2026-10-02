# Landing page audit against the Scope of Work, and conversion plan

30 Sep 2026. Covers the landing page built from Figma node `93:894` before the scope arrived. No Figma calls were made for this audit.

## 1. Gaps

### Forms (scope 2.7, CLAUDE.md §8)
| Now | Scope requires | Action |
|---|---|---|
| Contact form and footer newsletter post to Web3Forms (a third-party service that keeps copies) | Serverless function sends email; nothing stored | Remove Web3Forms. Add a Cloudflare Pages Function `functions/api/forms/[form].ts`: validate the fields, verify Turnstile, send one email, return a result. No database, no logs, no KV. |
| No consent checkbox, no privacy link | A required consent checkbox and a privacy link on every form | Neither is in the Figma frame. **Needs a Figma design or Pramod's OK** for the style. |
| Browser-default validation only | Required-field errors in EN and AR | Error text goes in `src/data/ui/{en,ar}.json`. Error styling isn't in Figma. **Needs a design or an OK.** |
| No spam protection | Cloudflare Turnstile | Load the Turnstile script only on pages with a form, with an invisible or managed widget so nothing visual is added. Verify the token on the server. |
| No success state | A success message | Not in Figma. **Needs a design.** |
| Footer "Subscribe to our newsletter" form | Not one of the scope's 4 forms, and a mailing list means storing data | **Ask Pramod:** keep it (sending where?), link it somewhere, or remove it? |
| The Contact section form on Home | 4 forms: Book an Appointment, Send an Enquiry, Refer a Patient, "We are listening" | **Ask:** which form is this? The fields must come from Pramod's list. |

Email provider: most transactional providers keep message logs or content by default, which conflicts with "nothing stored". The options are an SMTP relay on the client's own mail system (the Worker opens a TCP socket), or a provider with content retention turned off. **Pramod decides**, and also confirms the hosting target.

### Six editions and language (scope 2.2–2.3)
| Now | Required | Action |
|---|---|---|
| One page at `/` | `/`, `/ae`, `/sa`, each in English and Arabic | Generate every template for all 6 editions from `getStaticPaths` and an edition config. |
| The Arabic URL pattern is unknown | "Keep the current URL structure" | cambridgehospital.com returns 403 to scripts, so I couldn't read it. **Ask for the Arabic URL pattern.** My placeholder is `/ar`, `/ae/ar`, `/sa/ar`. |
| The EN/AR chip in the header is static | The switch keeps the visitor on the same page | Build the link for the same route in the other language. |
| "Global" in the header links to `#` | Its open state (edition switcher) isn't in the cache | **Figma needed.** |
| No country pop-up | Pop-up on the first visit to Global only | `functions/_middleware.ts` on the Global routes reads `request.cf.country` and sets a readable cookie when no choice is saved. A small script then shows the Figma pop-up and saves the choice in a cookie. Nothing runs on `/ae` or `/sa`. **Pop-up design is missing.** |

### Arabic RTL (scope 2.4)
Every horizontal position in the current code is physical (`left`):

- **Components affected:** 14 of 14, about 1,190 lines in total.
- **Hardcoded x coordinates:** about 154, plus about 74 `--x`/`--cx`/`--l` placement variables.
- **Other physical properties:** about 130 `left` and 13 `right` declarations, plus about 50 `ml/mr`, `pl/pr`, `text-left`, `rounded-tl`/`tr`, `origin-left` and `translate-x` utilities.
- **Manual cases:** about 25 transforms, masks, rotations and flips that CSS logical properties can't mirror. These are the rotated divider lines, the pattern and shape masks (`mask-position`), the flipped quote shape in Testimonials, the News arrows and the hero/Doctors dots.

Estimate: **about 85–90% of the positioning code changes**. Most of it is mechanical:

- **Mechanical changes:** `left-N` → `start-N`, `left:` → `inset-inline-start:`, `ml/mr` → `ms/me`, `pl/pr` → `ps/pe`, `text-left` → `text-start`, `rounded-tl` → `rounded-ss`, and so on.
- **Manual changes:** the about 25 special cases each get an `rtl:` override. The logo image itself is never flipped; it only changes side.

Each x coordinate becomes the distance from the start edge, so `dir="rtl"` gives an exact mirror (right = x). I'll check in two steps. First, the LTR page must still measure 0.0 px against the spec, using the measuring script from the last build. Second, a `dir="rtl"` screenshot of the English page checks the mirror.

This only fixes layout. The Arabic text still has to come from the Arabic Figma frames.

### Region images (scope 2.2)
Nothing is split by region yet. It's also unclear which edition frame `93:894` is. The first testimonial (Mohamed Al Menhali) wears a red turban, and the scope's own example says red is KSA and white is UAE, so this frame may already mix regions. **We need the UAE and KSA frames**, or a list of which images change per region.

### Animations (scope 2.1)
- **Hero cursor-follow:** not built. The hero banner is a single flattened PNG (woman, child and pill lines in one image), so nothing in it can follow the cursor yet. **We need the motion spec and the separate layers.**
- **Doctor animation:** not built. The cached data has no motion information. **We need the motion spec.**
- **Hero banners:** there are 4 pager dots in the hero, and two hidden banner layers (`21:665`, `21:666`). **Ask:** is the hero a slider?

### Templates filled from JSON (CLAUDE.md §4)
All content is hardcoded in the components: nav, 6 doctors, 6 hospitals, 3 news posts, 6 testimonials, 4 services, 10 care tiles, 4 calculators, 6 stats, 7 insurers and the footer links.

Page copy moves to `src/data/pages/home/{en,ar}.json`, plus region overrides. Doctors, hospitals, specialties and news come from Pramod's JSON through Astro content collections with a schema. The components receive props.

### Images, responsive, accessibility, SEO
| Item | Now | Action |
|---|---|---|
| 1x and 2x images | Sources are Figma exports at the 1052px frame size (the hero is 1052×500), so 2x at 1440 is impossible | Download the original uploaded images with `download_assets` (see §4). Then output widths 390/414/768/1024/1280/1366/1440/1536/1920 plus 2x. |
| Full nav from 1200px | The hamburger switches at 1024px | Move the header breakpoint to 1200px. The rest of the layout stays as it is. |
| Desktop widths 1280/1366/1536/1920 | Measured only at 1024/1440/1920 | Add those widths, plus 390/414, to the checking script. |
| Touch targets ≥ 44px | Many Figma controls are smaller (at 1440: See More 18px tall, Start Your Care 23px, pills 34px, header links about 20px) | Enlarge the clickable area with a transparent overlay so nothing looks different. On mobile, size controls to at least 44px. |
| WCAG AA contrast | See §2 | Flag only, per CLAUDE.md. |
| hreflang and language tags | None | Add `en`, `ar`, `en-AE`, `ar-AE`, `en-SA`, `ar-SA` and `x-default` alternates to every page. |
| Sitemap per edition | None | Add 6 sitemap endpoints and a sitemap index. |
| Per-page meta | One hardcoded title and description, and the canonical URL points to example.com | Take the title and description from each page's JSON. Set `site` once Pramod gives the domain. |
| 301 redirects | None | Add `public/_redirects` from Pramod's redirect map. |
| Keyboard use and heading order | Headings go h1 → h2 → h3; the menu is a CSS checkbox | Check the checkbox is keyboard-focusable during QA. |
| Carousels | No content is repeated | OK |
| Fonts | Figma also uses **Gotham Bold 700** (testimonial names); CLAUDE.md lists only 300/400/500 | **Ask:** add the Bold file, or confirm another weight. The woff2 files are still missing. |
| Header chevron | `figma-cache/chevron-down.svg` isn't anywhere on this Mac (full search done) | **Please re-export it.** The slot stays empty until then. |

## 2. Contrast (flagged only; colours not changed)
| Ratio | Result | Pair |
|---|---|---|
| 2.26 | **FAIL** (fails even the 3:1 large-text minimum) | White text on cyan `#00b8ff`: all cyan buttons and the Hospitals tab |
| 2.26 | **FAIL** | Cyan `#00b8ff` text on white: header top links, hero outline buttons, Services titles, testimonial names |
| 2.05 | **FAIL** | Cyan outline-button text on the light hero banner |
| 4.51–5.33 | Pass | Grey `#6b6b6b` on white, on the veil grey, and on the form fields |
| 4.89 | Pass | Cyan numbers on navy `#00415a` (Facilities stats) |
| 9–11 | Pass | Navy on white, white on navy, footer links |

Needs a decision from Pramod or the designer: keep cyan as it is, or use a darker cyan for text and button backgrounds.

## 3. Content consistency (flag only; edits need Pramod's written list)
- "Send an **Inquiry**" (Figma, header and CTA) vs "Send an **Enquiry**" (scope).
- "Dr. **Rober Hanna** Kassab" (Doctors card) vs "Dr. **Robert** Kassab" (News).
- "Improved **Impatients**" (Facilities stats). Probably meant "Inpatients".
- "Our specialists **provides**…" (Start Your Recovery).
- "Cambridge Medical & Rehabilitation" (News excerpt) vs "Cambridge Hospital".
- The first Quick Links item reads "Cambridge". It may mean "About Cambridge".

## 4. Missing Figma data and estimated calls
| Data | How | Est. calls |
|---|---|---|
| List of pages and frames: which templates, Arabic, UAE/KSA and pop-ups exist | `get_metadata` for the page list, then 1 per page with designs | 2–4 |
| Hero cursor-follow and doctor animation | `get_motion_context` on the two nodes | 2 |
| Arabic Home | One read-only `use_figma` that dumps every text node with its position; `get_design_context` only where the layout differs | 1–5 |
| UAE vs KSA Home images | One `use_figma` per frame listing image hashes to find the differences, then `download_assets` on the sections that differ | 4–10 |
| Full-resolution originals for 2x (Home) | `download_assets` on each image-heavy section (returns the uploaded originals, up to 20 per call) | 6–8 |
| Pop-ups: country, Book an Appointment, Send an Enquiry, We are listening, Refer a Patient (+ success/error states if designed) | 1 `get_design_context` each (small frames) | 5–8 |
| Header "Global" switcher open state, and the mobile menu if designed | `get_design_context` | 1–2 |
| 12 other templates in English: About, Patient, Care, Hospitals list, Hospital detail, Find a Doctor list, Doctor profile, News list, Article, Contact, Legal, 404 | A tall page costs 1 sparse call plus about 5–8 section calls | 70–110 |
| Arabic versions of those templates | One text-dump `use_figma` each | about 12 |
| **Total** | | **about 105–160** |

**Budget blocker:** the plan allows about 20 read calls a month. This month already used 16 reads and 4 `use_figma` calls (and whether `use_figma` counts is still unconfirmed). The whole site can't be built by 15 Oct on this plan. Options:

- A paid Dev or Full seat for the sprint, which has much higher limits.
- Pramod or the designer exporting assets and text in bulk.
- Confirming with Figma whether `use_figma` read-only calls count, because they can dump the text and structure of a whole page in one call.

## 5. Proposed structure
```
src/
  data/
    editions.json            # global|ae|sa: base path, locales, hreflang codes, phone, region image set
    ui/{en,ar}.json          # nav, buttons, form labels, errors, success text
    pages/home/{en,ar}.json  # page copy + meta title/description; region overrides in pages/home/{ae,sa}.json
    doctors.json hospitals.json specialties.json news/   # from Pramod (content collections + zod schema)
  lib/  scale.ts  i18n.ts (t(), localePath(), alternates())  editions.ts  images.ts (widths/2x presets)
  layouts/BaseLayout.astro   # lang, dir, title/meta, canonical, hreflang, font preload
  components/
    layout/ Header, Footer, LanguageSwitch, EditionSwitch, CountryPopup
    ui/     Button, Pill, Card, HitArea (44px), Picture presets
    forms/  Form.astro (+ tiny script), fields, Consent, Turnstile
    home/   Hero, CtaTab, Services, Doctors, ... (current sections, props-driven, logical CSS)
    ...     one folder per template
  pages/
    [...base]/index.astro                 # Home for all 6 editions (base = '' | ar | ae | ae/ar | sa | sa/ar)
    [...base]/find-a-doctor/index.astro, [...base]/doctors/[slug].astro, ...   # same pattern per template
    [...base]/sitemap.xml.ts + sitemap-index.xml.ts
    404.astro
functions/
  _middleware.ts             # Global only: geo cookie from request.cf.country
  api/forms/[form].ts        # validate, verify Turnstile, send email, no storage
public/ fonts/  _redirects  _headers
```

## 6. Step-by-step plan
**A. Now, no Figma or Pramod needed (targets the 2 Oct Setup gate)**
1. Add the edition config and i18n helpers. Generate Home for all 6 editions. BaseLayout sets `lang`, `dir`, meta, canonical and hreflang. Add the per-edition sitemaps and a `_redirects` stub.
2. Convert the RTL positioning (the mechanical pass, then the about 25 manual cases). Check that LTR still measures 0.0 px against the spec, and that the `dir="rtl"` screenshot is mirrored.
3. Move the Home content into `src/data/pages/home/en.json` and make the components props-driven. Define the content-collection schemas for doctors, hospitals and news with placeholders shaped for Pramod's JSON.
4. Move the header breakpoint to 1200px. Add the 44px hit areas. Wire the EN/AR switch and edition links, and replace `#` links with real routes.
5. Remove Web3Forms. Build the form function (validation, Turnstile, provider adapter behind an env variable, no storage) and the client form component with EN/AR errors. The visuals wait on Figma.
6. Build the country pop-up logic (middleware and cookie). The visuals wait on Figma.
7. Build the image presets (widths plus 2x), ready for the full-resolution sources.

**B. Needs Figma (after the budget is sorted):** page inventory → motion → pop-ups → Arabic Home → region images and originals → the other templates, in the order of the 6 Oct and 9 Oct gates.

**C. Needs Pramod:** everything in §7.

## 7. Questions for Pramod
1. **Arabic URLs:** what is the Arabic URL pattern on the current site?
2. **Hosting and email:** confirm Cloudflare Pages, choose the email route (SMTP relay or a provider with retention off), and give the recipient inbox for each form in each edition.
3. **Form details:** send the field lists for the 4 forms. Say which form the Home contact section is, and what happens to the newsletter form.
4. **Missing designs:** consent checkbox, error and success states (Figma, or OK to style from existing tokens).
5. **Contrast:** decide on the cyan contrast failures (§2).
6. **Copy:** send the edit list for §3.
7. **Hero:** is the hero a slider? Where are the region frames and motion specs?
8. **Fonts:** Gotham Bold 700 (used in Figma) and the font files.
9. **Figma budget:** resolved 2 Oct 2026 (paid Dev seat, see CLAUDE.md §3).
10. **Analytics:** Google Analytics with a consent banner, or none?
11. **Welcome / country pop-up (scope 2.3):** Figma has only "You’re on Our UAE Website" (Continue Here / Go to Global Website). The scope says Global only, offering Global, UAE and KSA. Which flow is correct? Is there a KSA version (map, text, flag)? Do visitors from other countries see a pop-up? (Built from the UAE design, switched off in `src/data/country-popup.json`. Current reading: Continue Here = UAE site, Go to Global = stay; Esc = stay.)
12. **Book an Appointment:** Option 1 (106:246, built) or Option 2 (106:510): which is final?
13. **"We are listening" link (scope 2.5, 2.7):** the Your Opinion Matters pop-up or the Patient Feedback page? (Now: header opens the pop-up, footer goes to the page at the placeholder URL `/patient-feedback`.)
14. **Dial codes:** confirm the country list and order for the Mobile fields (now all countries; default +971 on Global and UAE, +966 on KSA). Figma has only the UAE flag: send flag artwork, or OK to show no flag for other countries.
15. **Forms:** field lists for all forms, the recipient inbox per form type (`FORM_TO_BOOK_APPOINTMENT`, `FORM_TO_SEND_ENQUIRY`, `FORM_TO_FEEDBACK`, `FORM_TO_REFER_PATIENT`; the Home contact section uses the Send an Enquiry inbox), and all Arabic text (labels, errors, success, country names).
16. **Built without a Figma design, for approval:** close ×, error style (navy text, red dot, thin red line on the field), success message and its wording, the consent row (Contact page style, placed above each submit button; forms grow by that row), unselected radio circles on the feedback page.
17. **Spelling:** Inquiry / Enquiry, Speciality / Specialty, E-mail / Email. Which one, everywhere?
18. **Contrast fails:** white on cyan 2.26:1 (buttons), cyan text on white 2.26:1 ("Consult for a Care Plan"), grey radios 1.24:1. Keep the Figma colours, or approve darker versions?
19. **Photos:** the original full-size photos. The home hero and the feedback hero are only 1052 px wide in Figma (soft at 1440 and on retina), and the feedback hero needs a KSA (red ghutra) version.
20. **Missing pages already linked:** Privacy policy (consent row on every form + footer) is still "#" until the Legal pages are built.
