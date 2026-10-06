## Fixes made during this audit (5 Oct 2026)

All destinations are configuration (JSON `page` / `path` / `care` / `action` keys), never hard-coded in components, so each can be changed without code. Items with no real destination yet point to the closest existing page and are logged in `docs/open-decisions.md` (LA1-LA6).

| Where | Before | After | Log |
|---|---|---|---|
| Header + footer "Knowledge Center" | `#` | Media Hub, Health Articles category (`media-hub?category=health-articles#latest`) | LA1 (no Knowledge Center page in Figma or scope) |
| Home hero "Learn More" | `#` | About Cambridge | LA2 |
| Home doctors row | all six buttons `#` | "Book Now" opens the Book an Appointment pop-up with the doctor preselected; "See More" opens the doctor's profile | fixed |
| Home testimonials "View More Stories" | `#` | Patient Testimonials page | fixed |
| Home health calculators "Calculate Now" (4) | `#` | Patient Hub | LA4 (no calculator pages: not in scope) |
| Home "Services" cards, Our Care cards, hospital care cards, footer Services column | `#` | Our Care service pages (`our-care/<service>`) | OC3 |
| Header + footer "Our Care" | `#` | Our Care hub | OC3 |
| Home facilities "Visit Page", Our Hospitals "View Hospital", footer hospital names | Contact page / `#` | Hospital detail pages (own region when the current edition has none) | HD3 |
| Media Hub cards, Home News cards | `media-hub/<slug>` (no page) / `#` | Article pages; the three Home placeholder posts link to the 404 page until the export | AR5 |
| Footer "Compliance" / "Privacy Policy", every form's consent "Privacy policy" link (Contact page form included) | `#` | Legal pages | L1 |
| Language and region switches on hospital pages | 404 for a hospital the other region does not have | nearest existing parent (`our-hospitals` list) | LA5 |
| Post Acute "Know More" cards | new | condition detail pages / Conditions list | OC4 |

Still pointing to a stand-in page (needs an answer): Knowledge Center (LA1), Learn More (LA2), calculators (LA4), Home News placeholder posts (AR5). Social icons (LA6): linked to the live site's profiles since 6 Oct 2026 (`src/data/social.json`). URLs follow the live site since 6 Oct 2026 (WP1): `/faqs`, `/contact-us`, `/about/why-cambridge-hospital`, `/about/who-we-are`, `/patient-hub/find-a-doctor`, `/legal/<slug>`, `/care/home-healthcare`, `/care/in-school`.
