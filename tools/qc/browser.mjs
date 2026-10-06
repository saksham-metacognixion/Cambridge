// Browser QC (scope 4) with the installed Chrome via playwright-core, against the QC server (tools/qc/serve.mjs on :4400):
//  1. responsive: one page per template, 11 widths: no horizontal scroll; at >= 1440 the 1440-wide stages are centred
//  2. Find a Doctor filters: country persists across other filters, /ae and /sa default, URL round trip, back button, empty state
//  3. forms: required errors in EN and AR, consent required, Turnstile slot present, mocked submit shows the success message,
//     nothing stored in the browser (no new cookies / storage keys)
//  4. keyboard: Tab reaches the menu links, Enter opens the Book pop-up, focus is trapped, Escape closes and restores focus;
//     tabs move with arrow keys; a form can be completed with the keyboard
// Usage: node tools/qc/browser.mjs [base=http://localhost:4400] [out=docs/qc/browser.json]
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright-core';

const base = process.argv[2] ?? 'http://localhost:4400';
const out = process.argv[3] ?? 'docs/qc/browser.json';
const WIDTHS = [360, 390, 414, 768, 1024, 1200, 1280, 1366, 1440, 1536, 1920];
const TEMPLATES = ['/', '/about', '/about/why-cambridge-hospital', '/about/accreditations-partnerships', '/about/careers', '/care', '/care/inpatient', '/care/inpatient/post-acute-rehabilitation', '/care/inpatient/post-acute-rehabilitation/neurorehabilitation', '/care/inpatient/post-acute-rehabilitation/neurorehabilitation/stroke-rehabilitation', '/care/outpatient', '/care/home-healthcare', '/sa/care/home-healthcare', '/care/in-school', '/patient-hub/conditions-specialities', '/patient-hub/conditions-specialities/stroke-rehabilitation', '/ar/patient-hub/conditions-specialities/stroke-rehabilitation', '/patient-hub', '/patient-hub/find-a-doctor', '/patient-hub/find-a-doctor/ahmad-al-khayer', '/hospitals', '/hospitals/cambridge-hospital-abu-dhabi', '/hospitals/cambridge-hospital-al-ain', '/media-hub', '/media-hub/first-patients-new-saudi-facility', '/contact-us', '/your-opinion-matters', '/patient-hub/refer-a-patient', '/patient-hub/international-patients', '/patient-hub/insurance-providers', '/patient-hub/testimonials', '/bmi-calculator', '/ar/stroke-risk-calculator', '/faqs', '/legal/privacy-policy', '/404'];

const results = { responsive: [], doctors: [], forms: [], keyboard: [] };
const ok = (list, name, pass, note = '') => { list.push({ name, pass, note }); console.log(`${pass ? 'PASS' : 'FAIL'} ${name}${note ? ' - ' + note : ''}`); };

const browser = await chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext({ reducedMotion: 'reduce' });
await ctx.addInitScript(() => { try { sessionStorage.setItem('ch_edition', 'global'); } catch {} });

// 1. responsive -----------------------------------------------------------------------------------------------------
for (const url of TEMPLATES) {
  const page = await ctx.newPage();
  const bad = [];
  for (const w of WIDTHS) {
    await page.setViewportSize({ width: w, height: 900 });
    if (w === WIDTHS[0]) await page.goto(base + url, { waitUntil: 'load' });
    await page.waitForTimeout(80);
    const r = await page.evaluate(() => {
      const de = document.documentElement;
      const hs = de.scrollWidth > de.clientWidth + 1 || document.body.scrollWidth > de.clientWidth + 1;
      // centring: every 1440-max box (.stage and the section wrappers with max-width: 1440px) must have equal side margins (± 1px) at >= 1440
      let off = 0;
      if (innerWidth >= 1440) {
        for (const el of document.querySelectorAll('.stage, header, main > div > section, main > section, main > article, main > div > div')) {
          const cs = getComputedStyle(el);
          if (cs.maxWidth !== '1440px') continue;
          const r = el.getBoundingClientRect();
          if (r.width < 1200 || r.width > 1441) continue;
          const l = r.left, rr = de.clientWidth - r.right;
          if (Math.abs(l - rr) > 1.5) off++;
        }
      }
      return { hs, off, sw: de.scrollWidth, cw: de.clientWidth };
    });
    if (r.hs) bad.push(`${w}: horizontal scroll (${r.sw}>${r.cw})`);
    if (r.off) bad.push(`${w}: ${r.off} box(es) off-centre`);
  }
  ok(results.responsive, `responsive ${url}`, bad.length === 0, bad.join('; '));
  await page.close();
}

