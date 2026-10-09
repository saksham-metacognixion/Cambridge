# Animation audit vs the live site — 8 Oct 2026

Scope: animations, transitions and motion only (user brief, 8 Oct 2026). Nothing else was changed: no content, layout,
spacing, type, colour, image, route or form logic. Source of truth for motion = the live site as captured locally:

- `docs/cambridgehospital.WordPress.2026-10-06.xml` — every live page / content block with its Greenshift motion attributes
  (`gs-prlx-mouse`, `data-aos`, `.gs-counter`, Swiper `gs-swiper-init` settings, tabs, accordions, hover properties of every block).
- The five saved live pages in `~/Downloads` (About, Our Care, Our Hospitals, Why Cambridge, Contact Us) with their `_files`:
  Blocksy theme CSS (`main.min.css`), Greenshift scripts (`gsap-mousemove-init.js`, `aoslight.js`, Swiper `init.js`,
  `index.js` counters / lightbox), Bit Form CSS, Code Snippets (`287.css`, `19964.css`, `19967.js`), `sticky.js`, `back-to-top`.
- cambridgehospital.com itself was **not** opened by script (standing instruction, 7 Oct 2026; a permitted attempt on 8 Oct hit
  Cloudflare's challenge). On 9 Oct 2026 the user saved four more live pages (FAQs, Who We Are, Cambridge Hospital Abu Dhabi,
  Dr. Sami Alamin) into ~/Downloads, which closed every UNVERIFIED row: Greenshift tabs / accordion CSS, the hospital and
  doctor templates. The article template was fetched live on 8 Oct.

Earlier audits already matched About, Our Hospitals, Why Cambridge and Contact Us (7 Oct 2026, see docs/open-decisions.md
WP17-WP19); their rows are repeated here as PASS with the verified values.

Status key: **PASS** = matches the live behaviour (values listed) · **FIXED** = was MISSING / INCORRECT, now PASS ·
**OPEN** = live has it, not reproducible without a layout / content change or overruled by a recorded client decision
(logged as AN1-AN12 in docs/open-decisions.md) · **UNVERIFIED** = no local source for the live value · **N/A** = no live
counterpart (Figma-only element) or no motion on either side.

## Site-wide (theme + shared blocks)

