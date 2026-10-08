// Writes vercel.json for the Vercel staging link from dist/_redirects (run after `npm run build`).
// Vercel ignores Cloudflare's _redirects file, so the 301s are copied into vercel.json. With trailingSlash: false Vercel
// strips the slash first, so only the slash-less rules are kept. Forms and the country header (functions/) are
// Cloudflare Pages Functions and do not run on Vercel.
import { readFileSync, writeFileSync } from 'node:fs';

const redirects = readFileSync('dist/_redirects', 'utf8')
  .split('\n')
  .map((line) => line.trim().split(/\s+/))
  .filter(([from, to]) => from && to && (from === '/' || !from.endsWith('/')))
  .map(([from, to, code]) => ({ source: from, destination: to, statusCode: Number(code) || 301 }));

const config = {
  $schema: 'https://openapi.vercel.sh/vercel.json',
  framework: null,
  buildCommand: 'npm run build',
  outputDirectory: 'dist',
  cleanUrls: true,
  trailingSlash: false,
  redirects,
};

writeFileSync('vercel.json', JSON.stringify(config, null, 2) + '\n');
console.log(`vercel.json: ${redirects.length} redirects`);
