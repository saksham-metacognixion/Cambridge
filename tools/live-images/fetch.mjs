// Save live-site pages / REST JSON / images through a plain Chrome the USER starts by hand (missing-image audit, 9 Oct 2026):
//   open -na "Google Chrome" --args --remote-debugging-port=9333 --user-data-dir=/tmp/chrome-9333 --no-first-run about:blank
// cambridgehospital.com sits behind a Cloudflare bot check (NW1): curl / Node / automated Chrome get 403, a real Chrome
// profile passes it once and every in-page fetch() after that carries the clearance cookie. Raw DevTools protocol
// (playwright-core cannot attach to this Chrome build); the page context does the fetching (Runtime.evaluate).
//
//   node tools/live-images/fetch.mjs <job.json> [out-dir=docs/cambridge-images-live]
//   job.json = { "pages": ["/ae/care/outpatient/", ...], "json": ["/ae/wp-json/wp/v2/doctor?per_page=100", ...],
//               "images": ["https://cambridgehospital.com/wp-content/uploads/.../x.avif", ...] }
// Output: <out>/_pages/<path>.html, <out>/_json/<path>.json, images under <out>/<URL path> (the layout tools/import-wp-images.mjs
// and tools/condition-banners/run.sh read: docs/cambridge-images*/wp-content/uploads/...). Existing files are skipped.
// Report: <out>/_report.txt (appended). Nothing is retried automatically after 3 failures: the line says "fail".
import fs from 'node:fs';
import path from 'node:path';

const ORIGIN = 'https://cambridgehospital.com';
const [jobFile, OUT = 'docs/cambridge-images-live'] = process.argv.slice(2);
if (!jobFile) throw new Error('usage: node tools/live-images/fetch.mjs <job.json> [out-dir]');
const job = JSON.parse(fs.readFileSync(jobFile, 'utf8'));
const abs = (u) => (u.startsWith('http') ? u : ORIGIN + u);
const safe = (u) => new URL(abs(u)).pathname.replace(/^\/|\/$/g, '').replace(/[^\w./-]+/g, '_') || 'index';

let targets;
for (let i = 0; !targets; i++) {
  try { targets = await (await fetch('http://127.0.0.1:9333/json/list')).json(); }
  catch (e) { if (i >= 900) throw new Error('Chrome with --remote-debugging-port=9333 not found (start it by hand, see the header)'); await new Promise((r) => setTimeout(r, 1000)); }
}
// No open tab (Chrome started on about:blank with the window closed): open one through the port.
const target = targets.find((t) => t.type === 'page') ?? (await (await fetch('http://127.0.0.1:9333/json/new?about:blank', { method: 'PUT' })).json());
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
let id = 0; const pending = new Map(); const listeners = [];
ws.onmessage = (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) { const { res, rej } = pending.get(m.id); pending.delete(m.id); m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result); }
  else if (m.method) listeners.forEach((l) => l(m));
};
const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
const waitFor = (pred, ms = 60000) => new Promise((res, rej) => { const t = setTimeout(() => rej(new Error('timeout')), ms); const l = (m) => { if (pred(m)) { clearTimeout(t); listeners.splice(listeners.indexOf(l), 1); res(m); } }; listeners.push(l); });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const evaluate = async (expression) => {
  const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? JSON.stringify(r.exceptionDetails));
  return r.result.value;
};

await send('Page.enable');
// Warm up on the site root so the Cloudflare challenge (if any) is solved once in this profile.
const loaded = waitFor((m) => m.method === 'Page.loadEventFired');
await send('Page.navigate', { url: ORIGIN + '/' });
await loaded;
for (let i = 0; i < 60; i++) {
  const t = await evaluate('document.title');
  if (!/Just a moment|Attention Required/i.test(t) && t) break;
  if (i === 0) console.log('waiting for the Cloudflare check in the Chrome window...');
  await sleep(1000);
}

const report = [];
const log = (line) => { report.push(line); console.log(line); };
const save = (dest, buf) => { fs.mkdirSync(path.dirname(dest), { recursive: true }); fs.writeFileSync(dest, buf); return fs.statSync(dest).size; };

// Text documents (HTML / JSON): in-page fetch, text back.
const fetchText = (u) => evaluate(`(async () => { const r = await fetch(${JSON.stringify(abs(u))}, { redirect: 'follow' }); return { status: r.status, final: r.url, type: r.headers.get('content-type'), text: await r.text() }; })()`);
for (const [kind, list, ext] of [['pages', job.pages ?? [], 'html'], ['json', job.json ?? [], 'json']]) {
  for (const u of list) {
    const dest = path.join(OUT, `_${kind}`, `${safe(u)}.${ext}`);
    if (fs.existsSync(dest)) { log(`skip   ${u} (have)`); continue; }
    let status = 'fail';
    for (let attempt = 0; attempt < 3 && status === 'fail'; attempt++) {
      try {
        const r = await fetchText(u);
        if (r.status === 200 && !/Just a moment|cf-chl/.test(r.text.slice(0, 3000))) { status = `${save(dest, r.text)} B`; }
        else { console.log(`  ${u}: status ${r.status}, retry`); await sleep(4000 * (attempt + 1)); }
      } catch (e) { console.log(`  ${u}: ${e.message}, retry`); await sleep(3000); }
    }
    log(`${kind.padEnd(6)} ${u} -> ${status}`);
  }
}

// Images: in-page fetch, bytes back as base64 (one at a time; a few hundred KB each).
const fetchBytes = (u) => evaluate(`(async () => { const r = await fetch(${JSON.stringify(abs(u))}); const b = await r.blob(); const data = await new Promise((res) => { const fr = new FileReader(); fr.onload = () => res(fr.result.split(',')[1]); fr.readAsDataURL(b); }); return { status: r.status, type: r.headers.get('content-type'), data }; })()`);
for (const u of job.images ?? []) {
  const rel = new URL(abs(u)).pathname.slice(1);
  const dest = path.join(OUT, rel);
  if (fs.existsSync(dest)) { log(`skip   ${rel} (have)`); continue; }
  let status = 'fail';
  for (let attempt = 0; attempt < 3 && status === 'fail'; attempt++) {
    try {
      const r = await fetchBytes(u);
      if (r.status === 200 && String(r.type).startsWith('image/')) status = `${save(dest, Buffer.from(r.data, 'base64'))} B ${r.type}`;
      else { console.log(`  ${rel}: status ${r.status} ${r.type}, retry`); await sleep(4000 * (attempt + 1)); }
    } catch (e) { console.log(`  ${rel}: ${e.message}, retry`); await sleep(3000); }
  }
  log(`image  ${rel} -> ${status}`);
}

fs.mkdirSync(OUT, { recursive: true });
fs.appendFileSync(path.join(OUT, '_report.txt'), `Saved ${new Date().toISOString()} with tools/live-images/fetch.mjs (${path.basename(jobFile)})\n${report.join('\n')}\n\n`);
await send('Page.navigate', { url: 'about:blank' });
ws.close();
console.log(`done: ${report.filter((l) => / fail$/.test(l)).length} failure(s)`);