| Element | Live animation | Ours | Status | Action |
|---|---|---|---|---|
| Every page hero (48 live pages) | `gs-prlx-mouse data-prlx-xy="14"`: people layer follows the cursor, x = (cursorX / body width − .5) × 14 px, y likewise over the body height, gsap.to 0.5 s Power1.easeOut per move, whole-page listener, no return to rest | `src/scripts/hero-follow.ts`, same formula and easing; only the people (or the Hospitals map group) move, gradient and pills fixed; mouse only, off with reduced motion | PASS | none (all 36 templates × EN/AR/ae/sa checked: layer moves) |
| Links (`a`) | `transition: all .12s cubic-bezier(.455,.03,.515,.955)` (Blocksy `--theme-transition`) | buttons / pills / tabs: `--ui-ease` = the same curve (global.css). Header links, footer links, post-card titles had no transition | FIXED | header nav / dropdown / region / Visit links, footer links, post titles now ease colour with `--ui-ease` |
| Header dropdowns (`data-dropdown="type-1:simple"`) | `.sub-menu`: opacity 0→1, visibility, `translate3d(0,10px,0)`→0, all `.2s ease` | was opacity .15s only | FIXED | `.sub`, `.fly` (Our Care fly-out) = .2s ease fade + 10 px rise |
| Language / region dropdown | `.ct-language-switcher[data-type=dropdown] > ul`: opacity, visibility, `translate3d(0,10px,0)`, `.2s ease` | region menu `.rmenu` was .15s fade | FIXED | same .2s ease + 10 px rise |
| Top-level nav item hover | `nav li:hover > .ct-menu-link` colour change (.12s) | no hover state | FIXED | hover = brand AA treatment (Deep Teal + 2 px cyan underline, as the dropdown items), .12s |
| Hamburger (`ct-header-trigger`) | lines morph to an X, `all .12s` theme curve | .2s | FIXED | .12s theme curve |
| Mobile menu (`right-side` offcanvas) | panel `opacity .25s ease-in-out`; inner `translate3d(20%,0,0)`→0 `.25s ease-in-out` | `display:none` → `flex`, no motion | FIXED | our dropdown panel fades .25s ease-in-out and slides in from 20 % off the inline end (mirrored in RTL); hidden via `visibility`, no horizontal overflow (checked 390 / 768, EN + AR). The closing transition is armed by the first toggle (`.nav-toggled`, scripts/nav-submenu.ts) so a window resized across 1200px never slides the closed panel out (checked) |
| Mobile submenu accordion | `.mobile-menu ul.is-animating { transition: height .3s ease }` | `display:none` → `block` | FIXED | grid-row 0fr→1fr over .3s ease (both levels) |
| Sticky header (`data-sticky="shrink"`, `sticky.js`, `--header-sticky-animation-speed .2s`) | header sticks and shrinks on scroll | none | OPEN | WP18 (7 Oct): theme chrome not in Figma, waiting for Pramod |
| Back-to-top button (`back-to-top.min.css`, .3s fade) | square button fades in after scrolling | none | OPEN | WP18 |
| Footer (`Footer-En` block) | `data-aos="fade-up"` 600 ms, ease, rise max(50px, 15 %), replays | Footer.astro: same values | PASS | none |
| Footer links | colour → white on hover (.12s) | none | FIXED | `.links a:hover` → white, .12s |
| Footer / Home contact social icons | `width_hover` / `height_hover` 38 → 39 px with the theme .12s (the `stroke_hover` targets an `<img>` and has no visible effect) | icons are one Figma image with transparent hit links; no hover | FIXED (9 Oct 2026) | each link redraws its own icon from the same strip image (a background slice shown only while hovered) scaled by 39 / 38 over .12s; strip image and layout untouched; mouse only, off with reduced motion; EN + AR checked (AN9 closed) |
| Footer newsletter button (form 1 `.bf-btn`) | hover opacity .7 (.25s), pressed scale(.98) .18s | hover = brand cyan underline (BG3) | FIXED (motion) | pressed scale(.98) .18s added; the hover look stays the brand decision |
| Footer columns on phones (`287.css`, < 768) | headings collapse / expand the link lists, max-height + opacity .3s cubic-bezier(.25,.8,.25,1), `+` / `−` glyphs | columns always open | OPEN (AN8) | a layout / content change (toggle glyphs), not built |
| Cookie notice (`ct-fade-start`) | fade | none | N/A | analytics / cookie banner still "to be confirmed" (scope) |
| CTA tiles (Appointment / Find a Doctor, "CTA Buttons Grid" on every page) | background → #e7e7e7 on hover, .12s | ContactRecovery: `.tile` / `.tbg` → `--color-mist`, .12s curve | PASS | none |
| Buttons (Greenshift hover colours) | fills invert / outlines recolour, .12s | shared `.btn-fill` / `.btn-fill-navy` / `.btn-outline` / `.ui-pill` / `.ui-tab`, .12s curve; colours = brand AA pass (BG3, 8 Oct) | PASS (motion) | colour choices documented in WP16 / BG3 |
| Scroll entrances (Greenshift AOS light) | `aos-animate` 10 ms after any part enters (rootMargin bottom −5 %), removed when fully out → replays; fade-up = opacity + translate3d(0, max(50px,15%), 0), 0.8 s cubic-bezier(.42,0,.58,1), per-item delay 0 / 50 / 100 / 150 ms | `src/scripts/aos.ts` + `.aos [data-aos]` CSS: identical | PASS | none |
| Count-up (`.gs-counter`, Greenshift index.js) | from 0, linear, whole numbers, `Intl` commas, postfix kept, starts at 30 % in view, once; `data-duration` per stat | `src/scripts/countup.ts` Greenshift mode (`data-countup-duration`) | PASS (where used, see pages) | Home and Who We Are switched to it (below) |
| Swiper rows (loader.js on first interaction, init.js) | `speed` / `autoplay.delay` / `pauseOnMouseEnter` (= not `disablepause`) / `disableOnInteraction` (= not `autoplayrestore`), wrapper timing = CSS `ease`, grab cursor, loop | `src/scripts/autoscroll.ts` step mode now takes the four settings per row (`data-autoscroll-delay / -speed / -pause / -restore`); drag-scroll.ts gives the grab cursor | FIXED (see Home) | — |
| Swiper pagination bullets | `transition: width .4s ease-out` | shared Pagination dots: 200 ms colour + size | FIXED | width / height .4s ease-out, colour at once |
| Video lightbox (`GSLightbox`) | overlay opacity 0→1 `.3s ease-in-out`; content `scale(.8)`→1 `.3s ease-in-out`; close button hover darkens .3s | 250 ms ease, scale .96 | FIXED | 300 ms ease-in-out, scale .8 (About intro, hospital environment videos) |
| Play-button pulse | two 1 px rings, `pulse-ring 2s cubic-bezier(.215,.61,.355,1) infinite`, second +0.5 s, scale 1→1.5, opacity 1→0 | `.video-pulse` identical | PASS | none |
| Doctor card photo (`.doctor-image-box`) | `scale(1.04)` on hover, `transition: all .5s cubic-bezier(.42,0,.58,1)` | 1.04 over 200 ms ease-out | FIXED | .5s cubic-bezier(.42,0,.58,1) (origin stays the bottom edge, bug 019) |
| Doctor name (`dynamic-post-title`) | colour → cyan (.12s), underline grows 0 → 100 % over .7s ease | the name is a heading, not a link (Figma); the card button links | OPEN (AN10) | adding links = structure change |
| Post / news card title (`colorlinksHover`) | colour → cyan, .12s | Media Hub cards: no hover; Home news title is not a link | FIXED / OPEN (AN10) | PostCard title: brand AA hover (Deep Teal + cyan underline), .12s |
| Blocksy `[data-reveal]` archive entrance (1.5 s) | Blocksy blog archive only | not used on the live Cambridge templates (Media Hub archive is a Greenshift block) | N/A | — |
| Bit Form (all live forms, `bitform-1.css`) | `.bf-spinner` 1 s linear ring while sending; `.bf-form-msg.active` fades in 1 s ease-out; field items `all .2s ease` | Contact form had it (WP19); the shared FormShell forms (Refer, International, Your Opinion Matters, pop-ups) had no spinner / fade | FIXED | FormShell submit shows a 1 s linear ring while `aria-disabled`; `.f-success` fades in 1 s ease-out |
| Bit Form field focus / invalid / button shadow (per-form custom CSS) | known for the Contact form (form 4) and the footer form (form 1) only | Contact form matched (WP19) | UNVERIFIED for Refer / International / Opinion | custom CSS of those forms is not in the local sources |
| Greenshift tabs (`gspb-tabs`, Who We Are, Accreditations, Careers, FAQs, hospital gallery areas) | saved pages 9 Oct 2026: `.t-btn { transition: all .4s ease-in-out }`; the panels are NOT a swiper here (`tabscroll`, no `tabswiper`): `tabs.js` toggles `display:none` / `.active`, so the switch is instant; < 768 the vertical tabs become a bottom sheet (`19967.js`, sheet slides up .42s cubic-bezier(.22,1,.36,1)) and the chosen panel plays `gs-panel-in` .28s cubic-bezier(.22,1,.36,1) (opacity 0 → 1, translateY 8px → 0) | tab buttons eased .12s; panel switch instant; < 1024 accordion (bug 035) with no entrance | FIXED | `.ui-tab` now eases .4s ease-in-out (every tab list); < 768 the shown panel of the shared Tabs and the FAQ plays the same .28s rise (`ui-panel-in`, global.css). The bottom sheet itself stays the bug 035 accordion (AN7) |
| Greenshift accordion (FAQs, `gsclose` / `gsopen`) | saved page 9 Oct 2026: answer `max-height: 0 → 5000px` + `opacity 0 → 1`, `transition: all .25s ease-out` (the height is in place almost at once, the fade shows); title `transition: all .3s ease-in-out`; icon `transform: rotate(90deg)` over .3s ease-in-out; `toggleone` = one open per group | native `<details>`, instant, chevron swapped | FIXED | FaqSection: the script runs the group (name attribute dropped with JS, kept without), keeps `open` through the .25s collapse, `.is-open` a frame after opening; bar colours .3s ease-in-out; one chevron turning 180° over .3s; off with reduced motion. Measured: cross-fade 0.25 s, first item closes at 0.3 s, keyboard Enter / Space works |
| Country pop-up, Book / Enquiry / Opinion pop-ups | no live counterpart (live links to pages) | Figma pop-ups, no motion | N/A | — |

