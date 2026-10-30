// Run: npm run test:client-096-098
// Client bugs 096-098 (13 Oct 2026): Home Care slug, shorter footer quick links, one form-panel background.
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (p) => fs.readFileSync(p, 'utf8');
const json = (p) => JSON.parse(read(p));

// 096: the Home Care service is /care/homecare/; the live /care/home-healthcare/ only survives as a 301 alias.
const care = json('src/data/care.json');
const slugs = [];
const walk = (n) => { slugs.push(n.slug); (n.children ?? []).forEach(walk); };
care.services.forEach(walk);
assert.ok(slugs.includes('homecare'), 'care.json: no "homecare" service');
assert.ok(!slugs.includes('home-healthcare'), 'care.json: old "home-healthcare" slug still present');
for (const f of ['en', 'ar', 'sa.en', 'sa.ar']) {
  assert.ok(fs.existsSync(`src/data/content/care/homecare.${f}.json`), `missing content/care/homecare.${f}.json`);
  assert.ok(!fs.existsSync(`src/data/content/care/home-healthcare.${f}.json`), `stale content/care/home-healthcare.${f}.json`);
}
for (const p of ['src/data/content/layout/footer.en.json', 'src/data/content/home/services.en.json'])
  assert.ok(!read(p).includes('"care": "home-healthcare"'), `${p} links the old Home Care slug`);
assert.ok(!Object.keys(json('src/data/seo.json').pages).some((u) => u.includes('/care/home-healthcare/')), 'seo.json keyed by the old URL');
assert.match(read('src/lib/redirects.ts'), /homecare: "home-healthcare"/, 'redirects.ts: no 301 alias for the old slug');

// 097: seven quick links removed (FAQs kept), the Arabic rows still line up with the English ones.
const REMOVED = ['Media Hub', 'Career Hub', 'Knowledge Centre', 'Your Opinion Matters', 'Find a Doctor', 'Search Conditions', 'Send an Inquiry'];
const en = json('src/data/content/layout/footer.en.json').quickLinks.rows;
const ar = json('src/data/content/layout/footer.ar.json').quickLinks.rows;
const labels = en.flat().map((x) => x.label);
for (const l of REMOVED) assert.ok(!labels.includes(l), `footer still links "${l}"`);
for (const l of ['Cambridge', 'Our Care', 'Patient Hub', 'Our Hospitals', 'Contact Us', 'Book an Appointment', 'FAQs'])
  assert.ok(labels.includes(l), `footer lost "${l}"`);
assert.deepEqual(ar.map((r) => r.length), en.map((r) => r.length), 'footer.ar.json rows do not match footer.en.json');
assert.ok(en.every((r) => r.length > 0), 'empty footer row');

// 098: the shared .pf-card is white and no page form overrides its background or shadow.
assert.match(read('src/components/forms/forms.css'), /\.pf-card \{[^}]*background: #fff;/, '.pf-card is not white');
for (const p of ['international/InternationalForm', 'refer/ReferForm', 'feedback/FeedbackForm', 'calculators/CalculatorForm']) {
  const css = read(`src/components/${p}.astro`).split('<style>')[1] ?? '';
  const card = css.match(/^\s*\.card \{[^}]*\}/gm) ?? [];
  assert.ok(!card.some((r) => /background|box-shadow/.test(r)), `${p}: .card overrides the shared panel look`);
}

console.log('client 096-098: ok');
