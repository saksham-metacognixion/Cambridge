#!/usr/bin/env python3
"""Bug 115 (14 Oct 2026): repair the Why Cambridge hero layers (UAE/Global + KSA).

Two compositing defects came in with the 9 Oct client-folder swap (tools/client-assets/swap-hero.py):

1. <key>-bg.png: the refill behind the old people cut pill 2's right cap (x 826-849, y 112-157) and smeared its
   last pixels sideways into grey/navy stubs (y 116-118, 144-147), plus faint strokes at y 160-164 and a grey band at
   y 237-249 that the people hide today but the cursor-follow can uncover. The cap is restored from the original
   Figma banner (commit e03b2a8, identical to the current bg up to x 825), the stubs are flattened to the clean row colour.
2. <key>-subject.png: the client cut-out keeps a 1-2 px white matte (pale outline on the headcloth/shoulders).
   The outer 2 px ring takes the colour of the solid pixels just inside it (colour decontamination); alpha is untouched.

The flat <key>.png is rebuilt as bg + subject (as swap-hero.py does).

Usage: python3 tools/hero-layers/fix-why-banner.py <figma-banner.png>
       (git show e03b2a8:src/assets/why/banner.png > figma-banner.png)
"""
import sys
import numpy as np
from PIL import Image
from numpy.lib.stride_tricks import sliding_window_view as sw

FIGMA = np.array(Image.open(sys.argv[1]).convert('RGBA'))
LAYERS = ['src/assets/why', 'src/assets/regions/sa/why']
MIRROR = 1443  # pill 2: left cap x + right cap x (left 596 <-> right 847 on the middle row, 602 <-> 839-842 at y 120)


def clean_row(bg, y, x):
    return bg[y, x].copy()


def fix_bg(path):
    bg = np.array(Image.open(path).convert('RGBA'))
    dark = bg[..., :3].astype(int).sum(-1) < 600
    # 1. pill 2's right cap from Figma, up to the cap edge mirrored from the left cap; clean row colour beyond it.
    for y in range(110, 159):
        left = [x for x in range(590, 640) if dark[y, x]]
        edge = MIRROR - left[0] if left else -1
        ref = clean_row(bg, y, 920 if y in (114, 115, 116, 151, 152, 153) else 1000)
        for x in range(826, 941):
            bg[y, x] = FIGMA[y, x] if x <= edge + 1 else ref
    # 2. hidden strokes: flatten to the clean colour of the same row.
    for y in range(160, 165):
        bg[y, 850:1000] = clean_row(bg, y, 1000)
    for y in range(237, 250):
        bg[y, 850:] = clean_row(bg, y, 800)
    Image.fromarray(bg).save(path, optimize=True)
    return bg


def rings(transp, n):
    d = np.full(transp.shape, 99, int)
    d[transp] = 0
    cur = transp.copy()
    for k in range(1, n + 1):
        p = np.pad(cur, 1)
        nb = np.zeros_like(cur)
        for dy in (-1, 0, 1):
            for dx in (-1, 0, 1):
                nb |= p[1 + dy:1 + dy + cur.shape[0], 1 + dx:1 + dx + cur.shape[1]]
        d[nb & ~cur] = k
        cur = nb
    return d


def boxmean(v, m, r):
    pv = np.pad(np.where(m, v, 0), r)
    pm = np.pad(m.astype(float), r)
    s = sw(pv, (2 * r + 1, 2 * r + 1)).sum((-1, -2))
    c = sw(pm, (2 * r + 1, 2 * r + 1)).sum((-1, -2))
    return s / np.maximum(c, 1e-9), c


def fix_subject(path):
    """Colour decontamination of the outer 2 px ring: ring 2, then ring 1, takes the mean colour of its 3x3 neighbours
    one ring further in (the matte is a light green-tinted spill, e.g. (199,216,189) outside a (171,172,169) cloth edge)."""
    im = np.array(Image.open(path).convert('RGBA')).astype(float)
    a = im[..., 3]
    d = rings(a < 8, 6)
    changed = 0
    for k in (2, 1):
        ring = (a >= 8) & (d == k)
        src = (a >= 8) & (d > k)
        means = [boxmean(im[..., c], src, 1) for c in range(3)]
        has = ring & (means[0][1] > 0)
        for c in range(3):
            im[..., c][has] = means[c][0][has]
        changed += int(has.sum())
    Image.fromarray(np.clip(im.round(), 0, 255).astype(np.uint8)).save(path, optimize=True)
    return changed


for d in LAYERS:
    fix_bg(f'{d}/banner-bg.png')
    n = fix_subject(f'{d}/banner-subject.png')
    print(d, 'edge px decontaminated:', n)
flat = Image.alpha_composite(Image.open('src/assets/why/banner-bg.png').convert('RGBA'),
                             Image.open('src/assets/why/banner-subject.png').convert('RGBA'))
flat.convert('RGB').save('src/assets/why/banner.png', optimize=True)
