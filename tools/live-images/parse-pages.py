"""Read the live pages saved by tools/live-images/fetch.mjs and list the image each slot uses (missing-image audit, 9 Oct 2026).

    python3 -I tools/live-images/parse-pages.py [docs/cambridge-images-live] > <manifest.json>

Output (JSON): {
  "care": { "/ae/care/outpatient/": { "hero": <url>, "cards": [ { "title", "image" } ] }, ... },     # hero = the people cut-out
  "hospitals": { "/ae/hospitals/cambridge-hospital-abu-dhabi/": { "hero", "video", "areas": [ { "label", "images": [url] } ] } },
  "doctors": { "/ae/patient-hub/find-a-doctor/": [ { "name", "image", "href" } ] }
}
Live markup (Greenshift blocks): the hero people image is the first <img> after the `shape1` frame (class gsbp-682a453 on care
pages, gsbp-e701bf6 on hospital pages); service cards are `care<n>-image`; the hospital gallery is a tab block
(`tabtitlelabel` = area) holding one swiper per tab; doctor cards carry `wp-post-image`.
"""
import html, json, os, re, sys

ROOT = sys.argv[1] if len(sys.argv) > 1 else 'docs/cambridge-images-live'
PAGES = f'{ROOT}/_pages'
IMG = re.compile(r'<img[^>]+>')
SRC = re.compile(r'\ssrc="([^"]+)"')
CLS = re.compile(r'class="([^"]*)"')


def src(tag):
    m = SRC.search(tag)
    return html.unescape(m.group(1)) if m else ''


def imgs(seg):
    return [(src(t), (CLS.search(t) or [None, ''])[1], t) for t in IMG.findall(seg)]


def main_part(t):
    i = t.find('<main')
    return t[i:] if i > 0 else t


def care_page(t):
    body = main_part(t)
    hero = ''
    for s, c, _ in imgs(body):
        if 'uploads' in s and 'shape1' not in s and 'Logo' not in s:
            hero = s
            break
    cards = []
    # each card: an <img class="care<n>-image"> followed by its heading
    for m in re.finditer(r'<img[^>]*class="care\d-image"[^>]*>', body):
        after = body[m.end():m.end() + 3000]
        h = re.search(r'<h[2-4][^>]*>(.*?)</h[2-4]>', after, re.S)
        title = re.sub(r'<[^>]+>', '', h.group(1)).strip() if h else ''
        cards.append({'title': html.unescape(title), 'image': src(m.group(0))})
    return {'hero': hero, 'cards': cards}


def hospital_page(t):
    body = main_part(t)
    out = {'hero': '', 'video': '', 'areas': []}
    for s, c, _ in imgs(body):
        if 'uploads' in s and not out['hero'] and 'Logo' not in s:
            out['hero'] = s
        if 'Video-Thumbnail' in s:
            out['video'] = s
    labels = re.findall(r'<div class="tabtitlelabel">([^<]+)', body)
    panels = re.split(r'<div[^>]*role="tabpanel"[^>]*>', body)[1:]
    for label, panel in zip(labels, panels):
        panel = panel.split('class="care1-image"')[0]  # the service cards after the gallery are not part of the last tab
        pics = []
        for s, c, tag in imgs(panel):
            if 'uploads' in s and s not in pics and 'svg' not in s:
                pics.append(s)
        out['areas'].append({'label': html.unescape(label.strip()), 'images': pics})
    return out


def doctors_page(t):
    body = main_part(t)
    out = []
    for m in re.finditer(r'<img[^>]*class="[^"]*wp-post-image[^"]*"[^>]*>', body):
        seg = body[m.end():m.end() + 2500]
        name = re.search(r'<h[2-4][^>]*>(.*?)</h[2-4]>', seg, re.S)
        href = re.search(r'href="([^"]*/doctor/[^"]*)"', seg)
        out.append({'name': html.unescape(re.sub(r'<[^>]+>', '', name.group(1)).strip()) if name else '', 'image': src(m.group(0)), 'href': href.group(1) if href else ''})
    return out


result = {'care': {}, 'hospitals': {}, 'doctors': {}}
for dirpath, _, files in os.walk(PAGES):
    for f in sorted(files):
        if not f.endswith('.html'):
            continue
        rel = os.path.relpath(os.path.join(dirpath, f), PAGES)[:-5]
        url = '/' + rel + '/'
        t = open(os.path.join(dirpath, f), encoding='utf8').read()
        if '/care' in url:
            result['care'][url] = care_page(t)
        elif re.search(r'/hospitals/.+', url):
            result['hospitals'][url] = hospital_page(t)
        elif 'find-a-doctor' in url:
            result['doctors'][url] = doctors_page(t)
json.dump(result, sys.stdout, indent=1, ensure_ascii=False)
