"""Split a flat hero banner into the two cursor-follow layers (see src/scripts/hero-follow.ts).

    swiftc -O tools/hero-layers/mask.swift -o /tmp/hero-mask
    /tmp/hero-mask <banner.png> <work-dir>                         # -> <work-dir>/mask-all.png (Apple Vision subject mask)
    python3 tools/hero-layers/split.py <banner.png> <mask.png> <out-dir> [dilate=7]   # -> <out-dir>/<stem>-subject.png + <out-dir>/<stem>-bg.png

subject = the banner with the Vision mask as alpha (the people only).
bg      = the banner with the people removed: each row is filled by blending from the pixels just left of them to
          the pixels just right of them, which carries the gradient and the horizontal pill lines straight through.
          The people only drift ~10px (banner px), so only a thin strip of this fill is ever visible.
Output goes next to the flat banner in src/assets (`<key>-subject` / `<key>-bg`, picked up by heroLayers() in
src/lib/images.ts); Home used banner3.png -> hero/banner3-subject.png + hero/banner3-bg.png (2 Oct 2026), the inner
pages followed on 7 Oct 2026 (tools/hero-layers/run-all.sh).
"""
import os, sys
import numpy as np, cv2
from PIL import Image

src, mask, out = sys.argv[1], sys.argv[2], sys.argv[3]
DIL = int(sys.argv[4]) if len(sys.argv) > 4 else 7  # hole growth in px; larger when thin strokes (a map outline) escape the mask
stem = os.path.splitext(os.path.basename(src))[0]
im = np.array(Image.open(src).convert('RGBA')).astype(np.float32)
a = np.array(Image.open(mask).convert('L'))
H, W = a.shape
hole = cv2.dilate((a > 4).astype(np.uint8), np.ones((DIL, DIL), np.uint8)) > 0  # grown so no soft edge of them stays
K = 3  # pixels averaged on each side
bg = im.copy()
for y in range(H):
    row = hole[y]
    x = 0
    while x < W:
        if not row[x]: x += 1; continue
        s = x
        while x < W and row[x]: x += 1
        L = im[y, max(0, s - K):s].mean(0) if s > 0 else None
        R = im[y, x:min(W, x + K)].mean(0) if x < W else None
        if L is None and R is None: continue  # the whole row is subject: left as is
        L = R if L is None else L
        R = L if R is None else R
        t = np.linspace(0, 1, x - s + 2)[1:-1][:, None]
        bg[y, s:x] = L * (1 - t) + R * t
# Bottom rows: the side samples there touch the people's soft edges, so reuse the last clean row.
clean = H - 6
# A few dark pixels of their bottom edge can sit just outside the mask, next to its right end: clean those too.
for y in range(clean + 1, H):
    if not hole[y].any(): continue
    bg[y, hole[y], :3] = bg[clean, hole[y], :3]
    near_end = np.abs(np.arange(W) - np.where(hole[y])[0].max()) < 40
    dark = (bg[y, :, :3].sum(1) < 540) & near_end
    bg[y, dark, :3] = bg[clean, dark, :3]
# People cut by the banner's side edge (most inner-page banners: the rightmost person runs off x 1051): when the subject
# drifts away from that edge (at most ~11 banner px) the strip it uncovers shows the ORIGINAL pixels there, not the fill, so
# the person stays attached to the edge instead of leaving a gap. The seam at EDGE is never uncovered (drift < EDGE).
EDGE = 14
bg[:, :EDGE] = im[:, :EDGE]
bg[:, W - EDGE:] = im[:, W - EDGE:]
cut = im.copy()
cut[..., 3] = a.astype(np.float32) * (im[..., 3] / 255.0)
os.makedirs(out, exist_ok=True)
Image.fromarray(np.clip(bg, 0, 255).astype(np.uint8)).save(f'{out}/{stem}-bg.png', optimize=True)
Image.fromarray(np.clip(cut, 0, 255).astype(np.uint8)).save(f'{out}/{stem}-subject.png', optimize=True)
cov = (a > 4).mean() * 100
cols = np.where((a > 4).any(0))[0]; rows = np.where((a > 4).any(1))[0]
print(f'{stem}: mask {cov:.1f}% of the image, x {cols.min()}-{cols.max()} of {W}, y {rows.min()}-{rows.max()} of {H}')
