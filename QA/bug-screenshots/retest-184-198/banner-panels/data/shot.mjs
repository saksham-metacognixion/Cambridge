// node shot.mjs <base> <outdir> <widths> <pathsfile>: hero screenshots per path x width (ENGINE=chrome|webkit), Global edition
// cookie (pop-up closed). report.json: section box, pill stack + people rects (page px, relative to the section), RTL flip,
// horizontal scroll, people clipped by the viewport or the section.
import { chromium, webkit } from 'playwright-core';
import fs from 'node:fs';
const [base, out, ws, pf] = process.argv.slice(2);
const paths = fs.readFileSync(pf, 'utf8').split(/\s+/).filter(Boolean);
const engine = process.env.ENGINE || 'chrome';
fs.mkdirSync(out, { recursive: true });
const b = engine === 'webkit' ? await webkit.launch() : await chromium.launch({ channel: 'chrome' });
const ctx = await b.newContext({ reducedMotion: 'reduce', deviceScaleFactor: 1 });
await ctx.addCookies([{ name: 'ch_edition', value: 'global', url: base }]);
const p = await ctx.newPage();
const report = [];
for (const path of paths) {
  for (const w of ws.split(',').map(Number)) {
    await p.setViewportSize({ width: w, height: 1000 });
    await p.goto(base + path, { waitUntil: 'load', timeout: 120000 });
    await p.evaluate(async () => { await Promise.all([...document.querySelectorAll('.bn-frame img')].map((i) => i.decode().catch(() => {}))); });
    await p.waitForTimeout(250);
    const r = await p.evaluate(() => {
      const f = document.querySelector('.bn-frame');
      const sec = f?.closest('section');
      if (!sec) return null;
      const rect = sec.getBoundingClientRect();
      const sh = f.querySelector('.bn-shape')?.getBoundingClientRect();
      const img = f.querySelector('[data-hero-subject] img, img[data-hero-subject]') || f.querySelector('.bn-people');
      const pe = (img || f.querySelector('[data-hero-subject]')).getBoundingClientRect();
      const rtl = document.documentElement.dir === 'rtl';
      const flip = rtl && !!f.querySelector('.bn-flip') && f.getAttribute('dir') !== 'ltr';
      const cs = getComputedStyle(sec);
      const clipX = cs.overflowX !== 'visible' || cs.overflow !== 'visible';
      const vis = { l: Math.max(0, clipX ? rect.left : 0), r: Math.min(innerWidth, clipX ? rect.right : innerWidth) };
      return { y: rect.top + scrollY, h: Math.round(rect.height), rtl, flip, src: img?.currentSrc?.split('/').pop(), nat: img && [img.naturalWidth, img.naturalHeight],
        shape: sh && [sh.left, sh.top - rect.top, sh.width, sh.height].map((v) => +v.toFixed(2)), people: [pe.left, pe.top - rect.top, pe.width, pe.height].map((v) => +v.toFixed(2)),
        cutL: +(vis.l - pe.left).toFixed(1), cutR: +(pe.right - vis.r).toFixed(1), cutB: +(pe.bottom - rect.bottom).toFixed(1),
        hscroll: document.documentElement.scrollWidth > innerWidth, edge: [...f.classList].filter((c) => /bleed|fade/.test(c)) };
    });
    const name = `${path.replace(/\//g, '_') || '_'}-${w}.png`;
    if (r && !process.env.NOSHOT) await p.screenshot({ path: `${out}/${name}`, clip: { x: 0, y: r.y, width: w, height: Math.min(r.h, 1600) } });
    report.push({ path, w, ...r });
  }
  process.stdout.write('.');
}
fs.writeFileSync(`${out}/report.json`, JSON.stringify(report, null, 1));
await b.close();
console.log(' done', report.length);
