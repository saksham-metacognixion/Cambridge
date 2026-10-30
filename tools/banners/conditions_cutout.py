"""Bug 213 (19 Oct 2026): re-extract the Conditions & Specialities people from the client composite, keying ONLY the background that is
connected to the outside of the figure (flood fill from the work-region border), so white / light cloth inside the
silhouette (doctor's coat, cuffs, grey sweater) stays opaque.

Background model: per-row colour at the left edge blended linearly to the per-row colour at the right edge (the client
gradient is slightly diagonal). A pixel is passable when it is within T of that model in brightness and hue (G-R, B-G within TC), or when it is a pill-stroke pixel
(inside the rendered pills.svg mask, colour on the bg->pill-colour line) next to background. Enclosed bg-like pockets
(wheel spokes, arm gaps) are background only when they are large and match the model closely; small speckles are cloth.
Same crop box / size as the 19 Oct cut (1411,268)-(2448,1370) -> 757x804, so banner-art.json is untouched.
Usage: node tools/banners/pillmask.mjs /tmp/pillmask.png
       python3 -I tools/banners/conditions_cutout.py "<Banners - KSA>/Conditions & Specialties - KSA.png" /tmp/pillmask.png /tmp/cutout.png
       then write the PNG as lossless WebP (sharp: .webp({ lossless: true })) to src/assets/regions/{sa,ae}/conditions/banner-cutout.webp
Pure Pillow (no numpy/OpenCV on the build machine)."""
import sys
from collections import deque
from PIL import Image, ImageChops, ImageDraw, ImageFilter
Image.MAX_IMAGE_PIXELS = None
BOX = (1411, 268, 2448, 1370)       # composite crop of the 19 Oct cut-out (unchanged)
OUT = (757, 804)
RX0, RY0, RX1, RY1 = 1300, 160, 2600, 1370   # work region (composite px), wider than BOX so the fill starts outside
T = 7                                # bg tolerance (max channel), bg noise is +-1
TC = 4                               # hue tolerance on G-R and B-G: the coat's shadows are neutral grey, the bg is blue-green
POCKET_MIN, POCKET_T = 20, 4         # enclosed pocket = background when >= this many px and mean diff <= POCKET_T (wheel spokes,
                                     # frame gaps); smaller specks are anti-aliasing noise and stay opaque
# stroke colours measured in this composite (pill pixels clear of the people): navy, cyan and green cores, and the
# navy->cyan / navy->green gradients the strokes run along
_CORES = [(1, 65, 90), (34, 180, 116), (3, 189, 251)]
PILL_COLOURS = [tuple(round(a + k / 6 * (b - a)) for a, b in zip(_CORES[0], c)) for c in _CORES[1:] for k in range(7)]

