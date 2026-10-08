// Link audit of the built site (scope 4): crawls every edition from its home page over the QC server (tools/qc/serve.mjs),
// follows every internal link, checks each target (status, hash = element id or pop-up), lists href="#", checks external
// links (http(s), tel:, mailto:) by format, and verifies that the language switch and the edition switch land on the same page.
// Usage: node tools/qc/links.mjs [base=http://localhost:4400] [out=docs/link-audit.md]
// Uses the static HTML only (no browser): fast and deterministic. Pop-up hashes are the ones Modals.astro opens.
import fs from 'node:fs';
import path from 'node:path';

const base = process.argv[2] ?? 'http://localhost:4400';
const out = process.argv[3] ?? 'docs/link-audit.md';
const EDITIONS = [
  { id: 'global-en', base: '', region: 'global', locale: 'en' },
  { id: 'global-ar', base: 'ar', region: 'global', locale: 'ar' },
  { id: 'ae-en', base: 'ae', region: 'ae', locale: 'en' },
  { id: 'ae-ar', base: 'ae/ar', region: 'ae', locale: 'ar' },
  { id: 'sa-en', base: 'sa', region: 'sa', locale: 'en' },
  { id: 'sa-ar', base: 'sa/ar', region: 'sa', locale: 'ar' },
];
const POPUPS = new Set(['#book-appointment', '#send-inquiry', '#your-opinion']);

const pages = new Map(); // path -> { status, html, ids:Set, links:[{href, text}] }
const queue = EDITIONS.map((e) => (e.base ? `/${e.base}/` : '/')); // bug 057: every page URL ends in a slash
const seen = new Set(queue);

