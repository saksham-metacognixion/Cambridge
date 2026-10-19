"""Bugs 215-217 (19 Oct 2026): a banner's people cut-out straight from the client's 2880x1370 composite, at the client's own scale
and spot (composite.py `extract_full` placement), keyed as Bug 213 (conditions_cutout.py): ONLY background connected to the
outside of the figure is removed, so white thobes, coats and blankets on the pale gradient stay opaque.

composite.py needs numpy / OpenCV and the 16 Oct reference set (`_bg.png`, `_ref/`), which this build machine does not have;
this is the pure-Pillow route for the second (19 Oct) delivery, whose files are the full banner (gradient + outline pills +
people) and need no reference cut-out.

Background model: per-row colour at the left edge blended linearly to the right edge (the gradient is slightly diagonal). A pixel
is passable when it is within T of that model in brightness and hue, or a pill-stroke pixel (inside the rendered pills.svg mask,
colour on the bg -> stroke-colour line) next to background. Flood from the work-region border; enclosed passable pockets are
background only when large and a close match; foreground pieces that do not reach the frame bottom (stray stroke bits) go.
Bugs 238-240: the key runs twice, the second time against the gradient measured locally from the background the first pass
reached (local_background); then bridge_strokes rebuilds the outline across every pill-stroke row (no nubs, bites or stroke
colour where a stroke meets a figure). Crop as extract_full: the subject box + 4 px (start / top) and 5 px (end), down to the frame bottom; output at 2x live px
(composite px x 500/685); banner-art.json values off the canvas: w, h = output / 2, pills = pill_place.STACK in the box,
end = live px from the frame's end edge, drop 0.

    node tools/banners/pillmask.mjs /tmp/pillmask.png
    python3 -I tools/banners/client_cutout.py "<composite.png>" /tmp/pillmask.png /tmp/cutout.png [x0max]
    -> prints the banner-art.json entry; then write the PNG as lossless WebP (sharp: .webp({ lossless: true })).
`x0max` (optional, composite px): nothing left of it is subject (a client fade that runs into the copy side is cut there).
"""
import json
import sys
from collections import deque
from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageMath
Image.MAX_IMAGE_PIXELS = None

T = 7            # bg tolerance (max channel); bg noise is +-1
TC = 4           # hue tolerance on G-R and B-G (shadows on white cloth are neutral grey, the gradient is blue-green)
# Bug 230 (19 Oct 2026): POCKET_MIN 20 -> 150. Pockets of 20-100 composite px matching the gradient were white logo letters and
# pale specks on scrubs (a hole in the TBI wordmark); real gaps (arms, chair legs, crutches) measured >= 229. A tiny real gap kept
# opaque shows the client's own gradient pixels, so the error is invisible that way round.
POCKET_MIN, POCKET_T = 150, 4
# Bugs 222/223 (19 Oct 2026): a gap enclosed between two people (stethoscope tube, arm over a shoulder) is shaded a little
# darker than the gradient (mean diff 4.4-4.5) but still carries the client's pill strokes: with stroke evidence it is background
# up to POCKET_T_PILL, when it is a real gap (>= POCKET_PILL_SIZE px; the gaps measured 9.9k-16k). Small pockets inside a
# ventilator or a teal / navy coat logo also hold stroke-coloured px (<= 360 px) and stay opaque.
POCKET_T_PILL, POCKET_PILL_MIN, POCKET_PILL_SIZE = 6, 40, 2000
NEW_SCALE = 500 / 685                    # composite px -> output px (2x live)
STACK = (1172.68, 138.54)                # pill_place.STACK: the outline stack's top-left, composite px
_CORES = [(1, 65, 90), (34, 180, 116), (3, 189, 251)]  # stroke colours (conditions_cutout.py)
PILL_COLOURS = [tuple(round(a + k / 6 * (b - a)) for a, b in zip(_CORES[0], c)) for c in _CORES[1:] for k in range(7)]


def background(comp):
    W, H = comp.size
    left = comp.crop((8, 0, 40, H)).resize((1, H), Image.BOX).resize((W, H), Image.NEAREST)
    right = comp.crop((W - 40, 0, W - 8, H)).resize((1, H), Image.BOX).resize((W, H), Image.NEAREST)
    ramp = Image.linear_gradient('L').rotate(90).resize((W, H)).transpose(Image.FLIP_LEFT_RIGHT)  # 0 at x=0 .. 255 at x=W
    return Image.composite(right, left, ramp)


