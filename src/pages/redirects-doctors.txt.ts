import type { APIRoute } from 'astro';
import { editions, urlFor } from '../lib/editions';
import { DOCTOR_PATHS, profileDoctors } from '../lib/doctors';

/*
 * 301 map for doctor profile URLs that change (scope 2.9): one line per doctor that has an `old_url` (path of the current site's
 * profile page, from Pramod's JSON) that differs from the new URL. Format = Cloudflare Pages `_redirects` ("from to 301");
 * it is emitted as /redirects-doctors.txt so the deploy step can append it to `_redirects` (or convert it for nginx).
 * The old site has one URL per doctor, so the old path goes to the Global English profile (the same as the old site's default).
 */
export const GET: APIRoute = () => {
  const global = editions.find((e) => e.id === 'global-en')!;
  const lines = profileDoctors
    .filter((d) => d.old_url)
    .map((d) => ({ from: new URL(d.old_url!, 'https://x.invalid').pathname.replace(/\/+$/, ''), to: urlFor(global, DOCTOR_PATHS.profile(d.slug)) }))
    .filter((r) => r.from && r.from !== r.to)
    .map((r) => `${r.from} ${r.to} 301`);
  return new Response(lines.join('\n') + (lines.length ? '\n' : ''), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