## Pages

### Home (`/`, `/ar/`, `/ae`, `/sa` + AR)

| Section / element | Live | Ours | Status | Action |
|---|---|---|---|---|
| Hero | `gs-prlx-mouse` 14 (mother and baby / family) | hero-follow.ts on the subject layer | PASS | — |
| Hero buttons "Get in Touch" / "Learn More" | border + label → navy (.12s) | `.btn-outline`, .12s (colour per BG3) | PASS (motion) | — |
| CTA 4 buttons | → #e7e7e7 | CtaTab / ContactRecovery tiles | PASS | — |
| Care cards ("Hospital Information" × 4) | `data-aos="fade-up"` 800, delays 0 / 50 / 100 / 150 | Services.astro `data-aos` with `--aos-delay: i × 50ms` | PASS | — |
| Care card buttons | → navy fill | `.btn-fill` (→ navy, BG3 labels) | PASS | — |
| Medical Team row ("Content Area" swiper) | 5.6 per view, **speed 1000, autoplay delay 1000**, loop, centered, grab cursor, **pauses on mouse enter, stops for good after a drag** (no `autoplayrestore`) | was a constant 8 s-per-card glide that resumed 2.5 s after a drag (bug 018 approximation) | FIXED | `data-autoscroll="step" data-autoscroll-restore="no"`: 1 s pause, 1 s eased slide of one card, hover pauses, click / dots / pills keep it, a drag ends it (measured: 9 × 100 ms still, one card per ~2 s, EN + AR, 390 / 768 / 1440) |
| Doctor photo / name hover | scale 1.04 .5s / cyan + underline .7s | FIXED / OPEN (AN10) | see site-wide | |
| Care Support row | 8.5 per view, **speed 12000, delay 0**, loop, **`disablepause`** (no hover pause), `autoplayrestore` | 8 s glide, paused on hover | FIXED | `step`, delay 0, speed 12000, pause "no": one tile per 12.0 s with Swiper's CSS `ease` (fast early, long slow tail), never pauses under the mouse, resumes 2.5 s after a drag (the drag spring must settle; Swiper restarts at once) |
| Hospitals Locations (Facilities cards) | UAE / KSA links → navy fill + white; "Visit" → cyan border; "Book" → navy | shared button classes, .12s | PASS (motion) | — |
| Counter grid (6 stats) | `.gs-counter` data-duration **1 / 1.5 / 2 / 1 / 1.5 / 2 s**, linear, from 0 at 30 % in view, once | one grouped 2 s ease-out count, final value shown before | FIXED | per-stat Greenshift mode in Facilities.astro (measured: "0" before, 1 s stats final at 1.2 s, all final at 2.3 s, no replay) |
| Stories (Testimonials) row | 4 per view, **speed 15000, delay 0**, loop, `disablepause`, `autoplayrestore` | 8 s glide, hover pause | FIXED | `step`, delay 0, speed 15000, pause "no": one card per 15.0 s eased, no hover pause (measured 282 px per 15.2 s = one card) |
| "View More Stories" | → navy fill | `.btn-fill` | PASS | — |
| CTA Recover tiles | → #e7e7e7 | ContactRecovery | PASS | — |
| Calculators "Calculate Now" | → cyan fill + white | `.btn-fill-navy` (→ cyan, Deep Teal label BG3) | PASS (motion) | — |
| News and Insights slider | 3 per view, **speed 800, autoplay 8000**, centered, loop, pause on hover, no restore; title → cyan | Figma: three fixed cards + category pills + dots; no slider, title not a link | OPEN (AN2, AN10) | turning the cards into a carousel changes the layout |
| Insurance Providers | static logo strip (the "Insurance Providers" block has no swiper); "View All" → cyan fill | static strip, `.btn-fill-navy` | PASS | — |
| Contact (social icons) | 38 → 39 px on hover, .12s | per-icon slice of the strip scales 39 / 38 (see site-wide) | FIXED | — |
| Footer | fade-up 600 | same | PASS | — |