// 2. Find a Doctor filters --------------------------------------------------------------------------------------------
{
  const page = await ctx.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(base + '/find-a-doctor', { waitUntil: 'load' });
  const shown = () => page.evaluate(() => [...document.querySelectorAll('[data-doctor-list] > li')].filter((li) => !li.hidden).length);
  const pressed = () => page.evaluate(() => document.querySelector('[data-doctor-filters] [data-country][aria-pressed="true"]')?.dataset.country);
  const all = await shown();
  await page.click('[data-doctor-filters] [data-country="sa"]');
  const sa = await shown();
  ok(results.doctors, 'country filter narrows the list', sa < all && sa > 0, `${sa} of ${all}`);
  ok(results.doctors, 'country in the URL', page.url().includes('country=sa'), page.url());
  // change another filter: the country must stay
  const options = await page.$$eval('[data-doctor-filters] select[name="specialty"] option', (o) => o.map((x) => x.value).filter(Boolean));
  await page.selectOption('[data-doctor-filters] select[name="specialty"]', options[0]);
  ok(results.doctors, 'country stays selected when the speciality changes', (await pressed()) === 'sa' && page.url().includes('country=sa'), `pressed=${await pressed()} url=${page.url()}`);
  await page.fill('[data-doctor-filters] input[name="q"]', 'zzzzqqqq');
  await page.waitForTimeout(400);
  ok(results.doctors, 'country stays selected when the name query changes', (await pressed()) === 'sa', `pressed=${await pressed()}`);
  ok(results.doctors, 'empty state shown when nothing matches', await page.evaluate(() => !document.querySelector('[data-doctor-empty]').hidden) && (await shown()) === 0);
  // round trip: reload the URL
  const u = page.url();
  await page.goto(u, { waitUntil: 'load' });
  ok(results.doctors, 'URL round trip restores country + speciality + query', (await pressed()) === 'sa' && (await page.inputValue('[data-doctor-filters] select[name="specialty"]')) === options[0] && (await page.inputValue('[data-doctor-filters] input[name="q"]')) === 'zzzzqqqq');
  // back button
  await page.goto(base + '/find-a-doctor', { waitUntil: 'load' });
  await page.click('[data-doctor-filters] [data-country="ae"]');
  await page.selectOption('[data-doctor-filters] select[name="specialty"]', options[0]);
  await page.goBack();
  await page.waitForTimeout(200);
  ok(results.doctors, 'back button restores the previous filter state', (await pressed()) === 'ae' && (await page.inputValue('[data-doctor-filters] select[name="specialty"]')) === '', `pressed=${await pressed()}`);
  // regional defaults
  for (const [p, c] of [['/ae/find-a-doctor', 'ae'], ['/sa/find-a-doctor', 'sa']]) {
    await page.goto(base + p, { waitUntil: 'load' });
    const only = await page.evaluate((c) => [...document.querySelectorAll('[data-doctor-list] > li')].filter((li) => !li.hidden).every((li) => li.dataset.country === c), c);
    ok(results.doctors, `${p} lists only ${c.toUpperCase()} doctors by default`, only);
  }
  await page.close();
}

