/**
 * 301 map for every live-site URL that changes (scope 2.9), in ONE place. Emitted by src/pages/_redirects.ts as the
 * Cloudflare Pages `_redirects` file (each rule in both forms, `/x` and `/x/`, because the live URLs end in a slash), and
 * converted for the nginx staging server by deploy/deploy.sh.
 * Sources: the WordPress export (docs/cambridgehospital.WordPress.2026-10-06.xml, 6 Oct 2026), news `old_url`
 * (src/data/news/posts.json), doctor `old_url` (bug 059), condition `old_slug`, the testimonial / leadership REST exports
 * (docs/testimonial.json, docs/leadership.json: bug 060). Our Care pages keep their live URLs (care.json slugs, bug 058).
 * A rule whose source ends in "/*" is a Cloudflare splat rule (every URL under that path); those come last, after every
 * exact rule, because the first matching rule wins (tools/vercel-json.mjs, tools/qc/serve.mjs and deploy/deploy.sh read
 * them the same way). Every target is the final page URL (urlFor, trailing slash): one hop, no chains.
 */
import { editions, urlFor } from "./editions";
import { PAGE_PATHS } from "./paths";
import { NEWS_PATHS } from "./news";
import { conditions, CONDITION_PATHS } from "./conditions";
import { DOCTOR_PATHS, profileDoctors, doctorEditions } from "./doctors";
import {
  allCareNodes,
  careInRegion,
  careOutsideRegion,
  CARE_PATHS,
} from "./care";
import posts from "../data/news/posts.json";

export interface Redirect {
  from: string;
  to: string;
}

/**
 * Meet the Team (WP6): no page yet, so the live URL and the leadership profiles go to About. When the page is built, add
 * `meetTheTeam: "about/meet-the-team"` to PAGE_PATHS: the /about/meet-the-team rule then drops out (the page answers
 * itself) and /leadership/* points at the new page, still one hop.
 */
const MEET_THE_TEAM = (PAGE_PATHS as Record<string, string>).meetTheTeam as
  string | undefined;
const meetTheTeamFor = (e: (typeof editions)[number]) =>
  urlFor(e, MEET_THE_TEAM ?? PAGE_PATHS.about);

/** Our care.json slug -> the live site's slug, where they differ (the live /ae and /sa page sitemaps, 9 Oct 2026). */
const LIVE_CARE_SLUGS: Record<string, string> = {
  "central-nervous-system": "central-nervous-system-anomalies-rehab",
  "long-term-cardiac": "long-term-cardiac-anomalies-rehab",
  "paediatric-post-acute-rehab": "post-acute-care",
  "paediatric-transitional": "pediatric-transitional-care",
  "musculoskeletal-rehabilitation": "musculoskeletal-rehab",
  "spinal-cord-injury-rehabilitation": "spinal-cord-injury-rehab",
  "stroke-rehabilitation": "stroke-rehab",
  "traumatic-brain-injury-rehabilitation": "traumatic-brain-injury-rehab",
};

/**
 * Live /condition/<slug>/ URLs that must NOT land on the condition carrying that `old_slug` (bug 060, 9 Oct 2026). The live
 * record at /condition/post-surgical-rehabilitation/ is titled "Neurorehabilitation" (docs/specialty.json, id 18781: retitled
 * in WordPress, slug kept), so tools/import-wp-cpt.mjs attached that slug to our Neurorehabilitation condition and the URL
 * opened it. The client wants the URL to open Post-Surgical Rehabilitation, which exists only as the Our Care page
 * (care.json `post-surgical-rehab`; there is no condition of that name, U8). Value = care.json slug; not offered in the
 * edition's country -> that edition's Our Care hub (as bug 047).
 */
const CONDITION_URL_TO_CARE: Record<string, string> = {
  "post-surgical-rehabilitation": "post-surgical-rehab",
};

/** RFC 3986 normal form of a percent-encoded path: uppercase hex, what browsers send (bug 060; WordPress exported lowercase). */
const canonical = (p: string) =>
  p.replace(/%[0-9a-f]{2}/gi, (m) => m.toUpperCase());