def stroke_residual(p, q, colours=PILL_COLOURS):
    """how far colour p is off the nearest line background q -> a stroke colour (max channel): ~0 for a stroke px and its
    anti-aliasing against the gradient"""
    u = (p[0] - q[0], p[1] - q[1], p[2] - q[2])
    best = 1e9
    for P in colours:
        v = (P[0] - q[0], P[1] - q[1], P[2] - q[2])
        t = max(0.0, min(1.0, (u[0] * v[0] + u[1] * v[1] + u[2] * v[2]) / (v[0] ** 2 + v[1] ** 2 + v[2] ** 2)))
        r = max(abs(u[0] - t * v[0]), abs(u[1] - t * v[1]), abs(u[2] - t * v[2]))
        if r < best: best = r
    return best


def bridge_strokes(fg, c, b, pills, w, h):
    """Bugs 238-240 (19 Oct 2026): where a horizontal pill stroke meets the silhouette the key leaves a nub (stroke px kept) or a
    notch (cloth px next to the stroke keyed out with it) a few rows tall: the steps and navy dashes along the Long-Term Care
    cardigan / scrubs and the Neuromuscular therapist's arm. Per column, each short run of stroke rows (the pill mask +-BAND_PAD,
    <= BAND_MAX rows: the horizontal strokes, not the near-vertical part of a round cap) is rebuilt from the rows just outside it
    (ya above, yb below), which the stroke does not touch:
    - an outline crossing both rows within REACH px (same side inside) is moved linearly from its spot in ya to its spot in yb,
      so a slanted edge stays slanted (a per-column copy left a straight piece and a step);
    - with no outline near, the run takes the state of ya and yb when they agree (a stroke stub in the open, a stroke-wide gap
      in cloth);
    - when they differ with no outline crossing both (the outline runs along the stroke: a forearm or a fist lying on a pill
      row), each foreground px of the run is stroke when its colour is nearer the bg -> stroke line than the figure's colour in
      the foreground row (a stroke / skin anti-aliasing sliver the flood cannot pass), and goes; the outline px left take the
      figure's colour. Only the drawn stroke rows +-1, only px clearly nearer the stroke (2 x), and only against the stroke
      colour(s) pills.svg draws there (`pills`, RGBA): a navy-dark fold in teal cloth under a sky-blue stroke is cloth.
    The strokes run BEHIND the people, so stroke colour can only sit on the outline: rebuilt foreground px within EDGE of the
    outline (and px the run filled in) take the colour interpolated between ya and yb along the outline. Cloth deeper inside is
    never recoloured (light-blue scrubs lie on the bg -> sky-blue stroke line, so `pillish` alone would recolour cloth).
    fg (L 0/255) and c (RGB) are edited in place; returns the number of px whose key changed."""
    # BAND_PAD: the bite reaches the mask +-2 (pm) +-2 (the stub filter's pil); REACH: a 45 deg shoulder moves ~16 px across a run
    BAND_PAD, BAND_MAX, EDGE, REACH, STROKE_T = 4, 16, 4, 24, 40
    pa = pills.split()[3].point(lambda v: 255 if v > 40 else 0).load()
    pc = pills.load()

    def drawn(x, y):
        """the stroke colours drawn within 3 rows of (x, y)"""
        return {pc[x, yy][:3] for yy in range(max(0, y - 3), min(h, y + 4)) if pc[x, yy][3] > 40} or PILL_COLOURS
    orig = fg.copy(); o, src, bp = orig.load(), c.copy().load(), b.load()
    f, cp = fg.load(), c.load()

    def edge(x, y, side=None):
        """the outline nearest x in row y of the original key, (position between two px, fg on its right?), or None; `side`:
        only an outline facing that way (the same outline in ya and yb, not the far side of a finger)"""
        for k in range(REACH + 1):
            for j in (x + k, x - k - 1):
                if 0 <= j < w - 1 and o[j, y] != o[j + 1, y] and side in (None, bool(o[j + 1, y])):
                    return j + 0.5, bool(o[j + 1, y])
        return None

    def lerp(p, q, t):
        return tuple(round(a + t * (b - a)) for a, b in zip(p, q))

    changed, cleared = 0, []
    for x in range(w):
        y = 0
        while y < h:
            if not pa[x, y]:
                y += 1; continue
            y1 = y
            while y1 + 1 < h and pa[x, y1 + 1]: y1 += 1
            ya, yb = y - BAND_PAD - 1, y1 + BAND_PAD + 1
            y = y1 + 1
            if ya < 0 or yb >= h or yb - ya - 1 > BAND_MAX: continue
            ea = edge(x, ya); eb = edge(x, yb, ea[1] if ea else None)
            for yy in range(ya + 1, yb):
                t = (yy - ya) / (yb - ya)
                if ea and eb and abs(ea[0] - eb[0]) <= REACH:
                    pt = ea[0] + t * (eb[0] - ea[0])
                    inside = (x > pt) == ea[1]
                    v = 255 if inside else 0
                    if inside and abs(x - pt) <= EDGE + 1:
                        off = x - pt  # the same spot relative to the outline in ya and yb
                        xa, xb = min(w - 1, max(0, round(ea[0] + off))), min(w - 1, max(0, round(eb[0] + off)))
                        cp[x, yy] = lerp(src[xa, ya], src[xb, yb], t)
                elif o[x, ya] == o[x, yb] and not ea and not eb:
                    v = o[x, ya]
                    if v and not o[x, yy]:
                        cp[x, yy] = lerp(src[x, ya], src[x, yb], t)
                elif o[x, ya] != o[x, yb] and o[x, yy] and (pa[x, yy] or pa[x, yy - 1] or pa[x, yy + 1]):
                    ref = src[x, ya] if o[x, ya] else src[x, yb]
                    p = src[x, yy]
                    rs, rf = stroke_residual(p, bp[x, yy], drawn(x, yy)), max(abs(p[k] - ref[k]) for k in range(3))
                    v = 0 if 2 * rs < rf and rs <= STROKE_T else 255  # clearly stroke: light-blue scrubs sit ~11 off the sky-blue line
                    if v and rs < rf * 1.5 and any(not o[xx, yy] for xx in range(max(0, x - EDGE), min(w, x + EDGE + 1))):
                        cp[x, yy] = ref
                else:
                    continue
                if f[x, yy] != v:
                    f[x, yy] = v; changed += 1
                    if not v: cleared.append((x, yy))
    # a px cleared here is background only when it joins background the key found; an enclosed one (sleeve cloth read as stroke
    # under a near-horizontal outline) is put back
    keep = set(); q = deque(); cl = set(cleared)
    for x, y in cleared:
        if any(0 <= x + dx < w and 0 <= y + dy < h and not o[x + dx, y + dy] and not f[x + dx, y + dy]
               for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
            keep.add((x, y)); q.append((x, y))
    while q:
        x, y = q.popleft()
        for n in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if n in cl and n not in keep: keep.add(n); q.append(n)
    for x, y in cl - keep:
        f[x, y] = 255; cp[x, y] = src[x, y]; changed -= 1
    return changed


def key(c, b, pm, w, h):
    """the background key of the work region c against the background model b: (reached, bglike, pillish, pockets)"""
    N = w * h
    cr, cg, cbl = c.split(); br, bgc, bb = b.split()
    diff = ImageChops.lighter(ImageChops.lighter(ImageChops.difference(cr, br), ImageChops.difference(cg, bgc)), ImageChops.difference(cbl, bb))
    hue = ImageMath.eval('convert(max(abs((g-r)-(G-R)), abs((bl-g)-(B-G))), "L")', r=cr, g=cg, bl=cbl, R=br, G=bgc, B=bb)
    bgl = ImageMath.eval('convert(((d <= %d) & (u <= %d)) * 255, "L")' % (T, TC), d=diff, u=hue)
    diff_b, bgl_b = diff.tobytes(), bgl.tobytes()
    bglike = bytearray(1 if v else 0 for v in bgl_b)
    cpx, bpx = c.load(), b.load()
    pillish = bytearray(N)
    for i in range(N):
        if pm[i] and not bglike[i]:
            x, y = i % w, i // w
            p, q = cpx[x, y], bpx[x, y]
            if stroke_residual(p, q) <= 14: pillish[i] = 1
    # a stroke is ~3.5 px wide: its pixels are within 3 px of the background beside it; a wider reach let the flood bite into
    # cloth of a stroke-like colour (teal scrubs) where a pill row meets the figure (conditions_cutout.py uses 11)
    near = Image.frombytes('L', (w, h), bytes(v * 255 for v in bglike)).filter(ImageFilter.MaxFilter(7)).tobytes()
    passable = bytearray(1 if (bglike[i] or (pillish[i] and near[i])) else 0 for i in range(N))
    reached = bytearray(N); q = deque()
    def seed(i):
        if passable[i] and not reached[i]: reached[i] = 1; q.append(i)
    for x in range(w): seed(x)  # top edge; the bottom edge is the frame bottom, where the people stand
    for y in range(h): seed(y * w); seed(y * w + w - 1)
    while q:
        i = q.popleft(); x = i % w
        for j in ((i - 1) if x > 0 else -1, (i + 1) if x < w - 1 else -1, i - w, i + w):
            if 0 <= j < N and passable[j] and not reached[j]: reached[j] = 1; q.append(j)
    seen = bytearray(N); n_pockets = 0
    for s in range(N):
        if passable[s] and not reached[s] and not seen[s]:
            comp_px = [s]; seen[s] = 1; k = 0
            while k < len(comp_px):
                i = comp_px[k]; k += 1; x = i % w
                for j in ((i - 1) if x > 0 else -1, (i + 1) if x < w - 1 else -1, i - w, i + w):
                    if 0 <= j < N and passable[j] and not seen[j]: seen[j] = 1; comp_px.append(j)
            bgpx = [i for i in comp_px if bglike[i]]
            md = sum(diff_b[i] for i in bgpx) / max(1, len(bgpx))
            npil = sum(1 for i in comp_px if pillish[i])
            if len(comp_px) >= POCKET_MIN and (md <= POCKET_T or (len(comp_px) >= POCKET_PILL_SIZE and npil >= POCKET_PILL_MIN and md <= POCKET_T_PILL)):
                n_pockets += 1
                for i in comp_px: reached[i] = 1
    return reached, bglike, pillish, n_pockets


def local_background(c, b, reached, bglike, pm, w, h, G=12, MIN=20):
    """b corrected by the local mean of c - b over the px the first key reached (background connected to the outside, so never
    cloth) away from the strokes, per G x G cell; cells without MIN such px take the mean of their filled neighbours, grown
    outwards; the correction is upsampled bilinearly."""
    gw, gh = (w + G - 1) // G, (h + G - 1) // G
    acc = [[0, 0, 0, 0] for _ in range(gw * gh)]
    cp, bp = c.load(), b.load()
    for i in range(w * h):
        if reached[i] and bglike[i] and not pm[i]:
            x, y = i % w, i // w
            p, q = cp[x, y], bp[x, y]; a = acc[(y // G) * gw + x // G]
            a[0] += p[0] - q[0]; a[1] += p[1] - q[1]; a[2] += p[2] - q[2]; a[3] += 1
    corr = [(a[0] / a[3], a[1] / a[3], a[2] / a[3]) if a[3] >= MIN else None for a in acc]
    while any(v is None for v in corr):
        nxt = corr[:]
        for gy in range(gh):
            for gx in range(gw):
                if corr[gy * gw + gx] is None:
                    nb = [corr[yy * gw + xx] for yy in range(max(0, gy - 1), min(gh, gy + 2))
                          for xx in range(max(0, gx - 1), min(gw, gx + 2)) if corr[yy * gw + xx] is not None]
                    if nb: nxt[gy * gw + gx] = tuple(sum(v[k] for v in nb) / len(nb) for k in range(3))
        if nxt == corr: corr = [v or (0.0, 0.0, 0.0) for v in corr]; break
        corr = nxt
    out = []
    for k, ch in enumerate(b.split()):
        g = Image.new('F', (gw, gh)); g.putdata([v[k] for v in corr])
        g = g.resize((gw * G, gh * G), Image.BILINEAR).crop((0, 0, w, h))
        out.append(ImageMath.eval('convert(b + d + 0.5, "L")', b=ch, d=g))
    return Image.merge('RGB', out)


def main(comp_path, pill_path, out_png, x0max=None):
    comp = Image.open(comp_path).convert('RGB'); W, H = comp.size
    bg = background(comp)
    # coarse subject box (strong difference, thin strokes opened away) -> work region with a margin, so the flood starts outside
    d = ImageChops.difference(comp, bg).split()
    dmax = ImageChops.lighter(ImageChops.lighter(d[0], d[1]), d[2])
    coarse = dmax.point(lambda v: 255 if v > 30 else 0).filter(ImageFilter.MinFilter(13)).filter(ImageFilter.MaxFilter(13))
    cb = coarse.getbbox()
    RX0, RY0, RX1, RY1 = max(1, cb[0] - 120), max(1, cb[1] - 120), min(W, cb[2] + 120), H
    if x0max is not None:
        RX0 = max(RX0, int(x0max))
    w, h = RX1 - RX0, RY1 - RY0
    box = (RX0, RY0, RX1, RY1)
    c = comp.crop(box); b = bg.crop(box)
    # Bugs 238-240: +-2 rows, was +-3. The mask sits within 1 row of the drawn strokes; at +-3 light-blue scrubs on the bg -> sky-blue
    # stroke line read as stroke 3 rows off the stroke and the flood bit 2-3 px into the cloth there (bridge_strokes covers +-4)
    pm = Image.open(pill_path).split()[3].point(lambda v: 255 if v > 40 else 0).filter(ImageFilter.MaxFilter(5)).crop(box).tobytes()
    reached, bglike, pillish, n_pockets = key(c, b, pm, w, h)
    # Bugs 238-240: the left/right blend misses the client's gradient by up to 7 near the frame's end edge (LTC UAE: 205,214,221 vs
    # 198,210,218 beside the nurse's sleeve); with T = 7 a few pure-gradient px failed the test and stayed on the outline as pale
    # nubs. Re-key against the local background measured from the first pass.
    b = local_background(c, b, reached, bglike, pm, w, h)
    reached, bglike, pillish, n_pockets = key(c, b, pm, w, h)
    fg = Image.frombytes('L', (w, h), bytes(0 if r else 255 for r in reached))
    # keep only foreground that reaches the frame bottom (the people stand on it; loose stroke bits do not)
    fpx = fg.load()
    for x in range(w):
        if fpx[x, h - 1] == 255: ImageDraw.floodfill(fg, (x, h - 1), 128)
    fg = fg.point(lambda v: 255 if v == 128 else 0)
    # stroke stubs where a stroke meets the silhouette: thin (gone after a 9 px opening) and stroke-coloured
    opened = fg.filter(ImageFilter.MinFilter(9)).filter(ImageFilter.MaxFilter(9))
    pil = Image.frombytes('L', (w, h), bytes(v * 255 for v in pillish)).filter(ImageFilter.MaxFilter(5))
    fg = ImageChops.subtract(fg, ImageChops.multiply(ImageChops.subtract(fg, opened), pil))
    n_bridged = bridge_strokes(fg, c, b, Image.open(pill_path).convert('RGBA').crop(box), w, h)
    fg = fg.filter(ImageFilter.GaussianBlur(0.7))  # ~1 composite px of anti-aliasing before the 0.73x downscale
    comp = comp.copy(); comp.paste(c, (RX0, RY0))  # c: stroke colour taken off the outline by bridge_strokes
    full = Image.new('L', (W, H), 0); full.paste(fg, (RX0, RY0))
    bx = full.point(lambda v: 255 if v > 12 else 0).getbbox()
    x0, y0, x1, y1 = max(0, bx[0] - 4), max(0, bx[1] - 4), min(W, bx[2] + 4), H  # bbox x1 is exclusive: +4 = extract_full's max + 5
    size = (round((x1 - x0) * NEW_SCALE), round((y1 - y0) * NEW_SCALE))
    a = full.crop((x0, y0, x1, y1)).resize(size, Image.LANCZOS)
    out = comp.crop((x0, y0, x1, y1)).resize(size, Image.LANCZOS).convert('RGBA'); out.putalpha(a)
    out.save(out_png)
    wl, hl = size[0] / 2, size[1] / 2
    k = NEW_SCALE / 2
    entry = {'w': wl, 'h': hl, 'shape': True, 'pills': [round((STACK[0] - x0) * k, 1), round((STACK[1] - y0) * k, 1)],
             'end': round((W - x1) * k, 1), 'drop': 0}
    print(json.dumps({'box': [x0, y0, x1, y1], 'work': [RX0, RY0, RX1, RY1], 'size': size, 'pockets_bg': n_pockets,
                      'bridged': n_bridged, 'entry': entry}))


if __name__ == '__main__':
    main(*sys.argv[1:4], *(int(v) for v in sys.argv[4:5]))