// 3. forms ------------------------------------------------------------------------------------------------------------
const FORMS = [
  { url: '/contact-us', form: 'form[data-form="send-enquiry"]', open: null, name: 'Contact page (Send an Enquiry)' },
  { url: '/', form: 'form[data-form="home-contact"]', open: null, name: 'Home "Get in touch" form' },
  { url: '/', form: '#book-appointment form[data-form]', open: 'a[href="#book-appointment"]', name: 'Book an Appointment pop-up' },
  { url: '/', form: '#send-enquiry-popup form[data-form]', open: 'a[href="#send-inquiry"]', name: 'Send an Inquiry pop-up' },
  { url: '/', form: '#feedback-popup form[data-form]', open: 'a[href="#your-opinion"]', name: 'Your Opinion Matters pop-up' },
  { url: '/your-opinion-matters', form: 'form[data-form="feedback"]', open: null, name: 'Patient Feedback page' },
  { url: '/patient-hub/refer-a-patient', form: 'form[data-form="refer-patient"]', open: null, name: 'Refer a Patient (For Healthcare Professionals)' },
  { url: '/patient-hub/international-patients', form: 'form[data-form="international-enquiry"]', open: null, name: 'International Patients' },
];
async function formChecks(locale) {
  for (const f of FORMS) {
    const url = (locale === 'ar' ? '/ar' : '') + (f.url === '/' ? '' : f.url) || '/';
    const page = await ctx.newPage({ viewport: { width: 1440, height: 900 } });
    let posted = null;
    await page.route('**/api/forms/**', (route) => { posted = route.request().postData() ?? ''; route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) }); });
    await page.goto(base + url, { waitUntil: 'load' });
    const before = await page.evaluate(() => ({ ls: Object.keys(localStorage).sort().join(), ss: Object.keys(sessionStorage).sort().join(), ck: document.cookie }));
    if (f.open) { await page.click(f.open); await page.waitForSelector(f.form, { state: 'visible' }); }
    const form = page.locator(f.form).first();
    const expected = await form.evaluate((el) => JSON.parse(el.dataset.config).fields.filter((x) => x.required).map((x) => x.name));
    ok(results.forms, `${f.name} [${locale}]: Turnstile slot present`, (await form.locator('.ts-slot').count()) === 1);
    // submit empty -> required errors + consent error
    await form.locator('button[type="submit"]').click();
    await page.waitForTimeout(300);
    const errs = await form.evaluate((el) => [...el.querySelectorAll('.f-err')].filter((e) => !e.hidden && e.textContent.trim()).map((e) => e.closest('[data-field]')?.dataset.field));
    const missing = [...expected, 'consent'].filter((n) => !errs.includes(n));
    ok(results.forms, `${f.name} [${locale}]: required errors shown (incl. consent)`, missing.length === 0, missing.length ? 'missing: ' + missing.join(',') : `${errs.length} errors`);
    const sample = await form.evaluate((el) => [...el.querySelectorAll('.f-err')].find((e) => !e.hidden)?.textContent.trim() ?? '');
    ok(results.forms, `${f.name} [${locale}]: error text is ${locale === 'ar' ? 'Arabic (or English fallback, B4)' : 'English'}`, sample.length > 0, sample);
    // fill everything required, tick consent, submit (mocked) -> success
    await form.evaluate((el) => {
      const cfg = JSON.parse(el.dataset.config);
      for (const fld of cfg.fields) {
        const input = el.querySelector(`[name="${fld.name}"]`);
        if (!input) continue;
        const set = (v) => { input.value = v; input.dispatchEvent(new Event('input', { bubbles: true })); input.dispatchEvent(new Event('change', { bubbles: true })); };
        if (fld.type === 'radio' || fld.type === 'rating') { const r = el.querySelector(`[name="${fld.name}"]`); r.checked = true; r.dispatchEvent(new Event('change', { bubbles: true })); }
        else if (fld.type === 'select') { const s = el.querySelector(`select[name="${fld.name}"]`); if (s) { const o = [...s.options].find((o) => o.value); if (o) set(o.value); } }
        else if (fld.type === 'email') set('qa@example.com');
        else if (fld.type === 'tel') set('501234567');
        else if (fld.type === 'date') set('1990-01-01');
        else set('QA test'.slice(0, fld.max ?? 200)); // respects short limits (International 'age' max 3)
      }
      const consent = el.querySelector('input[name="consent"]'); consent.checked = true; consent.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await form.locator('button[type="submit"]').click();
    const success = page.locator(`[data-success-for="${await form.getAttribute('data-form')}"]`).first();
    let shown = false;
    try { await success.waitFor({ state: 'visible', timeout: 15000 }); shown = true; } catch {}
    ok(results.forms, `${f.name} [${locale}]: mocked submit shows the success message`, shown && posted !== null, posted === null ? 'nothing posted' : `posted ${posted.length} bytes`);
    ok(results.forms, `${f.name} [${locale}]: consent posted with the form`, posted !== null && /name="consent"|consent=/.test(posted));
    const after = await page.evaluate(() => ({ ls: Object.keys(localStorage).sort().join(), ss: Object.keys(sessionStorage).sort().join(), ck: document.cookie }));
    ok(results.forms, `${f.name} [${locale}]: nothing stored in the browser`, JSON.stringify(before) === JSON.stringify(after), JSON.stringify(after));
    await page.close();
  }
}
await formChecks('en');
await formChecks('ar');

