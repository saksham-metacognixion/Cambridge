"""Banner people art as on the live site (banner brief, 14 Oct 2026). Run from the project root:

    python3 -I tools/banners/prepare.py

The live banners draw the people as one transparent cut-out at its natural size (579x450, 500x450, 565x462 ... at 1440px),
right-aligned to the content edge, over a shared gradient (cover) and the pill shape. Our hero layers (tools/hero-layers,
tools/region-photos) were 1052-wide Figma composites stretched to the full banner width (1.37x upscaled at 1440, the people
cropped by the shorter condition / care frames). This copies the live originals (docs/cambridge-images-live, saved with
.astro/qc-banner/banner-src.mjs + dl.mjs) next to the hero assets as <key>-cutout.<ext>, region files under
src/assets/regions/<ae|sa>/ only where the live edition shows a different picture, and writes src/data/banner-art.json
(display size in live px at 1440, whether the pill shape is drawn).

tools/banners/banners.json, per key:  "global" / "ae" / "sa" = a live file, or "crop" = cut the people out of our own
  <key>-subject layer (a Figma picture that differs from the live one, or a regional picture the live site does not have);
  "sa_recolour" = re-apply the KSA hijab recolour (bug 066 reopened, user decision K1) to the live KSA file.
  "hd" = {"src": client original, "green": true for a green-screen studio shot}: replace the global cut-out with a 2x copy
  from the client's Website Images folder (14 Oct 2026, docs/client-assets/website-images-oct14), aligned to the live
  framing by tools/banners/hd.py; the display size in banner-art.json stays the live one.
  `--hd-only` applies just that step (and the hospital split) to the cut-outs already in src/assets (no other banner is touched).
Shared art (identical on all three live editions): banners/bg.avif (gradient), banners/shape.avif (pills), banners/pattern.svg (Home).
"""
import json
import os
import shutil
import subprocess
import sys

from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from hd import hd_copy  # noqa: E402
from split_pills import write as split_pills  # noqa: E402

LIVE = 'docs/cambridge-images-live/wp-content/uploads/2026/06/'
cfg = json.load(open('tools/banners/banners.json'))
if '--hd-only' not in sys.argv:
    os.makedirs('src/assets/banners', exist_ok=True)
    shutil.copyfile(LIVE + 'Find-a-Doctor.avif', 'src/assets/banners/bg.avif')
    shutil.copyfile(LIVE + 'shape1.avif', 'src/assets/banners/shape.avif')
    shutil.copyfile(LIVE + 'Pattern.svg', 'src/assets/banners/pattern.svg')

manifest = {}


def apply_hd(key, e, d):
    """Hospital pages: split the live file into the building alone + <key>-pills.svg (split_pills.py), then, with an "hd"
    entry, a 2x copy of the cut-out d from the client original (global only); returns the new path."""
    owned = {v['key'] for v in json.load(open('tools/banners/composites.json')).values() if v.get('new')}
    if key in owned:  # the picture comes from a client composite (composite.py writes cut-out, pills SVG and display size)
        print(f'skip   {key:52s} (composite.py)')
        return d
    if key.startswith('hospital-detail/'):
        split_pills(key.split('/banner-')[1])
        d = f'src/assets/{key}-cutout.png'
    hd = e.get('hd')
    if not hd:
        return d
    tmp = '.astro/banner-tmp/hd.webp'
    os.makedirs(os.path.dirname(tmp), exist_ok=True)
    print(f'hd     {key:52s} <- {hd["src"]}')
    green = hd.get('green', False)
    # target = 2x the live display size (banner-art.json), so a re-run on an already-replaced copy gives the same size
    live = json.load(open('src/data/banner-art.json'))[f'global:{key}']['w']
    hd_copy(d, hd['src'], tmp, green=green, patch=green, k=2 * live / Image.open(d).width)
    out = dest(key, 'global', '.webp')
    shutil.move(tmp, out)
    return out




def dest(key, region, ext):
    d = f'src/assets/{key}-cutout{ext}' if region == 'global' else f'src/assets/regions/{region}/{key}-cutout{ext}'
    os.makedirs(os.path.dirname(d), exist_ok=True)
    for old in ('.png', '.avif', '.webp'):  # one file per key/region
        p = d[: -len(ext)] + old
        if os.path.exists(p):
            os.remove(p)
    return d


def crop(key, region):
    """The people of our own subject layer, cut to their opaque box. Layers of the 500-high frames hold the cut-out at about
    1:1 (live px); the 323-high condition / care frames were scaled to fit, so they are shown 500/323 larger (as before)."""
    src = f'src/assets/regions/{region}/{key}-subject.png' if region != 'global' else f'src/assets/{key}-subject.png'
    if not os.path.exists(src):
        src = f'src/assets/{key}-subject.png'
    im = Image.open(src).convert('RGBA')
    bb = im.getchannel('A').point(lambda v: 255 if v >= 8 else 0).getbbox()
    out = im.crop(bb)
    d = dest(key, region, '.png')
    out.save(d, optimize=True)
    k = 450 / 323 if im.height < 400 else 1
    return d, round(out.width * k), round(out.height * k), bb[3] == im.height


if '--hd-only' in sys.argv:
    import glob
    for key, e in cfg.items():
        if e.get('hd') or key.startswith('hospital-detail/'):
            cur = glob.glob(f'src/assets/{key}-cutout.*')  # an already-replaced .webp realigns to itself (same result)
            if not cur:
                sys.exit(f'{key}: no current cut-out to align to; run without --hd-only')
            apply_hd(key, e, cur[0])
    sys.exit(0)

for key, e in cfg.items():
    for region in ('global', 'ae', 'sa'):
        src = e.get(region)
        if not src:
            continue
        if src == 'crop':
            d, w, h, cut = crop(key, region)
        else:
            ext = os.path.splitext(src)[1]
            if region == 'sa' and e.get('sa_recolour'):
                # recolour-hijab.py works on <root>/src/assets/regions/<region>/<key>-subject.png: point it at a temp copy
                tmp = '.astro/banner-tmp'
                os.makedirs(tmp, exist_ok=True)
                Image.open(src).convert('RGBA').save(f'{tmp}/k-subject.png')
                rel = os.path.relpath(tmp, 'src/assets/regions')
                im = Image.open(src)
                subprocess.run([sys.executable, '-I', 'tools/region-photos/recolour-hijab.py', 'k', rel,
                                str(int(im.width * 0.69)), str(im.width - 1), '0', str(im.height - 1)], check=True)
                d = dest(key, region, '.png')
                shutil.move(f'{tmp}/k-subject.png', d)
            else:
                d = dest(key, region, ext)
                shutil.copyfile(src, d)
            im = Image.open(d)
            w, h = im.size
            cut = True
        if region == 'global':
            d = apply_hd(key, e, d)
        manifest[f'{region}:{key}'] = {'w': w, 'h': h, 'shape': not key.startswith('hospital-detail/')}
        print(f'{region:6s} {key:52s} {w}x{h}  <- {src}')

json.dump(dict(sorted(manifest.items())), open('src/data/banner-art.json', 'w'), indent=1)
print(len(manifest), 'banner art entries -> src/data/banner-art.json')
