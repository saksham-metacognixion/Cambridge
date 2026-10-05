// Static server for the built site (dist/), with the hosting rules the deploy targets apply, for QC runs:
//   - Astro build.format 'file' + trailingSlash 'never': /ae -> ae.html, /sa/ar/faq -> sa/ar/faq.html (nginx: $uri, $uri.html, $uri/index.html)
//   - unknown URL -> 404 with the nearest 404.html up the path (Cloudflare Pages rule), so /ae/ar/x shows the Arabic UAE 404
//   - a trailing slash redirects to the canonical URL (301), like the nginx config
// Usage: node tools/qc/serve.mjs [port=4400] [dir=dist]
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const port = Number(process.argv[2] ?? 4400);
const root = path.resolve(process.argv[3] ?? 'dist');
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff' };

const file = (p) => { try { return fs.statSync(p).isFile() ? p : null; } catch { return null; } };
const within = (p) => path.resolve(p).startsWith(root);

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  let p = decodeURIComponent(url.pathname);
  if (p.length > 1 && p.endsWith('/')) { res.writeHead(301, { Location: p.replace(/\/+$/, '') + url.search }); return res.end(); }
  const abs = path.join(root, p);
  if (!within(abs)) { res.writeHead(400); return res.end(); }
  const hit = p === '/' ? file(path.join(root, 'index.html')) : file(abs) ?? file(abs + '.html') ?? file(path.join(abs, 'index.html'));
  if (hit) {
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(hit)] ?? 'application/octet-stream' });
    return fs.createReadStream(hit).pipe(res);
  }
  // nearest 404.html up the path
  let dir = path.dirname(abs);
  while (within(dir)) {
    const nf = file(path.join(dir, '404.html'));
    if (nf) { res.writeHead(404, { 'Content-Type': TYPES['.html'] }); return fs.createReadStream(nf).pipe(res); }
    if (dir === root) break;
    dir = path.dirname(dir);
  }
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('404');
}).listen(port, () => console.log(`qc server: http://localhost:${port} -> ${root}`));
