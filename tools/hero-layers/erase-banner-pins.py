"""Erase the pins baked into the Our Hospitals banner (src/assets/hospitals/banner-subject.png + banner.png), R071 (10 Oct 2026).
HeroMap.astro draws every pin (filtered by edition: /ae the UAE three, /sa the KSA three) at the hospitals' positions, so the
banner itself carries none (before, /ae showed the KSA pins baked into the photo and vice versa, and the UAE pins were misplaced).
- Pin mask: the cyan strokes (#00b8ff) inside each pin box, holes filled (pin bodies), grown 2 px for the anti-aliased rim.
- Land under the pins: the hero map vector (src/assets/hospitals/map.svg, the outline HeroMap draws; banner px offset found by
  matching, (601, 98)). Around the UAE the layer's own silhouette is simplified (no Qatar, a deeper notch south of Abu Dhabi),
  so that whole corner takes the vector's shape, feathered; the KSA pins only replace the pin area.
- Colour: a gradient fitted to the map fill around each area (the layer's own pixels kept wherever they were land already).
- Flat banner (~= banner-bg + subject): gets the composite's change, and the clean composite itself inside the pins.
Usage: python3 tools/hero-layers/erase-banner-pins.py <land.npy> <offset x> <offset y> <src_dir> <out_dir>
(land.npy = map.svg rasterized 1:1, outline closed with a 3 px dilation, inside flood-filled; .astro/qc-hosp/rasterize.mjs)"""
import sys, cv2, numpy as np
land_path, ox, oy, src, dst = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), sys.argv[4], sys.argv[5]
# (pin box x0, x1, y0, y1, inner rebuild box or None, colour sample box x0, x1, y0, y1): Figma 101:6609 pins, banner px
AREAS = [
    ((914, 992, 209, 274), (901, 1000, 203, 282), (820, 1000, 130, 320)),   # UAE: Abu Dhabi, Al Mudeef, Al Ain
    ((832, 882, 164, 222), None, (760, 900, 120, 300)),                      # Dhahran + Al Khobar
    ((676, 710, 255, 294), None, (620, 760, 200, 340)),                      # Jeddah
]
sub = cv2.imread(f'{src}/banner-subject.png', cv2.IMREAD_UNCHANGED).astype(np.float32)
bg = cv2.imread(f'{src}/banner-bg.png', cv2.IMREAD_UNCHANGED).astype(np.float32)
ban = cv2.imread(f'{src}/banner.png').astype(np.float32)
H, W = sub.shape[:2]
land = np.load(land_path); L = np.zeros((H, W), np.float32); lh, lw = land.shape
L[oy:oy + lh, ox:ox + lw] = land[:min(lh, H - oy), :min(lw, W - ox)]
alpha_v = cv2.GaussianBlur(L, (0, 0), 1.2) * 255
gy, gx = np.mgrid[0:H, 0:W]
b, g, r = sub[..., 0], sub[..., 1], sub[..., 2]
cyan = ((b - r > 45) & (g > 75) & (sub[..., 3] > 20)).astype(np.uint8)
out = sub.copy(); pins_all = np.zeros((H, W), np.uint8)
for (x0, x1, y0, y1), inner, (sx0, sx1, sy0, sy1) in AREAS:
    box = np.zeros((H, W), np.uint8); box[y0:y1, x0:x1] = 1
    m = cv2.morphologyEx(cyan * box, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
    ff = m * 255; fm = np.zeros((H + 2, W + 2), np.uint8); cv2.floodFill(ff, fm, (0, 0), 128)
    m = (((ff != 128) | (m > 0)) & (box > 0)).astype(np.uint8)
    m = cv2.dilate(m, np.ones((3, 3), np.uint8), iterations=2)
    pins_all |= m
    opaque = (sub[..., 3] > 250) & (m == 0)
    ys, xs = np.nonzero(opaque[sy0:sy1, sx0:sx1]); ys += sy0; xs += sx0
    coef = np.linalg.lstsq(np.c_[np.ones(len(xs)), xs, ys], sub[ys, xs, :3], rcond=None)[0]
    fill = np.stack([coef[0, c] + coef[1, c] * gx + coef[2, c] * gy for c in range(3)], -1)
    w = cv2.GaussianBlur(m.astype(np.float32), (0, 0), 0.8)
    if inner:
        R = np.zeros((H, W), np.float32); R[inner[2]:inner[3], inner[0]:inner[1]] = 1
        w = np.maximum(cv2.GaussianBlur(R, (0, 0), 4), w)
    base = np.where(opaque[..., None], out[..., :3], fill)
    out[..., :3] = out[..., :3] * (1 - w[..., None]) + base * w[..., None]
    out[..., 3] = out[..., 3] * (1 - w) + alpha_v * w
def comp(layer):
    a = layer[..., 3:4] / 255
    return layer[..., :3] * a + bg[..., :3] * (1 - a)
nb = ban + (comp(out) - comp(sub))
mp = cv2.GaussianBlur(cv2.dilate(pins_all, np.ones((3, 3), np.uint8), iterations=2).astype(np.float32), (0, 0), 1.0)[..., None]
nb = nb * (1 - mp) + comp(out) * mp
cv2.imwrite(f'{dst}/banner-subject.png', np.clip(out, 0, 255).round().astype(np.uint8))
cv2.imwrite(f'{dst}/banner.png', np.clip(nb, 0, 255).round().astype(np.uint8))
left = cv2.connectedComponentsWithStats((((np.clip(out, 0, 255)[..., 0] - np.clip(out, 0, 255)[..., 2]) > 45) & (out[..., 1] > 75) & (out[..., 3] > 20)).astype(np.uint8))[2][1:]
print('pin pixels', int(pins_all.sum()), '| cyan blobs left (x>550, >15 px):', [tuple(s[:4]) for s in left if s[4] > 15 and s[0] > 550])