### About (`/about`)
| Section / element | Live | Ours | Status |
|---|---|---|---|
| Hero | prlx 14 | follow | PASS |
| Intro video | lightbox .3s ease-in-out, scale .8→1; pulse rings 2 s | FIXED (timing) / PASS (pulse) | |
| Explore cards | fade-up 800, 0 / 50 / 100 / 150; title → cyan, button → navy | PASS (7 Oct audit; title hover = brand AA underline) | |
| Journey timeline (Swiper 754c702) | speed 400 ease, loop, autoplay 6000, no hover pause, stops on drag / arrow; bullets exist live, not in Figma | timeline.ts: identical; no bullets (Figma) | PASS (dots: open since 7 Oct) |
| CTA tiles, footer | #e7e7e7 / fade-up | PASS | |

### Who We Are (`/about/who-we-are`)
| Section / element | Live | Ours | Status |
|---|---|---|---|
| Hero | prlx 14 | follow | PASS |
| Counter grid (1,300+ · 715+ · 15+ · 60 % · 85 % · 91 %) | `.gs-counter` 1 / 1.5 / 2 / 1 / 1.5 / 2 s, linear, once, 30 % | **no count-up** | FIXED: Network.astro stats count with the live durations (invisible size copy keeps the grid stable; sr-only final value) |
| Our Mission tabs (3) | `.t-btn` .4s ease-in-out, instant panel switch, < 768 bottom sheet + `gs-panel-in` .28s | shared Tabs: buttons .4s, instant switch, < 768 panel rise .28s; accordion layout (bug 035) | FIXED / AN7 |
| Expanding globe, Foundation, CTA tiles | no content motion live; tiles #e7e7e7 | same | PASS |

