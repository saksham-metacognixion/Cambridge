"""Bug 219 (19 Oct 2026): recolour-hijab.py (bug 066 K1, numpy) in pure Pillow, for the build machine without numpy, run on a
whole cut-out instead of a hand-drawn region of the old 1x layer, which had left the hijab's top-left corner light blue.

    python3 -I tools/region-photos/recolour_hijab_pil.py <in.png> <out.png> <x0> <x1> <y0> <y1>

Same rule as recolour-hijab.py: inside the box, pixels are weighted by how blue (hue ~207) and saturated they are, and each
pixel's brightness relative to the hijab's median is carried onto NAVY with the same compression, so folds and anti-aliased
edges blend. The box only has to keep other blue clothing out (the nurse's scrubs); the hue test does the rest.
"""
import colorsys
import sys
from PIL import Image

NAVY = (17, 32, 56)


def ramp(v, lo, hi):
    t = min(1.0, max(0.0, (v - lo) / (hi - lo)))
    return t * t * (3 - 2 * t)


def main(src, out, x0, x1, y0, y1):
    im = Image.open(src).convert('RGBA'); px = im.load()
    pts = []
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            r, g, b, a = px[x, y]
            if not a: continue
            h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            w = ramp(s, 0.12, 0.35) * (1 - ramp(abs(h * 360 - 207), 18, 30))
            if w > 0: pts.append((x, y, w, v))
    core = sorted(v for _, _, w, v in pts if w > 0.9)
    med = core[len(core) // 2]
    for x, y, w, v in pts:
        r, g, b, a = px[x, y]
        k = min(2.2, max(0.35, v / med)) ** 0.7
        n = [min(255.0, c * k) for c in NAVY]
        px[x, y] = (round(r * (1 - w) + n[0] * w), round(g * (1 - w) + n[1] * w), round(b * (1 - w) + n[2] * w), a)
    im.save(out)
    print(f'{out}: {len(core)} hijab px recoloured navy in x {x0}-{x1}, y {y0}-{y1}')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2], *(int(v) for v in sys.argv[3:7]))
