# Banner photo animation removed — 16 Oct 2026

Client task (16 Oct 2026, narrowed by the user the same day): **only the banner / hero photos must not animate.** Every other
animation on the site stays exactly as audited in `docs/animation-audit.md` (scroll entrances, Home doctor row, auto-scroll rows,
count-ups, timeline and gallery autoplay, hover transitions, menus, lightbox, forms).

History: a first pass removed every animation site-wide (commit 97d8679, "No animations site-wide"). The user then asked for all
of it back except the banner photos, so the tree was restored from f11a4de and only the hero cursor-follow was removed again.

## What is removed

| Source of motion | Was | Now |
|---|---|---|
| Hero cursor-follow on every page banner (people layer drifts with the mouse, `data-prlx-xy="14"` on the live site) and the Our Hospitals map group (`follow="map"`) | `src/scripts/hero-follow.ts`, imported by `sections/Hero.astro`, `shared/PageHero.astro`, `contact/ContactHero.astro`, `feedback/FeedbackHero.astro` | Script deleted, the four imports removed. The `data-hero-follow` box and `data-hero-subject` / `-bg` layers stay as static markup (the crops, bleeds and fades of `BannerArt.astro` / `PageHero.astro` are unchanged), so every banner looks the same, it just does not move. |

Nothing else changed: no CSS, no other script, no markup, no content. Comments that named the script now say "the former
scripts/hero-follow.ts, removed 16 Oct 2026".

## QA

`.astro/qc-noanim/check.mjs` (left from the site-wide pass) checks, among other things, that the hero layers' transforms are
identical 2.5 s apart while the mouse moves across the page. For this narrower change only that hero check is relevant: the
other checks (no transitions anywhere, rows not moving) are expected to FAIL now that the animations are back, and they do.
A dedicated run (`.astro/qc-noanim/hero-only.mjs`) checks per route: hero layers static with the mouse moving, and the Home
doctor row still auto-scrolls (the rest of the motion is back).
