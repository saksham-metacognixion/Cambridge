"""Hospital-page galleries from the live site (missing-image audit, 9 Oct 2026).

    python3 -I tools/live-images/wire-hospitals.py <manifest.json> <slug> [<slug> ...]

<manifest.json> = tools/live-images/parse-pages.py output (the live tabs "Outdoor Spaces" / "Indoor Spaces" / ... and their
photos). For each hospital slug (src/data/hospitals.json) whose content file has NO gallery yet (healing.areas empty), the
live photos are copied to src/assets/hospital-detail/<slug>/<file>.<ext> (original bytes, looked for in
docs/cambridge-images-live/<URL path> then docs/cambridge-images-ksa/<file>) and healing.areas is written to
src/data/content/hospital-detail/<slug>.en.json in the live tab order (key = slug of the label, alt = hospital name + the
photo's file name words). A hospital that already has a gallery (Abu Dhabi, Figma) is left alone.
Live quirk: when every tab of a page lists the same photos (Al Ain), the photos are sorted into the live tabs by their file
names (garden / backyard / exterior / facility -> outdoor, gym / gait / rehabilitation -> gyms, kozyavkin / pediatric /
activity -> amenities, the rest indoor) and the content file's _note says so.
"""
import json, os, re, shutil, sys

manifest = json.load(open(sys.argv[1]))
slugs = sys.argv[2:]
hospitals = json.load(open('src/data/hospitals.json'))['hospitals']
LIVE, KSA, OUT = 'docs/cambridge-images-live', 'docs/cambridge-images-ksa', 'src/assets/hospital-detail'
SORT = [('outdoor', r'garden|backyard|exterior|extrerior|facility'), ('gym', r'gym|gait|rehabilitation'), ('amenit', r'kozyavkin|pediatric|activity')]


def find(url):
    rel = re.sub(r'^https?://[^/]+/', '', url)
    for c in (f'{LIVE}/{rel}', f'{KSA}/{os.path.basename(rel)}'):
        if os.path.exists(c):
            return c
    return None


def words(name, hospital):
    """file name -> alt words, without the hospital's own name (Cambridge-Hospital-Jeddah-CT-Scan-2 -> CT Scan 2)"""
    w = re.sub(r'[-_]+', ' ', re.sub(r'\.\w+$', '', name)).strip()
    w = re.sub(r'^(Cambridge Hospital|CMRC Hospital|Al Mudeef Center|Extrerior Image)\s*', '', w, flags=re.I)
    w = re.sub(rf"^{re.escape(hospital)}\s*", '', w, flags=re.I).strip()
    return w.replace('Extrerior', 'Exterior').replace('Waitign', 'Waiting') or 'photo'


for slug in slugs:
    h = next(x for x in hospitals if x['slug'] == slug)
    url = next(u for u in manifest['hospitals'] if u.rstrip('/').endswith('/' + h['path']))
    page = manifest['hospitals'][url]
    f = f'src/data/content/hospital-detail/{slug}.en.json'
    doc = json.load(open(f))
    if doc.get('healing', {}).get('areas'):
        print(f'{slug}: has a gallery already, skipped')
        continue
    areas = page['areas']
    note = ''
    if len(areas) > 1 and len({tuple(a['images']) for a in areas}) == 1:
        pool = areas[0]['images']
        sorted_areas = [{'label': a['label'], 'images': []} for a in areas]
        for img in pool:
            n = os.path.basename(img).lower()
            target = next((a for key, rx in SORT for a in sorted_areas if key in a['label'].lower() and re.search(rx, n)), None)
            target = target or next((a for a in sorted_areas if 'indoor' in a['label'].lower()), sorted_areas[0])
            target['images'].append(img)
        areas = [a for a in sorted_areas if a['images']]
        note = ' The live page lists the same photos under every tab; they are sorted into the tabs here by their file names (to be confirmed by the client).'
    out = []
    missing = []
    for a in areas:
        key = re.sub(r'[^a-z0-9]+', '-', a['label'].lower()).strip('-')
        images = []
        for img in a['images']:
            src = find(img)
            if not src:
                missing.append(os.path.basename(img))
                continue
            stem = re.sub(r'[^a-z0-9]+', '-', re.sub(r'\.\w+$', '', os.path.basename(img)).lower()).strip('-')
            ext = os.path.splitext(src)[1].lower()
            os.makedirs(f'{OUT}/{slug}', exist_ok=True)
            shutil.copyfile(src, f'{OUT}/{slug}/{stem}{ext}')
            images.append({'image': f'hospital-detail/{slug}/{stem}', 'alt': f"{h['brand']['en'] if isinstance(h['brand'], dict) else h['brand']} {h['city']['en']} - {words(os.path.basename(img), h['city']['en'])}"})
        if images:
            out.append({'key': key, 'label': a['label'], 'active': 0, 'images': images})
    doc['healing']['areas'] = out
    doc['_note'] = re.sub(r'\s*the gallery section shows the shared text without photos\.?', '', doc.get('_note', '')).rstrip() + \
        f" Gallery (missing-image audit, 9 Oct 2026): the live page's own photos and tabs ({url}), saved through the user's Chrome into docs/cambridge-images-live / docs/cambridge-images-ksa, wired by tools/live-images/wire-hospitals.py.{note}"
    json.dump(doc, open(f, 'w'), indent=2, ensure_ascii=False)
    open(f, 'a').write('\n')
    print(f"{slug}: {sum(len(a['images']) for a in out)} photos in {len(out)} areas {[a['label'] for a in out]}" + (f'; MISSING {missing}' if missing else ''))
