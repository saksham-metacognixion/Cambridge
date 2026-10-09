"""Small-screen crop of a condition banner (bug 042): the strip of the 1052x323 banner kept in view below 1024px, centred on the
people (PageHero `small` prop: x = strip start, w = strip width, banner px). w = 448 keeps today's hero height (72vw wide box).

    python3 -I tools/condition-banners/small-crop.py <slug> [subject.png]   -> writes heroLayout.small into
    src/data/content/conditions/<slug>.en.json (when that file exists) and prints the values.
"""
import json, os, sys
import numpy as np
from PIL import Image

slug = sys.argv[1]
subject = sys.argv[2] if len(sys.argv) > 2 else f'src/assets/conditions/{slug}-subject.png'
W, STRIP = 1052, 448
a = np.array(Image.open(subject).convert('RGBA'))[..., 3]
cols = np.where((a > 10).sum(axis=0) > 4)[0]  # columns holding people (ignore stray edge pixels)
x0, x1 = int(cols.min()), int(cols.max()) + 1
cx = (x0 + x1) / 2
x = int(round(min(max(cx - STRIP / 2, 0), W - STRIP)))
f = f'src/data/content/conditions/{slug}.en.json'
if os.path.exists(f):
    d = json.load(open(f))
    d.setdefault('heroLayout', {})['small'] = {'x': x, 'w': STRIP}
    with open(f, 'w') as out:
        json.dump(d, out, ensure_ascii=False, indent=2); out.write('\n')
print(f'{slug}: people x {x0}-{x1} -> small x={x} w={STRIP}')
