# Task 205 + Bug 206 — implementation report

Date: 19 Oct 2026 · Branch: `develop` (not committed, not deployed)

**Status:** both fixes are implemented and pass in Chrome. **Actual Safari (macOS and iPhone) is still PENDING**: no Mac or iPhone was available. The "Call us" destination is **ON HOLD** until the client confirms the number.

---

## 1. Files changed

| File | Purpose |
|---|---|
| `src/data/call-button.json` (new) | Per-region destination for the floating Call us button (`phone.global / ae / sa`). Every value is `null` and marked **pending client confirmation**. |
| `src/layouts/BaseLayout.astro` | Renders the shared Call us control above "Go to top" on every page of every edition. With a `null` number it renders an inert placeholder `<button aria-disabled="true">`; with a number it renders an `<a href="tel:…">`. |
| `src/styles/global.css` | `.to-top` and `.to-call` now share one visual rule (unchanged arrow values), plus `.to-call` positioning, an active state, the disabled cursor, hiding the button while the mobile menu is open, and the `--float-clear` token for the footer. |
| `src/data/content/layout/header.en.json`, `header.ar.json` | Accessible name `callUs`: "Call us" / "اتصل بنا". The Arabic is the approved string the header and footer menus already use; it was reused, not newly translated. |
| `src/components/Footer.astro` | Below 1024px only: the footer's bottom padding is at least `--float-clear`, so the copyright and legal links are not covered by the floating buttons when the page is scrolled to the bottom. |
| `src/components/sections/CareSupport.astro` | Bug 206: each icon now sits inside its 89 × 87 tile, which centres it with `display: grid; place-items: center`. The `ix` / `iy` Figma inset offsets were removed. |

## 2. Task 205 — floating Call us button

- **Markup:** one shared element in `BaseLayout.astro`, the layout every page uses, so it appears in all 6 editions (Global, UAE, KSA × EN/AR). In the build, all 1,666 generated pages contain it exactly once.
- **Icon:** the handset glyph from the project's own `src/assets/contact-page/icon-phone.svg`, inlined at 12 × 12 so it takes `currentColor`, the same way the arrow is drawn.
- **Style:** the same rule as the arrow:
  - 36 × 36 button (12px padding + 12px icon)
  - cyan background with a Deep Teal icon
  - 2px radius and the theme shadow
  - 44px tap area
  - hover: Muted Teal background with a white icon
  - focus-visible: 2px navy outline
  - new active (pressed) state: the hover colours, for touch screens

  The arrow's own values and behaviour are unchanged; only the selector is now shared.
- **Position:**
  - Desktop and tablet (≥ 690px): `bottom: 71px`, i.e. 25 + 36 (the arrow) + a **10px gap**, on the same `inset-inline-end: 25px` as the arrow.
  - Phones (< 690px, where the arrow is hidden): it takes the arrow's corner, `bottom: 25px` plus the iOS safe-area inset.
  - Logical properties throughout: right in LTR, left in RTL.
  - The button is always visible; it does not wait for scrolling like the arrow.
- **Overlap safeguards:**
  - Hidden while the mobile menu panel is open (< 1200px).
  - The pop-up forms are `<dialog>`s in the top layer, so they cover the button and make it unreachable while open (verified).
  - Footer: see the Footer change above. Before that change, QA found "Privacy Policy" and the Arabic copyright line under the buttons at 320–1023px.
- **Accessibility:**
  - Accessible name "Call us" / "اتصل بنا".
  - `aria-disabled="true"` exposes the unavailable state; assistive tech announces it as dimmed / unavailable.
  - It stays focusable, comes before "Go to top" in the Tab order (matching the visual order) and shows the focus outline.
  - The mouse cursor is `not-allowed`.

### Call link: on hold (confirmed)

