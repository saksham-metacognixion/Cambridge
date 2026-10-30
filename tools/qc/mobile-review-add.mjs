// Adds pages to docs/mobile-review/index.html (the review Padmavathi approves, docs/open-decisions.md P1): for each page a
// section with the Figma frame | the build at 768 | the build at 390 (each column scrolls), the small-screen layout decisions
// and the automatic comparison of text styles (colour, font, weight, italic, case) between 1440 and the two small widths.
// Usage: node tools/qc/mobile-review-add.mjs pages.json   (see the PAGES shape below; existing sections with the same id are replaced)
import fs from 'node:fs';
import { chromium } from 'playwright-core';

const base = process.env.QC_BASE ?? 'http://localhost:4400';
const file = 'docs/mobile-review/index.html';
const pages = JSON.parse(fs.readFileSync(process.argv[2], 'utf8')); // [{ id, title, url, figma: 'figma-cache/pages/x.png' | null, decisions: [..] }]

const b64 = (p) => (p && fs.existsSync(p) ? `data:image/png;base64,${fs.readFileSync(p).toString('base64')}` : null);
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const browser = await chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext({ reducedMotion: 'reduce' });
await ctx.addInitScript(() => { try { sessionStorage.setItem('ch_edition', 'global'); } catch {} });

async function capture(url, w) {
  const page = await ctx.newPage({ viewport: { width: w, height: 900 } });
  await page.goto(base + url, { waitUntil: 'networkidle' });
  await page.evaluate(async () => { const step = 500; for (let y = 0; y < document.documentElement.scrollHeight; y += step) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 30)); } scrollTo(0, 0); await new Promise((r) => setTimeout(r, 200)); });
  await page.addStyleTag({ content: '*, *::before, *::after { transition: none !important; animation: none !important; }' });
  const shot = await page.screenshot({ fullPage: true, type: 'jpeg', quality: 62 }); // JPEG keeps the review file small (the PNG originals are the QC screenshots)
  const styles = await page.evaluate(() => {
    const out = new Map();
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = walker.nextNode())) {
      const t = n.textContent.trim();
      if (t.length < 3) continue;
      const el = n.parentElement;
      if (!el || el.closest('dialog, script, style, [hidden]')) continue;
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      const visible = cs.display !== 'none' && cs.visibility !== 'hidden' && (r.width > 0 || r.height > 0);
      out.set(t.slice(0, 60), { c: cs.color, f: cs.fontFamily.split(',')[0], w: cs.fontWeight, i: cs.fontStyle, u: cs.textTransform, visible });
    }
    const imgs = [...document.querySelectorAll('img')].map((i) => ({ n: (i.getAttribute('src') || '').split('/').pop().split('.')[0], v: i.getBoundingClientRect().width > 0 && getComputedStyle(i).display !== 'none' }));
    const hs = document.documentElement.scrollWidth > document.documentElement.clientWidth + 1;
    return { styles: [...out.entries()], imgs, hs };
  });
  await page.close();
  return { shot, ...styles };
}

let html = fs.readFileSync(file, 'utf8');
for (const p of pages) {
  const ref = await capture(p.url, 1440);
  const cols = [];
  const checks = [];
  for (const w of [768, 390]) {
    const r = await capture(p.url, w);
    const refMap = new Map(ref.styles);
    let compared = 0, diffs = 0, hidden = 0;
    const diffList = [];
    for (const [t, s] of r.styles) {
      const a = refMap.get(t);
      if (!a) continue;
      if (!s.visible) { hidden++; continue; }
      compared++;
      const d = ['c', 'f', 'w', 'i', 'u'].filter((k) => a[k] !== s[k]);
      if (d.length) { diffs++; if (diffList.length < 5) diffList.push(`"${t.slice(0, 30)}": ${d.join('/')}`); }
    }
    const hiddenImgs = r.imgs.filter((i) => !i.v && ref.imgs.find((x) => x.n === i.n)?.v).map((i) => i.n);
    checks.push(`<li><b>${w}</b>: ${compared} text styles compared with 1440, <b>${diffs} difference${diffs === 1 ? '' : 's'}</b> (colour, font, weight, italic, case)${diffList.length ? ': ' + esc(diffList.join('; ')) : ''}. ${hidden} texts not visible (header items live inside the hamburger menu). Images hidden: ${hiddenImgs.length ? esc([...new Set(hiddenImgs)].slice(0, 8).join(', ')) : 'none'}. Horizontal scroll: ${r.hs ? '<b>YES</b>' : 'none'}.</li>`);
    cols.push(`<div class="col"><h4>Built, ${w === 768 ? 'tablet' : 'mobile'} ${w}</h4><div class="scroll"><img loading="lazy" src="data:image/jpeg;base64,${r.shot.toString('base64')}" alt="${esc(p.title)} at ${w} px"></div></div>`);
  }
  const fig = b64(p.figma);
  const figCol = `<div class="col"><h4>Figma (1052 wide frame = 1440 design)</h4><div class="scroll">${fig ? `<img loading="lazy" src="${fig}" alt="Figma design of ${esc(p.title)}">` : '<p class="mut">No Figma frame: built from existing components only (see docs/open-decisions.md).</p>'}</div></div>`;
  const section = `<section id="${p.id}"><h2>${esc(p.title)}</h2>\n<div class="cols">${figCol}\n${cols.join('\n')}</div>\n<h3>Small-screen layout decisions</h3><ul class="dec">${p.decisions.map((d) => `<li>${esc(d)}</li>`).join('')}</ul>\n<h3>Colours, fonts, text and images vs 1440 (automatic check)</h3><ul class="chk">${checks.join('')}</ul></section>`;
  const re = new RegExp(`<section id="${p.id}">[\\s\\S]*?</section>`);
  if (re.test(html)) html = html.replace(re, section);
  else html = html.replace('<section id="popup-book">', section + '\n<section id="popup-book">');
  const toc = `<a href="#${p.id}">${esc(p.title)}</a>`;
  if (!html.includes(toc)) html = html.replace('<a href="#popup-book">', toc + '<a href="#popup-book">');
  console.log('added', p.id);
}
html = html.replace(/Generated \d{4}-\d{2}-\d{2}/, `Generated ${new Date().toISOString().slice(0, 10)}`).replace('The Article template is not built yet (only its Figma frame exists), so it is not in this review. ', '');
fs.writeFileSync(file, html);
await browser.close();
