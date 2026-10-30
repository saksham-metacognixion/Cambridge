"""Region hero background: carry a horizontal pill on under the region's people (bug 066, 9 Oct 2026).

    python3 tools/region-photos/extend-pill.py <key> <region> <y0> <y1> <x_src> <x_end>

split.py fills the hole behind the Global people row by row, so a pill that ran on behind a Global head ends in a pale fade
there (the Global head covers it). A region's people standing further right leave that fade in view as a light smudge
beside them. Column <x_src> (a solid part of the pill, with its anti-aliased top / bottom edge) is copied over
x_src..x_end for rows y0..y1 of src/assets/regions/<region>/<key>-bg.png (written by fix-bg-edge.py, or copied from the
Global bg when that wrote none). Pick x_end under the region's people with room for the cursor-follow drift (±7 px).
"""
import os
import sys
import shutil
import numpy as np
from PIL import Image

key, region = sys.argv[1], sys.argv[2]
y0, y1, xs, xe = map(int, sys.argv[3:7])
out = f'src/assets/regions/{region}/{key}-bg.png'
if not os.path.exists(out):
    shutil.copy(f'src/assets/{key}-bg.png', out)
bg = np.array(Image.open(out).convert('RGBA'))
bg[y0:y1 + 1, xs:xe + 1] = bg[y0:y1 + 1, xs:xs + 1]
Image.fromarray(bg).save(out, optimize=True)
print(f'{out}: pill rows {y0}-{y1} extended {xs}->{xe}')
