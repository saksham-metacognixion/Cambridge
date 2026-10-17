"""Banner people cut-outs from the client's full-banner composites (Prateek, 16 Oct 2026: `Cambridge Hospital - Website Images`,
2880x1370 opaque PNGs = gradient + outline pills + people, 2x of a 1440x685 stage).

The people are the same pictures as our live-size cut-outs, so each composite is aligned to the current cut-out (hd.fit),
the matching region is taken at the composite's own scale (capped at 2x the display size), and the people are keyed by difference against the shared
background (`_bg.png`: the gradient + pills, estimated from all composites: tools/banners/composite-bg.py). The current
cut-out's alpha bounds the key (nothing outside the live silhouette, the solid interior always kept: a white coat on the pale
gradient must not key out), so the result is the live framing with the composite's detail and a keyed, sharper edge.

    python3 -I tools/banners/composite.py [outdir]     # trial run into outdir (with side-by-side PNGs); default: src/assets

Mapping: tools/banners/composites.json {"<file>": {"key": "...", "region": "global|ae|sa"}}.
"""
import glob
import json
import os
import sys

import cv2
import numpy as np
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from hd import fit, warp, warp_full  # noqa: E402
from defringe import defringe  # noqa: E402  (extract_new only)

ROOT = 'docs/client-assets/website-images-oct16/'
BG = ROOT + '_bg.png'
# Bug 175: the cut-outs these composites replaced (aa07f83^, the live files), kept as the fixed alignment + silhouette reference.
# Aligning to src/assets instead would fit each run to the previous run's output and widen its edge every time.
REF = ROOT + '_ref/'
EDGE_IN, EDGE_RAMP = 3, 1.5  # live px: reference colours in the outer band, the composite from EDGE_IN + EDGE_RAMP in


# the composites' outline pills (stroke colours sampled from the shared background)
PILL_COLOURS = np.array([[15, 85, 113], [13, 98, 119], [17, 191, 252], [17, 124, 142], [46, 197, 250], [15, 199, 255], [70, 193, 140],
                         [60, 191, 137], [49, 192, 134], [49, 212, 141], [13, 84, 112], [38, 182, 118], [41, 112, 132]], np.float32) / 255


def pill_mask(comp):
    """Pill stroke pixels the background estimate may miss (behind the people in most files): a pill colour on a horizontal
    run of 24+ px, grown by 2 px."""
    rgb = comp[..., :3]
    near = np.zeros(rgb.shape[:2], bool)
    for c in PILL_COLOURS:
        near |= np.abs(rgb - c).max(axis=2) < 0.07
    m = near.astype(np.uint8)
    runs = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((1, 24), np.uint8))
    return cv2.dilate(runs, np.ones((5, 5), np.uint8)) > 0


def key_alpha(comp, bg):
    """0..1 from the colour distance to the background (max channel), soft between 0.03 and 0.16; pill strokes keyed out."""
    d = np.abs(comp[..., :3] - bg[..., :3]).max(axis=2)
    a = np.clip((d - 0.03) / 0.13, 0, 1)
    a[pill_mask(comp)] = 0
    return a


