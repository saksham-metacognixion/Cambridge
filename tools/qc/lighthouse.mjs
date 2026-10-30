// Lighthouse (scope 2.10: 95+ mobile and desktop) on Home, Find a Doctor and a hospital page, against the QC server.
// Usage: node tools/qc/lighthouse.mjs [base=http://localhost:4400] [out=docs/qc/lighthouse.json]
// Needs Chrome (installed) and lighthouse (npx lighthouse@12). Reports the four category scores + the main metrics.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const base = process.argv[2] ?? 'http://localhost:4400';
const out = process.argv[3] ?? 'docs/qc/lighthouse.json';
const PAGES = ['/', '/patient-hub/find-a-doctor', '/hospitals/cambridge-hospital-abu-dhabi', '/care/inpatient/post-acute-rehab/neuro-rehab', '/ar'];
const rows = [];
for (const p of PAGES) {
  for (const form of ['mobile', 'desktop']) {
    const tmp = path.join(path.dirname(out), `lh-${p.replace(/\W+/g, '_') || 'home'}-${form}.json`);
    fs.mkdirSync(path.dirname(tmp), { recursive: true });
    const args = ['--yes', 'lighthouse@12', base + p, '--quiet', '--output=json', `--output-path=${tmp}`, '--chrome-flags=--headless=new --no-sandbox', '--only-categories=performance,accessibility,best-practices,seo'];
    if (form === 'desktop') args.push('--preset=desktop');
    execFileSync('npx', args, { stdio: 'inherit', timeout: 300000 });
    const r = JSON.parse(fs.readFileSync(tmp, 'utf8'));
    const c = r.categories, a = r.audits;
    const row = {
      page: p, form,
      performance: Math.round(c.performance.score * 100), accessibility: Math.round(c.accessibility.score * 100), bestPractices: Math.round(c['best-practices'].score * 100), seo: Math.round(c.seo.score * 100),
      lcp: a['largest-contentful-paint'].displayValue, cls: a['cumulative-layout-shift'].displayValue, tbt: a['total-blocking-time'].displayValue, fcp: a['first-contentful-paint'].displayValue, si: a['speed-index'].displayValue,
      opportunities: Object.values(a).filter((x) => x.details?.type === 'opportunity' && x.score !== null && x.score < 0.9).map((x) => `${x.title} (${x.displayValue ?? ''})`).slice(0, 6),
      a11yFails: Object.values(a).filter((x) => x.score === 0 && c.accessibility.auditRefs.some((ref) => ref.id === x.id)).map((x) => x.title).slice(0, 6),
    };
    rows.push(row);
    console.log(JSON.stringify(row));
    fs.unlinkSync(tmp);
  }
}
fs.writeFileSync(out, JSON.stringify(rows, null, 1));