const pathOf = (url: string) =>
  new URL(url, "https://x.invalid").pathname.replace(/\/+$/, "");
const globalOf = (locale: "en" | "ar") =>
  editions.find((e) => e.region === "global" && e.locale === locale)!;

/**
 * Live page URLs without a page of their own here, per edition language:
 *   - news category archives -> Media Hub filtered on that category
 *   - /book-an-appointment -> the edition home with the Book an Appointment pop-up open (CT15)
 *   - /about/meet-the-team -> About (leadership records not in the export, WP6)
 *   - /legal (the live legal index) -> the Privacy Policy, the first legal page
 *   - /condition/<WordPress slug> -> the condition's detail page
 *   - a care page not offered in the edition's country (care.json `regions`, bug 047) -> that edition's Our Care hub
 *   - another country's doctor profile (e.g. /sa/patient-hub/find-a-doctor/<UAE doctor>) -> that edition's Find a Doctor list
 * The four health calculators keep their live URLs (PAGE_PATHS, bug 014): no redirect.
 */
export function pageRedirects(): Redirect[] {
  const out: Redirect[] = [];
  for (const e of editions) {
    const base = e.base ? `/${e.base}` : "";
    const add = (from: string, to: string) =>
      out.push({ from: `${base}${from}`, to });
    for (const cat of [
      "events",
      "conferences",
      "press-releases",
      "health-articles",
    ])
      add(`/${cat}`, urlFor(e, NEWS_PATHS.list) + `?category=${cat}#latest`);
    add("/book-an-appointment", urlFor(e) + "#book-appointment");
    if (!MEET_THE_TEAM) add("/about/meet-the-team", meetTheTeamFor(e));
    add("/legal", urlFor(e, PAGE_PATHS.privacyPolicy));
    for (const c of conditions)
      if (c.old_slug && !CONDITION_URL_TO_CARE[c.old_slug])
        add(
          `/condition/${c.old_slug}`,
          urlFor(e, CONDITION_PATHS.detail(c.slug)),
        );
    for (const [live, slug] of Object.entries(CONDITION_URL_TO_CARE)) {
      const p = allCareNodes().find((x) => x.node.slug === slug);
      if (!p)
        throw new Error(
          `redirects: CONDITION_URL_TO_CARE "${live}" -> unknown care slug "${slug}"`,
        );
      add(
        `/condition/${live}`,
        careInRegion(slug, e.region)
          ? urlFor(e, CARE_PATHS.of(p.trail))
          : urlFor(e, CARE_PATHS.hub),
      );
    }
    // Care pages not offered in this edition's country (bug 047, e.g. /sa/care/in-school) -> the edition's Our Care hub.
    const outside = new Set(
      careOutsideRegion(e.region).map((p) => p.node.slug),
    );
    for (const p of careOutsideRegion(e.region))
      out.push({
        from: urlFor(e, CARE_PATHS.of(p.trail)),
        to: urlFor(e, CARE_PATHS.hub),
      });
    // Care pages whose slug differs from the live site's (live sitemaps, 9 Oct 2026) -> the page under our slug.
    for (const p of allCareNodes()) {
      const live = LIVE_CARE_SLUGS[p.node.slug];
      if (!live) continue;
      const to = outside.has(p.node.slug)
        ? urlFor(e, CARE_PATHS.hub)
        : urlFor(e, CARE_PATHS.of(p.trail));
      out.push({
        from: urlFor(e, CARE_PATHS.of([...p.trail.slice(0, -1), live])),
        to,
      });
    }
    // Doctor profiles exist on Global + the doctor's own country only (no UAE / KSA mixing).
    for (const d of profileDoctors)
      if (!doctorEditions(d).includes(e.id))
        out.push({
          from: urlFor(e, DOCTOR_PATHS.profile(d.slug)),
          to: urlFor(e, DOCTOR_PATHS.list),
        });
  }
  // The live Arabic home page was a WordPress page with its own slug.
  out.push({ from: "/ar/cambridge-hospital", to: urlFor(globalOf("ar")) });
  return out;
}

