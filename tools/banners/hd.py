"""Higher-resolution copies of existing images from the client's originals (Website Images folder, 14 Oct 2026).

The client's files are the same photos at 2-3x our size but framed differently (and the condition banners are the
green-screen studio shots). fit() finds where our current image sits inside the original (SIFT + RANSAC, scale and
offset only), so the new copy keeps our exact framing and only gains pixels; the layout (banner-art.json display size,
object-position, crops) does not change.

    from hd import hd_copy
    hd_copy(current, original, out, green=False, k=2)   # writes out at k x the current size (less if the original is short)

CLI check:  python3 -I tools/banners/hd.py <current> <original> <out> [green] [k]
"""
import sys

import cv2
import numpy as np
from PIL import Image


def _rgba(path):
    return np.asarray(Image.open(path).convert('RGBA')).astype(np.float32) / 255


def _gray(a, bg):
    rgb = a[..., :3] * a[..., 3:4] + np.asarray(bg, np.float32) * (1 - a[..., 3:4])
    return cv2.cvtColor((rgb * 255).astype(np.uint8), cv2.COLOR_RGB2GRAY)


def fit(cur, src, max_rot=0.5):
    """Scale s and offset t with cur ~= src * s + t (pixels). Raises if the match is weak."""
    bg = np.median(np.concatenate([src[:8, :8, :3].reshape(-1, 3), src[:8, -8:, :3].reshape(-1, 3)]), axis=0)
    g1, g2 = _gray(cur, bg), _gray(src, bg)
    sift = cv2.SIFT_create(nfeatures=6000)
    m1 = (cur[..., 3] > 0.5).astype(np.uint8) * 255
    k1, d1 = sift.detectAndCompute(g1, m1)
    k2, d2 = sift.detectAndCompute(g2, None)
    pairs = [m for m, n in cv2.BFMatcher().knnMatch(d1, d2, k=2) if m.distance < 0.75 * n.distance]
    if len(pairs) < 12:
        raise RuntimeError(f'only {len(pairs)} matches')
    p1 = np.float32([k1[m.queryIdx].pt for m in pairs])
    p2 = np.float32([k2[m.trainIdx].pt for m in pairs])
    M, inl = cv2.estimateAffinePartial2D(p2, p1, method=cv2.RANSAC, ransacReprojThreshold=2.0, maxIters=5000)
    n_in = int(inl.sum())
    s = float(np.hypot(M[0, 0], M[1, 0]))
    rot = float(np.degrees(np.arctan2(M[1, 0], M[0, 0])))
    if n_in < 12 or abs(rot) > max_rot:
        raise RuntimeError(f'weak fit: {n_in} inliers, rotation {rot:.2f} deg')
    fit.last = {'M': M, 'rot': rot}  # the full similarity (with rotation) of the last fit, for warp_full()
    return s, (float(M[0, 2]), float(M[1, 2])), n_in


def key_green(src):
    """Alpha + despill for the studio green screen. Greenness = G - max(R, B); the backdrop sits ~0.35-0.5."""
    r, g, b = src[..., 0], src[..., 1], src[..., 2]
    gn = g - np.maximum(r, b)
    alpha = 1 - np.clip((gn - 0.06) / (0.22 - 0.06), 0, 1)
    out = src.copy()
    out[..., 1] = np.minimum(g, np.maximum(r, b) + 0.02)  # despill: no pixel greener than its red/blue
    out[..., 3] = alpha
    return out


def warp_full(src, M, k, size):
    """Like warp() but with the full similarity M (rotation included, from fit.last): cur = M * src, scaled by k."""
    A = M.copy() * k
    A[:, 2] = M[:, 2] * k
    pm = src.copy()
    pm[..., :3] *= pm[..., 3:4]
    w = cv2.warpAffine(pm, A, size, flags=cv2.INTER_AREA, borderMode=cv2.BORDER_CONSTANT, borderValue=(0, 0, 0, 0))
    a = w[..., 3:4]
    w[..., :3] = np.where(a > 1e-4, w[..., :3] / np.maximum(a, 1e-4), 0)
    return w


