# Cambridge Hospital Website: Scope of Work

> Converted from `docs/Cambridge_Hospital_Website_Scope_of_Work.docx` (the original).

Version 1.0 · 30 September 2026 · Prepared by Pratik W

## 1. Reference

The Figma file is the source of truth. If something isn't in Figma or in this document, ask Pramod on Slack before building it.

| **What** | **Use it for** |
|---|---|
| Figma file | All pages, layouts, animations, the country pop-up, images, English and Arabic content |
| Current site (cambridgehospital.com) | How existing features behave (filters, forms, region switching). Reference for behaviour only, not for code. |
| Doctors, hospitals, specialties and news data | Exported to JSON from the current site. Pramod will share it. |

**Figma to code:** connect Figma to VS Code, Cursor or Claude Code through the Figma MCP server, so layouts and assets come straight from the file. Don't export images one at a time.

## 2. Develop

### 2.1 Stack and build
- Static website. No WordPress, no database, no CMS.
- Framework is your choice. Recommended: Next.js with static export.
- Match Figma exactly: layout, spacing, typography, colours, images
- Animations as in Figma: the hero image that follows the cursor, and the doctor animation
- Speed target: PageSpeed 95+ on mobile and desktop
- Images exported at 1x and 2x, converted to WebP or AVIF, with width and height set on every image
- Lazy-load everything below the fold
- Load each library once only
- Form credentials go in environment variables, never in the code

### 2.2 Regions and languages

| **Edition** | **URL** | **Languages** |
|---|---|---|
| Global | / | English, Arabic |
| UAE | /ae | English, Arabic |
| KSA | /sa | English, Arabic |

- Six editions in total. Keep the current URL structure.
- Each region uses its own images from Figma (for example, the turban is white on UAE and red on KSA). Never mix images across regions.
- The language switch keeps the visitor on the same page in the other language

### 2.3 Country pop-up (Global only)
- On a first visit to Global, detect the visitor's country at the edge (Cloudflare's country header or Next.js middleware)
- Show the Figma pop-up offering Global, UAE and KSA
- Save the choice in a cookie and don't show the pop-up again
- No pop-up on /ae or /sa

### 2.4 Arabic (right-to-left)
- `dir="rtl"` on Arabic pages, with the full layout mirrored: logo, navigation, icons and arrows
- Use CSS logical properties (`margin-inline-start`, not `margin-left`) so one stylesheet works both ways
- Arabic text is taken from Figma as it is. No translating.
- The Arabic page must look exactly like the English one, mirrored

### 2.5 Page templates

| **Template** | **Must include** |
|---|---|
| Home | Hero animation, doctor animation, region images |
| About | "We are listening" section and its link in the navigation |
| Patient | As per Figma |
| Care | Specialties and services |
| Our Hospitals: list | Hospitals filtered by region |
| Our Hospitals: detail | Address, phone, hours, map, click-to-call |
| Find a Doctor: list | Filters (2.6) |
| Find a Doctor: profile | Doctor details, Book an Appointment button |
| Media / News: list and article | All existing news posts (about 259) |
| Contact Us | Contact form and details |
| Legal | Privacy, cookies and others |
| 404 | Links back to the key sections |

Build templates and load content into them from JSON. Don't hand-build individual pages.

### 2.6 Find a Doctor
- Filters: country, hospital, specialty (and any others in Figma)
- The selected country stays selected when any other filter changes. This is the main bug to avoid.
- On /ae and /sa, the country defaults to that region
- Filter state lives in the URL (?country=ae&specialty=paediatrics), so links can be shared and the back button works
- Data comes from JSON, filtered on the client side
- Clear empty state when no doctors match

### 2.7 Forms

| **Form** | **Placement** |
|---|---|
| Book an Appointment | Doctor profile, header, hospital pages |
| Send an Enquiry | Contact page, pop-up |
| Refer a Patient | Referral page |
| Contact / Feedback ("We are listening") | About / navigation |

- Email only. Nothing is stored: no database, no logs of submissions
- A serverless function sends each submission to an email service (SMTP or a transactional email provider)
- Fields as per the list Pramod will share
- Required-field validation, with error messages in English and Arabic
- A consent checkbox and privacy policy link on every form
- Spam protection with Cloudflare Turnstile
- A success message after submitting

### 2.8 Responsive
- Laptop and desktop: 1280, 1366, 1440, 1536, 1920 px. Nothing off-centre or misaligned at any of these widths.
- Tablet: 768, 1024 px
- Mobile: 360, 390, 414 px
- Full navigation visible from 1200 px up
- Touch targets at least 44 px

