/**
 * 301 map for every live-site URL that changes (scope 2.9), in ONE place. Emitted by src/pages/_redirects.ts as the
 * Cloudflare Pages `_redirects` file (each rule in both forms, `/x` and `/x/`, because the live URLs end in a slash), and
 * converted for the nginx staging server by deploy/deploy.sh.
 * Sources: the WordPress export (docs/cambridgehospital.WordPress.2026-10-06.xml, 6 Oct 2026), news `old_url`
 * (src/content/news/<slug>.json `old_url` / `previous_slugs`), doctor `old_url` (bug 059), condition `old_slug`, the testimonial / leadership REST exports
 * (docs/testimonial.json, docs/leadership.json: bug 060). Our Care pages keep their live URLs (care.json slugs, bug 058).
 * A rule whose source ends in "/*" is a Cloudflare splat rule (every URL under that path); those come last, after every
 * exact rule, because the first matching rule wins (tools/vercel-json.mjs, tools/qc/serve.mjs and deploy/deploy.sh read
 * them the same way). Every target is the final page URL (urlFor, trailing slash): one hop, no chains.
 */
import { editions, urlFor } from "./editions";
import { PAGE_PATHS } from "./paths";
import { NEWS_PATHS, newsRecords, newsFiles, isLive } from "./news";
import { conditions, CONDITION_PATHS } from "./conditions";
import { DOCTOR_PATHS, profileDoctors, doctorEditions } from "./doctors";
import {
  allCareNodes,
  careInRegion,
  careOutsideRegion,
  CARE_PATHS,
} from "./care";
import { leaders, leaderEditions, leaderHref, LEADER_PATHS } from "./leadership";

export interface Redirect {
  from: string;
  to: string;
}

/**
 * Meet the Team (WP6): built 16 Oct 2026 (Task 198), PAGE_PATHS.meetTheTeam, so the /about/meet-the-team rule drops out (the
 * page answers itself). Without that key the page and every /leadership/ URL would go to About again.
 */
const MEET_THE_TEAM = (PAGE_PATHS as Record<string, string>).meetTheTeam as
  string | undefined;
const meetTheTeamFor = (e: (typeof editions)[number]) =>
  urlFor(e, MEET_THE_TEAM ?? PAGE_PATHS.about);

/**
 * Our care.json slug -> the live site's slug, where they differ (the live /ae and /sa page sitemaps, 9 Oct 2026).
 * homecare: client bug 096 (13 Oct 2026) renamed the live /care/home-healthcare/ to match the section name (SEO-sensitive,
 * client to confirm before go-live: docs/open-decisions.md U9).
 */
const LIVE_CARE_SLUGS: Record<string, string> = {
  homecare: "home-healthcare",
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
  // Doctors the client took out of Find a Doctor who stay on Meet the Team: the old profile URL opens the leader profile.
  for (const e of editions)
    for (const [doctor, leader] of Object.entries(DOCTOR_TO_LEADER)) {
      const l = leaders.find((x) => x.slug === leader);
      if (l) out.push({ from: urlFor(e, DOCTOR_PATHS.profile(doctor)), to: leaderHref(l, e) });
    }
  out.push(...leadershipRedirects());
  // The live Arabic home page was a WordPress page with its own slug.
  out.push({ from: "/ar/cambridge-hospital", to: urlFor(globalOf("ar")) });
  return out;
}

/**
 * One line per post whose old URL differs; English posts go to Global English, Arabic posts to Global Arabic. A post renamed in
 * the dashboard keeps its earlier slugs in `previous_slugs`: each one 301s to the current URL in every edition of the post.
 */
export function newsRedirects(): Redirect[] {
  const old = newsRecords
    .filter((p) => p.old_url)
    .map((p) => ({
      from: pathOf(p.old_url),
      to: urlFor(
        globalOf(p.language === "ar" ? "ar" : "en"),
        NEWS_PATHS.article(p.slug),
      ),
    }));
  const renamed = newsFiles
    .filter(isLive)
    .flatMap((p) =>
      p.previous_slugs.flatMap((prev) =>
        editions
          .filter((e) => p.editions.includes(e.region))
          .map((e) => ({ from: urlFor(e, NEWS_PATHS.article(prev)), to: urlFor(e, NEWS_PATHS.article(p.slug)) })),
      ),
    );
  return [...old, ...renamed];
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
 * Live /leadership/<slug>/ profiles (Task 198, 16 Oct 2026): every leader has a page at the live URL (LEADER_PATHS), so the
 * live links need no rule. Exact rules only (a /leadership/* splat would shadow the profile pages):
 *   - /leadership (the live section root) -> the edition's Meet the Team
 *   - a leader of the other country in /ae or /sa (e.g. /sa/leadership/ahmad-al-khayer) -> that edition's Meet the Team
 *   - a live slug that differs from ours (the Arabic /ar/leadership/dr-mohammed-halawani/) -> the profile, same edition
 *   - live profiles not imported (RETIRED_LEADER_SLUGS) -> the edition's Meet the Team
 * Any other /leadership/<x> is a 404 (the 404 page links the key sections).
 */
/** Dr. Mohammed Halawani: removed as a doctor (client, 19 Oct 2026), kept as the KSA CEO on Meet the Team. */
const DOCTOR_TO_LEADER: Record<string, string> = { "mohammed-halawani": "mohammed-halawani" };
/** Arabic-only live profile without an English record (عظيم أنور, IT Director, /ar/leadership/azeem-anwar/): not imported (client).
 *  wael-alsayed (Wael Alsayed, KSA): removed from the site by the client, 19 Oct 2026 (tools/leadership/import.py REMOVED). */
const RETIRED_LEADER_SLUGS = ["azeem-anwar", "wael-alsayed"];
export function leadershipRedirects(): Redirect[] {
  const out: Redirect[] = [];
  for (const e of editions) {
    const team = urlFor(e, PAGE_PATHS.meetTheTeam);
    const at = (slug: string) => urlFor(e, LEADER_PATHS.profile(slug));
    out.push({ from: urlFor(e, LEADER_PATHS.section), to: team });
    for (const slug of RETIRED_LEADER_SLUGS) out.push({ from: at(slug), to: team });
    for (const l of leaders) {
      const home = leaderEditions(l).includes(e.id);
      if (!home) out.push({ from: at(l.slug), to: team });
      for (const old of l.old_urls) {
        const slug = old.replace(/\/+$/, "").split("/").pop()!;
        if (slug !== l.slug) out.push({ from: at(slug), to: home ? leaderHref(l, e) : team });
      }
    }
  }
  return out;
}

/**
 * Whole live sections without a page per item here, per edition (splat rules, after every exact rule):
 *   - /doctor/<x> not matched by doctorRedirects -> Find a Doctor (bug 059: a live slug we do not know yet never 404s)
 *   - /testimonial/<x> (12 live stories, docs/testimonial.json) -> Patient Testimonials (bug 060: one page, no story pages)
 * The section roots themselves (/doctor/, /testimonial/) go to the same pages. /leadership/<x> used to be here (-> About,
 * bug 060 / 061); since Task 198 the profiles exist at those URLs, see leadershipRedirects().
 */
export function sectionRedirects(): Redirect[] {
  return editions.flatMap((e) => {
    const base = e.base ? `/${e.base}` : "";
    return (
      [
        ["doctor", urlFor(e, DOCTOR_PATHS.list)],
        ["testimonial", urlFor(e, PAGE_PATHS.patientTestimonials)],
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
