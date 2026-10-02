"""Split a flat hero banner into the two cursor-follow layers (see src/scripts/hero-follow.ts).

    swift tools/hero-layers/mask.swift <dir>      # <dir>/banner3.png -> <dir>/mask-1.png (Apple Vision subject mask)
    python3 tools/hero-layers/split.py <dir>      # -> <dir>/banner3-subject.png + <dir>/banner3-bg.png

subject = the banner with the Vision mask as alpha (the people only).
bg      = the banner with the people removed: each row is filled by blending from the pixels just left of them to
          the pixels just right of them, which carries the gradient and the horizontal pill lines straight through.
          The people only drift ~10px (banner px), so only a thin strip of this fill is ever visible.
Then copy both into src/assets/hero/ (or src/assets/regions/<ae|sa>/hero/ for a region's own banner).
"""
import sys
import numpy as np, cv2
from PIL import Image

d = sys.argv[1]
im = np.array(Image.open(f'{d}/banner3.png').convert('RGBA')).astype(np.float32)
a = np.array(Image.open(f'{d}/mask-1.png').convert('L'))
H, W = a.shape
hole = cv2.dilate((a > 4).astype(np.uint8), np.ones((7, 7), np.uint8)) > 0  # grown so no soft edge of them stays
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
cut = im.copy()
cut[..., 3] = a.astype(np.float32) * (im[..., 3] / 255.0)
Image.fromarray(np.clip(bg, 0, 255).astype(np.uint8)).save(f'{d}/banner3-bg.png', optimize=True)
Image.fromarray(np.clip(cut, 0, 255).astype(np.uint8)).save(f'{d}/banner3-subject.png', optimize=True)
