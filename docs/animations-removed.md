# All animations removed — 16 Oct 2026

Client task (16 Oct 2026): remove every animation and motion effect across the whole site (Global, `/ae`, `/sa`, English and
Arabic, every width) without changing layout, content, images, colours, routes or functionality. This supersedes the motion
work logged in `docs/animation-audit.md` (8–9 Oct 2026), which stays as history.

Rule from now on: **nothing on the site moves, fades, slides, scales or turns on load, scroll, hover, focus, click, resize or
route change. Scrolling is instant.** Hover and selected states keep their colours (static). Carousels keep their manual
controls (swipe, drag, dots, arrows) but never move on their own.

## What was removed, where

| Source of motion | Was | Now |
|---|---|---|
| Scroll entrances (`data-aos` fade / fade-up on Home services, About explore cards, care cards, Media Hub tiles, doctor photo, footer) | `scripts/aos.ts` + `html.aos` armed in `BaseLayout`, `.aos [data-aos]` rules in `global.css`, inline footer observer | Script deleted, inline scripts and CSS removed, `data-aos` attributes stripped; everything is in place from first paint |
| Hero cursor-follow (every page hero + the Our Hospitals map) | `scripts/hero-follow.ts` on `[data-hero-follow]` | Script deleted (the layer markup and crops stay; the layers simply do not move) |
| Auto-scrolling rows (Home Doctors, Care Support, Testimonials, Our Care doctors, Media Hub Latest) | `scripts/autoscroll.ts` step / glide modes, copies of the row | Script deleted, `data-autoscroll*` attributes removed; the rows are plain swipe / drag / dot rows |
| Count-up stats (Why Cambridge, Our Hospitals impact, Who We Are, Home map counters) | `scripts/countup.ts`, `hospital-map.ts` counters | Script deleted; the map script no longer counts; final values render at once |
| Home hospital map (outline draw-in, pin drop + bob + pulse, label / counter fades, card fade-slide, pin hover scale) | `Facilities.astro` keyframes + transitions, `.in` entrance in `hospital-map.ts` | All removed; pins, labels, counters are static; the card shows at once; hover keeps the colour swap only |
| About timeline autoplay + eased arrow slide | `scripts/timeline.ts` (6 s autoplay, 400 ms ease) | Autoplay gone; arrows jump one card; loop, dots, drag kept |
| Hospital gallery autoplay + 0.8 s slide transitions | `scripts/hospital-gallery.ts`, `HealingGallery.astro` | Autoplay gone; photos change places at once |
| Mouse-drag throw / spring settle on rows | `scripts/drag-scroll.ts` | Drag still follows the pointer 1:1; on release the row lands on the nearest card at once |
| Video lightbox fade + scale, play-button pulse rings | `scripts/video-facade.ts`, `.video-lightbox*`, `.video-pulse` | Opens / closes at once; pulse rings gone |
| Home News tab cross-fade | `scripts/news-tabs.ts`, `News.astro` | The card set swaps at once |
| Smooth scrolling (dots, back-to-top, calculator result, combobox) | `behavior: "smooth"` in `pagination.ts`, `doctors-row.ts`, `back-to-top.ts`, `calculator.ts`, `combobox.ts` | `behavior: "auto"`; `html { scroll-behavior: auto !important }` |
| Header: dropdown / fly-out / region menu fade + rise, chevron turns, burger morph, mobile panel slide, mobile accordion height, sticky shadow + logo shift, link colour eases | `Header.astro`, `.nav-toggled` arming in `nav-submenu.ts` | All transitions removed; menus show / hide at once (hover-intent close delays kept: they are not motion) |
| Footer: fade-up entrance, link colour ease, newsletter button press scale, phone column accordion slide | `Footer.astro` | Removed; columns open at once |
| Buttons / pills / tabs colour transitions (`--ui-ease`, `.ui-tab` 0.4 s), tab-panel rise on phones (`ui-panel-in`), tab chevron turn | `global.css`, `Tabs.astro` | Removed; hover colours are instant |
| FAQ accordion (max-height / opacity / chevron / bar colour transitions, JS-timed exclusivity) | `FaqSection.astro` | Script removed; native `<details name>` keeps one open per group; looks keyed on `[open]` |
| Forms: field focus / invalid eases, submit press scale + shadow ease, spinning ring while sending, consent dot / ring eases, error and success fade-ins | `forms.css`, `ContactForm.astro`, `AttachField.astro` | Removed; the spinner span stays hidden (cursor: progress marks sending); messages appear at once |
| Card hovers: doctor photo zoom 1.04, condition card lift, social icon 38→39 px grow, title underline grow 0→100 %, hospital / post / CTA tile colour eases | `global.css`, `ConditionCard.astro`, `SocialIcons.astro`, `HospitalCards.astro`, `PostCard.astro`, `ContactRecovery.astro`, `Explore.astro` | Transform hovers removed; colour / underline hovers stay, instant |
| Pagination dot size ease, timeline dot width ease, combobox chevron turn, rating face scale ease, Contact map fade-in, "Go to top" fade + rise | the components named | Removed (the selected rating face keeps its static larger look) |

