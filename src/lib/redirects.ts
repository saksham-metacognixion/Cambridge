/**
 * 301 map for every live-site URL that changes (scope 2.9), in ONE place. Emitted by src/pages/_redirects.ts as the
 * Cloudflare Pages `_redirects` file (each rule in both forms, `/x` and `/x/`, because the live URLs end in a slash), and
 * converted for the nginx staging server by deploy/deploy.sh.
 * Sources: the WordPress export (docs/cambridgehospital.WordPress.2026-10-06.xml, 6 Oct 2026), news `old_url`
 * (src/data/news/posts.json), doctor `old_url` (none yet: WP13), condition `old_slug`.
 */
import { editions, urlFor } from "./editions";
import { PAGE_PATHS } from "./paths";
import { NEWS_PATHS } from "./news";
import { conditions, CONDITION_PATHS } from "./conditions";
import { DOCTOR_PATHS, profileDoctors, doctorEditions } from "./doctors";
import { careOutsideRegion, CARE_PATHS } from "./care";
import posts from "../data/news/posts.json";

export interface Redirect {
  from: string;
  to: string;
}

const pathOf = (url: string) => new URL(url, "https://x.invalid").pathname.replace(/\/+$/, "");
const globalOf = (locale: "en" | "ar") => editions.find((e) => e.region === "global" && e.locale === locale)!;

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
    const add = (from: string, to: string) => out.push({ from: `${base}${from}`, to });
    for (const cat of ["events", "conferences", "press-releases", "health-articles"])
      add(`/${cat}`, urlFor(e, NEWS_PATHS.list) + `?category=${cat}#latest`);
    add("/book-an-appointment", urlFor(e) + "#book-appointment");
    add("/about/meet-the-team", urlFor(e, PAGE_PATHS.about));
    add("/legal", urlFor(e, PAGE_PATHS.privacyPolicy));
    for (const c of conditions) if (c.old_slug) add(`/condition/${c.old_slug}`, urlFor(e, CONDITION_PATHS.detail(c.slug)));
    // Care pages not offered in this edition's country (bug 047, e.g. /sa/care/in-school) -> the edition's Our Care hub.
    for (const p of careOutsideRegion(e.region)) out.push({ from: urlFor(e, CARE_PATHS.of(p.trail)), to: urlFor(e, CARE_PATHS.hub) });
    // Doctor profiles exist on Global + the doctor's own country only (no UAE / KSA mixing).
    for (const d of profileDoctors) if (!doctorEditions(d).includes(e.id)) out.push({ from: urlFor(e, DOCTOR_PATHS.profile(d.slug)), to: urlFor(e, DOCTOR_PATHS.list) });
  }
  // The live Arabic home page was a WordPress page with its own slug.
  out.push({ from: "/ar/cambridge-hospital", to: urlFor(globalOf("ar")) });
  return out;
}

/** One line per post whose old URL differs; English posts go to Global English, Arabic posts to Global Arabic. */
export function newsRedirects(): Redirect[] {
  return (posts as { slug: string; old_url: string; language: string }[])
    .filter((p) => p.old_url)
    .map((p) => ({ from: pathOf(p.old_url), to: urlFor(globalOf(p.language === "ar" ? "ar" : "en"), NEWS_PATHS.article(p.slug)) }));
}

/** One line per doctor with an old profile URL (none until Pramod's data has them, WP13). */
export function doctorRedirects(): Redirect[] {
  return profileDoctors
    .filter((d) => d.old_url)
    .map((d) => ({ from: pathOf(d.old_url!), to: urlFor(globalOf("en"), DOCTOR_PATHS.profile(d.slug)) }));
}

/** All rules, deduplicated by source, without no-op rules. */
export function allRedirects(): Redirect[] {
  const seen = new Set<string>();
  return [...pageRedirects(), ...newsRedirects(), ...doctorRedirects()].filter(
    (r) => r.from && r.from !== r.to && !seen.has(r.from) && !!seen.add(r.from),
  );
}
