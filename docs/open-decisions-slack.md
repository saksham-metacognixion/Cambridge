*Cambridge Hospital website: open decisions (5 Oct 2026, final build phase)*
Full list with defaults and what changes: `docs/open-decisions.md`. Everything below has a working default on staging, so nothing is stuck, but the first block cannot go live without an answer. New since the last round: Health Article, Hospital detail, Our Care / Inpatient / Post Acute, 404 and Legal pages are built; link audit (`docs/link-audit.md`) and QC report (`docs/qc-report.md`) are in.

*:rotating_light: Blocking for go-live*
1. *Gotham font files + web licence* (Light, Book, Medium, Bold, Italic). Until then a fallback font is shown and line breaks differ from Figma. (Manager, Padmavathi)
2. *Email provider + inboxes* for the forms (provider with retention off, or the client's SMTP): Book, Enquiry, Feedback, Refer, International. (Pratik, Manager)
3. *Real data:* doctors, hospitals (+ phone, opening hours, map links), specialties, ~259 news posts (with their HTML bodies), FAQ answers, testimonials, conditions mapping. Today = Figma samples. (Pratik)
4. *Arabic text* for every page and form. All Arabic files are empty on purpose (no translating). (Pratik)
5. *Welcome / country pop-up flow:* scope says Global only with Global / UAE / KSA; Figma has the UAE version only (on for UAE visitors). (Pratik, Padmavathi)
6. *Production domain, hosting target, URL patterns* (Arabic path, page slugs incl. the new `media-hub/<slug>`, `our-hospitals/<slug>`, `our-care/...`, 301s). The live site blocks our scripts, so every slug is a guess. (Pratik, Manager)
7. *Original full-size photos and KSA image sets* (Figma images are 1052 px wide; people images need KSA versions, incl. the hospital banners). (Padmavathi, Pratik)
8. *Turnstile keys + Cloudflare account.* (Manager)
9. *Analytics decision* (GA + cookie banner or none; a mount point for the banner exists) and *Legal text* (privacy, cookie, compliance pages exist, empty). (Pratik)
10. *"We are listening" section* is in no About frame: the header link opens the Opinion pop-up until it is designed. (Pratik, Padmavathi)

*:white_check_mark: Decisions to confirm: Pratik (scope and content)*
- *Hospital pages:* Figma has Abu Dhabi only; the other five are generated (title "Advanced Care in <city>", placeholder banner, no video / gallery). Address, phone, hours sit under "Open in Google Maps" (not in Figma). "Book an Appointment" passes the hospital to the pop-up as a hidden field (the pop-up has no hospital field in Figma). Global shows all six, `/ae` and `/sa` their own three.
- *Our Care:* Figma covers Our Care -> Inpatient Care -> Post Acute Care only. Outpatient / Home Health / In School and the other five sub-services are generated pages. Post Acute "Know More" cards: two go to condition pages, two (Neuro, Musculoskeletal) to the Conditions list.
- *Health Article template* is a condition-page frame in Figma: news posts use it with the post image as hero, a date line (not in Figma) and the Figma button "Consult for a Care Plan" (odd on a press release: keep or change?). The three Home news cards link to the 404 page until the export arrives (their posts exist on Home only).
- *Links with no real destination* (closest page used): Knowledge Center -> Media Hub health articles; Home "Learn More" -> About; the four health calculators -> Patient Hub; social icons = one image, URLs needed.
- *Careers page* (not in the scope list): keep? URL `/careers` ok? No job list / apply form in Figma.
- Typos kept as in Figma (Inquiry/Enquiry, "Rober Hanna", "Impatients", "Breif History", "Adu Dhabi", Post Acute hero text = Inpatient text...): send the copy edit list.
- Form field lists, Home contact form identity, newsletter forms (not one of the 4 forms), Book Appointment option 1 vs 2, "We are listening" = pop-up or page, dial-code list, region of data, condition-to-specialty mapping, page titles / descriptions.

*:art: Decisions to confirm: Padmavathi (design and QC)*
- *Approve mobile and tablet layouts:* `docs/mobile-review/index.html` now covers 22 pages + 3 pop-ups + menu (Figma | 768 | 390 side by side, decisions per page).
- *Pages without a Figma frame:* 404 page and Legal template (built from existing parts only); the date line and body styles of the article; address / phone / hours block in the hospital map band; hospital gallery controls (photos are the controls: no arrows / dots in Figma); the "Content pending" state.
- Elements built without a Figma design (close x, error and success styles, consent row, unselected radios).
- Contrast: white on cyan 2.26:1, cyan text on white 2.26:1, grey radios 1.24:1. Keep Figma colours or darker ones?
- People images that need KSA versions (heroes, Careers photos, International, Insurance, Testimonials, Refer, hospital banners).

*:moneybag: Manager (cost)*
- Gotham licence, email provider, Cloudflare plan + Turnstile (see blocking items 1, 2, 6, 8).
