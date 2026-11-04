// tools/security-headers.mjs: the inline-script hashes and the "/*" header rule the build appends to dist/_headers.
// Run: npm run test:security-headers
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import assert from 'node:assert/strict';
import { inlineScripts, sha256, inlineScriptHashes, buildHeadersRule, securityHeaders, MAX_INLINE_SCRIPTS } from '../tools/security-headers.mjs';

const results = [];
const test = async (name, fn) => { try { await fn(); results.push(`ok   ${name}`); } catch (e) { results.push(`FAIL ${name}\n     ${e.message.split('\n')[0]}`); process.exitCode = 1; } };

const page = (script, extra = '') => `<!doctype html><html><head><script>${script}</script>
<script type="application/ld+json">{"@type":"Article","x":${Math.random()}}</script>
<script is:inline type="application/json" id="ch-edition-config">{"targets":{"global":"/${Math.random()}"}}</script>
<script type="module" src="/_astro/app.js"></script>${extra}</head><body></body></html>`;

await test('inlineScripts: only executable inline scripts count (not JSON, JSON-LD or src= scripts)', () => {
  const found = inlineScripts(page('a()', '<script type="module">m()</script><script type="text/template"><p>x</p></script>'));
  assert.deepEqual(found, ['a()', 'm()']);
});

await test('sha256: base64 as CSP expects it', () => {
  assert.equal(sha256('a()'), 'qVpDBgj7bpq5hMAcGp3AOc79J3Y1Z4HvySTwKrWDoy4=');
});

await test('inlineScriptHashes + buildHeadersRule: one hash for the same script on many pages, pages with varying JSON data', async () => {
  const root = await mkdtemp(join(tmpdir(), 'sh-'));
  try {
    for (const p of ['index.html', 'ae/index.html', 'sa/ar/contact-us/index.html', 'ae/404.html']) {
      await mkdir(join(root, p, '..'), { recursive: true });
      await writeFile(join(root, p), page('var x = 1;'));
    }
    await writeFile(join(root, '_redirects'), '/a /b 301\n');
    const seen = await inlineScriptHashes(root);
    assert.equal(seen.size, 1);
    const { rule, hashes } = await buildHeadersRule(root);
    assert.deepEqual(hashes, [sha256('var x = 1;')]);
    assert.match(rule, /^\/\*\n  Strict-Transport-Security: max-age=31536000\n  Content-Security-Policy: default-src 'self'; script-src 'self' 'sha256-/);
    assert.match(rule, /\n  X-Frame-Options: SAMEORIGIN\n/);
    assert.match(rule, /\n  Referrer-Policy: strict-origin-when-cross-origin\n/);
    assert.match(rule, /\n  Permissions-Policy: camera=\(\)/);
    assert.doesNotMatch(rule, /script-src[^;]*unsafe-inline/, 'no unsafe-inline for scripts');
    assert.match(rule, /frame-src https:\/\/challenges\.cloudflare\.com https:\/\/www\.youtube-nocookie\.com https:\/\/player\.vimeo\.com/);
    // Google Analytics (Analytics.astro): the loader by domain, the hits by domain; never by 'unsafe-inline'.
    assert.match(rule, /script-src[^;]* https:\/\/www\.googletagmanager\.com/);
    assert.match(rule, /connect-src[^;]* https:\/\/\*\.google-analytics\.com https:\/\/www\.googletagmanager\.com/);
    assert.match(rule, /img-src[^;]* https:\/\/\*\.google-analytics\.com/);
  } finally { await rm(root, { recursive: true, force: true }); }
});

await test('buildHeadersRule: a script that differs per page fails the build with the pages named', async () => {
  const root = await mkdtemp(join(tmpdir(), 'sh-'));
  try {
    for (let i = 0; i <= MAX_INLINE_SCRIPTS; i++) {
      await mkdir(join(root, `p${i}`), { recursive: true });
      await writeFile(join(root, `p${i}`, 'index.html'), page(`var page = ${i};`));
    }
    await assert.rejects(buildHeadersRule(root), (e) => /different inline scripts/.test(e.message) && /p0[\\/]index\.html: var page = 0;/.test(e.message));
  } finally { await rm(root, { recursive: true, force: true }); }
});

await test('securityHeaders: every header the review asked for, HSTS without includeSubDomains', () => {
  const names = securityHeaders([]).map(([k]) => k);
  assert.deepEqual(names, ['Strict-Transport-Security', 'Content-Security-Policy', 'X-Frame-Options', 'X-Content-Type-Options', 'Referrer-Policy', 'Permissions-Policy']);
  assert.equal(securityHeaders([])[0][1], 'max-age=31536000');
});

console.log(results.join('\n'));