### Why Cambridge Hospital — PASS (7 Oct audit WP18: 8 counters 1.5 s, hover colours per BG3, footer). No change.
### Accreditations & Partnerships — hero PASS; 8 tabs = the Greenshift tabs (buttons .4s ease-in-out, instant switch, phone panel rise .28s) FIXED; CTA tiles PASS.
### Career Hub — hero PASS; "UAE / KSA vacancies" border → navy + label → cyan (.12s): `.btn-outline` .12s PASS (colours BG3); two tab sets FIXED as above.
### Our Care (`/care`) and care section pages
| Section / element | Live | Ours | Status |
|---|---|---|---|
| Hero | prlx 14 | follow | PASS |
| Four service cards | fade-up 800, 0 / 50 / 100 / 150; buttons → navy | CareCards `reveal`, `.btn-fill` | PASS |
| "Meet Our Team" | → cyan border + label | `.btn-outline` | PASS |
| Doctors row (Swiper, 4 per view) | speed 1000, delay 1000, loop, hover pause, **no restore** | DoctorsRow step mode | FIXED (`data-autoscroll-restore="no"`; a drag now ends the autoplay as live) |
| Doctor photo / name | scale 1.04 .5s / cyan underline .7s | FIXED / OPEN (AN10) | |
| Section pages (inpatient, outpatient, home, in-school) | live: hero prlx only (in the export, no AOS / counters) | PageHero follow; topic tabs (shared Tabs) | PASS (hero); tabs UNVERIFIED (AN6) |