- `src/data/call-button.json` has `null` for every region, plus a `$comment` saying the destination is pending client confirmation and must not be guessed. The contact-page numbers were deliberately **not** reused.
- No `tel:` link, invented number or URL exists anywhere in the change.
- The placeholder is `<button type="button">` with no click handler and is not inside a form. QA confirmed that click, Enter and Space cause no navigation, no pop-up and no scroll change.
- **To go live:** enter the confirmed numbers under `phone` (international format; spaces and dashes are fine). That region's EN and AR pages then render `<a href="tel:+…">` automatically, with no component changes.

## 3. Bug 206 — Care Support icon centring

- **Cause:** each icon was absolutely positioned from Figma frame insets (`design[].inset` → `ix`, `iy`). Measured on staging, before the fix:

  | Icon | Off-centre on staging |
  |---|---|
  | Radiology | 19.9px horizontally |
  | Outpatient Gym | 21.8px horizontally |
  | Hydrotherapy | 14.9px horizontally |
  | Dialysis | 9.8px vertically |
  | Blood Bank | 6.8px horizontally |
  | The other five | 0.5–4px |

- **Fix:**
  - The icon `<img>` moved inside the cyan tile `<div>`, which is now `display: grid; place-items: center`.
  - The icon keeps its exact Figma size (`iw × ih`, the SVG's own box) through `--iw` / `--ih`.
  - `ix` / `iy` were deleted.
  - No per-icon offsets. Centring has no direction, so it is identical in RTL.
  - The change is scoped to this component; no other icons are affected.
- **Unchanged:** tile size (89 × 87 units), colour, radius, shadow, row spacing, labels, the auto-scroll, and the Arabic tile height (bug 138).
- **Result:** every icon is centred within **0.02px** on both axes at all 11 widths, in all 6 home editions. Icon and tile sizes match staging to within 0.05px; no icon was resized or distorted.

## 4. English and Arabic results

| Check | English (LTR) | Arabic (RTL) |
|---|---|---|
| Call us position | right edge, 25px in | left edge, 25px in |
| Stack with arrow (≥ 690) | same edge, 10px gap | same edge, 10px gap |
| Accessible name | "Call us" | "اتصل بنا" |
| Care icons centred | all 10 (max 0.02px) | all 10 (max 0.02px) |
| Footer clear of buttons | yes, 320–1920 | yes, 320–1920 |

## 5. QA matrix

Run: a local production build served with `tools/qc/serve.mjs`, Google Chrome 155 via playwright-core, scripted checks plus screenshot review. **253 checks, 0 failed.**

Pages: all 6 home pages; `/contact-us/`, `/ae/ar/patient-hub/find-a-doctor/`, `/sa/media-hub/`, `/ar/hospitals/` and `/404` for the floating button; footer overlap on `/`, `/ar/`, `/ae/`, `/sa/ar/` and `/contact-us/`.

| Width | Chrome: Call us (11 pages) | Chrome: icons (6 homes) | Chrome: footer overlap (5 pages) | Safari macOS | iPhone Safari |
|---|---|---|---|---|---|
| 320 | pass | pass | pass | n/a | **pending** |
| 360 | pass | pass | pass | n/a | **pending** |
| 375 | pass | pass | pass | n/a | **pending** |
| 390 | pass | pass | pass | n/a | **pending** |
| 414 | pass | pass | pass | n/a | **pending** |
| 430 | pass | pass | pass | n/a | **pending** |
| 768 | pass | pass | pass | **pending** | **pending** (iPad) |
| 1024 | pass | pass | pass | **pending** | **pending** (iPad) |
| 1280 | pass | pass | pass | **pending** | n/a |
| 1440 | pass | pass | pass | **pending** | n/a |
| 1920 | pass | pass | pass | **pending** | n/a |

Behaviour checks at 1440 (and 390 for the menu), EN and AR, all passed in Chrome:

- **Placeholder does nothing:** mouse click, Enter and Space cause no navigation, no pop-up and no scroll change.
- **Keyboard:** Tab reaches Call us and then Go to top; `:focus-visible` shows a 2px navy outline.
- **Hover and active:** Muted Teal `#418ea2` background with a white icon; cursor `not-allowed`.
- **Go to top regression:** it still appears after scrolling past 100px, scrolls to the top and hides again.
- **Mobile menu:** opening it hides Call us; closing it shows the button again.
- **Pop-up form:** an open `<dialog>` covers the button.

Staging (https://cambridge-hospital-staging.vercel.app/) was measured with the same script as the "before" baseline: the icon offsets in section 3, and no Call us button.

## 6. Actual Safari

**PENDING. Not tested.** This work was done on Linux with no macOS or iOS device, and no Playwright WebKit build was installed. Nothing in this report claims that Safari passed. Still to do on real devices:

- **Desktop Safari (macOS)** at 768–1920:
  - stack position and gap
  - hover and focus ring
  - RTL on `/ar/`
  - Care icons centred
- **iPhone Safari** at 320–430:
  - button above the home indicator, and the safe-area behaviour
  - not over the toolbar
  - footer clearance
  - the menu hides the button
  - tapping the placeholder does nothing
  - VoiceOver reads "Call us, dimmed, button" (EN) and the Arabic name (AR)

Risk notes for the Safari pass:

- The menu-hide rule uses `:has()`, supported since Safari 15.4. Older Safari would simply keep the button visible.
- `env(safe-area-inset-bottom)` resolves to 0 because the viewport meta does not opt into `viewport-fit=cover`. Harmless, but it means the 25px offset is measured from the visible viewport, above the Safari toolbar.

## 7. Build and validation

| Check | Result |
|---|---|
| `astro build` (production static export) | **pass**: 1,666 pages, exit 0, no image or build errors (built to a private out-dir, see note) |
| `npm test` (functions, filters, conditions, sanitize, news, calculators, client 096–098) | **all passed** |
| Lint | no lint script in this project; none run |
| Console / network errors (Chrome, 11 pages × 11 widths) | none introduced. The only messages are the contact-map "no Google Maps API key" warning and the 404 page's own 404 status; staging shows both too |

Note: the first `npm run build` into `dist/` failed with `ENOENT … dist/_astro/`. Another session working in the same repo started its own `npm run build` four minutes later and cleared `dist/` mid-build. To avoid that clash, the verified builds used `astro build --outDir <scratch>/dist`. The command and config are otherwise identical to `npm run build`.

## 8. Remaining issues

1. **Safari (macOS and iPhone): pending**, see section 6.
2. **Call destination: on hold** until the client confirms a number per region.
3. "اتصل بنا" literally means "call us / contact us". It was reused from approved copy; the client may want to confirm it for this button.
4. Out of scope, not changed: in the Care Support row some labels are not centred under their tiles (e.g. "Radiology"). The labels use Figma's own label boxes (`cx`); the bug only covered the icons.
5. On tablets (690–1023px) the footer's bottom padding is now 119px (it was 20px), and on phones 73px (it was 16px), so the last row clears the floating buttons. This is a visible change to the footer's bottom spacing on those widths, needed to meet "no footer content obscured".

## 9. `git status` (end of work)

```
 M src/components/Footer.astro                 <- this task
 M src/components/careers/TabsSection.astro    <- NOT this task (another session's work, untouched)
 M src/components/sections/CareSupport.astro   <- this task
 M src/data/content/layout/header.ar.json      <- this task
 M src/data/content/layout/header.en.json      <- this task
 M src/data/leadership.json                    <- NOT this task (untouched)
 M src/layouts/BaseLayout.astro                <- this task
 M src/pages/[...base]/about/careers.astro     <- NOT this task (untouched)
 M src/styles/global.css                       <- this task
?? docs/banner-assets-audit.md                 <- NOT this task (already untracked before)
?? docs/banner-assets-inventory.csv            <- NOT this task (already untracked before)
?? src/data/call-button.json                   <- this task
?? docs/task-205-bug-206-implementation.md     <- this report
```

Nothing was committed or deployed.