/** One line per post whose old URL differs; English posts go to Global English, Arabic posts to Global Arabic. */
export function newsRedirects(): Redirect[] {
  return (posts as { slug: string; old_url: string; language: string }[])
    .filter((p) => p.old_url)
    .map((p) => ({
      from: pathOf(p.old_url),
      to: urlFor(
        globalOf(p.language === "ar" ? "ar" : "en"),
        NEWS_PATHS.article(p.slug),
      ),
    }));
}

/**
 * Live doctor profiles (bug 059): the live site had them at /<ae|sa>[/ar]/doctor/<live slug>/. Each goes to the profile in
 * the SAME country edition and language (a KSA URL never lands on a UAE page). Sources per doctor with a country: the live
 * slug from `old_url` (KSA slugs are longer: dr-saleh-awadh-mohamed-damnan -> saleh-damnan) and the WordPress slug (the UAE
 * live URLs use it). Any other /<edition>/doctor/<x> -> that edition's Find a Doctor list (sectionRedirects).
 */
export function doctorRedirects(): Redirect[] {
  const out: Redirect[] = [];
  for (const d of profileDoctors) {
    if (!d.country) continue;
    const live = d.old_url ? pathOf(d.old_url).split("/").pop()! : "";
    for (const e of editions.filter((x) => x.region === d.country))
      for (const slug of new Set([live, d.slug].filter(Boolean)))
        out.push({
          from: `/${e.base}/doctor/${slug}`,
          to: urlFor(e, DOCTOR_PATHS.profile(d.slug)),
        });
  }
  return out;
}

/**
 * Whole live sections without a page per item here, per edition (splat rules, after every exact rule):
 *   - /doctor/<x> not matched by doctorRedirects -> Find a Doctor (bug 059: a live slug we do not know yet never 404s)
 *   - /testimonial/<x> (12 live stories, docs/testimonial.json) -> Patient Testimonials (bug 060: one page, no story pages)
 *   - /leadership/<x> (17 live profiles, docs/leadership.json) -> About, like /about/meet-the-team until Meet the Team
 *     exists (bug 060 / 061, WP6). Change the target here and every rule follows (no chains).
 * The section roots themselves (/doctor/, /testimonial/, /leadership/) go to the same pages.
 */
export function sectionRedirects(): Redirect[] {
  return editions.flatMap((e) => {
    const base = e.base ? `/${e.base}` : "";
    return (
      [
        ["doctor", urlFor(e, DOCTOR_PATHS.list)],
        ["testimonial", urlFor(e, PAGE_PATHS.patientTestimonials)],
        ["leadership", meetTheTeamFor(e)],
      ] as const
    ).flatMap(([section, to]) => [
      { from: `${base}/${section}`, to },
      { from: `${base}/${section}/*`, to },
    ]);
  });
}

/**
 * All rules, deduplicated by source, without no-op rules. Sources are compared without their trailing slash (bug 057:
 * "/media-hub/x" and the target "/media-hub/x/" are the same page, a rule between them would loop) and with their
 * percent-encoding in uppercase (bug 060: the seven Arabic post slugs; src/pages/[redirects].ts also writes the lowercase twin).
 */
export function allRedirects(): Redirect[] {
  const seen = new Set<string>();
  const bare = (p: string) => p.replace(/\/+$/, "");
  const isSplat = (r: Redirect) => r.from.endsWith("/*");
  const rules = [
    ...pageRedirects(),
    ...newsRedirects(),
    ...doctorRedirects(),
    ...sectionRedirects(),
  ];
  return [...rules.filter((r) => !isSplat(r)), ...rules.filter(isSplat)]
    .map((r) => ({ ...r, from: canonical(bare(r.from)) }))
    .filter(
      (r) =>
        r.from &&
        r.from !== bare(r.to) &&
        !seen.has(r.from) &&
        !!seen.add(r.from),
    );
}