def extract(file, key, region, outdir=None, log=print):
    cur_path = glob.glob(f'{REF}{key.replace("/", "__")}{"" if region == "global" else "." + region}.*')
    if not cur_path:  # no saved reference yet: the current cut-out (first run only)
        cur_path = (glob.glob(f'src/assets/regions/{region}/{key}-cutout.*') if region != 'global' else []) or glob.glob(f'src/assets/{key}-cutout.*')
    cur_path = cur_path[0]
    cur = np.asarray(Image.open(cur_path).convert('RGBA')).astype(np.float32) / 255
    comp = np.asarray(Image.open(ROOT + file).convert('RGBA')).astype(np.float32) / 255
    bg = np.asarray(Image.open(BG).convert('RGBA')).astype(np.float32) / 255
    s, t, n_in = fit(cur, comp, max_rot=20)  # cur ~= comp * s + t (a rotated composite is turned to our framing)
    M = fit.last['M']
    if abs(fit.last['rot']) > 0.3:
        log(f'  rotation {fit.last["rot"]:.2f} deg applied')
    live = json.load(open('src/data/banner-art.json'))[f'{region}:{key}']['w']  # display size in live px
    k = min(1 / s, 2 * live / cur.shape[1])  # the composite's own pixels, at most 2x the display size
    h, w = cur.shape[:2]
    size = (round(w * k), round(h * k))
    ak = key_alpha(comp, bg)
    # colour and keyed alpha warped separately: warp() premultiplies, which would leave black where the key is ~0 while the
    # final alpha (bounded by the current outline) can be wider there
    hd = warp_full(np.dstack([comp[..., :3], np.ones_like(ak)]), M, k, size)
    hd[..., 3] = warp_full(np.dstack([ak, ak, ak, np.ones_like(ak)]), M, k, size)[..., 0]
    ca = cv2.resize(cur[..., 3], size, interpolation=cv2.INTER_CUBIC).clip(0, 1)
    # Bug 175 (16 Oct 2026): the edge comes from the live reference, the interior from the composite. The composites' people
    # carry a light rim of their own (pasted with a pale matte, lighter than the backdrop, so no key separates it from a white
    # coat) and in places sit 1-2 px off the reference outline; keyed edges (the old gate allowed 2 live px past the outline)
    # showed both as a white halo over the dark pill shape. Now: alpha = the live outline (upscaled, its own soft edge), colour =
    # the composite's sharp pixels from EDGE_IN live px inside that outline, the reference's clean colours in the band outside.
    pm = cv2.resize(cur[..., :3] * cur[..., 3:4], size, interpolation=cv2.INTER_CUBIC)
    ref_rgb = np.clip(pm / np.maximum(ca, 1e-3)[..., None], 0, 1)  # un-premultiplied: no dark fringe from the transparent black
    px = size[0] / live  # file px per live px
    depth = cv2.distanceTransform((ca > 0.5).astype(np.uint8), cv2.DIST_L2, 5) / px  # live px inside the outline
    t = np.clip((depth - EDGE_IN) / EDGE_RAMP, 0, 1)[..., None]
    rgb = ref_rgb + (hd[..., :3] - ref_rgb) * t
    a = ca
    out = np.dstack([rgb, a])
    img = Image.fromarray((out * 255 + 0.5).astype(np.uint8))
    # sanity: the new copy at the current size vs the current cut-out
    back = cv2.resize(out, (w, h), interpolation=cv2.INTER_AREA)
    d = np.abs(cur[..., :3] * cur[..., 3:4] - back[..., :3] * back[..., 3:4]).mean(axis=2)
    B = 12
    blocks = cv2.resize(d, (max(1, w // B), max(1, h // B)), interpolation=cv2.INTER_AREA)
    log(f'  {os.path.basename(cur_path)} {w}x{h} -> {size[0]}x{size[1]} (x{k:.2f}, {n_in} inliers, diff {d.mean() * 255:.1f}/255, worst block {blocks.max() * 255:.0f}/255)')
    if outdir:
        os.makedirs(outdir, exist_ok=True)
        img.save(f'{outdir}/{key.replace("/", "__")}{"" if region == "global" else "." + region}.png')
    else:
        dest = f'src/assets/regions/{region}/{key}-cutout.webp' if region != 'global' else f'src/assets/{key}-cutout.webp'
        for old in glob.glob(dest[:-5] + '.*'):
            os.remove(old)
        img.save(dest, lossless=True, method=6)
    return {'k': k, 'inliers': n_in, 'diff': float(d.mean() * 255), 'worst': float(blocks.max() * 255), 'size': size}


# The composite is the Figma banner frame at 1440 (1440x685 = our 500-tall live stage x 1.3688, drawn at 2x), so one composite
# pixel = 500/685 live px at 2x.
NEW_SCALE = 500 / 685


def fill_interior(a):
    """Alpha with the subject's interior forced opaque: whatever the background flood (alpha < 0.15, from the border) does not
    reach is inside the subject (a pale coat on the pale gradient keys as half-transparent otherwise)."""
    h, w = a.shape
    free = (a < 0.15).astype(np.uint8)
    mask = np.zeros((h + 2, w + 2), np.uint8)
    reach = np.zeros_like(free)
    for seed in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1), (w // 2, 0), (0, h // 2)]:
        if free[seed[1], seed[0]]:
            m = mask.copy()
            cv2.floodFill(free.copy(), m, seed, 1, flags=4 | cv2.FLOODFILL_MASK_ONLY | (1 << 8))
            reach |= m[1:-1, 1:-1]
    interior = (reach == 0).astype(np.uint8)
    interior = cv2.erode(interior, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5)))
    return np.maximum(a, interior.astype(np.float32))


def extract_new(file, key, region, pills=False, outdir=None, log=print):
    """A composite whose picture is NOT on the site yet: the subject keyed against the background (pills included for the
    hospital pages, which draw their own pill SVG from it), cropped to its box and scaled to 2x the live size; the display size
    goes to banner-art.json. Returns the output path."""
    comp = np.asarray(Image.open(ROOT + file).convert('RGBA')).astype(np.float32) / 255
    bg = np.asarray(Image.open(ROOT + '_bg.png').convert('RGBA')).astype(np.float32) / 255
    d = np.abs(comp[..., :3] - bg[..., :3]).max(axis=2)
    a = np.clip((d - 0.03) / 0.13, 0, 1)
    if True:  # the subject alone first (pill strokes erased, interior filled); the pills are added back below for the hospitals
        a[pill_mask(comp)] = 0
        # the pills' geometry (same canvas positions in every composite, `_pills.png`): within it, a pixel that is a THIN
        # HORIZONTAL LINE (unlike the rows 5 px above and below, which match each other) is a stroke over the background and
        # is erased; clothing in front of a pill shows no line and is kept
        P = np.asarray(Image.open(ROOT + '_pills.png').convert('L')) > 0
        rgb = comp[..., :3]
        up, down = np.roll(rgb, 5, axis=0), np.roll(rgb, -5, axis=0)
        line = (np.abs(rgb - up).max(axis=2) > 0.1) & (np.abs(rgb - down).max(axis=2) > 0.1) & (np.abs(up - down).max(axis=2) < 0.08)
        left, right = np.roll(rgb, 5, axis=1), np.roll(rgb, -5, axis=1)  # the arcs at the pill ends
        line |= (np.abs(rgb - left).max(axis=2) > 0.1) & (np.abs(rgb - right).max(axis=2) > 0.1) & (np.abs(left - right).max(axis=2) < 0.08)
        strokes = cv2.dilate((P & line).astype(np.uint8), np.ones((3, 3), np.uint8)) > 0
        a[strokes] = 0
    a = fill_interior(a)
    # Bug 175: no backdrop halo on the people (see extract). The crop box is measured before (so the picture keeps its place in the
    # banner); the hospital buildings are left as they were: their painted edges have no halo, and split_pills reads the building
    # edge, so a changed alpha there turns wall and hedge lines into pills.
    box_a = a.copy()
    rgb = comp[..., :3]
    if not pills:
        rgb, a = defringe(rgb, a, px=2 / NEW_SCALE)
    if pills:
        # hospital pages: the pill strokes (keyed against the plain gradient) outside the building, NOT hole-filled, so the
        # outlines stay thin for split_pills
        grad = np.asarray(Image.open(ROOT + '_grad.png').convert('RGBA')).astype(np.float32) / 255
        dg = np.abs(comp[..., :3] - grad[..., :3]).max(axis=2)
        ap = np.clip((dg - 0.03) / 0.13, 0, 1)
        building = cv2.dilate((a > 0.5).astype(np.uint8), np.ones((5, 5), np.uint8)) > 0
        ap[building] = 0
        a = np.maximum(a, ap)
    # specks; Bug 191 (16 Oct 2026): and, for people banners, a loose pill outline (Media Hub: the bottom pill next to the wrist
    # kept its stroke, which `_pills.png` misses there, and was drawn over the page's own pills): a piece apart from the subject
    # that is a thin ring (under 15% of its box filled) in the pill stroke colours
    def stray_pill(sel, st):
        fill = st[cv2.CC_STAT_AREA] / (st[cv2.CC_STAT_WIDTH] * st[cv2.CC_STAT_HEIGHT])
        c = comp[..., :3][sel].mean(axis=0)
        return fill < 0.15 and np.abs(PILL_COLOURS - c).max(axis=1).min() < 0.12

    for m in (a, box_a):
        n, lab, stats, _ = cv2.connectedComponentsWithStats((m > 0.3).astype(np.uint8))
        big = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA])) if n > 1 else 0
        for i in range(1, n):
            if stats[i, cv2.CC_STAT_AREA] < 400:
                m[lab == i] = 0
            elif not pills and i != big and stray_pill(lab == i, stats[i]):
                m[cv2.dilate((lab == i).astype(np.uint8), np.ones((5, 5), np.uint8)) > 0] = 0  # with its faint rim
    ys, xs = np.nonzero((a if pills else box_a) > 0.05)
    x0, x1, y0, y1 = max(0, xs.min() - 4), min(comp.shape[1], xs.max() + 5), max(0, ys.min() - 4), comp.shape[0]  # to the bottom edge
    crop = np.dstack([rgb[y0:y1, x0:x1], a[y0:y1, x0:x1]])
    size = (round((x1 - x0) * NEW_SCALE), round((y1 - y0) * NEW_SCALE))
    pm = crop.copy()
    pm[..., :3] *= pm[..., 3:4]
    out = cv2.resize(pm, size, interpolation=cv2.INTER_AREA)
    al = out[..., 3:4]
    out[..., :3] = np.where(al > 1e-4, out[..., :3] / np.maximum(al, 1e-4), 0)
    img = Image.fromarray((out.clip(0, 1) * 255 + 0.5).astype(np.uint8))
    disp = (round(size[0] / 2), round(size[1] / 2))
    # Bugs 194/196 (16 Oct 2026): the outline pill stack sits at one canvas spot in every composite (pill_place.STACK), so its
    # top-left in the people box is read straight off the crop box (no fit): composite px -> live px = NEW_SCALE / 2.
    from pill_place import STACK
    pills_at = [float(round((STACK[0] - x0) * NEW_SCALE / 2, 1)), float(round((STACK[1] - y0) * NEW_SCALE / 2, 1))]
    log(f'  new picture: subject box {x1 - x0}x{y1 - y0} at ({x0}, {y0}) -> {size[0]}x{size[1]} (display {disp[0]}x{disp[1]} live px, pills {pills_at})')
    if outdir:
        os.makedirs(outdir, exist_ok=True)
        dest = f'{outdir}/{key.replace("/", "__")}{"" if region == "global" else "." + region}.png'
        img.save(dest)
    else:
        dest = f'src/assets/regions/{region}/{key}-cutout.png' if region != 'global' else f'src/assets/{key}-cutout.png'
        for old in glob.glob(dest[:-4] + '.*'):
            os.remove(old)
        img.save(dest, optimize=True)
        mp = 'src/data/banner-art.json'
        man = json.load(open(mp))
        e = man.get(f'{region}:{key}', {'shape': not pills})
        e.update({'w': disp[0], 'h': disp[1]})
        if not pills:
            e['pills'] = pills_at  # the old picture's placement does not apply either
            if key == 'media-hub/banner':  # Bug 185: the client's frame spot too (Insurance / International already matched: unchanged)
                e.update(frame_place(x1, comp.shape[1]))
        for flag in ('bleed', 'fade'):
            e.pop(flag, None)  # the old picture's cut-edge flags do not apply
        man[f'{region}:{key}'] = e
        json.dump(dict(sorted(man.items())), open(mp, 'w'), indent=1)
        if pills:  # hospital page: building alone + <key>-pills.svg from this cut-out (pills 69 px tall here vs 27 in the live files)
            from split_pills import write as split_write
            split_write(key.split('/banner-')[1], src=dest, scale=2.55)
    return dest



