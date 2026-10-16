"""Meet the Team (Task 198, 16 Oct 2026): src/data/leadership.json + src/assets/leadership/<slug>.avif from the live site.

Sources (saved with tools/live-images/fetch.mjs through a plain Chrome, 16 Oct 2026, under docs/cambridge-images-live/):
  _pages/about/meet-the-team.html        English list: order, card title, photo, profile link (17 cards)
  _pages/ar/about/meet-the-team.html     Arabic list: Arabic name + card title (18 cards: + Azeem Anwar, Arabic only, NOT imported)
  _pages/leadership/<slug>.html          English profile: Professional Summary (bio)
  _pages/ar/leadership/<ar slug>.html    Arabic profile: Arabic name, title, bio
  wp-content/uploads/2026/07/*.avif      the 1024 x 1024 portraits the live cards show
  docs/leadership.json                   the WordPress REST export: post id, slug, leader_country (94 = UAE, 95 = KSA, the
                                         records' own class names say leader_country-uae / leader_country-ksa)
English and Arabic records are paired by their portrait URL (the same file on both pages; the slugs differ for Dr. Mohammed
Halawani: /leadership/mohammed-halawani/ vs /ar/leadership/dr-mohammed-halawani/). Text is copied as published: no translation,
no rewording. Profile URLs keep the live slugs, including /leadership/arafat-alakhrass/ = Dr. Wael Sary and
/leadership/arafat-alakhrass-2/ = Arafat Alakhrass (WordPress slug collision, kept so old links open the right person).

    python3 -I tools/leadership/import.py
"""
import html
import json
import os
import re
import shutil

LIVE = 'docs/cambridge-images-live/'
# Live text that cannot be published as it stands (left empty, reported; client to send the right text):
WITHHOLD_AR_BIO = {
    # the live Arabic profile describes another person: "Dr. Mohammed Ibrahim", business development specialist, pharmacist
    'mohammed-alhayyan': 'the live Arabic profile carries another person\'s biography (Dr. Mohammed Ibrahim, business development)',
}
ORIGIN = 'https://cambridgehospital.com'


def cards(page):
    s = open(LIVE + '_pages/' + page).read()
    sec = s[s.find('class="leaders-cards'):s.find('class="leaders-cta')]
    out = []
    for it in re.split(r'class="gspbgrid_item', sec)[1:]:
        href = re.search(r'href="([^"]+)"', it).group(1)
        img = re.search(r'<img[^>]+src="([^"]+)"', it).group(1)
        name = html.unescape(re.sub('<[^>]+>', '', re.search(r'gspb-dynamic-title-element[^>]*>(.*?)</h2>', it, re.S).group(1))).strip()
        meta = re.search(r'<span class="gspb_meta_value">(.*?)</span>', it, re.S)
        title = html.unescape(meta.group(1)).strip() if meta else ''
        out.append({'href': href, 'img': img, 'name': name, 'title': title})
    return out


def clean_html(h):
    h = re.sub(r'\s(class|style|id)="[^"]*"', '', h)
    h = re.sub(r'<br\s*/?>', '<br>', h)
    h = re.sub(r'<p>\s*(&nbsp;|\s)*</p>', '', h)
    return re.sub(r'\n+', '', h).strip()


def profile(path):
    s = open(LIVE + '_pages/' + path + '.html').read()
    sec = s[s.find('gsbp-9e2fdc3 alignfull'):]
    sec = sec[:sec.find('</section>')]
    name = html.unescape(re.search(r'<h1[^>]*>(.*?)</h1>', sec, re.S).group(1)).strip()
    title = re.search(r'<span class="gspb_meta_value">(.*?)</span>', sec, re.S)
    bio = re.search(r'<h2>[^<]*</h2>.*?<div class="gspb_meta_value">(.*?)</div>\s*</div>', sec, re.S)
    return {'name': name, 'title': html.unescape(title.group(1)).strip() if title else '', 'bio': clean_html(bio.group(1)) if bio else ''}


def main():
    wp = {x['slug']: x for x in json.load(open('docs/leadership.json'))}
    en, ar = cards('about/meet-the-team.html'), cards('ar/about/meet-the-team.html')
    ar_by_img = {c['img']: c for c in ar}
    leaders, notes = [], []
    os.makedirs('src/assets/leadership', exist_ok=True)
    for i, c in enumerate(en):
        slug = c['href'].rstrip('/').split('/')[-1]
        w = wp[slug]
        country = {94: 'ae', 95: 'sa'}[w['leader_country'][0]]
        assert f'leader_country-{"uae" if country == "ae" else "ksa"}' in w['class_list'], slug
        a = ar_by_img[c['img']]
        ar_slug = a['href'].rstrip('/').split('/')[-1]
        pe, pa = profile(f'leadership/{slug}'), profile(f'ar/leadership/{ar_slug}')
        assert pe['name'] == c['name'], (slug, pe['name'], c['name'])
        src = LIVE + c['img'].split(ORIGIN + '/')[1]
        shutil.copyfile(src, f'src/assets/leadership/{slug}.avif')
        rec = {
            'id': w['id'], 'slug': slug, 'country': country, 'order': i + 1,
            'name': {'en': c['name'], 'ar': pa['name'] or a['name']},
            # the card title (wptexturize dashes, as the list shows it); the profile shows the same field
            'title': {'en': c['title'], 'ar': a['title'] or pa['title']},
            'bio': {'en': pe['bio'], 'ar': pa['bio']},
            'photo': f'leadership/{slug}',
            'old_urls': sorted({f'/leadership/{slug}', f'/ar/leadership/{ar_slug}'}),
        }
        if slug in WITHHOLD_AR_BIO:
            rec['bio']['ar'] = ''
            notes.append(f'{slug}: Arabic bio withheld: {WITHHOLD_AR_BIO[slug]}')
        if ar_slug != slug:
            notes.append(f'{slug}: Arabic live slug {ar_slug}')
        if not rec['title']['ar']:
            notes.append(f'{slug}: no Arabic title on the live site')
        if pa['name'] != a['name']:
            notes.append(f'{slug}: Arabic name differs, card "{a["name"]}" vs profile "{pa["name"]}" (profile used)')
        leaders.append(rec)
    extra = [c for c in ar if c['img'] not in {x['img'] for x in en}]
    for c in extra:
        notes.append(f'Arabic-only card not imported: {c["name"]} ({c["title"]}) {c["href"]}')
    out = {
        '$comment': 'Meet the Team leadership (Task 198, 16 Oct 2026). Generated by tools/leadership/import.py from the live English and Arabic Meet the Team pages and profiles (saved 16 Oct 2026, docs/cambridge-images-live/_pages) and docs/leadership.json (post id, slug, leader_country 94 = UAE / 95 = KSA). order = the live list order. Text as published on the live site (no translation). Edit here; re-running the importer overwrites this file.',
        'leaders': leaders,
    }
    json.dump(out, open('src/data/leadership.json', 'w'), ensure_ascii=False, indent=1)
    print(f'{len(leaders)} leaders: {sum(x["country"] == "ae" for x in leaders)} UAE, {sum(x["country"] == "sa" for x in leaders)} KSA')
    print('\n'.join(notes))


if __name__ == '__main__':
    main()