### 2.9 Content and SEO
- Copy edit: "We are here to listen" becomes "We are listening". Other edits only from Pramod's written list.
- One spelling of each group and facility name everywhere
- A title and meta description on every page
- Language tags (en-AE, ar-AE, en-SA, ar-SA and Global) and hreflang links between editions
- A sitemap for each edition
- 301 redirects for any old URL that changes

### 2.10 Accessibility
- Button colours pass contrast checks (WCAG AA)
- Alt text on all images
- Carousels don't repeat content for screen readers
- Headings in the correct order

## 3. Review

All work goes to a private staging link. Nothing is published live until the release in section 5.

| **Gate** | **Date** | **What is reviewed** | **Reviewer** |
|---|---|---|---|
| Setup | 2 Oct | Project skeleton, routing for 6 editions, design system | Pramod |
| Core journeys | 6 Oct | Home, Find a Doctor, profile, hospitals, all four forms working | Pramod |
| Feature complete | 9 Oct | All pages, Arabic RTL, pop-up, animations, responsive | Pramod + Padmavathi |
| Review release | 10 Oct | Full site on staging, shared for external feedback | Pramod |
| Fixes | 10 to 14 Oct | One consolidated feedback list, fixed and re-checked | Pramod |

For each gate, post the staging link and a short list of what's done and what's open in Slack.

## 4. QC checklist

Padmavathi runs this before the review release and again before go-live. Log every failure in Slack with a screenshot, the page URL and the screen width.

### Design

- [ ] Every page matches Figma on all 6 editions

- [ ] Hero and doctor animations work, and are smooth on laptop and mobile

- [ ] Correct region images on Global, UAE and KSA

### Layout

- [ ] No misaligned or off-centre sections at 1280, 1366, 1440, 1536, 1920 px

- [ ] Tablet (768, 1024) and mobile (360, 390, 414) layouts correct

- [ ] Tested on a real iPhone and a real Android phone

- [ ] Tested in Chrome, Safari, Firefox and Edge

### Arabic

- [ ] Every Arabic page mirrored correctly: logo, navigation, icons, text alignment

- [ ] No English text left on Arabic pages

- [ ] The language switch lands on the same page

### Country pop-up

- [ ] Shows on the first visit to Global only

- [ ] Detects the country correctly (test with a VPN set to the UAE, KSA and another country)

- [ ] The choice is remembered on the next visit

### Find a Doctor

- [ ] Country stays selected when specialty or hospital changes

- [ ] /ae and /sa show only that region's doctors by default

- [ ] Filtered URL can be shared, and the back button works

- [ ] Empty state shows when nothing matches

### Forms (every form, every edition)

- [ ] Required-field errors show in English and Arabic

- [ ] The consent checkbox is required

- [ ] Spam protection is active

- [ ] Submission arrives in the correct inbox, with every field present

- [ ] Success message shows

- [ ] Nothing is stored anywhere after submitting

### Performance and SEO

- [ ] PageSpeed 95+ on mobile and desktop for Home, Find a Doctor and a hospital page

- [ ] Every page has a title and meta description

- [ ] Sitemaps and hreflang links present for all editions

- [ ] Old URLs redirect correctly, with no broken internal links

### Accessibility

- [ ] Contrast check passes on buttons and text

- [ ] All images have alt text

- [ ] Keyboard navigation works through the menu and forms

## 5. Release

Go-live is **15 October**. Pramod gives the final go-ahead.

### Before go-live

- [ ] Full QC checklist passed on staging

- [ ] All feedback items closed

- [ ] Form recipient inboxes and email credentials set for production

- [ ] Redirect map in place

- [ ] Rollback plan ready: the current site can be restored within minutes

- [ ] Launch time agreed with Pramod

### Go-live

- [ ] Deploy to production and point the domain (DNS / Cloudflare)

- [ ] Clear the cache

- [ ] Smoke test straight after launch: Home on all 6 editions, Find a Doctor, one submission of each form

- [ ] Submit sitemaps to Google Search Console

### After go-live (15 to 21 October)

- [ ] Daily check of the main journeys: pop-up, Find a Doctor, all four forms

- [ ] Any fault is fixed the same day

- [ ] Handover notes: where the code lives, how to deploy, environment variables, how content is updated

## 6. Not in scope

If anyone asks for one of these, send the request to Pramod first. Don't build it.
- A database, or storing form submissions
- A CMS or admin panel
- A leads or appointments back office
- Any other website
- Writing content or translating
- New images or design beyond Figma
- Patient portal, payments, or integrations with hospital systems, CRMs or insurers

### To be confirmed by Pramod
- Analytics: add Google Analytics with a cookie consent banner, or no analytics at all. Leave room for a consent banner until this is decided.
- Content updates after launch: whether a simple CMS is needed. Keep content in JSON files so a CMS can be added later if required.
