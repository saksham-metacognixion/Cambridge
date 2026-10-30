"""Region hero subject layer (bug 063, 8 Oct 2026): put a region's people cut-out on the Global banner's canvas.

    python3 tools/region-photos/compose-subject.py <global-subject.png> <cutout.(png|avif)> <out.png> [max-scale=1.35] [feather=40]

The Global hero is two layers (tools/hero-layers): <key>-bg (gradient + pills, the people filled out row by row) and
<key>-subject (the people). A region only replaces the subject: its cut-out (the live KSA site's transparent banner, or a
card photo cut out with tools/hero-layers/mask.swift) goes where the Global people stand, so the Figma composition stays
(people on the right, the text side clear) and the filled hole in <key>-bg stays covered.
Placement = the scale / x offset that leaves the least of the Global people's footprint uncovered (that fill is only meant
to show in the ~10px cursor drift), never reaching further left than the Global people, never smaller than them:
  - when the cut-out is cropped at its bottom (people cut by the frame) it may run past the banner's bottom edge, else it
    stands on the Global people's bottom
  - right edge on the banner's right edge when the cut-out is cropped at its right side
  - the people's top stays inside the banner and at most 40px above the Global people's top (same size, no zoom)
  - a side cropped by the source (a card photo) that does not land on a banner edge is faded out over `feather` px (smoothstep), only in the rows where the crop cuts the people
Output = RGBA canvas of the Global subject's size -> src/assets/regions/<region>/<key>-subject.png.
"""
import sys
import cv2
import numpy as np
from PIL import Image

g_path, c_path, out = sys.argv[1:4]
MAX_S = float(sys.argv[4]) if len(sys.argv) > 4 else 1.35
FEATHER = int(sys.argv[5]) if len(sys.argv) > 5 else 40  # px; smoothstep fade
TOP_MIN, TOP_UP = 4, 40  # heads stay in the frame, at most 40px taller than the Global people
g = Image.open(g_path).convert('RGBA')
W, H = g.size
ga = np.array(g.split()[-1]) > 24
ys, xs = np.nonzero(ga)
gx0, gy0, gx1, gy1 = xs.min(), ys.min(), xs.max() + 1, ys.max() + 1
c = Image.open(c_path).convert('RGBA')
ca = np.array(c.split()[-1]) > 24
ys, xs = np.nonzero(ca)
cx0, cy0, cx1, cy1 = xs.min(), ys.min(), xs.max() + 1, ys.max() + 1
# Drop detached specks (stray pixels some live cut-outs carry, e.g. a red dot at the post-acute banner's edge): keep only
# the alpha components larger than 0.5% of the people's area.
alpha = np.array(c.split()[-1])
n, lab, stats, _ = cv2.connectedComponentsWithStats((alpha > 24).astype(np.uint8), 8)
keep = np.zeros(n, bool); keep[1:] = stats[1:, cv2.CC_STAT_AREA] >= 0.005 * stats[1:, cv2.CC_STAT_AREA].sum()
c.putalpha(Image.fromarray(np.where(keep[lab] | (alpha <= 24), alpha, 0).astype(np.uint8)))
ca = np.array(c.split()[-1]) > 24
ys, xs = np.nonzero(ca)
cx0, cy0, cx1, cy1 = xs.min(), ys.min(), xs.max() + 1, ys.max() + 1
cut = c.crop((cx0, cy0, cx1, cy1))
touch = {'left': cx0 == 0, 'right': cx1 == c.width, 'bottom': cy1 == c.height}
s_min = min((gy1 - gy0) / cut.height, 0.6 * (gx1 - gx0) / cut.width) * 0.85


def place(s):
    w, h = round(cut.width * s), round(cut.height * s)
    # cropped at its bottom: may run past the banner's bottom edge (the frame cuts the people), else stands on the Global bottom
    ys_ = [y for y in range(max(TOP_MIN, int(gy0) - TOP_UP), int(gy0) + 80, 4) if y + h >= H] if touch['bottom'] else [int(gy1) - h]
    xs_ = [W - w] if touch['right'] else range(int(gx0) - 10, int(W - w * 0.6), 4)
    return w, h, ys_, xs_


best = None
small = 4  # score on a 1/4 grid
gs = ga[::small, ::small]
for s in np.arange(s_min, max(s_min, MAX_S) + 1e-9, 0.02):
    w, h, ys_, xs_ = place(s)
    a = np.array(cut.split()[-1].resize((max(w // small, 1), max(h // small, 1)))) > 24
    for x, y in ((x, y) for y in ys_ for x in xs_):
        if y < max(TOP_MIN, gy0 - TOP_UP):
            continue
        if x < gx0 - 10:
            continue
        cov = np.zeros_like(gs)
        X, Y = x // small, y // small
        sx0, sy0 = max(-X, 0), max(-Y, 0)
        dx0, dy0 = max(X, 0), max(Y, 0)
        hh = min(a.shape[0] - sy0, cov.shape[0] - dy0)
        ww = min(a.shape[1] - sx0, cov.shape[1] - dx0)
        if hh <= 0 or ww <= 0:
            continue
        cov[dy0:dy0 + hh, dx0:dx0 + ww] = a[sy0:sy0 + hh, sx0:sx0 + ww]
        exposed = (gs & ~cov).sum()
        score = exposed + 0.05 * s * 1000  # prefer the smaller of two equal fits
        if best is None or score < best[0]:
            best = (score, s, x, y, w, h, exposed)
_, s, x, y, w, h, exposed = best
big = cut.resize((w, h), Image.LANCZOS)
al = np.array(big.split()[-1]).astype(np.float32)
ramp = np.clip(np.arange(w) / FEATHER, 0, 1)
ramp = ramp * ramp * (3 - 2 * ramp)
def rows_cut(col):
    # rows where the people reach the source's border (the crop), blurred vertically so the fade starts and ends softly
    r = (col > 24).astype(np.float32)
    k = max(h // 12, 1)
    r = np.convolve(r, np.ones(2 * k + 1) / (2 * k + 1), 'same')
    return np.clip(r * 1.5, 0, 1)[:, None]


src_a = np.array(big.split()[-1])
if touch['left'] and x > 0:
    al *= 1 - rows_cut(src_a[:, 0]) * (1 - ramp[None, :])
if touch['right'] and x + w < W:
    al *= 1 - rows_cut(src_a[:, -1]) * (1 - ramp[::-1][None, :])
big.putalpha(Image.fromarray(al.astype(np.uint8)))
canvas = Image.new('RGBA', (W, H), (0, 0, 0, 0))
canvas.alpha_composite(big, (max(x, 0), max(y, 0)), (max(-x, 0), max(-y, 0)))
canvas.save(out, optimize=True)
print(out.split('/')[-2:], 'scale %.2f' % s, 'at', (int(x), int(y)), 'size', (w, h), 'global', (int(gx0), int(gy0), int(gx1), int(gy1)),
      'uncovered %.1f%%' % (100 * exposed / gs.sum()), {k: v for k, v in touch.items() if v})