const attr = (tag, name) => { const m = tag.match(new RegExp(`\\s${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i')); return m ? (m[2] ?? m[3] ?? m[4] ?? '') : null; };
const decode = (s) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');

async function fetchPage(p) {
  const res = await fetch(base + p, { redirect: 'manual' });
  const html = res.status === 200 || res.status === 404 ? await res.text() : '';
  const ids = new Set([...html.matchAll(/\sid\s*=\s*"([^"]+)"/g)].map((m) => m[1]));
  const links = [];
  for (const m of html.matchAll(/<a\b[^>]*>/gi)) {
    const href = attr(m[0], 'href');
    if (href === null) continue;
    const after = html.slice(m.index + m[0].length, m.index + m[0].length + 200);
    const text = (attr(m[0], 'aria-label') ?? decode(after.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim().slice(0, 40)) || '(no text)';
    links.push({ href: decode(href), text });
  }
  // hreflang + canonical for the switch checks
  const alts = [...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g)].map((m) => ({ lang: m[1], href: m[2] }));
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1] ?? '';
  const title = html.match(/<title>([^<]*)<\/title>/)?.[1] ?? '';
  return { status: res.status, location: res.headers.get('location'), html, ids, links, alts, canonical, title };
}

const normalize = (href, from) => {
  const u = new URL(href, base + from);
  if (u.origin !== new URL(base).origin) return null;
  // Kept as written (bug 057): a page link without its trailing slash answers 301 and is reported as a problem.
  const p = u.pathname;
  return { path: p, hash: u.hash, search: u.search };
};

// 1. crawl
while (queue.length) {
  const p = queue.shift();
  const page = await fetchPage(p);
  pages.set(p, page);
  if (page.status !== 200) continue;
  for (const l of page.links) {
    if (l.href === '#' || l.href.startsWith('#') || /^(mailto|tel|https?):/i.test(l.href)) continue;
    const n = normalize(l.href, p);
    if (!n || seen.has(n.path)) continue;
    seen.add(n.path);
    queue.push(n.path);
  }
}

// 2. check every link
const problems = []; // { kind, from, text, href, note }
const okCount = { internal: 0, hash: 0, popup: 0, external: 0, tel: 0, mailto: 0 };
const bare = new Map(); // text -> pages
for (const [p, page] of pages) {
  if (page.status !== 200) continue;
  for (const l of page.links) {
    const h = l.href;
    if (h === '#' || h === '') { bare.set(l.text, (bare.get(l.text) ?? new Set()).add(p)); continue; }
    if (/^tel:/i.test(h)) { if (/^tel:\+?[\d]{6,15}$/.test(h)) okCount.tel++; else problems.push({ kind: 'tel', from: p, text: l.text, href: h, note: 'malformed tel: link' }); continue; }
    if (/^mailto:/i.test(h)) { if (/^mailto:[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(h)) okCount.mailto++; else problems.push({ kind: 'mailto', from: p, text: l.text, href: h, note: 'malformed mailto: link' }); continue; }
    if (/^https?:/i.test(h)) {
      const same = new URL(h).origin === new URL(base).origin;
      if (same) { /* treated below as internal */ } else { try { new URL(h); okCount.external++; } catch { problems.push({ kind: 'external', from: p, text: l.text, href: h, note: 'invalid URL' }); } continue; }
    }
    if (h.startsWith('#')) {
      if (POPUPS.has(h)) { okCount.popup++; continue; }
      if (page.ids.has(h.slice(1))) { okCount.hash++; continue; }
      problems.push({ kind: 'hash', from: p, text: l.text, href: h, note: 'no element with this id on the page and not a pop-up' });
      continue;
    }
    const n = normalize(h, p);
    const target = pages.get(n.path);
    if (!target || target.status !== 200) { problems.push({ kind: 'broken', from: p, text: l.text, href: h, note: `target answers ${target?.status ?? 'nothing'}` }); continue; }
    if (n.hash && !POPUPS.has(n.hash) && !target.ids.has(n.hash.slice(1))) { problems.push({ kind: 'hash', from: p, text: l.text, href: h, note: `no element "${n.hash}" on ${n.path}` }); continue; }
    okCount.internal++;
  }
}

// 3. language / edition switch: on every 200 page, the EN/AR links and the region menu links must resolve, and point to the same page path
const switchProblems = [];
let switchOk = 0;
let nearest = 0;
const editionOf = (p) => { const clean = p.replace(/^\/+|\/+$/g, ''); const sorted = [...EDITIONS].sort((a, b) => b.base.length - a.base.length); for (const e of sorted) { if (e.base === '') return { e, rest: clean }; if (clean === e.base || clean.startsWith(e.base + '/')) return { e, rest: clean.slice(e.base.length).replace(/^\//, '') }; } return { e: EDITIONS[0], rest: clean }; };
for (const [p, page] of pages) {
  if (page.status !== 200 || p.endsWith('/404') || p.endsWith('/404/')) continue;
  const { e, rest } = editionOf(p);
  const langLinks = [...page.html.matchAll(/<a href="([^"]+)" hreflang="([^"]+)" lang="(en|ar)"/g)].map((m) => ({ href: m[1], lang: m[3] }));
  const regionLinks = [...page.html.matchAll(/<a href="([^"]+)" hreflang="([^"]+)" class="hit ritem/g)].map((m) => ({ href: m[1], hreflang: m[2] }));
  for (const l of [...langLinks, ...regionLinks]) {
    const n = normalize(l.href, p);
    const t = pages.get(n.path) ?? (await fetchPage(n.path));
    pages.set(n.path, t);
    const { rest: rest2 } = editionOf(n.path);
    if (t.status !== 200) {
      switchProblems.push({ from: p, href: l.href, note: `switch target answers ${t.status}` });
    } else if (rest2 !== rest) {
      // Allowed only when the exact page does not exist in the other edition (a hospital of another region): the switch then
      // lands on the nearest parent that exists (src/lib/routes.ts switchHref). Anything else is a wrong landing page.
      const { e: e2 } = editionOf(n.path);
      const exact = '/' + [e2.base, rest].filter(Boolean).join('/') + (e2.base || rest ? '/' : '');
      const ex = pages.get(exact) ?? (await fetchPage(exact));
      pages.set(exact, ex);
      if ((ex.status === 404 || ex.status === 301) && (rest2 === '' || rest.startsWith(rest2 + '/'))) { switchOk++; nearest++; }
      else switchProblems.push({ from: p, href: l.href, note: `switch lands on "${rest2}" instead of "${rest}"` });
    } else switchOk++;
  }
}

// 4. report
const list = [...pages.entries()].sort(([a], [b]) => a.localeCompare(b));
const lines = [];
lines.push('# Link audit', '', `Generated ${new Date().toISOString().slice(0, 10)} by \`node tools/qc/links.mjs\` against the built site (\`npm run build\`, served by \`tools/qc/serve.mjs\`). Crawl start: the six edition home pages; every internal link followed; every pop-up hash (#book-appointment, #send-inquiry, #your-opinion) and in-page hash checked.`, '');
const fixesFile = path.join(path.dirname(out), 'link-audit.fixes.md');
if (fs.existsSync(fixesFile)) lines.push(fs.readFileSync(fixesFile, 'utf8').trim(), '');
lines.push('## Summary', '', '| Check | Result |', '|---|---|');
lines.push(`| Pages crawled | ${list.filter(([, p]) => p.status === 200).length} (200) |`);
lines.push(`| Internal links resolving | ${okCount.internal} |`);
lines.push(`| In-page hash links resolving | ${okCount.hash} |`);
lines.push(`| Pop-up links (#book-appointment / #send-inquiry / #your-opinion) | ${okCount.popup} |`);
lines.push(`| External / tel: / mailto: links valid | ${okCount.external} / ${okCount.tel} / ${okCount.mailto} |`);
lines.push(`| Language + edition switches landing on the same page | ${switchOk} (${nearest} of them on the nearest existing parent, because the page has no version in that edition) |`);
lines.push(`| **Broken internal links** | **${problems.filter((x) => x.kind === 'broken').length}** |`);
lines.push(`| **Hash links without a target** | **${problems.filter((x) => x.kind === 'hash').length}** |`);
lines.push(`| **Malformed external / tel / mailto** | **${problems.filter((x) => ['external', 'tel', 'mailto'].includes(x.kind)).length}** |`);
lines.push(`| **href="#" links** | **${[...bare.values()].reduce((n, s) => n + s.size, 0)} occurrences (${bare.size} distinct labels)** |`);
lines.push(`| **Switch problems** | **${switchProblems.length}** |`, '');
if (problems.length) { lines.push('## Failures', '', '| Kind | From | Link text | href | Note |', '|---|---|---|---|---|'); for (const x of problems) lines.push(`| ${x.kind} | ${x.from} | ${x.text} | ${x.href} | ${x.note} |`); lines.push(''); }
if (bare.size) { lines.push('## href="#" (no destination)', '', '| Link text | On pages |', '|---|---|'); for (const [t, s] of bare) lines.push(`| ${t} | ${s.size} (e.g. ${[...s].slice(0, 3).join(', ')}) |`); lines.push(''); }
if (switchProblems.length) { lines.push('## Language / edition switch problems', '', '| From | href | Note |', '|---|---|---|'); for (const x of switchProblems) lines.push(`| ${x.from} | ${x.href} | ${x.note} |`); lines.push(''); }
lines.push('## Pages', '', '| Path | Status | Title | Links |', '|---|---|---|---|');
for (const [p, page] of list) lines.push(`| ${p} | ${page.status} | ${page.title.replace(/\|/g, '/')} | ${page.links.length} |`);
lines.push('');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, lines.join('\n'));
console.log(lines.slice(0, 16).join('\n'));
if (problems.length || switchProblems.length) process.exitCode = 1;
