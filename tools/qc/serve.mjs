// Static server for the built site (dist/), with the hosting rules the deploy targets apply, for QC runs:
//   - Astro build.format 'file' + trailingSlash 'never': /ae -> ae.html, /sa/ar/faq -> sa/ar/faq.html (nginx: $uri, $uri.html, $uri/index.html)
//   - unknown URL -> 404 with the nearest 404.html up the path (Cloudflare Pages rule), so /ae/ar/x shows the Arabic UAE 404
//   - a trailing slash redirects to the canonical URL (301), like the nginx config
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

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  let p = decodeURIComponent(url.pathname);
  if (p.length > 1 && p.endsWith('/')) { res.writeHead(301, { Location: p.replace(/\/+$/, '') + url.search }); return res.end(); }
  const abs = path.join(root, p);
  if (!within(abs)) { res.writeHead(400); return res.end(); }
  const hit = p === '/' ? file(path.join(root, 'index.html')) : file(abs) ?? file(abs + '.html') ?? file(path.join(abs, 'index.html'));
  if (hit) return send(req, res, hit);
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
