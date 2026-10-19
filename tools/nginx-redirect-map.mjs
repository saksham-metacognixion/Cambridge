// nginx has no _redirects support: turn dist/_redirects ("from to 301") into a map file the server config includes
// (deploy/nginx/cambridge-staging.conf and deploy/docker/nginx.conf, map $uri $ch_redirect). Run after `npm run build`
// (deploy/deploy.sh, Dockerfile).
// A splat source ("/sa/doctor/*", bug 059 / 060) becomes a regex key; nginx checks the exact keys before the regex ones.
// $uri is percent-DECODED, so a percent-encoded source (the Arabic post slugs, bug 060) is written decoded; map keys are
// case-insensitive, so the upper / lower-case twins of _redirects collapse to one key (a duplicate would only warn).
import { readFileSync, writeFileSync } from 'node:fs';

const keys = new Map();
for (const line of readFileSync('dist/_redirects', 'utf8').split('\n')) {
  const [from, to] = line.trim().split(/\s+/);
  if (!from || !to) continue;
  let k = from.endsWith('/*') ? '~^' + from.slice(0, -1) : from;
  if (k.includes('%')) try { k = decodeURIComponent(k); } catch {}
  if (!keys.has(k.toLowerCase())) keys.set(k.toLowerCase(), `"${k}" "${to}";`);
}
writeFileSync('dist/_redirects.nginx-map', [...keys.values()].join('\n') + '\n');
console.log(`dist/_redirects.nginx-map: ${keys.size} redirects`);
