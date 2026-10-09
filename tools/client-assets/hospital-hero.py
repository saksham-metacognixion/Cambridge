"""Hospital-page hero banner from a client-supplied cut-out (client "Website Assets" folder, 9 Oct 2026).

    python3 -I tools/client-assets/hospital-hero.py <slug> <cutout.png> [<slug> <cutout.png> ...]

Same composition as tools/live-images/hospital-heroes.py for a cut-out (a transparent PNG of the building with the outlined
pills drawn in, 579x450 like the live Al Ain / Al Mudeef banners), right- and bottom-aligned over the live hero gradient,
but at its native size (MAX_SCALE 1.0, no upscaling): the KSA buildings fill their frame edge to edge, and scaled to the
banner height (x 1.11) the Al Khobar facade ran under the hero title ("Al Khobar Hospital" ends at x 468; the art then
started at 409). At 1.0 the art starts at x 473, clear of the title column, and keeps its full resolution (docs/cambridge-images-ksa/bgHero.avif), saved as
src/assets/hospital-detail/banner-<slug>.png (1052x500, static: no cursor-follow layers). The content file's
hero.banner stays the same key; heroLayout.small (the strip kept in view below 1024px) is recomputed from the art.
"""
import json, os, re, sys
import numpy as np
from PIL import Image

W, H, STRIP = 1052, 500, 448
MAX_SCALE = 1.0
GRADIENT = 'docs/cambridge-images-ksa/bgHero.avif'
OUT = 'src/assets/hospital-detail'


def small_x(layer):
    a = np.array(layer.convert('RGBA'))[..., 3]
    cols = np.where((a > 10).sum(axis=0) > 4)[0]
    cx = (cols.min() + cols.max() + 1) / 2
    return int(round(min(max(cx - STRIP / 2, 0), W - STRIP)))


bg = Image.open(GRADIENT).convert('RGBA').resize((W, H), Image.LANCZOS)
args = sys.argv[1:]
for slug, src in zip(args[::2], args[1::2]):
    cut = Image.open(src).convert('RGBA')
    sc = min(H / cut.height, MAX_SCALE)
    cut = cut.resize((round(cut.width * sc), round(cut.height * sc)), Image.LANCZOS)
    layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    layer.paste(cut, (W - cut.width, H - cut.height))
    out = f'{OUT}/banner-{slug}.png'
    Image.alpha_composite(bg, layer).convert('RGB').save(out, optimize=True)
    f = f'src/data/content/hospital-detail/{slug}.en.json'
    d = json.load(open(f))
    d['hero']['banner'] = {'image': f'hospital-detail/banner-{slug}', 'alt': d['hero']['banner'].get('alt', '')}
    d.setdefault('heroLayout', {})['small'] = {'x': small_x(layer), 'w': STRIP}
    note = re.sub(r"\s*Banner \(missing-image audit, 9 Oct 2026\):[^.]*\.[^.]*\.[^.]*\.", '', d.get('_note', '')).rstrip()
    d['_note'] = note + f" Banner (client assets, 9 Oct 2026): the client's own hero cut-out ({os.path.basename(src)}, docs/client-assets/hospital-banners/) over the live hero gradient, tools/client-assets/hospital-hero.py; static (no cursor-follow layers)."
    with open(f, 'w') as o:
        json.dump(d, o, ensure_ascii=False, indent=2)
        o.write('\n')
    print(f'{slug}: {out} <- {os.path.basename(src)} small.x={small_x(layer)}')