def main(comp_path, pill_path, out_png, dbg=None):
    comp = Image.open(comp_path).convert('RGB'); W, H = comp.size
    left = comp.crop((8, 0, 40, H)).resize((1, H), Image.BOX).load()
    right = comp.crop((W - 40, 0, W - 8, H)).resize((1, H), Image.BOX).load()
    pm = Image.open(pill_path).split()[3].point(lambda v: 255 if v > 40 else 0).filter(ImageFilter.MaxFilter(7)).load()
    w, h = RX1 - RX0, RY1 - RY0
    px = comp.load()
    N = w * h
    diff = bytearray(N); bglike = bytearray(N); pillish = bytearray(N)
    for y in range(h):
        Y = RY0 + y; L = left[0, Y]; R = right[0, Y]
        for x in range(w):
            X = RX0 + x; f = X / (W - 1)
            bg = (L[0] + f * (R[0] - L[0]), L[1] + f * (R[1] - L[1]), L[2] + f * (R[2] - L[2]))
            c = px[X, Y]
            d = max(abs(c[0] - bg[0]), abs(c[1] - bg[1]), abs(c[2] - bg[2]))
            i = y * w + x
            diff[i] = min(255, int(d))
            hue = max(abs((c[1] - c[0]) - (bg[1] - bg[0])), abs((c[2] - c[1]) - (bg[2] - bg[1])))
            if d <= T and hue <= TC: bglike[i] = 1
            elif pm[X, Y]:
                # on the segment bg -> pill colour (anti-aliased stroke over the gradient)?
                best = 1e9
                for P in PILL_COLOURS:
                    v = (P[0] - bg[0], P[1] - bg[1], P[2] - bg[2]); u = (c[0] - bg[0], c[1] - bg[1], c[2] - bg[2])
                    t = max(0.0, min(1.0, (u[0] * v[0] + u[1] * v[1] + u[2] * v[2]) / (v[0] ** 2 + v[1] ** 2 + v[2] ** 2)))
                    r = max(abs(u[0] - t * v[0]), abs(u[1] - t * v[1]), abs(u[2] - t * v[2]))
                    if r < best: best = r
                if best <= 14: pillish[i] = 1
    # pill pixels are passable only next to background (a stroke crossing cloth of a similar colour must not cut a groove)
    bgimg = Image.frombytes('L', (w, h), bytes(v * 255 for v in bglike)).filter(ImageFilter.MaxFilter(11))
    near = bgimg.tobytes()
    passable = bytearray(N)
    for i in range(N):
        if bglike[i] or (pillish[i] and near[i]): passable[i] = 1
    # flood from the work-region border
    reached = bytearray(N); q = deque()
    def seed(i):
        if passable[i] and not reached[i]: reached[i] = 1; q.append(i)
    for x in range(w): seed(x); seed((h - 1) * w + x)
    for y in range(h): seed(y * w); seed(y * w + w - 1)
    while q:
        i = q.popleft(); x = i % w
        for j in ((i - 1) if x > 0 else -1, (i + 1) if x < w - 1 else -1, i - w, i + w):
            if 0 <= j < N and passable[j] and not reached[j]: reached[j] = 1; q.append(j)
    # enclosed passable pockets: background only when big and a close match to the model
    seen = bytearray(N); pockets = []
    for s in range(N):
        if passable[s] and not reached[s] and not seen[s]:
            comp_px = [s]; seen[s] = 1; k = 0
            while k < len(comp_px):
                i = comp_px[k]; k += 1; x = i % w
                for j in ((i - 1) if x > 0 else -1, (i + 1) if x < w - 1 else -1, i - w, i + w):
                    if 0 <= j < N and passable[j] and not seen[j]: seen[j] = 1; comp_px.append(j)
            bgpx = [i for i in comp_px if bglike[i]]
            md = sum(diff[i] for i in bgpx) / max(1, len(bgpx))
            isbg = len(comp_px) >= POCKET_MIN and md <= POCKET_T
            pockets.append((len(comp_px), round(md, 2), isbg, (comp_px[0] % w + RX0, comp_px[0] // w + RY0)))
            if isbg:
                for i in comp_px: reached[i] = 1
    fg = Image.frombytes('L', (w, h), bytes(0 if r else 255 for r in reached))
    # drop specks of foreground not attached to the people (stray anti-aliased pill bits): keep blobs touching the bottom
    fgb = fg.copy()
    fpx = fgb.load()
    for x in range(w):
        if fpx[x, h - 1] == 255: ImageDraw.floodfill(fgb, (x, h - 1), 128)
    fg = fgb.point(lambda v: 255 if v == 128 else 0)
    # trim pill-stroke stubs left where a stroke meets the silhouette: thin protrusions (gone after a 9 px opening) that are
    # stroke-coloured. Thin real parts (spokes, stethoscope) are not stroke-coloured and are kept.
    opened = fg.filter(ImageFilter.MinFilter(9)).filter(ImageFilter.MaxFilter(9))
    pil = Image.frombytes('L', (w, h), bytes(v * 255 for v in pillish)).filter(ImageFilter.MaxFilter(5))
    stub = ImageChops.multiply(ImageChops.subtract(fg, opened), pil)
    fg = ImageChops.subtract(fg, stub)
    # soften the hard edge by ~1 composite px before the 0.73x downscale (anti-aliasing, no halo growth)
    fg = fg.filter(ImageFilter.GaussianBlur(0.7))
    full = Image.new('L', (W, H), 0); full.paste(fg, (RX0, RY0))
    a = full.crop(BOX).resize(OUT, Image.LANCZOS)
    rgb = comp.crop(BOX).resize(OUT, Image.LANCZOS)
    out = rgb.convert('RGBA'); out.putalpha(a); out.save(out_png)
    print('pockets (size, mean diff, background?, first px):')
    for p in sorted(pockets, reverse=True)[:40]: print(' ', p)
    print('stub px trimmed', stub.histogram()[255])
    print('pockets total', len(pockets), 'filled as cloth px', sum(p[0] for p in pockets if not p[2]))
    if dbg:
        Image.frombytes('L', (w, h), bytes(v * 255 for v in pillish)).save(dbg + '-pillish.png')
        fg.save(dbg + '-fg.png')

if __name__ == '__main__':
    main(*sys.argv[1:])
