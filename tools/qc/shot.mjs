// Full-page screenshot of a built page with the installed Google Chrome (playwright-core, channel "chrome").
// Usage: node tools/qc/shot.mjs <url> <out.png> [width=1440] [height=900]
// The preview server must be running (npm run preview). Animations are disabled so screenshots are stable.
import { chromium } from 'playwright-core';

const [url, out, w = '1440', h = '900'] = process.argv.slice(2);
if (!url || !out) {
  console.error('usage: node tools/qc/shot.mjs <url> <out.png> [width] [height]');
  process.exit(2);
}
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: Number(w), height: Number(h) }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
// Global edition: the Welcome pop-up would cover the page; pretend this tab already chose "Global" (QC_POPUP=1 keeps it).
if (!process.env.QC_POPUP) await page.addInitScript(() => { try { sessionStorage.setItem('ch_edition', 'global'); } catch {} });
await page.goto(url, { waitUntil: 'networkidle' });
// Trigger every lazy section / reveal, then come back to the top.
await page.evaluate(async () => {
  const step = Math.max(400, innerHeight / 2);
  for (let y = 0; y < document.documentElement.scrollHeight; y += step) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 40)); }
  scrollTo(0, 0);
  await new Promise((r) => setTimeout(r, 300));
});
await page.addStyleTag({ content: '*, *::before, *::after { transition: none !important; animation: none !important; }' });
await page.screenshot({ path: out, fullPage: true });
const size = await page.evaluate(() => ({ w: document.documentElement.scrollWidth, h: document.documentElement.scrollHeight }));
console.log(`${out} ${size.w}x${size.h}`);
await browser.close();
