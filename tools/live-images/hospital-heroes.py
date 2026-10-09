"""Hospital-page hero banners from the live site (missing-image audit, 9 Oct 2026).

    python3 -I tools/live-images/hospital-heroes.py <manifest.json> <slug> [<slug> ...]

Before: all six hospital pages showed the Figma Abu Dhabi banner (family in front of the Abu Dhabi building) as a placeholder
(docs/open-decisions.md HD1). The live site gives each page its own hero image: Abu Dhabi = the same artwork as Figma (kept);
Al Mudeef / Al Ain = a transparent cut-out of the building with the outlined pills drawn in; the KSA hospitals = the
hospital's photo. Here each becomes src/assets/hospital-detail/banner-<slug>.png (1052x500, static: no cursor-follow layers,
a building does not drift) over the live site's own plain hero gradient (bgHero.avif, no pills):
  - a cut-out is fitted to the banner height and right-aligned (its own column on the right, as the live page shows it)
  - an opaque photo is fitted to the banner height, right-aligned and feathered into the gradient on its left
The content file gets hero.banner = hospital-detail/banner-<slug> and heroLayout.small (strip kept in view below 1024px).
"""
import json, os, re, sys
import numpy as np
from PIL import Image

manifest = json.load(open(sys.argv[1]))
slugs = sys.argv[2:]
hospitals = json.load(open('src/data/hospitals.json'))['hospitals']
LIVE, KSA, OUT = 'docs/cambridge-images-live', 'docs/cambridge-images-ksa', 'src/assets/hospital-detail'
W, H, STRIP = 1052, 500, 448
GRADIENT = f'{KSA}/bgHero.avif'  # the live hero gradient (1480x500), same on every live edition
FOOTPRINT = f'{OUT}/banner-abu-dhabi-subject.png'
PY = sys.executable


def find(url):
    rel = re.sub(r'^https?://[^/]+/', '', url)
    for c in (f'{LIVE}/{rel}', f'{KSA}/{os.path.basename(rel)}'):
        if os.path.exists(c):
            return c
    return None


def is_cutout(path):
    im = Image.open(path)
    return 'A' in im.mode and (np.array(im.convert('RGBA'))[..., 3] < 10).mean() > 0.05


def fade_photo(bg, src):
    """opaque photo (the KSA list photos, 900x975): fitted to the banner height, right-aligned, its left edge feathered into
    the gradient (smoothstep over the photo's left 35 %) - a cover crop would show only a corner of the building"""
    photo = Image.open(src).convert('RGBA')
    sc = H / photo.height
    p = photo.resize((round(photo.width * sc), H), Image.LANCZOS)
    x = np.linspace(0, 1, p.width)
    t = np.clip(x / 0.35, 0, 1)
    p.putalpha(Image.fromarray((t * t * (3 - 2 * t) * 255).astype(np.uint8)[None, :].repeat(H, 0)))
    layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    layer.paste(p, (W - p.width, 0))
    return Image.alpha_composite(bg, layer), layer


def small_x(layer):
    a = np.array(layer.convert('RGBA'))[..., 3]
    cols = np.where((a > 10).sum(axis=0) > 4)[0]
    cx = (cols.min() + cols.max() + 1) / 2
    return int(round(min(max(cx - STRIP / 2, 0), W - STRIP)))


bg = Image.open(GRADIENT).convert('RGBA').resize((W, H), Image.LANCZOS)
for slug in slugs:
    h = next(x for x in hospitals if x['slug'] == slug)
    url = next(u for u in manifest['hospitals'] if u.rstrip('/').endswith('/' + h['path']))
    src = find(manifest['hospitals'][url]['hero'])
    if not src:
        print(f'{slug}: live hero not on disk, skipped')
        continue
    out = f'{OUT}/banner-{slug}.png'
    if is_cutout(src):
        # the live page shows the cut-out in its own column on the right: fitted to the banner height, right- and bottom-aligned
        cut = Image.open(src).convert('RGBA')
        sc = min(H / cut.height, 1.6)
        cut = cut.resize((round(cut.width * sc), round(cut.height * sc)), Image.LANCZOS)
        layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
        layer.paste(cut, (W - cut.width, H - cut.height))
        Image.alpha_composite(bg, layer).save(out)
    else:
        flat, layer = fade_photo(bg, src)
        flat.save(out)
    f = f'src/data/content/hospital-detail/{slug}.en.json'
    d = json.load(open(f))
    d['hero']['banner'] = {'image': f'hospital-detail/banner-{slug}', 'alt': ''}
    d.setdefault('heroLayout', {})['small'] = {'x': small_x(layer), 'w': STRIP}
    d['_note'] = re.sub(r'\s*the Abu Dhabi banner is the placeholder \(HD1 / CT4\);?', '', d.get('_note', '')).rstrip()
    d['_note'] += f" Banner (missing-image audit, 9 Oct 2026): the live page's own hero image ({url}, {os.path.basename(src)}) over the live hero gradient, tools/live-images/hospital-heroes.py; static (no cursor-follow layers)."
    with open(f, 'w') as o:
        json.dump(d, o, ensure_ascii=False, indent=2)
        o.write('\n')
    print(f'{slug}: {out} <- {os.path.basename(src)} ({"cut-out" if is_cutout(src) else "photo"})')
