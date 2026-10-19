// Static server for the built site (dist/), with the hosting rules the deploy targets apply, for QC runs:
//   - Astro build.format 'directory' + trailingSlash 'always' (bug 057): /ae/ -> ae/index.html, /sa/ar/faqs/ -> sa/ar/faqs/index.html
//   - a page URL without its slash 301s to the slash URL (/contact-us -> /contact-us/), like the nginx config, vercel.json and
//     Cloudflare Pages; the _redirects rules are checked first, so an old URL is one hop in either form
//   - unknown URL -> 404 with the nearest 404.html up the path (Cloudflare Pages rule), so /ae/ar/x shows the Arabic UAE 404
// Usage: node tools/qc/serve.mjs [port=4400] [dir=dist]
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const port = Number(process.argv[2] ?? 4400);
const root = path.resolve(process.argv[3] ?? 'dist');
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff' };

const file = (p) => { try { return fs.statSync(p).isFile() ? p : null; } catch { return null; } };
const within = (p) => path.resolve(p).startsWith(root);
// gzip for text types, like nginx (gzip on) and Cloudflare do; cache headers like the nginx config, so Lighthouse measures the real thing
const TEXT = new Set(['.html', '.css', '.js', '.mjs', '.json', '.xml', '.txt', '.svg']);
function send(req, res, hit, status = 200) {
  const ext = path.extname(hit);
  const headers = { 'Content-Type': TYPES[ext] ?? 'application/octet-stream' };
  if (hit.includes('/_astro/') || hit.includes('/fonts/')) headers['Cache-Control'] = 'public, max-age=31536000, immutable';
  const gz = TEXT.has(ext) && /\bgzip\b/.test(req.headers['accept-encoding'] ?? '');
  if (gz) { headers['Content-Encoding'] = 'gzip'; headers['Vary'] = 'Accept-Encoding'; }
  res.writeHead(status, headers);
  const s = fs.createReadStream(hit);
  (gz ? s.pipe(zlib.createGzip()) : s).pipe(res);
}

// dist/_redirects (Cloudflare Pages format, src/pages/_redirects.ts): exact-path 301s, checked before anything else
const redirects = new Map();
// splat rules ("/sa/doctor/* /sa/patient-hub/find-a-doctor/ 301"): after the exact ones, first match wins
const splats = [];
try {
  for (const line of fs.readFileSync(path.join(root, '_redirects'), 'utf8').split('\n')) {
    const [from, to, code] = line.trim().split(/\s+/);
    if (from?.endsWith('/*') && to) splats.push({ prefix: from.slice(0, -1), to, code: Number(code) || 301 });
    else if (from && to) redirects.set(from, { to, code: Number(code) || 301 });
  }
} catch {}

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  const r = redirects.get(url.pathname) ?? splats.find((s) => url.pathname.startsWith(s.prefix));
  if (r) { res.writeHead(r.code, { Location: r.to }); return res.end(); }
  if (url.pathname.startsWith('/_redirects')) { res.writeHead(404); return res.end(); }
  let p = decodeURIComponent(url.pathname);
  const abs = path.join(root, p);
  if (!within(abs)) { res.writeHead(400); return res.end(); }
  const hit = p.endsWith('/') ? file(path.join(abs, 'index.html')) : file(abs);
  if (hit) return send(req, res, hit);
  if (!p.endsWith('/') && file(path.join(abs, 'index.html'))) { res.writeHead(301, { Location: url.pathname + '/' + url.search }); return res.end(); }
  // nearest 404.html up the path
  let dir = path.dirname(abs);
  while (within(dir)) {
    const nf = file(path.join(dir, '404.html'));
    if (nf) return send(req, res, nf, 404);
    if (dir === root) break;
    dir = path.dirname(dir);
  }
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('404');
}).listen(port, () => console.log(`qc server: http://localhost:${port} -> ${root}`));
