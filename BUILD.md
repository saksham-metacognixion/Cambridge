# Build conventions (read before touching a section)

**Source of truth = `figma-cache/*-spec.md`** (exact values read from Figma) + `figma-cache/assets.json`.
Never guess a colour, size, text, position or asset. If a spec is silent or unclear, do NOT invent: leave a
`<!-- TODO(figma): ... -->` comment and report it. Do not call Figma tools. Do not redesign anything.

## Scale
Figma frame = 1052 px wide, page = 1440 px. `--u` = one Figma pixel (≈1.3688 px at 1440, fluid between 1024–1440).
Tailwind is wired so **every number is a Figma px value**:
`w-185 h-231 left-94 top-1380 -left-118 left-525.5 gap-11 p-10` → scaled automatically (`--spacing: var(--u)`).
Font sizes `text-f7 f8 f9 f10 f12 f13 f14 f16 f19 f23 f28 f30 f39`, radii `rounded-r3 r4 r5 r6 r7 r8 r12 r15 r16 r18 r21 r30 r12p6`,
line-heights `leading-14` (= 14 Figma px), letter-spacing none, hairlines `.hair-15 .hair-25 .hair-50 .hair-100` (+ `border-<colour>`),
shadows `shadow-bar shadow-tile shadow-news`, fonts `font-gotham` with `font-light|normal|medium|bold` (300/400/500/700).
Colours: `navy #004059`, `navy-alt #00415a`, `cyan #00b8ff`, `body #6b6b6b`, `teal-border #418ea2`, `mist #e7e7e7`, `chip #ededed`,
`off-white #fffdfd`, `veil rgba(231,231,231,.5)`, `field rgba(217,217,217,.5)`, `dot-light #f9f9f9`, `dot-grey #d9d9d9`, `white`.
For a value with no token write it as Figma px anyway, e.g. `rounded-[calc(21.9*var(--u))]`, `style="width:calc(915.014*var(--u))"`.
The factor lives ONLY in `src/lib/scale.ts` (TARGET_W / DESIGN_W). For image widths use `px()` from there.

## Section anatomy (desktop ≥1024px = pixel-faithful absolute canvas)
```astro
<section class="relative bg-veil" style="--h: 553">      <!-- full-bleed background colour goes HERE (edge to edge) -->
  <div class="stage">                                     <!-- 1440 max, centred; height = --h × --u; clips overflow -->
    <p class="absolute left-237 top-106 w-577 h-27 …">…</p>   <!-- x = PAGE x (stage left = page x 0), y = SECTION-relative -->
  </div>
</section>
```
* x is PAGE x for every section (stage left edge = page x 0). Specs written in frame coordinates say how to convert
  (`page x = value ± offset`). y is relative to the section top; spec header states the section's page-y origin.
* Frame origins: Header (0,0) · Hero (0,117) · CTA Tab (0,560) · Services (0,640) · Doctors (-118,1241; use page x) ·
  Care Support frame x=-22,y=1698 · Facilities (0,2054) · Testimonials x=-96,y=2892 · Recovery (0,3367) ·
  Calculators (0,3553) · News x=60,y=4041 · Insurance x=30,y=4665 · Contact (0,4906) · Footer (0,5285).
  For specs already in PAGE coordinates (Header, Hero, CTA, Doctors, Facilities, Calculators, Footer) subtract only the section's page y.
* A rectangle in the spec that is a full-width band (1052 wide from x=0) becomes the section's full-bleed background instead.
* Text boxes: use the spec's width/height, `whitespace`-normal, `[word-break:break-word]`, exact weight/size/line-height/colour, `not-italic`.
  Centred text in the spec ("centred cx…") = box `left = cx − w/2`, `text-center`.
* Layer order = order in the spec (later = on top). Keep it wherever things overlap.
* Overhanging rows (Doctors, Care Support, Testimonials): the row is placed exactly as in Figma and cut off at the stage edge.
  Wrap the row in a `.hscroll` scroller that fills the stage width, put the row inside with a negative left margin equal to
  its overhang, and add a 0-width first child with `scroll-snap-align:start` so the initial position (scrollLeft 0) shows exactly
  the Figma view. Cards get `scroll-snap-align:start`. NO arrows, dots, autoplay or any added control.
* Interactions from the client: "Book an Appointment", "Send an Inquiry", "Your Opinion Matters" open modals later →
  render them as `<a href="#book-appointment">` / `#send-inquiry` / `#your-opinion` (no modal yet). Every other link `href="#"`.
  Email = `mailto:`. Forms = plain `<form action="https://api.web3forms.com/submit" method="POST">` with hidden
  `access_key` = `import.meta.env.PUBLIC_WEB3FORMS_KEY`, styled exactly like the Figma boxes.
* HTML must be semantic (header/nav/main/section/h1-h6/ul/button/form/label) as long as the pixels stay identical. Alt text: `""` for decoration,
  a short accurate description (from the layer name / visible text) for photos and logos. Never add visible text.

## Responsive (<1024px, no Figma exists → adapt LAYOUT only)
Stack columns, wrap grids, let images scale down (`max-width:100%`, keep aspect), keep the same colours, fonts, weights, text,
images, radii, borders and shadows. Below 1024 `--u` is fixed (≈1.3688px), so text stays at its designed size; make widths fluid
(`w-full`, `max-w-…`, flex/grid) and drop `absolute`. Step a font size down only where text would overflow. Rows that overhang the
frame keep the same swipe scroller. No horizontal page scroll at 360 / 768 / 1024 / 1440 (`overflow-x` must never leak).
Use `max-lg:` variants or a scoped `<style>` with `@media (max-width: 1023.98px)`.

## Performance
Zero JS by default. Prefer CSS-only (checkbox / `:target` / `details`) for interaction; a tiny inline `<script>` only if unavoidable.
Raster images via `astro:assets`: `import img from '../../assets/x/y.png'` then
`<Picture src={img} formats={['avif']} fallbackFormat="webp" width={px(w)} height={px(h)} widths={[…]} sizes=… loading="lazy" decoding="async" alt="…" />`
(or `<Image format="webp" …>` for small logos). The hero banner is the only `loading="eager" fetchpriority="high"` image.
Always set `width`/`height`. SVGs: `import s from '…svg'` → `<img src={s.src} width height alt>`; never redraw or edit an asset.
Every image goes at the exact box / crop given in its spec (`object-cover`, insets, offsets).
Fonts: `Gotham` (300/400/500/700) is declared in global.css; the woff2 files are NOT added yet (licence check) – do not add another font.

## Files
Each section = `src/components/sections/<Name>.astro` (plus Header/Footer in `src/components/`). Own only your files.
Do NOT edit global.css, BaseLayout, scale.ts, index.astro or another agent's files; report needed changes instead.
Verification: create `src/pages/t-<yourname>.astro` (BaseLayout + your components), run `npx astro dev --port <yourport>` in background,
screenshot with headless Chrome:
`"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu --hide-scrollbars --window-size=1440,<H> --screenshot=<file>.png http://localhost:<port>/t-<yourname>`
(use widths 1440, 1024, 768, 360; view the PNG). Check horizontal overflow with a throw-away `<script>` that writes
`document.documentElement.scrollWidth` into the DOM and `--dump-dom`. Compare against the spec numerically. When done: stop your
dev server, delete your test page, and report: what you built, every deviation / unclear item / missing asset, nothing else.
