*Cambridge Hospital website: open decisions (5 Oct 2026)*
Full list with defaults and what changes: `docs/open-decisions.md`. Everything below has a working default on staging, so nothing is stuck, but the first block cannot go live without an answer.

*:rotating_light: Blocking for go-live*
1. *Gotham font files + web licence* (Light, Book, Medium, Bold, Italic). Until then a fallback font is shown and line breaks differ from Figma. (Manager, Padmavathi)
2. *Email provider + inboxes* for the forms (provider with retention off, or the client's SMTP): Book, Enquiry, Feedback, Refer, International. (Pratik, Manager)
3. *Real data:* doctors, hospitals, specialties, ~259 news posts, FAQ answers, testimonials. Today = Figma samples. (Pratik)
4. *Arabic text* for every page and form. All Arabic files are empty on purpose (no translating). (Pratik)
5. *Welcome / country pop-up flow:* scope says Global only with Global / UAE / KSA; Figma has the UAE version only (on for UAE visitors). (Pratik, Padmavathi)
6. *Production domain, hosting target, URL patterns* (Arabic path, page slugs, 301s). The live site blocks our scripts, so every slug is a guess. (Pratik, Manager)
7. *Original full-size photos and KSA image sets* (Figma images are 1052 px wide; people images need KSA versions). (Padmavathi, Pratik)
8. *Turnstile keys + Cloudflare account.* (Manager)
9. *Analytics decision* (GA + cookie banner or none) and *Legal pages* (privacy, cookies). (Pratik)

*:white_check_mark: Decisions to confirm: Pratik (scope and content)*
- *Careers page* (Figma 112:7295) is built but is not in the scope's template list. In scope? URL `/careers` ok?
- Careers has no job list, detail page or apply form in Figma. Needed? Own data, or an external jobs portal? Buttons ("Join our Team", "View Open Roles", "Apply Now") all go to Contact for now: one JSON change when we know.
- Careers tab content: 7 of the 9 tab panels have no text in Figma ("Content pending" on staging only).
- Health Article template: Figma exists, not built. Next?
- Typos kept as in Figma (Inquiry/Enquiry, "Rober Hanna", "Impatients", "Breif History", "Adu Dhabi"...): send the copy edit list.
- Form field lists, Home contact form identity, newsletter forms (not one of the 4 forms, a mailing list stores data), Book Appointment option 1 vs 2, "We are listening" = pop-up or page, dial-code list.
- Region of data (e.g. SAICO listed under UAE), condition-to-specialty mapping, page titles/descriptions.

*:art: Decisions to confirm: Padmavathi (design and QC)*
- *Approve mobile and tablet layouts:* `docs/mobile-review/index.html` (15 pages, 3 pop-ups, menu; Figma | 768 | 390 side by side, decisions per page). 10 small-screen bugs found and fixed (hero text over photos, tap targets under 44 px, black "Global" button, edge padding).
- Elements built without a Figma design (close x, error and success styles, consent row, unselected radios, "Content pending" state).
- Contrast: white on cyan 2.26:1, cyan text on white 2.26:1, grey radios 1.24:1. Keep Figma colours or darker ones?
- People images that need KSA versions: Home / Find a Doctor / Patient Hub / Feedback / Careers heroes, Careers photos, International, Insurance, Testimonials, Refer.

*:moneybag: Manager (cost)*
- Gotham licence, email provider, Cloudflare plan + Turnstile (see blocking items 1, 2, 6, 8).
