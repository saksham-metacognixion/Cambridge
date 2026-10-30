// Read <title> + meta description of live pages through a CDP-attached Chrome (Cloudflare). Usage: node seo-crawl.mjs <ours.txt> <out.json>
import { chromium } from 'playwright-core';
import fs from 'node:fs';
const [oursFile, outFile] = process.argv.slice(2);
const b = await chromium.connectOverCDP('http://localhost:9333');
const page = await b.contexts()[0].newPage();
await page.goto('https://cambridgehospital.com/robots.txt', { waitUntil: 'load' });
for (let i = 0; i < 60 && !(await page.content()).includes('User-agent'); i++) await page.waitForTimeout(1000);
const live = await page.evaluate(async () => {
  const locs = (t) => [...t.matchAll(/<loc>\s*(?:<!\[CDATA\[)?\s*([^<\]\s]+)/g)].map((m) => m[1]);
  const idx = locs(await (await fetch('/sitemap_index.xml')).text());
  const all = [];
  for (const m of idx) all.push(...locs(await (await fetch(m)).text()));
  return all.filter((u) => !/\.(jpe?g|png|webp|avif|gif|svg|pdf)$/i.test(u));
});
console.log('live sitemap urls', live.length);
const ours = fs.readFileSync(oursFile, 'utf8').split('\n').filter(Boolean).map((p) => 'https://cambridgehospital.com' + p);
const urls = [...new Set([...live, ...ours])];
const done = fs.existsSync(outFile) ? JSON.parse(fs.readFileSync(outFile, 'utf8')) : {};
const todo = urls.filter((u) => !done[u] || done[u].error);
console.log('total', urls.length, 'todo', todo.length);
const crawl = (batch) => page.evaluate(async (todo) => {
  const out = {};
  let i = 0;
  async function worker() {
    while (i < todo.length) {
      const u = todo[i++];
      try {
        const r = await fetch(u, { redirect: 'follow' });
        const t = await r.text();
        const d = new DOMParser().parseFromString(t, 'text/html');
        out[u] = { status: r.status, final: r.url, title: d.title.trim(), description: d.querySelector('meta[name="description"]')?.content?.trim() ?? null, ogTitle: d.querySelector('meta[property="og:title"]')?.content ?? null, challenged: /Just a moment|cf-chl/.test(t.slice(0, 3000)) };
      } catch (e) { out[u] = { error: String(e) }; }
    }
  }
  await Promise.all(Array.from({ length: 6 }, worker));
  return out;
}, batch);
for (let k = 0; k < todo.length; k += 60) {
  Object.assign(done, await crawl(todo.slice(k, k + 60)));
  fs.writeFileSync(outFile, JSON.stringify(done, null, 1));
  console.log('batch', k + 60, '/', todo.length);
}

const v = Object.values(done);
console.log('saved', v.length, 'errors', v.filter((x) => x.error).length, 'challenged', v.filter((x) => x.challenged).length, 'non200', v.filter((x) => x.status && x.status !== 200).length);
process.exit(0);