### Our Hospitals — PASS (7 Oct audit: map group follows in both axes, 6 counters 1 / 1.5 / 2 s once, title → cyan, card button → cyan (WP17 resolved), tiles #e7e7e7, footer). No change.
### Hospital detail (saved live Cambridge Hospital Abu Dhabi page, 9 Oct 2026)
| Section / element | Live | Ours | Status |
|---|---|---|---|
| Hero | prlx 14 | follow | PASS |
| Hero button | → white border + label (.12s) | `.btn-outline` / shared, .12s (colour per BG3) | PASS (motion) |
| Environment video | GSLightbox .3s ease-in-out, pulse rings | same (FIXED earlier) | PASS |
| Healing Environment gallery (4 Swipers, one per area tab) | 1.5 per view centered, **speed 800** (CSS ease), loop, **autoplay 8000**, pause on mouse enter, no `autoplayrestore` (a drag ends it), no grab cursor; area tabs `.t-btn` .4s | slides moved in .45s cubic-bezier(.22,1,.36,1), no autoplay | FIXED | slides .8s ease; the shown area advances every 8 s, the mouse over the photos holds it, a swipe / drag ends it, click / key / dot restart the 8 s; off with reduced motion (measured: 8 s step, hover hold, drag stop) |
| Map band | no motion (static map + link) | same | PASS |
| Care cards ("Inpatient … In School") | `data-aos="fade-up"` 800, delays 0 / 50 / 100 / 150; titles → cyan, buttons → navy | CareCards without `reveal` | FIXED | `reveal` on hospital pages (4 cards 0 / 50 / 100 / 150) |
| CTA tiles, footer | #e7e7e7 / fade-up 600 | same | PASS |
### Patient Hub — hero PASS; six hub cards: title → cyan (.12s) and button → #7AFFCE + white live → ours `.btn-fill-navy` (cyan per the 7 Oct hospitals decision / BG3), title not a link (AN10); CTA tiles PASS.
### Find a Doctor — hero PASS; the live magnifier search field (icon → Muted Teal on hover) has no counterpart: ours is the dropdown combobox of R056, whose clear ✕ already tints on hover (AN12 closed, N/A); doctor cards: photo FIXED (.5s), name OPEN (AN10), buttons PASS; CTA tiles PASS.
### Doctor profile (saved live Dr. Sami Alamin page, 9 Oct 2026)
| Section / element | Live | Ours | Status |
|---|---|---|---|
| Banner | none live (breadcrumb + photo card; no `gs-prlx-mouse`) | PageHero follow (HF1 decision, every page hero) | PASS (decision) |
| Photo (`dynamic-post-image`) | `data-aos="fade"` 800 ms ease: fades in on load | no entrance | FIXED | the profile photo carries `data-aos="fade"` (aos.ts, 0.8 s) |
| Book an Appointment | → cyan fill (.12s) | `.btn-fill-navy` → cyan, .12s | PASS |
| Sub specialties / summary | no motion | none | PASS |
| Footer | fade-up 600 | same | PASS |
### Conditions & Specialties — hero PASS; no magnifier search field on ours (selects + A-Z sort buttons with the shared outline hover, AN12 N/A); condition cards: title → cyan live (no underline), ours heading not a link (AN10); "Read More" → navy: `.btn-fill` PASS; CTA tiles PASS.
### Condition detail (specialty CPT, `docs/specialty.json`) — hero prlx PASS; one of 20 live pages (Stroke) has a doctors Swiper 1000 / 1000 no-restore: our condition pages list doctors as a grid / DoctorsRow (FIXED where it slides); topic tabs UNVERIFIED (AN6).
### Refer a Patient / International Patients / Your Opinion Matters / Book an Appointment (live page) — hero PASS; forms = Bit Forms: spinner + success fade FIXED (shared), field focus / invalid UNVERIFIED (custom CSS per form); the refer pills (shared Tabs) switch instantly (AN6).
### Insurance Providers / Patient Testimonials — hero PASS; no content motion live (hover keys empty); ours none. PASS.
### Media Hub (`MediaHub-Archive` block) and article
| Section / element | Live | Ours | Status |
|---|---|---|---|
| Hero | prlx 14 | follow | PASS |
| Four category tiles | `data-aos="fade"` 800 ease; no hover rule for `.category-card` | ExploreMedia tiles `data-aos="fade"` | PASS |
| Latest posts slider | 3 per view, **speed 800, autoplay 6000**, loop, hover pause, no restore; title → cyan | continuous glide loop (client bug 064 / R061, 8 Oct), title hover FIXED (brand AA) | OPEN (AN3): client decision vs live |
| Newsletter form | Bit Form (custom CSS not local) | static form | UNVERIFIED |
| Article page | **Live checked 8 Oct 2026 (headed Chrome, user permission; `.astro/qc-anim8/live/feeding_difficulties.*`)**: plain Blocksy single post, no hero parallax, no entrance on the content; the only motion is the theme chrome (sticky shrink header, back-to-top, AN1), the related-posts images (`data-hover="zoom-in"`, Blocksy `img { transition: transform .5s ease }`, a section not in Figma / not built) and the footer fade-up 600 | hero follow (HF1 decision), footer fade-up, ArticleVideo lightbox FIXED timing | PASS (article) / related posts N/A |

### Contact Us — PASS (7 Oct audit WP19: Bit Form field / button / consent / error / success motion, tiles, footer). Console shows the pre-existing "no Google Maps API key" notice on the static build (not animation).
### FAQs — hero PASS; 4 tabs (buttons .4s, phone panel rise .28s) FIXED; 18 accordion items (.25s ease-out fade + height, .3s bar + chevron, one open per group) FIXED; CTA tiles PASS.
### Calculators (BMI, Lung, Heart, Stroke) — hero PASS; result motion live = Bit Form / unknown, ours none. UNVERIFIED.
### Legal pages — live: no hero block, no motion; ours: no hero follow, no motion. PASS. 404: Figma only. N/A.

## Changes made (animation code only)

