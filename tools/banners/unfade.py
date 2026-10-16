"""Undo hero edge fades baked into banner cut-outs (Bugs 195 / 197, 16 Oct 2026; user decision the same day: the photo stays
solid, a hard cut where the picture itself ends). Called by prepare.py; on its own, from the project root:

    python3 -I tools/banners/prepare.py --unfade-only [--only=key1,key2]

tools/banners/banners.json `"unfade": {"<region>": mode}`, the source is always the pipeline's own (so a re-run gives the same
file): the live file of that region, or for "crop" the people box of our <key>-subject layer (as prepare.py crop()).

  "restore"  The live / Figma retouching faded furniture and clothing out with a soft brush, but the photo is still there under
             the fade (the colour channels keep it). Inside the wide feathers only (>= 7 px of partial alpha; the 1-2 px anti-
             aliased outline is left alone) alpha is scaled by 1 / T, so the picture is opaque again and ends in a short soft edge
             where the brush ran out. Pixels close to the old photo's backdrop colour (the faintest pixels of the feather) are not
             restored, and restored islands not joined to the people are dropped, so no backdrop smear comes back.
  "figma"    The Figma composite <key>.png shows the people solid and whole: key them against the backdrop layer <key>-bg.png
             inside the subject's box, fill the holes the subject layer had (a pale patch on a shirt), colours from the composite.
"""
import glob
import json
import os

import cv2
import numpy as np
from PIL import Image

T = 0.15  # alpha divisor in the feathers: a fade of ~100 px ends in ~15 px


def _disk(r):
    return cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * r + 1, 2 * r + 1))


def restore(img, backdrop=None):
    a = img[..., 3]
    partial = ((a > 0.02) & (a < 0.95)).astype(np.uint8)
    wide = cv2.morphologyEx(partial, cv2.MORPH_OPEN, _disk(3))  # a feather, not an anti-aliased outline
    zone = cv2.dilate(wide, _disk(3)) & (a > 0.02).astype(np.uint8)
    # Backdrop pixels seen through the feather are never restored: the Figma backdrop layer under the box (crop sources) and
    # the old photo's own backdrop = the feather's faintest pixels. The studio backdrops are all light, so a dark estimate
    # means the feather runs over the subject itself (a black abaya) and that guard is skipped.
    guards = [backdrop] if backdrop is not None else []
    faint = (zone > 0) & (a < 0.06)
    bg = np.median(img[..., :3][faint], axis=0) if faint.sum() > 50 else np.ones(3, np.float32)
    if bg.mean() > 0.5:
        guards.append(np.broadcast_to(bg, img[..., :3].shape))
    subject = np.ones(a.shape, np.float32)
    for g in guards:
        subject *= np.clip((np.abs(img[..., :3] - g).max(axis=2) - 0.05) / 0.10, 0, 1)
    wt = cv2.GaussianBlur(zone.astype(np.float32), (0, 0), 1.5) * subject
    na = a * (1 - wt) + np.clip(a / T, 0, 1) * wt
    n, lab, _, _ = cv2.connectedComponentsWithStats((na > 0.5).astype(np.uint8), 8)
    joined = np.zeros(n, bool)
    joined[np.unique(lab[a > 0.95])] = True
    joined[0] = False
    na = np.where((na > 0.5) & ~joined[lab], a, na)
    out = img.copy()
    out[..., 3] = na
    return out


def figma(key):
    comp = _rgba(f'src/assets/{key}.png')
    back = _rgba(f'src/assets/{key}-bg.png')
    subj = Image.open(f'src/assets/{key}-subject.png').convert('RGBA')
    x0, y0, x1, y1 = subj.getchannel('A').point(lambda v: 255 if v >= 8 else 0).getbbox()
    c, g = comp[y0:y1, x0:x1], back[y0:y1, x0:x1, :3]
    old = np.asarray(subj.crop((x0, y0, x1, y1))).astype(np.float32)[..., 3] / 255
    key_a = np.clip((np.abs(c[..., :3] - g).max(axis=2) - 0.03) / 0.06, 0, 1)
    m = cv2.morphologyEx((key_a > 0.5).astype(np.uint8), cv2.MORPH_CLOSE, _disk(2))
    # holes = backdrop-like areas inside the people (not joined to the box's top / start edge, where the real backdrop is)
    n, lab, st, _ = cv2.connectedComponentsWithStats(1 - m, 4)
    outside = set(lab[0, :]) | set(lab[:, 0])
    hole = np.isin(lab, [i for i in range(1, n) if i not in outside]) & (m == 0)
    solid = cv2.erode(((m > 0) | hole).astype(np.uint8), _disk(1)).astype(np.float32)
    out = c.copy()
    out[..., 3] = np.maximum(np.maximum(key_a, solid), old)
    return out


def _rgba(path):
    return np.asarray(Image.open(path).convert('RGBA')).astype(np.float32) / 255


def _source(key, region, src):
    """The cut-out's source pixels and, for a Figma crop, the backdrop layer under its box (the guard in restore())."""
    if src != 'crop':
        return _rgba(src), None
    p = f'src/assets/regions/{region}/{key}-subject.png' if region != 'global' else f'src/assets/{key}-subject.png'
    if not os.path.exists(p):
        p = f'src/assets/{key}-subject.png'
    im = Image.open(p).convert('RGBA')
    box = im.getchannel('A').point(lambda v: 255 if v >= 8 else 0).getbbox()
    bgp = p.replace('-subject.png', '-bg.png')
    backdrop = _rgba(bgp)[box[1]:box[3], box[0]:box[2], :3] if os.path.exists(bgp) else None
    return np.asarray(im.crop(box)).astype(np.float32) / 255, backdrop


def _save(arr, path):
    img = Image.fromarray((arr * 255 + 0.5).clip(0, 255).astype(np.uint8))
    ext = path.rsplit('.', 1)[-1].lower()
    if ext == 'webp':
        img.save(path, lossless=True, method=6)
    elif ext == 'avif':
        img.save(path, quality=90)
    else:
        img.save(path, optimize=True)


def unfade_all(cfg, only=None, log=print):
    for key, e in cfg.items():
        for region, mode in (e.get('unfade') or {}).items():
            if only and key not in only:
                continue
            pattern = f'src/assets/{key}-cutout.*' if region == 'global' else f'src/assets/regions/{region}/{key}-cutout.*'
            cur = glob.glob(pattern)
            if len(cur) != 1:
                raise SystemExit(f'{region}:{key}: expected one cut-out, found {cur}')
            src = e.get(region) or e['global']
            arr = figma(key) if mode == 'figma' else restore(*_source(key, region, src))
            before = Image.open(cur[0]).size
            if (arr.shape[1], arr.shape[0]) != before:
                raise SystemExit(f'{region}:{key}: source {arr.shape[1]}x{arr.shape[0]} != cut-out {before}')
            _save(arr, cur[0])
            log(f'unfade {region:6s} {key:46s} {mode:8s} -> {cur[0]}')


if __name__ == '__main__':
    import sys
    only = next((a.split('=', 1)[1].split(',') for a in sys.argv if a.startswith('--only=')), None)
    unfade_all(json.load(open('tools/banners/banners.json')), only)