// 4. keyboard ------------------------------------------------------------------------------------------------------------
{
  const page = await ctx.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(base + '/', { waitUntil: 'load' });
  // Tab through the header: the first focusable things are the logo and the menu links
  const order = [];
  for (let i = 0; i < 14; i++) { await page.keyboard.press('Tab'); order.push(await page.evaluate(() => { const a = document.activeElement; return a?.closest('header') ? (a.getAttribute('aria-label') || a.textContent.trim() || a.tagName).slice(0, 24) : 'OUT:' + a?.tagName; })); }
  ok(results.keyboard, 'Tab moves through the header menu in order', order.filter((x) => !x.startsWith('OUT')).length >= 12, order.join(' > '));
  // Enter on BOOK AN APPOINTMENT opens the dialog, focus moves inside, Tab stays inside, Escape closes and restores focus
  await page.focus('header a[href="#book-appointment"]');
  await page.keyboard.press('Enter');
  await page.waitForSelector('#book-appointment[open]');
  const inside1 = await page.evaluate(() => !!document.activeElement.closest('#book-appointment'));
  for (let i = 0; i < 25; i++) await page.keyboard.press('Tab');
  const inside2 = await page.evaluate(() => !!document.activeElement.closest('#book-appointment'));
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  const closed = await page.evaluate(() => !document.querySelector('#book-appointment').open);
  const restored = await page.evaluate(() => document.activeElement?.getAttribute('href') === '#book-appointment');
  ok(results.keyboard, 'Book pop-up: Enter opens, focus inside, Tab trapped, Escape closes and restores focus', inside1 && inside2 && closed && restored, `inside=${inside1}/${inside2} closed=${closed} restored=${restored}`);
  // tabs: arrow keys on the condition detail topics
  await page.goto(base + '/care/inpatient/post-acute-rehabilitation/neurorehabilitation', { waitUntil: 'load' });
  await page.focus('[data-tabs] [role="tab"][aria-selected="true"]');
  await page.keyboard.press('ArrowDown');
  const t2 = await page.evaluate(() => ({ sel: [...document.querySelectorAll('[data-tabs] [role="tab"]')].findIndex((t) => t.getAttribute('aria-selected') === 'true'), foc: [...document.querySelectorAll('[data-tabs] [role="tab"]')].indexOf(document.activeElement) }));
  await page.keyboard.press('End');
  const t3 = await page.evaluate(() => ({ sel: [...document.querySelectorAll('[data-tabs] [role="tab"]')].findIndex((t) => t.getAttribute('aria-selected') === 'true'), n: document.querySelectorAll('[data-tabs] [role="tab"]').length, panelVisible: !document.querySelector('[data-tabs] [role="tabpanel"]:not([hidden])')?.hidden }));
  ok(results.keyboard, 'Tabs: ArrowDown / End move selection and focus, panel follows', t2.sel === t2.foc && t2.sel === 1 && t3.sel === t3.n - 1 && t3.panelVisible, JSON.stringify({ t2, t3 }));
  // keyboard through the contact form: every field reachable, checkbox toggles with Space
  await page.goto(base + '/contact-us', { waitUntil: 'load' });
  await page.focus('form[data-form="send-enquiry"] [name="name"]');
  const reached = new Set();
  for (let i = 0; i < 12; i++) { reached.add(await page.evaluate(() => document.activeElement.getAttribute('name') || document.activeElement.tagName)); await page.keyboard.press('Tab'); }
  await page.focus('form[data-form="send-enquiry"] input[name="consent"]');
  await page.keyboard.press('Space');
  const checked = await page.evaluate(() => document.querySelector('form[data-form="send-enquiry"] input[name="consent"]').checked);
  ok(results.keyboard, 'Contact form: fields reachable by Tab, consent toggles with Space', ['name', 'email', 'hospital', 'subject', 'message', 'consent'].every((n) => reached.has(n)) && checked, [...reached].join(','));
  // hamburger menu at 390: toggle focusable, links reachable
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto(base + '/', { waitUntil: 'load' });
  await page.focus('#nav-toggle');
  await page.keyboard.press('Space');
  const menuOpen = await page.evaluate(() => getComputedStyle(document.querySelector('header nav.menu')).display !== 'none');
  // after the toggle come the logo link and the burger label, then the menu links
  let firstLink = 'OUT';
  for (let i = 0; i < 4 && firstLink === 'OUT'; i++) { await page.keyboard.press('Tab'); firstLink = await page.evaluate(() => document.activeElement.closest('nav.menu') ? document.activeElement.textContent.trim() : 'OUT'); }
  ok(results.keyboard, 'Mobile menu: Space on the toggle opens it, Tab reaches its links', menuOpen && firstLink !== 'OUT', `open=${menuOpen} first=${firstLink}`);
  await page.close();
}

await browser.close();
const flat = Object.entries(results).flatMap(([g, l]) => l.map((x) => ({ group: g, ...x })));
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify({ pass: flat.filter((x) => x.pass).length, fail: flat.filter((x) => !x.pass).length, checks: flat }, null, 1));
console.log(`\n${flat.filter((x) => x.pass).length} pass, ${flat.filter((x) => !x.pass).length} fail`);