# Bugs 194-197 (16 Oct 2026): the live reference cut-outs of these banners stop short of the client's picture on the start side
# (a table, couch, bed or coat cut by the live file's left edge) and feather that edge out over up to ~100 live px; `extract`
# copies that alpha, so the edge showed faded and short. `full` mode keeps the reference silhouette where it is clean and takes
# the composite's own key in the strip it cropped or feathered (and anywhere outside the reference frame), at the composite's
# own scale (people-to-pills as the client drew them) with the pill spot read off the canvas.
FULL_FADE, FULL_RAMP, FULL_BOTTOM = 100, 30, 10  # live px: reference alpha trusted from FADE + RAMP in from its left edge, BOTTOM up from its bottom
# Bugs 184-186 (16 Oct 2026, retest of d4ec6d8): every composite banner now uses `full` (the people at the client's scale, the
# pill spot off the canvas; `extract` kept our live scale and the pills were centred on it, 5-139 live px off the client files).
# `extend` (Find a Doctor, Homecare Global): the reference file itself cuts the woman / the wheelchair at its END edge (the old
# `bleed: "end"` pushed that cut off screen); there the composite's key is also taken past the reference's end edge.
FULL_END = 12  # live px: with `extend`, the key from this far inside the reference's end edge
FULL_HALO = 4  # composite px (2x): the reference alpha fades out from this far outside the client's keyed subject