Catch-all at the end of `src/styles/global.css` (for anything added later or injected by a widget):

```css
*, *::before, *::after { animation: none !important; transition: none !important; }
html { scroll-behavior: auto !important; }
```

## Kept on purpose (not motion)

- Scroll-snap on the rows and native swipe / trackpad scrolling (the browser's own, user-driven).
- Hover-intent close delays on the header menus and the map card (150–260 ms grace so the pointer can cross a gap).
- The Contact page Google map: our fade-in is gone, but the Maps JS API eases its own camera when a hospital is chosen
  (`setZoom` / `panBy`). That is Google's internal behaviour; switching it off would mean a different map library or a jump
  cut via `moveCamera`, which changes how the map re-centres. Flag for the client if it matters (AN13).
- Third-party internals: the Cloudflare Turnstile widget and the YouTube / Vimeo player UI inside their iframes animate on
  their own and cannot be reached from our CSS.
- No animated assets exist (no GIFs, SMIL SVGs or Lottie files were found in `public/` or `src/assets`).

## QA (16 Oct 2026)

`.astro/qc-noanim/check.mjs` serves `dist/` and checks 27 routes (Global / UAE / KSA, EN + AR; Home, About, Who We Are, Why,
Find a Doctor, Contact, Our Care, Hospitals, Media Hub, Patient Hub, FAQs, Conditions, Careers, Accreditations, Insurance,
Testimonials) at 1440 / 1024 / 390 in Chrome:

1. no element has a computed animation or transition with a duration;
2. nothing moves on its own (row scroll positions and hero-layer transforms identical 2.5 s apart while the mouse moves);
3. no hidden entrance state (every section, card and stat is at opacity 1 on load and after scrolling);
4. `scroll-behavior: auto`, counters show their final values at once;
5. interactions: header dropdown and mobile menu fully shown 30 ms after the click, news tabs swap at once, doctor-row dot
   jumps at once, video lightbox opens / closes at once, timeline does not autoplay and its arrow moves one card, FAQ
   accordion instant + exclusive + keyboard, hospital gallery does not autoplay and its dots work.

Result (16 Oct 2026, Chrome): all 27 routes x 3 widths clean (69 passes in the main sweep plus the re-run of the four routes whose
slugs were first typed wrong: `/faqs/`, `/about/why-cambridge-hospital/`, `/about/careers/`, `/about/accreditations-partnerships/`,
EN + AR + UAE / KSA editions), every interaction check passed, the FAQ accordion verified separately (`.astro/qc-noanim/faq.mjs`:
instant, one open per group, Enter on a summary works). WebKit and Firefox: Home, Arabic About and KSA Find a Doctor at the three
widths clean (`BROWSER=webkit|firefox`). `npm test` passes; `npm run build` builds all 1592 pages.
