"""Region hero people: turn a light-blue hijab navy (bug 066 reopened, 14 Oct 2026, user decision K1).

    python3 tools/region-photos/recolour-hijab.py <key> <region> <x0> <x1> <y0> <y1>

No KSA photo of the Our Care scene with a dark hijab exists (Global, UAE and KSA live files all show the same light-blue
one), so the KSA layer src/assets/regions/<region>/<key>-subject.png is recoloured in place, inside the box x0..x1, y0..y1
only (keep it clear of other blue clothing, e.g. the nurse's scrubs). Pixels are weighted softly by how blue and saturated
they are, so anti-aliased edges against the face, the coat and the transparent background blend instead of speckling.
The shading is kept (compressed): each pixel's brightness relative to the hijab's median is carried onto NAVY, the median colour of the
navy hijabs already in the approved KSA set (palliative-care / inpatient-care subjects). Run after compose-subject.py.
"""
import sys
import numpy as np
from PIL import Image

NAVY = np.array([17, 32, 56], float)

key, region = sys.argv[1], sys.argv[2]
x0, x1, y0, y1 = map(int, sys.argv[3:7])
out = f'src/assets/regions/{region}/{key}-subject.png'
im = np.array(Image.open(out).convert('RGBA')).astype(float)
hsv = np.array(Image.fromarray(im[..., :3].astype('uint8')).convert('HSV')).astype(float)
hue, sat, val = hsv[..., 0] * 360 / 255, hsv[..., 1] / 255, hsv[..., 2] / 255


def ramp(v, lo, hi):  # 0 below lo, 1 above hi, smoothstep between
    t = np.clip((v - lo) / (hi - lo), 0, 1)
    return t * t * (3 - 2 * t)


weight = ramp(sat, 0.12, 0.35) * (1 - ramp(np.abs(hue - 207), 18, 30))
box = np.zeros_like(weight)
box[y0:y1 + 1, x0:x1 + 1] = 1
weight *= box * (im[..., 3] > 0)
core = weight > 0.9
shade = val / np.median(val[core])
navy = np.clip(NAVY[None, None, :] * np.clip(shade, 0.35, 2.2)[..., None] ** 0.7, 0, 255)  # softer folds: dark navy, not royal blue
im[..., :3] = im[..., :3] * (1 - weight[..., None]) + navy * weight[..., None]
Image.fromarray(np.rint(im).astype('uint8')).save(out, optimize=True)
print(f'{out}: {int(core.sum())} hijab px recoloured navy in x {x0}-{x1}, y {y0}-{y1}')
