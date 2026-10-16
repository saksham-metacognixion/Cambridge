"""Bug 180 (16 Oct 2026): where each banner's outline pill stack sits behind its people, from the client's 16 Oct composites.

Every composite (`docs/client-assets/website-images-oct16/`, 2880x1370 = 2x of the 1440x685 frame) draws the same outline
pill stack at the same canvas spot (src/assets/banners/pills.svg, measured to 0.1 px: STACK below). Our cut-outs are the
same pictures at the live framing, so each composite is aligned to the current cut-out (hd.fit, as composite.py) and the
stack box is mapped into the cut-out's live-px box. The stack keeps its own size (562.31 x 430.15 live px, the composites'
500/685 scale); where our people are drawn larger or smaller than the composite's (scale != 1) its centre is kept.
Result: banner-art.json `pills: [x, y]` = the stack's top-left in the people box, live px (BannerArt.astro). Entries without
a composite use the default in lib/banner-art.ts (pillBox), fitted here from the composites (printed at the end).

    python3 -I tools/banners/pill_place.py          # writes src/data/banner-art.json
    python3 -I tools/banners/pill_place.py --dry    # prints only
"""
import glob
import json
import os
import sys

import numpy as np
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from hd import fit  # noqa: E402

ROOT = 'docs/client-assets/website-images-oct16/'
LIVE = 500 / 1370  # live px per composite px
STACK = (1172.68, 138.54, 1540.74, 1178.6)  # x, y, w, h in composite px (pills.svg viewBox origin and size)
PW, PH = STACK[2] * LIVE, STACK[3] * LIVE
SKIP = {'media-hub/banner'}  # Bug 179 (tracked separately): keeps the default placement


def place(file, key, region, man):
    p = (glob.glob(f'src/assets/regions/{region}/{key}-cutout.*') if region != 'global' else []) or glob.glob(f'src/assets/{key}-cutout.*')
    cur = np.asarray(Image.open(p[0]).convert('RGBA')).astype(np.float32) / 255
    comp = np.asarray(Image.open(ROOT + file).convert('RGBA')).astype(np.float32) / 255
    m = man[f'{region}:{key}']
    s, _, n = fit(cur, comp, max_rot=20)
    M = fit.last['M']
    f = m['w'] / cur.shape[1]  # live px per cut-out px
    x0, y0 = (M @ np.array([STACK[0], STACK[1], 1.0])) * f
    x1, y1 = (M @ np.array([STACK[0] + STACK[2], STACK[1] + STACK[3], 1.0])) * f
    scale = (x1 - x0) / PW
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    return {'x': round(cx - PW / 2, 1), 'y': round(cy - PH / 2, 1), 'scale': scale, 'n': n, 'w': m['w'], 'h': m['h'], 'cx': cx, 'bottom': y1}


if __name__ == '__main__':
    dry = '--dry' in sys.argv
    mp = 'src/data/banner-art.json'
    man = json.load(open(mp))
    rows = []
    for file, e in json.load(open('tools/banners/composites.json')).items():
        if e['key'] in SKIP:
            continue
        r = place(file, e['key'], e['region'], man)
        k = f"{e['region']}:{e['key']}"
        rows.append((k, r))
        flag = '  <- people drawn at a different size than the composite' if abs(r['scale'] - 1) > 0.06 else ''
        print(f"{k:50s} {r['w']}x{r['h']} pills [{r['x']}, {r['y']}] scale {r['scale']:.3f} ({r['n']} inliers){flag}")
        if not dry:
            man[k]['pills'] = [r['x'], r['y']]
    # default for banners without a composite: from the fits drawn at (about) the composite's own size
    good = [r for _, r in rows if abs(r['scale'] - 1) <= 0.05]
    dx = np.median([r['cx'] - r['w'] / 2 for r in good])
    gap = np.median([r['h'] - (r['y'] + PH) for r in good])
    print(f'default (from {len(good)} fits at scale 1 +- 0.05): stack centre {dx:+.1f} live px from the people box centre, bottom {gap:.1f} above the box bottom')
    if not dry:
        json.dump(dict(sorted(man.items())), open(mp, 'w'), indent=1)
