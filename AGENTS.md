# Cambridge Hospital Website — Project Rules for Claude

Source documents: `docs/scope-of-work.md` (Scope of Work v1.0, 30 Sep 2026) and the Figma file.
Read this file at the start of every session and follow it for all work.

## 1. Source of truth
- **Figma is the source of truth.** If something is not in Figma or the scope document, STOP and ask
  (the project contact is Pramod). Never invent UI, content, images, or behaviour.
- Current site (cambridgehospital.com) = reference for **behaviour only** (filters, forms, region
  switching). Never copy its code.
- Doctors, hospitals, specialties and news (~259 posts) come from JSON files Pramod shares. Put them in
  `src/data/`. Never hardcode this content into pages.

## 2. Design fidelity (non-negotiable)
- Match Figma exactly: layout, spacing, typography, colours, images, text. No redesign, no "improvements",
  no added or removed elements.
- The Figma frames are 1052px wide (a scaled-down 1440 design). Build at 1440 by multiplying every Figma
  value by the scale factor **1440/1052 ≈ 1.3688**. The factor lives in ONE place so it can be changed.
- Fonts: Gotham Light (300), Book (400), Medium (500). Self-host woff2 from `public/fonts/`. Never substitute
  another font. If files are missing, keep the `font-family` rule and ask.
- Animations as in Figma: hero image that follows the cursor, and the doctor animation. Smooth on laptop
  and mobile.
- Doctors / Testimonials rows overflow the frame in Figma: CSS scroll-snap rows, swipe/scroll only,
  no autoplay, no arrows or dots unless Figma shows them.
- If exact Figma colours fail WCAG AA contrast on buttons/text, do NOT change them silently — flag it and ask.

## 3. Figma MCP usage (strict budget)
- Current account is on a limited plan (~20 read calls/month). Be economical:
  - Check `figma-cache/` before ANY Figma call. Never fetch the same node twice.
  - No get_metadata / get_screenshot / whoami unless asked.
  - Before any batch of calls, state the plan and call count and wait for approval.
  - Log every call with a running total in `figma-cache/calls.md`.
  - Download image/SVG URLs immediately after each call (they expire); map them in `figma-cache/assets.json`.
  - If a call fails or hits the limit: stop and report. Never retry automatically.
- Drafts file: `vCNWiFsepoBswUbksI4Tbi`. Landing Page = node `93:894` (NOT `64:2407`, which is a draft).

## 4. Stack and build
- Static site. No WordPress, no database, no CMS, no admin panel.
- Astro + Tailwind, static output. Only tiny scripts / islands for interactive parts. Each library loaded once.
- Edge logic (country detection) and form sending run as serverless/edge functions (e.g. Cloudflare Pages
  Functions / middleware). Hosting target: confirm with Pramod before deploy config.
- Pages are **templates filled from JSON**, never hand-built one by one. Keep content in JSON so a CMS can
  be added later.
- Secrets (email provider, Turnstile keys) only in environment variables; keep `.env.example` updated.

## 5. Regions and languages — 6 editions
| Edition | URL | Languages |
|---|---|---|
| Global | `/` | English, Arabic |
| UAE | `/ae` | English, Arabic |
| KSA | `/sa` | English, Arabic |
- Keep the current site's URL structure.
- Each region uses its own Figma images (e.g. turban white on UAE, red on KSA). **Never mix images across regions.**
- Language switch keeps the visitor on the same page in the other language.

### Country pop-up (Global only)
- First visit to Global: detect country at the edge (Cloudflare country header or middleware), show the
  Figma pop-up (Global / UAE / KSA), save choice in a cookie, never show again. No pop-up on `/ae` or `/sa`.

### Arabic (RTL)
- `dir="rtl"` on Arabic pages; full mirror of logo, navigation, icons, arrows.
- Use CSS logical properties only (`margin-inline-start`, `ps-*`/`pe-*`, `start`/`end`) — never left/right —
  so one stylesheet works both ways.
- Arabic text exactly as in Figma. **No translating.** No English left on Arabic pages.

## 6. Page templates
Home (hero + doctor animations, region images) · About ("We are listening" section + nav link) · Patient ·
Care (specialties, services) · Our Hospitals list (filtered by region) · Hospital detail (address, phone,
hours, map, click-to-call) · Find a Doctor list · Doctor profile (details + Book an Appointment) ·
Media/News list + article (all ~259 posts) · Contact Us · Legal (privacy, cookies, others) · 404 (links to key sections).

## 7. Find a Doctor
- Filters: country, hospital, specialty (+ any others in Figma). Data from JSON, filtered client-side.
- **The selected country must stay selected when any other filter changes.** (Main bug to avoid.)
- On `/ae` and `/sa`, country defaults to that region.
- Filter state in the URL (`?country=ae&specialty=paediatrics`) — shareable, back button works.
- Clear empty state when nothing matches.

## 8. Forms
Book an Appointment (doctor profile, header, hospital pages) · Send an Enquiry (contact page, pop-up) ·
Refer a Patient (referral page) · Contact/Feedback "We are listening" (About / nav).
- **Email only. Nothing stored** — no database, no submission logs, no third-party form service that keeps
  copies. A serverless function sends each submission via SMTP or a transactional email provider.
- Fields from Pramod's list. Required-field validation with errors in English and Arabic.
- Consent checkbox (required) + privacy policy link on every form.
- Cloudflare Turnstile spam protection. Success message after submit.

## 9. Responsive
- Desktop/laptop: 1280, 1366, 1440, 1536, 1920 — nothing off-centre or misaligned.
- Tablet: 768, 1024. Mobile: 360, 390, 414.
- Full navigation visible from 1200px up; hamburger below, styled with Figma colours/fonts.
- Touch targets ≥ 44px. No horizontal scroll at any width.

## 10. Performance
- PageSpeed 95+ on mobile AND desktop.
- Images at 1x and 2x, WebP/AVIF, width and height on every image. Lazy-load everything below the fold.
- Hero image eager + `fetchpriority="high"`. Icons as SVG.

## 11. Content and SEO
- Copy edit: "We are here to listen" → **"We are listening"**. Other edits only from Pramod's written list.
- One spelling of each group and facility name everywhere.
- Title + meta description on every page. Language tags (en-AE, ar-AE, en-SA, ar-SA, Global) and hreflang
  links between editions. A sitemap per edition. 301 redirects for any old URL that changes.

## 12. Accessibility
- WCAG AA contrast on buttons (flag conflicts with Figma, don't silently change). Alt text on all images.
- Carousels don't repeat content for screen readers. Correct heading order. Keyboard navigation through menu and forms.

## 13. Not in scope — do NOT build (send request to Pramod first)
Database or stored submissions · CMS/admin panel · leads/appointments back office · any other website ·
writing or translating content · new images or design beyond Figma · patient portal, payments, or
integrations with hospital systems, CRMs or insurers.

**To be confirmed:** analytics (Google Analytics + cookie consent banner, or none) — leave room for a consent
banner. Post-launch CMS — keep content in JSON.

## 14. Timeline (all work on a private staging link)
Setup 2 Oct (skeleton, routing for 6 editions, design system) · Core journeys 6 Oct (Home, Find a Doctor,
profile, hospitals, all 4 forms) · Feature complete 9 Oct (all pages, RTL, pop-up, animations, responsive) ·
Review release 10 Oct · Fixes 10–14 Oct · **Go-live 15 Oct**.

## 15. Working rules
- Before building a section, confirm its Figma data is in `figma-cache/`. If not, ask — don't guess.
- After each section: compare with the Figma reference at 1440, list any differences you couldn't fix.
- Never publish or deploy to production without explicit approval.