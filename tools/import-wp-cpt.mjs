// Converts the live site's custom post types (REST exports saved by the client, 6 Oct 2026: docs/doctor.json,
// docs/insurance.json, docs/testimonial.json, docs/specialty.json, docs/leadership.json) into src/data/*.json.
// Taxonomy term NAMES come from the WordPress export (docs/cambridgehospital.WordPress.2026-10-06.xml, <wp:term>);
// the REST files only carry term ids and the term slugs in class_list.
//
// Usage: node tools/import-wp-cpt.mjs     (idempotent: re-running keeps the Figma design fields)
//
//   doctors.json      one record per WordPress doctor, in the REST order, the 15 Figma doctors first (Figma list order).
//                     WordPress gives: slug, name, country (doctor_country), specialties (doctor_specialty),
//                     sub_specialities (doctor_condition term names), bio (excerpt; else the leadership bio of the same
//                     person). It does NOT give: designation (ACF/ASE field doctor_designation, not in REST), hospital,
//                     languages, Arabic, photos (featured_media id kept in wp_media for the image step).
//                     Kept from the current file per doctor: title (Figma role), photo + card_photo/home_* (Figma
//                     design), bio / sub_specialities when already filled (Figma profile of Dr. Ahmad).
//   specialties.json  the doctor_specialty terms that have at least one doctor (id = term slug).
//   conditions.json   specialties[] from condition_specialty; old_slug = the live /condition/<slug>/ URL (301 map);
//                     doctors[] = the doctor profiles linked from the live condition page (doctors.json slugs).
//   testimonials.json regions from testimonial_country (quotes stay as in Figma).
//   insurers.json     slug + regions from WordPress; insurers missing from the file are appended (no logo yet).
// A report goes to docs/wp-cpt-import.md.
import fs from 'node:fs';

const XML = 'docs/cambridgehospital.WordPress.2026-10-06.xml';
const read = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const write = (f, d) => fs.writeFileSync(f, JSON.stringify(d, null, 2) + '\n');
const decode = (s) =>
  s.replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n)).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&hellip;/g, '…').replace(/&nbsp;/g, ' ');