- `src/scripts/autoscroll.ts` — step mode reads `data-autoscroll-delay`, `data-autoscroll-speed`, `data-autoscroll-pause="no"`, `data-autoscroll-restore="no"`; a real drag / swipe on a no-restore row ends the autoplay (Swiper `disableOnInteraction`), a click, wheel or dot / pill hold only pauses it.
- `sections/Doctors.astro`, `shared/DoctorsRow.astro` (step 1000 / 1000, no restore), `sections/CareSupport.astro` (0 / 12000, no hover pause), `sections/Testimonials.astro` (0 / 15000, no hover pause).
- `sections/Facilities.astro`, `who-we-are/Network.astro` — Greenshift counters (1 / 1.5 / 2 s per stat, once).
- `styles/global.css` — `.dr-photo` .5s cubic-bezier(.42,0,.58,1); `.video-lightbox` / stage 300 ms ease-in-out, scale .8. `scripts/video-facade.ts` FADE_MS 300.
- `Header.astro` — dropdown / fly-out / region menu .2s ease + 10 px rise; link colour .12s + top-link hover; burger .12s; mobile panel fade + 20 % slide .25s ease-in-out; mobile accordions .3s ease; all off under reduced motion.
- `scripts/nav-submenu.ts` — adds `.nav-toggled` to the header on the first menu toggle (arms the panel's closing transition).
- `shared/Pagination.astro` — dot size .4s ease-out.
- `forms/FormShell.astro` + `forms/forms.css` — `.f-spin` ring (1 s linear) while sending, `.f-success` 1 s ease-out fade.
- `Footer.astro` — link hover → white .12s, Subscribe pressed scale(.98) .18s. `media-hub/PostCard.astro` — title hover (.12s).
- 9 Oct 2026 (AN9): `shared/SocialIcons.astro` hover slice (39 / 38 scale, .12s) for the footer and Home contact strips; QA `.astro/qc-anim8/an9.mjs` (EN, AR, Contact, phone).
- 9 Oct 2026 (four saved pages): `styles/global.css` `.ui-tab` .4s ease-in-out + `ui-panel-in` (.28s, < 768) for the shared Tabs and FAQ panels; `faq/FaqSection.astro` animated accordion (script + CSS); `hospitals/[path].astro` CareCards `reveal`; `hospital/HealingGallery.astro` slides .8s ease + `scripts/hospital-gallery.ts` 8 s autoplay (hover hold, drag stop); `doctors/DoctorProfile.astro` photo `data-aos="fade"`.

## QA (`.astro/qc-anim8/`, against a static serve of `dist` on :8080)

`node .astro/qc-anim8/qa.mjs [rows,counters,header,mobile,lightbox,misc,pages,rtl,reduced]` (`AR=1` adds the Arabic / ae / sa
pages to the sweep), `care-curve.mjs` (12 s easing trace), `mobile-rows.mjs` (rows at 390 / 768, AR, care page), `resize.mjs`
(1440 → 390 resize must not animate the closed menu; open / close must).
`live4.mjs` = the 9 Oct checks (FAQ accordion + keyboard, tab buttons, phone panel rise, hospital cards / gallery autoplay, doctor photo), run on a scratch build in `.astro/qc-anim8/build` (the working tree's BaseLayout was mid-edit by another session).
Checked: Chrome, 1440 desktop, 768 tablet, 390 phone (touch), EN + AR, Global / ae / sa; reduced motion (no loops, counters
final, no header transitions); no console / page errors except the pre-existing Contact map key notice; no horizontal
overflow with the mobile menu closed or open. Final run: see `.astro/qc-anim8/full-run.log`.

Live-site pace of the three Home rows measured on our build: doctors one card per 2.0 s (1 s still + 1 s eased), Care Support
one tile per 12.0 s, Testimonials one card per 15.0 s; both continuous rows keep moving under the mouse.

## Remaining items after the AN1-AN12 pass (9 Oct 2026)

Reviewed once more with the brief "animation-only, verified on the original". Done: AN4, AN5 (earlier), AN6, AN7 panel rise,
AN11 (four saved pages), AN9 (icon grow). Closed as not applicable: AN12 (the live search field does not exist on ours).
Left unchanged because they are element, layout or decision changes, not animations (reported for Pramod / the client):
AN1 sticky shrinking header + back-to-top button (new header behaviour and a new element), AN2 Home news slider (three fixed
Figma cards would become a carousel), AN3 Media Hub Latest (client decision R061 keeps the glide over the live 6 s step),
AN7 phone bottom sheet (bug 035 accordion kept; its panel rise is built), AN8 collapsing footer columns on phones (toggle
glyphs + collapsing layout), AN10 card titles as links (structure; the Figma cards link from their buttons).