def warp(src, s, t, k, size):
    """src scaled by k*s (area filter: always a downscale here) and shifted by k*t into a size[0] x size[1] canvas."""
    f = k * s
    small = cv2.resize(src, (max(1, round(src.shape[1] * f)), max(1, round(src.shape[0] * f))), interpolation=cv2.INTER_AREA)
    fx, fy = small.shape[1] / src.shape[1], small.shape[0] / src.shape[0]
    M = np.float32([[1, 0, k * t[0] + (f - fx) * 0], [0, 1, k * t[1] + (f - fy) * 0]])
    # premultiply so edge pixels do not pick up the (keyed-out) background colour while shifting
    pm = small.copy()
    pm[..., :3] *= pm[..., 3:4]
    w = cv2.warpAffine(pm, M, size, flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=(0, 0, 0, 0))
    a = w[..., 3:4]
    w[..., :3] = np.where(a > 1e-4, w[..., :3] / np.maximum(a, 1e-4), 0)
    return w


def hd_copy(current, original, out, green=False, k=2.0, patch=False, solid=False, log=print):
    """solid (green only; Bugs 195/197, user decision 16 Oct 2026): the studio key is NOT bounded by the current alpha, so the
    furniture the live retouching faded out (chairs, table ends) is opaque wherever the original shows it, and the edge of the
    original's own frame is a hard cut (nothing is filled from the faded current copy there)."""
    cur, src = _rgba(current), _rgba(original)
    s, t, n_in = fit(cur, src)
    k = min(k, 1 / s)  # never upscale the original
    h, w = cur.shape[:2]
    size = (round(w * k), round(h * k))
    hd = warp(src, s, t, k, size)
    reach = warp(np.ones_like(src), s, t, k, size)[..., 3:4]  # where the original has pixels at all
    ca = cv2.resize(cur[..., 3], size, interpolation=cv2.INTER_CUBIC).clip(0, 1)
    if green or cur[..., 3].min() < 1:
        # Keep exactly the current cut: the current alpha (upscaled) bounds the new one. Inside its solid core the pixels stay
        # opaque and keep their own colour (green props such as the Tennis Elbow band survive the key); outside it: cleared.
        rad = max(1, round(k * 1.5))
        ker = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * rad + 1, 2 * rad + 1))
        core = cv2.GaussianBlur(cv2.erode((ca > 0.98).astype(np.uint8), ker).astype(np.float32), (0, 0), k * 0.5)
        # the current alpha grown by ~1.5 px: never trims the new, sharper outline, but keeps deliberate soft fades (the ICU
        # bed rail and sheet fade out at the frame edge on the live cut-out)
        outer = cv2.GaussianBlur(cv2.dilate(ca, ker), (0, 0), k * 0.4)
        if green:
            keyed = warp(key_green(src), s, t, k, size)
            hd[..., :3] = core[..., None] * hd[..., :3] + (1 - core[..., None]) * keyed[..., :3]
            hd[..., 3] = np.maximum(keyed[..., 3], core) * (reach[..., 0] if solid else outer)
        else:
            # an alpha original: its own edge, limited to the current cut; semi-transparent edge pixels of the original carry
            # its background colour (a blue sky fringe on the Jeddah towers), so inside the current edge they are made opaque
            # and outside it they are cut (the current cut-out's edge is clean)
            edge = np.clip((ca - 0.5) * 4 + 0.5, 0, 1)
            hd[..., 3] = np.where(edge > 0.5, np.maximum(hd[..., 3], edge), np.minimum(hd[..., 3], edge))
        # Opaque on the current image but transparent here (thin green props keyed out, e.g. the Tennis Elbow band; the pill
        # outlines drawn into the hospital-page cut-outs, absent from the originals): take the current pixels (upscaled).
        lost = cv2.GaussianBlur(((ca > 0.9) & (hd[..., 3] < 0.6)).astype(np.float32), (0, 0), k * 0.5)[..., None]
        upc = cv2.resize(cur, size, interpolation=cv2.INTER_CUBIC).clip(0, 1)
        hd = lost * upc + (1 - lost) * hd
    # a strip the original does not reach (it is framed tighter than ours): fill it from the current image, upscaled
    up = cv2.resize(cur, size, interpolation=cv2.INTER_CUBIC).clip(0, 1)
    if not solid:
        hd = reach * hd + (1 - reach) * up
    if patch:
        # The client's originals can predate the retouching on the live picture (the Cambridge Hospital logo on the scrubs,
        # a white tablet screen): where the content differs, keep the current pixels (upscaled) under a soft mask, so the
        # picture is unchanged and only gains detail elsewhere.
        back = cv2.resize(hd, (w, h), interpolation=cv2.INTER_AREA)
        d = np.abs(cur[..., :3] * cur[..., 3:4] - back[..., :3] * back[..., 3:4]).mean(axis=2)
        # inside the figures only (4 px in from the current outline): edge differences are the cut itself, not content
        inner = cv2.erode((cur[..., 3] > 0.98).astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9)))
        d = cv2.GaussianBlur(d * inner, (0, 0), 3)
        m = (d > 10 / 255).astype(np.uint8)
        m = cv2.dilate(m, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9)))
        m = cv2.GaussianBlur(cv2.resize(m.astype(np.float32), size, interpolation=cv2.INTER_LINEAR), (0, 0), 3 * k)[..., None]
        hd = m * up + (1 - m) * hd
        log(f'  patched {float((m[..., 0] > 0.5).mean()):.1%} of the frame from the current image')
    # how far the new copy is from the current one at the current size: mean, and the worst 12 px block (a retouched
    # detail such as a logo the original does not have shows up there, not in the mean)
    back = cv2.resize(hd, (w, h), interpolation=cv2.INTER_AREA)
    d = np.abs(cur[..., :3] * cur[..., 3:4] - back[..., :3] * back[..., 3:4]).mean(axis=2)
    err = float(d.mean() * 255)
    B = 12
    blocks = cv2.resize(d, (max(1, w // B), max(1, h // B)), interpolation=cv2.INTER_AREA)
    worst = float(blocks.max() * 255)
    by, bx = np.unravel_index(blocks.argmax(), blocks.shape)
    missing = float(1 - (cv2.resize(reach[..., 0], (w, h), interpolation=cv2.INTER_AREA) * cur[..., 3]).sum() / max(cur[..., 3].sum(), 1e-6))
    covered = missing < 0.002
    img = Image.fromarray((hd * 255 + 0.5).clip(0, 255).astype(np.uint8))
    if cur[..., 3].min() >= 1 and not green:
        img = img.convert('RGB')
    ext = out.rsplit('.', 1)[-1].lower()
    if ext == 'webp':
        img.save(out, lossless=True, method=6)
    elif ext == 'avif':
        img.save(out, quality=90)
    elif ext in ('jpg', 'jpeg'):
        img.convert('RGB').save(out, quality=92, subsampling=0)
    else:
        img.save(out, optimize=True)
    log(f'  {w}x{h} -> {size[0]}x{size[1]} (x{k:.2f}, original scale {1 / s:.2f}x, {n_in} inliers, '
        f'diff {err:.1f}/255, worst block {worst:.0f}/255 at {bx * B},{by * B}'
        + ('' if covered else f', {missing:.1%} of the picture filled from the current image') + ')')
    return {'size': size, 'err': err, 'worst': worst, 'at': (int(bx * B), int(by * B)), 'missing': missing}


if __name__ == '__main__':
    a = sys.argv[1:]
    hd_copy(a[0], a[1], a[2], green=len(a) > 3 and a[3] == 'green', k=float(a[4]) if len(a) > 4 else 2.0)
