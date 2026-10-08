"""Region hero background layer (bug 063, 8 Oct 2026): the Global <key>-bg with its right-edge fill redone.

    python3 tools/region-photos/fix-bg-edge.py <key> <region>     # -> src/assets/regions/<region>/<key>-bg.png (or nothing)

tools/hero-layers/split.py fills the hole behind the Global people row by row from the pixels left and right of them. Where
the people reach (or nearly reach, NEAR px) the banner's right edge there is no clean right side: the fill picks up the
people's own edge pixels (a skin / dress coloured smear, and on the post-acute banner a fingertip the mask missed). The
Global people hide that; a region's people (compose-subject.py) can leave part of it uncovered. Here every such right-edge
run is refilled by extending the row's background from just left of the hole (the gradient and the horizontal pill lines
carry on to the edge). Written only when the region's people leave some of it in view; heroLayers() (src/lib/images.ts)
then takes this background for that region, the Global one stays as it is.
"""
import sys
import numpy as np
import cv2
from PIL import Image

key, region = sys.argv[1], sys.argv[2]
NEAR, DIL, K = 12, 7, 3
bg = np.array(Image.open(f'src/assets/{key}-bg.png').convert('RGBA')).astype(np.float32)
g = np.array(Image.open(f'src/assets/{key}-subject.png').split()[-1])
sub = np.array(Image.open(f'src/assets/regions/{region}/{key}-subject.png').split()[-1])
hole = cv2.dilate((g > 4).astype(np.uint8), np.ones((DIL, DIL), np.uint8)) > 0
H, W = hole.shape
run = np.zeros_like(hole)
for y in range(H):
    xs = np.nonzero(hole[y])[0]
    if not len(xs) or xs.max() < W - 1 - NEAR:
        continue
    x = xs.max()
    while x > 0 and hole[y, x - 1]:
        x -= 1
    if x <= K:
        continue
    run[y, x:] = True
    bg[y, x:] = bg[y, x - K:x].mean(axis=0)
exposed = int((run & (sub < 200)).sum())
if exposed:
    out = f'src/assets/regions/{region}/{key}-bg.png'
    Image.fromarray(bg.clip(0, 255).astype(np.uint8)).save(out, optimize=True)
    print(key, 'right-edge runs', int(run.sum()), 'px, in view under the regional people', exposed, '->', out)
else:
    print(key, 'nothing in view, Global background kept')