def frame_place(x1, W):
    """Bugs 185/186 (16 Oct 2026): where the client's frame puts the picture: `end` = live px from the frame's end edge to the
    people box's end edge (the frame's end edge = the 1440 stage's, BannerArt.astro; the old fixed 72 put Homecare 126 px and Find
    a Doctor 7 px off the client's whitespace), `drop` 0 = the people stand on the frame bottom as in the files (the live site
    sank every cut-out 10 px)."""
    return {'end': float(round((W - x1) * NEW_SCALE / 2, 1)), 'drop': 0}


def _smooth01(x):
    t = np.clip(x, 0, 1)
    return t * t * (3 - 2 * t)


def extract_full(file, key, region, outdir=None, log=print, extend=False):
    comp = np.asarray(Image.open(ROOT + file).convert('RGBA')).astype(np.float32) / 255
    bg = np.asarray(Image.open(ROOT + '_bg.png').convert('RGBA')).astype(np.float32) / 255
    H, W = comp.shape[:2]
    ref_path = glob.glob(f'{REF}{key.replace("/", "__")}{"" if region == "global" else "." + region}.*')[0]
    ref = np.asarray(Image.open(ref_path).convert('RGBA')).astype(np.float32) / 255
    rh, rw = ref.shape[:2]
    fit(ref, comp, max_rot=20)
    M = fit.last['M']  # ref ~= M * comp
    Minv = cv2.invertAffineTransform(M)
    ref_a = cv2.warpAffine(ref[..., 3], Minv, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
    # every canvas pixel in reference (= live px) coordinates
    xs, ys = np.meshgrid(np.arange(W, dtype=np.float32), np.arange(H, dtype=np.float32))
    xr = M[0, 0] * xs + M[0, 1] * ys + M[0, 2]
    yr = M[1, 0] * xs + M[1, 1] * ys + M[1, 2]
    # the key only on the start side (left of FADE + RAMP, the file edge included) and under the reference's bottom: no reference
    # was cut on its top or end edge, and the pill ends there must not come back
    wr = _smooth01((xr - FULL_FADE) / FULL_RAMP) * _smooth01((rh - yr) / FULL_BOTTOM)
    if extend:
        wr = wr * _smooth01((rw - FULL_END - xr) / FULL_RAMP)
    # the composite's key (as extract_new, without the colour test for pill strokes: teal scrubs and blue sheets share those
    # colours; the pills are part of _bg, and the thin-line test below catches strokes the estimate misses)
    d = np.abs(comp[..., :3] - bg[..., :3]).max(axis=2)
    ka = np.clip((d - 0.03) / 0.13, 0, 1)
    P = np.asarray(Image.open(ROOT + '_pills.png').convert('L')) > 0
    rgb = comp[..., :3]
    up, down = np.roll(rgb, 5, axis=0), np.roll(rgb, -5, axis=0)
    line = (np.abs(rgb - up).max(axis=2) > 0.1) & (np.abs(rgb - down).max(axis=2) > 0.1) & (np.abs(up - down).max(axis=2) < 0.08)
    left, right = np.roll(rgb, 5, axis=1), np.roll(rgb, -5, axis=1)
    line |= (np.abs(rgb - left).max(axis=2) > 0.1) & (np.abs(rgb - right).max(axis=2) > 0.1) & (np.abs(left - right).max(axis=2) < 0.08)
    ka[cv2.dilate((P & line).astype(np.uint8), np.ones((3, 3), np.uint8)) > 0] = 0
    # pill-coloured horizontal runs that are THIN (a stroke, ~4 px at 2x) where they touch the subject; a pill-coloured area 12+
    # px tall (teal scrubs, a navy scarf) is cloth and stays
    near = np.zeros(rgb.shape[:2], bool)
    for c in PILL_COLOURS:
        near |= np.abs(rgb - c).max(axis=2) < 0.07
    m = near.astype(np.uint8)
    runs = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((1, 24), np.uint8))
    tall = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((12, 1), np.uint8))
    ka[cv2.dilate(runs & (1 - cv2.dilate(tall, np.ones((5, 5), np.uint8))), np.ones((5, 5), np.uint8)) > 0] = 0
    # Inpatient: the client file itself fades the blanket and rail out at the start end, and the pill strokes show through
    # that translucent strip; on the pill geometry a see-through pixel is the stroke (the page draws its own stack there)
    # (after the interior fill, so a pale solid object such as the Why bed's footboard is opaque first and keeps its pixels)
    ka = fill_interior(ka)
    # Bug 184/195 (16 Oct 2026): the pill rows are no longer cut out of the translucent key. Zeroing `P & (a < 0.9)` tore the
    # client's own fades (Inpatient blanket and rail end) into horizontal streaks; the client's pixels are kept instead: where the
    # file fades into its backdrop the colour already carries the gradient + stroke, and the page draws the same gradient and the
    # same stack at the same spot behind it (full mode: one canvas for both), so it reads as the client file.
    # in the strip the larger of the two: the reference where its edge is clean (no key notches on a pale coat), the key where
    # the reference was cropped or feathered
    a = wr * ref_a + (1 - wr) * np.maximum(ref_a, ka)
    a[(wr < 0.5) & (ka < 0.15) & (ref_a < 0.5)] = 0  # backdrop in the client file, only the reference's feather says otherwise
    # Bug 185 (16 Oct 2026): the reference outline is never more than HALO px wider than the client's own subject (the key):
    # where the old live file was cut wider or the client redrew an edge (KSA Homecare, In-School coat, Ventilation rail) the
    # backdrop inside the old outline showed as a pale band with pill pieces.
    far = cv2.distanceTransform((ka < 0.25).astype(np.uint8), cv2.DIST_L2, 5)
    a = np.minimum(a, np.clip((FULL_HALO + 4 - far) / 4, 0, 1))
    # thin pill-coloured slivers (stroke edges the background estimate misses: 1-4 px tall navy / cyan / green lines in the start
    # strip, where a file's pill row runs further than `_pills.png`, e.g. Homecare, Contact, Cerebral Palsy): horizontal
    # structures under 9 px tall, of a blue-green hue (grey wheel spokes, black tyres and skin are not), are removed in the key
    # strip and on the pill geometry; the physiotherapy band and lanyards are 15+ px tall or vertical and stay
    solid = cv2.morphologyEx((a > 0.05).astype(np.uint8), cv2.MORPH_OPEN, np.ones((9, 1), np.uint8))
    hue = (np.maximum(rgb[..., 1], rgb[..., 2]) - rgb[..., 0]) > 0.08
    zone = (cv2.dilate(P.astype(np.uint8), np.ones((7, 7), np.uint8)) > 0) | (wr < 0.5)
    a[(a > 0) & (solid == 0) & hue & zone] = 0
    # the reference outline runs 1-2 px past the composite's subject in places, where a pill end shows: pill-coloured pixels
    # on the pill geometry within 8 px of the backdrop go (inside the subject they are cloth crossing a hidden line, kept)
    near = np.zeros(rgb.shape[:2], bool)
    for c in PILL_COLOURS:
        near |= np.abs(rgb - c).max(axis=2) < 0.12
    edge = cv2.distanceTransform((a > 0.05).astype(np.uint8), cv2.DIST_L2, 5) <= 8
    a[edge & P & near] = 0
    for _ in range(1):  # specks
        n, lab, stats, _c = cv2.connectedComponentsWithStats((a > 0.3).astype(np.uint8))
        for i in range(1, n):
            if stats[i, cv2.CC_STAT_AREA] < 400:
                a[lab == i] = 0
    box_a = a.copy()
    rgb, a = defringe(rgb, a, px=2 / NEW_SCALE)
    ys_, xs_ = np.nonzero(box_a > 0.05)
    x0, x1, y0, y1 = max(0, xs_.min() - 4), min(W, xs_.max() + 5), max(0, ys_.min() - 4), H
    crop = np.dstack([rgb[y0:y1, x0:x1], a[y0:y1, x0:x1]])
    size = (round((x1 - x0) * NEW_SCALE), round((y1 - y0) * NEW_SCALE))
    pm = crop.copy()
    pm[..., :3] *= pm[..., 3:4]
    out = cv2.resize(pm, size, interpolation=cv2.INTER_AREA)
    al = out[..., 3:4]
    out[..., :3] = np.where(al > 1e-4, out[..., :3] / np.maximum(al, 1e-4), 0)
    img = Image.fromarray((out.clip(0, 1) * 255 + 0.5).astype(np.uint8))
    disp = (round(size[0] / 2), round(size[1] / 2))
    from pill_place import STACK
    pills_at = [float(round((STACK[0] - x0) * NEW_SCALE / 2, 1)), float(round((STACK[1] - y0) * NEW_SCALE / 2, 1))]
    log(f'  full picture: box {x1 - x0}x{y1 - y0} at ({x0}, {y0}) -> {size[0]}x{size[1]} (display {disp[0]}x{disp[1]} live px, pills {pills_at}, reference x{1 / np.hypot(M[0, 0], M[1, 0]):.3f})')
    if outdir:
        os.makedirs(outdir, exist_ok=True)
        dest = f'{outdir}/{key.replace("/", "__")}{"" if region == "global" else "." + region}.png'
        img.save(dest)
        return dest
    dest = f'src/assets/regions/{region}/{key}-cutout.webp' if region != 'global' else f'src/assets/{key}-cutout.webp'
    for old in glob.glob(dest[:-5] + '.*'):
        os.remove(old)
    img.save(dest, lossless=True, method=6)
    mp = 'src/data/banner-art.json'
    man = json.load(open(mp))
    e = man.get(f'{region}:{key}', {'shape': True})
    e.update({'w': disp[0], 'h': disp[1], 'pills': pills_at, **frame_place(x1, W)})
    for flag in ('bleed', 'fade'):
        e.pop(flag, None)  # the feathered / cut edge is gone
    man[f'{region}:{key}'] = e
    json.dump(dict(sorted(man.items())), open(mp, 'w'), indent=1)
    return dest

if __name__ == '__main__':
    outdir = sys.argv[1] if len(sys.argv) > 1 else None
    only = sys.argv[2].split(',') if len(sys.argv) > 2 else None
    m = json.load(open('tools/banners/composites.json'))
    for file, e in m.items():
        if only and e['key'] not in only:
            continue
        print(file, '->', e['region'], e['key'])
        try:
            if e.get('full'):
                extract_full(file, e['key'], e['region'], outdir=outdir, extend=e.get('extend', False))
            elif e.get('new'):
                extract_new(file, e['key'], e['region'], pills=e.get('pills', False), outdir=outdir)
            else:
                extract(file, e['key'], e['region'], outdir)
        except Exception as ex:
            print('  FAILED', ex)
