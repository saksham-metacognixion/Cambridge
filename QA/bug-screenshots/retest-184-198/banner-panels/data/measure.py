"""Per banner: where the people land vs the client composite when the composite is aligned on the pill stack (as the page
draws it at 1440). Error = max displacement (live px) of the people box corners between the two mappings composite -> page:
 (a) through the cut-out (SIFT fit of the composite to our cut-out, scaled to the w x h display box, + bleed translate),
 (b) through the pill stack (composite stack top-left -> banner-art `pills`).
python3 -I .astro/qc-r184/measure.py [keys,...]"""
import glob, json, os, sys
import numpy as np
from PIL import Image
sys.path.insert(0, 'tools/banners')
from hd import fit
from pill_place import STACK
ROOT = 'docs/client-assets/website-images-oct16/'
LIVE = 500 / 1370
man = json.load(open('src/data/banner-art.json'))
only = sys.argv[1].split(',') if len(sys.argv) > 1 else None
res = {}
for file, e in json.load(open('tools/banners/composites.json')).items():
    key, region = e['key'], e['region']
    if only and key not in only: continue
    k = f'{region}:{key}'
    m = man[k]
    p = (glob.glob(f'src/assets/regions/{region}/{key}-cutout.*') if region != 'global' else []) or glob.glob(f'src/assets/{key}-cutout.*')
    cur = np.asarray(Image.open(p[0]).convert('RGBA')).astype(np.float32) / 255
    comp = np.asarray(Image.open(ROOT + file).convert('RGBA')).astype(np.float32) / 255
    try:
        fit(cur, comp, max_rot=20)
    except Exception as ex:
        print(f'{k:48s} FIT FAILED {ex}'); continue
    M = fit.last['M']
    f = m['w'] / cur.shape[1]
    px, py = (m['pills'] if m.get('pills') else ((m['w'] - 562.31) / 2, m['h'] - 18.6 - 430.15))
    bleed = 82 if m.get('bleed') == 'end' else 0
    # people box in live px: corners (0,0)-(w,h); map back to composite through (a), then forward through (b)
    Minv = np.linalg.inv(np.vstack([M, [0, 0, 1]]))
    errs = []
    for (X, Y) in [(0, 0), (m['w'], 0), (0, m['h']), (m['w'], m['h']), (m['w'] / 2, m['h'] / 2)]:
        cx, cy, _ = Minv @ np.array([X / f, Y / f, 1.0])  # composite px of this people-box point
        bx, by = (cx - STACK[0]) * LIVE + px, (cy - STACK[1]) * LIVE + py  # where the pill-aligned composite puts it
        errs.append(np.hypot(X + bleed - bx, Y - by))
    s = 1 / np.hypot(M[0, 0], M[1, 0]) * LIVE / f  # composite people size / ours
    mode = 'full' if e.get('full') else 'new' if e.get('new') else 'extract'
    res[k] = round(float(max(errs)), 1)
    print(f'{k:48s} {mode:7s} err {max(errs):6.1f} px  scale(client/ours) {s:.3f}  {"bleed " if bleed else ""}{m["w"]}x{m["h"]}')
json.dump(res, open('.astro/qc-r184/measure-' + ('sel' if only else 'all') + '.json', 'w'), indent=1)