const text = (html) => decode(html.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
/** Gutenberg HTML -> plain <p>/<ul> HTML (block classes dropped; the build-time sanitizer does the rest). */
const html = (h) => h.replace(/<!--[\s\S]*?-->/g, '').replace(/\s(class|style|id)="[^"]*"/g, '').replace(/\n{2,}/g, '\n').trim();
const terms = (r, tax) => r.class_list.filter((c) => c.startsWith(tax + '-')).map((c) => c.slice(tax.length + 1));
const REGION = { uae: 'ae', ksa: 'sa' };
const report = [];

// --- taxonomy term names from the WXR
const xml = fs.readFileSync(XML, 'utf8');
const termName = {};
for (const m of xml.matchAll(/<wp:term>([\s\S]*?)<\/wp:term>/g)) {
  const g = (t) => (m[1].match(new RegExp(`<wp:${t}>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</wp:${t}>`)) || [])[1] ?? '';
  termName[`${g('term_taxonomy')}:${g('term_slug')}`] = decode(g('term_name'));
}
const tn = (tax, slug) => termName[`${tax}:${slug}`] ?? slug;

// --- doctors
const wpDoctors = read('docs/doctor.json');
const leaders = read('docs/leadership.json');
const docFile = read('src/data/doctors.json');
/** current (Figma sample) slug -> WordPress slug, matched by name (Figma spellings differ) */
const FIGMA_SLUG = {
  'rober-hanna-kassab': 'rober-kassab', 'elsanosi-ali-babiker': 'elsanosi-habour', 'amjad-abdelqader': 'amjad-abdel-qader',
  'sami-al-amin': 'sami-alamin', 'rao-muhammad-tariq': 'rao-tariq', 'rasha-hassan': 'rasha-mahgoub',
  'wala-mohammed': 'walaa-mohamed', 'ebtihal-rahma-ahmed': 'ebtihal-mohammed', 'samuel-tesfaye': 'samuel-tefera',
  'hasan-abu-eidah': 'hasan-abueideh',
};
const current = new Map(docFile.doctors.map((d) => [FIGMA_SLUG[d.slug] ?? d.slug, d]));
const figmaOrder = docFile.doctors.map((d) => FIGMA_SLUG[d.slug] ?? d.slug);
const ordered = [...wpDoctors].sort((a, b) => {
  const ia = figmaOrder.indexOf(a.slug), ib = figmaOrder.indexOf(b.slug);
  return (ia < 0 ? 1e3 : ia) - (ib < 0 ? 1e3 : ib) || a.menu_order - b.menu_order;
});
const leaderBio = (name) => {
  const k = (s) => s.toLowerCase().replace(/^dr\.?\s*/, '').replace(/[^a-z]/g, '');
  const l = leaders.find((x) => k(decode(x.title.rendered)) === k(name));
  return l ? html(l.content.rendered) : '';
};
const usedSpecialties = new Set();
const doctors = ordered.map((w, i) => {
  const old = current.get(w.slug);
  const name = decode(w.title.rendered);
  const countries = terms(w, 'doctor_country').map((c) => REGION[c]).filter(Boolean);
  const specs = terms(w, 'doctor_specialty');
  specs.forEach((s) => usedSpecialties.add(s));
  if (countries.length !== 1) report.push(`- doctor \`${w.slug}\` (${name}): ${countries.length ? 'several countries' : 'no country'} in WordPress -> listed on Global only`);
  if (old && old.name.en !== name) report.push(`- doctor \`${w.slug}\`: name "${old.name.en}" (Figma) -> "${name}" (WordPress)`);
  const excerpt = html(w.excerpt.rendered);
  const bio = old?.bio?.en || (text(excerpt) ? excerpt : '') || leaderBio(name);
  const subs = old?.sub_specialities?.length ? old.sub_specialities : terms(w, 'doctor_condition').map((c) => ({ en: tn('doctor_condition', c), ar: '' }));
  const rec = {
    id: `wp-${w.id}`,
    slug: w.slug,
    old_url: '',
    name: { en: name, ar: old?.name?.ar ?? '' },
    title: { en: old?.title?.en ?? '', ar: old?.title?.ar ?? '' },
    specialties: specs,
    hospital_id: '',
    country: countries.length === 1 ? countries[0] : '',
    languages: [],
    bio: { en: bio, ar: old?.bio?.ar ?? '' },
    sub_specialities: subs,
    photo: old?.photo ?? '',
    photo_alt: old?.photo_alt ?? { en: '', ar: '' },
    wp_media: w.featured_media || undefined,
  };
  for (const k of ['card_photo', 'home_photo', 'home_title', 'show_book_now']) if (old && old[k] !== undefined) rec[k] = old[k];
  return rec;
});
docFile.$comment =
  'Doctors from the live site (WordPress REST export docs/doctor.json, 6 Oct 2026) via tools/import-wp-cpt.mjs; do not edit by hand, re-run the importer. ' +
  'Schema: id (wp-<post id>), slug (WordPress slug), old_url (empty: the live site has no public doctor pages), name{en,ar}, ' +
  'title{en,ar} (designation; WordPress keeps it in the doctor_designation field, which is not in the export: filled for the 15 Figma doctors only, ' +
  'the card falls back to the specialty name), specialties[] (ids in specialties.json = doctor_specialty term slugs), hospital_id (not in WordPress, empty), ' +
  'country ae|sa ("" = no country in WordPress: Global list only), languages[], bio{en,ar} (HTML), sub_specialities[{en,ar}] (doctor_condition terms), ' +
  'photo (image key under src/assets; Figma photos for the 15 Figma doctors), photo_alt, wp_media (WordPress featured image id, for the image import). ' +
  'DESIGN-ONLY extras from Figma: card_photo, home_photo, home_title, show_book_now.';
docFile.doctors = doctors;
write('src/data/doctors.json', docFile);

// --- specialties (doctor_specialty terms in use)
const specFile = read('src/data/specialties.json');
const oldSpec = new Map(specFile.specialties.map((s) => [s.id, s]));
specFile.$comment = 'Doctor specialties = the live site\'s doctor_specialty terms that have doctors (WordPress export, 6 Oct 2026, tools/import-wp-cpt.mjs). id = term slug. No Arabic names in the export.';
specFile.specialties = [...usedSpecialties].map((id) => ({ id, name: { en: tn('doctor_specialty', id), ar: oldSpec.get(id)?.name?.ar ?? '' } }));
write('src/data/specialties.json', specFile);

// --- conditions
const wpConds = read('docs/specialty.json');
const condFile = read('src/data/conditions.json');
const CONDITION_SLUG = {
  'post-surgical-rehabilitation': 'neurorehabilitation', 'spinal-cord-injury-2': 'spinal-cord-injury', 'parkinsons-disease-2': 'parkinsons-disease',
  'multiple-sclerosis-2': 'multiple-sclerosis', 'musculoskeletal-and-orthopedic-rehabilitation': 'musculoskeletal-orthopaedic-rehabilitation',
  'hip-fracture-femoral-neck-fracture-rehabilitation': 'hip-fracture-rehabilitation', 'shoulder-injury-rotator-cuff-rehabilitation': 'shoulder-rotator-cuff-rehabilitation',
};
/** Doctors linked from a condition page's content on the live site (/<edition>/doctor/<old slug>/), mapped to doctors.json
 *  slugs: exact slug, else the one doctor whose slug words all appear in the old slug (dr-saleh-awadh-mohamed-damnan ->
 *  saleh-damnan). Live order kept; shown in "Expert Care, Trusted Doctors" on the condition page (bug 041). */
const conditionDoctors = (w) => {
  const out = [];
  for (const m of w.content.rendered.matchAll(/\/doctor\/([a-z0-9-]+)\/?"/g)) {
    const old = m[1];
    const words = new Set(old.split('-'));
    const hits = doctors.filter((d) => d.slug === old).concat(doctors.filter((d) => d.slug !== old && d.slug.split('-').every((x) => words.has(x))));
    const hit = hits[0]?.slug === old ? hits[0] : hits.length === 1 ? hits[0] : null;
    if (!hit) { report.push(`- condition \`${w.slug}\`: doctor link \`${old}\` matches ${hits.length ? hits.map((d) => d.slug).join(', ') : 'no doctor'}`); continue; }
    if (!out.includes(hit.slug)) out.push(hit.slug);
  }
  return out;
};
for (const w of wpConds) {
  const slug = CONDITION_SLUG[w.slug] ?? w.slug;
  const c = condFile.conditions.find((x) => x.slug === slug);
  if (!c) { report.push(`- condition \`${w.slug}\` (${text(w.title.rendered)}) has no card on the site`); continue; }
  c.old_slug = w.slug;
  c.specialties = terms(w, 'condition_specialty');
  c.doctors = conditionDoctors(w);
}
for (const c of condFile.conditions) if (!c.old_slug) report.push(`- condition card \`${c.slug}\` is not in WordPress`);
write('src/data/conditions.json', condFile);

// --- testimonials (regions only; the quotes are the Figma text)
const wpTest = read('docs/testimonial.json');
const testFile = read('src/data/testimonials.json');
for (const t of testFile.testimonials) {
  const w = wpTest.find((x) => x.slug === t.slug);
  if (!w) { report.push(`- testimonial \`${t.slug}\` is not in WordPress`); continue; }
  const r = terms(w, 'testimonial_country').map((c) => REGION[c]).filter(Boolean);
  if (r.join() !== t.regions.join()) report.push(`- testimonial \`${t.slug}\`: regions ${t.regions.join(',')} -> ${r.join(',')}`);
  t.regions = r;
  t.wp_media = w.featured_media || undefined;
}
for (const w of wpTest) if (!testFile.testimonials.some((t) => t.slug === w.slug)) report.push(`- testimonial \`${w.slug}\` (WordPress) is not on the site`);
write('src/data/testimonials.json', testFile);

// --- insurers
const wpIns = read('docs/insurance.json');
const insFile = read('src/data/insurers.json');
const key = (s) => s.toLowerCase().replace(/\b(insurance|company|pjsc)\b/g, '').replace(/adu/g, 'abu').replace(/[^a-z]/g, '');
for (const w of wpIns) {
  const name = decode(w.title.rendered);
  const regions = terms(w, 'insurance_country').map((c) => REGION[c]).filter(Boolean);
  let ins = insFile.insurers.find((x) => key(x.name.en) === key(name) || (x.slug && key(x.slug) === key(w.slug)));
  if (!ins) {
    ins = { name: { en: name, ar: '' }, regions };
    insFile.insurers.push(ins);
    report.push(`- insurer \`${w.slug}\` (${name}, ${regions}) added, no logo yet (featured image ${w.featured_media})`);
  } else if (ins.regions.join() !== regions.join()) {
    report.push(`- insurer ${ins.name.en}: regions ${ins.regions.join(',')} -> ${regions.join(',')}`);
    ins.regions = regions;
  }
  if (ins.name.en === 'Adu Dhabi National Insurance Company') { report.push(`- insurer name "${ins.name.en}" -> "${name}" (spelling, WordPress)`); ins.name.en = name; }
  ins.slug ??= w.slug;
  ins.wp_media = w.featured_media || undefined;
}
for (const x of insFile.insurers) if (!wpIns.some((w) => x.wp_media && w.featured_media === x.wp_media)) report.push(`- insurer ${x.name.en} (site) is not in WordPress: kept (Figma / live page)`);
write('src/data/insurers.json', insFile);

// --- report
const noTitle = doctors.filter((d) => !d.title.en).length;
const noPhoto = doctors.filter((d) => !d.photo).length;
fs.writeFileSync('docs/wp-cpt-import.md', `# WordPress custom post types import

Generated by \`tools/import-wp-cpt.mjs\` from the REST exports in \`docs/\` (doctor, insurance, testimonial, specialty, leadership; 6 Oct 2026).

- doctors: ${doctors.length} (was ${current.size} Figma sample doctors); ${noTitle} without a designation (card shows the specialty), ${noPhoto} without a photo
- specialties: ${specFile.specialties.length} (${specFile.specialties.map((s) => s.name.en).join(', ')})
- leadership: ${leaders.length} records, used as the bio of the doctors who are also leaders; no Meet the Team page in Figma (WP6)

## Not in the REST export
- doctor designation (\`doctor_designation\`) and profile link (\`doctor_profile_url\`): custom fields, not exposed in REST
- Arabic: names, designations, specialties (the files are from the English site)
- images: only featured image ids (\`wp_media\`); the files themselves are behind Cloudflare (NW1)

## Changes and notes
${report.join('\n')}
`);
console.log(report.join('\n'));
console.log(`doctors ${doctors.length}, specialties ${specFile.specialties.length}`);
