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

ROOT = 'docs/client-assets/website-images-oct16/'
BG = ROOT + '_bg.png'


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
    rad = max(1, round(k * 2))
    ker = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * rad + 1, 2 * rad + 1))
    gate = cv2.GaussianBlur(cv2.dilate((ca > 0.02).astype(np.float32), ker), (0, 0), k * 0.8)
    core = cv2.erode((ca > 0.98).astype(np.float32), ker)
    sharp = np.clip((ca - 0.5) * 3 + 0.5, 0, 1)
    a = np.maximum(np.maximum(hd[..., 3] * gate, core), np.minimum(sharp, gate))
    # colours straight from the composite: its gradient is the banner gradient we draw, so a partly blended edge pixel blends
    # into the same colours on the page (un-blending amplified noise into dark rings)
    out = np.dstack([hd[..., :3], a])
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
    if pills:
        # hospital pages: the pill strokes (keyed against the plain gradient) outside the building, NOT hole-filled, so the
        # outlines stay thin for split_pills
        grad = np.asarray(Image.open(ROOT + '_grad.png').convert('RGBA')).astype(np.float32) / 255
        dg = np.abs(comp[..., :3] - grad[..., :3]).max(axis=2)
        ap = np.clip((dg - 0.03) / 0.13, 0, 1)
        building = cv2.dilate((a > 0.5).astype(np.uint8), np.ones((5, 5), np.uint8)) > 0
        ap[building] = 0
        a = np.maximum(a, ap)
    # specks
    n, lab, stats, _ = cv2.connectedComponentsWithStats((a > 0.3).astype(np.uint8))
    for i in range(1, n):
        if stats[i, cv2.CC_STAT_AREA] < 400:
            a[lab == i] = 0
    ys, xs = np.nonzero(a > 0.05)
    x0, x1, y0, y1 = max(0, xs.min() - 4), min(comp.shape[1], xs.max() + 5), max(0, ys.min() - 4), comp.shape[0]  # to the bottom edge
    crop = np.dstack([comp[y0:y1, x0:x1, :3], a[y0:y1, x0:x1]])
    size = (round((x1 - x0) * NEW_SCALE), round((y1 - y0) * NEW_SCALE))
    pm = crop.copy()
    pm[..., :3] *= pm[..., 3:4]
    out = cv2.resize(pm, size, interpolation=cv2.INTER_AREA)
    al = out[..., 3:4]
    out[..., :3] = np.where(al > 1e-4, out[..., :3] / np.maximum(al, 1e-4), 0)
    img = Image.fromarray((out.clip(0, 1) * 255 + 0.5).astype(np.uint8))
    disp = (round(size[0] / 2), round(size[1] / 2))
    log(f'  new picture: subject box {x1 - x0}x{y1 - y0} -> {size[0]}x{size[1]} (display {disp[0]}x{disp[1]} live px)')
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
        for flag in ('bleed', 'fade'):
            e.pop(flag, None)  # the old picture's cut-edge flags do not apply
        man[f'{region}:{key}'] = e
        json.dump(dict(sorted(man.items())), open(mp, 'w'), indent=1)
        if pills:  # hospital page: building alone + <key>-pills.svg from this cut-out (pills 69 px tall here vs 27 in the live files)
            from split_pills import write as split_write
            split_write(key.split('/banner-')[1], src=dest, scale=2.55)
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
            if e.get('new'):
                extract_new(file, e['key'], e['region'], pills=e.get('pills', False), outdir=outdir)
            else:
                extract(file, e['key'], e['region'], outdir)
        except Exception as ex:
            print('  FAILED', ex)
