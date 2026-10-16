"""Bug 175 (16 Oct 2026): light matte around the people keyed out of the client's composites (tools/banners/composite.py).

The composites draw the people over a pale gradient (~ rgb 210,218,224 behind the figures). The difference key against the
estimated background (`_bg.png`) is unreliable right next to the people, so a band of that pale backdrop (up to ~7 px at 2x)
was kept opaque, and the soft edge pixels carried the backdrop colour: a white halo on the dark pill shape the page draws
behind the cut-out.

`defringe(rgb, a, px)` re-keys the edge band against the LOCAL backdrop:
  B (backdrop) = the composite's own colour just outside the silhouette (normalised convolution of the confident background),
  a' = a soft key on the distance to B (max channel: 0 within 0.02, 1 from 0.10); in the band the alpha is only ever lowered,
       min(a, a'). The halo IS the backdrop colour, so it keys out; a white coat (~0.12 from the pale backdrop), skin, hair
       and shading stay opaque. (A projection onto a B -> F line was tried first: the grey shading of the coats read as F
       and thinned the white coat pixels.)
  colour = C un-blended from B, (C - (1 - a')B) / a', for the pixels that stay partly transparent, faded to the colour just
       inside (F, opaque subject pixels unlike B) for the faintest ones, where un-blending amplifies noise.
Pixels away from the edge are untouched, so a clean edge comes back unchanged.

rgb: HxWx3 float 0..1, the OPAQUE source (the composite, so the backdrop colour exists outside the subject);
a: HxW float 0..1; px: file pixels per display (live) pixel (2 for the 2x cut-outs). Returns (rgb, a).
"""
import cv2
import numpy as np


def _nconv(img, w, sigma):
    """Normalised convolution: the w-weighted local mean of img (HxWxC), and the local weight."""
    num = cv2.GaussianBlur(img * w[..., None], (0, 0), sigma)
    den = cv2.GaussianBlur(w, (0, 0), sigma)
    return num / np.maximum(den, 1e-6)[..., None], den


def _fill(img, w, sigmas):
    """Local mean of img over the w pixels, widening the window until every pixel has support."""
    out, got = _nconv(img, w, sigmas[0])
    for s in sigmas[1:]:
        wide, den = _nconv(img, w, s)
        take = (got < 0.02)[..., None]
        out = np.where(take, wide, out)
        got = np.maximum(got, den)
    return out


def _smooth(x, lo, hi):
    t = np.clip((x - lo) / (hi - lo), 0, 1)
    return t * t * (3 - 2 * t)


def defringe(rgb, a, px=2.0, band=5.0):
    """band: how far into the subject (display px) the edge is examined; the halo seen on the site is up to ~3.5 display px."""
    rgb = rgb.astype(np.float32)
    a = a.astype(np.float32)
    k = lambda r: cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * max(1, round(r)) + 1,) * 2)
    # confident backdrop: clear of the subject's soft edge by a pixel
    bgw = (cv2.dilate((a > 0.02).astype(np.uint8), k(px)) == 0).astype(np.float32)
    B = _fill(rgb, bgw, [3 * px, 10 * px, 40 * px])
    # confident subject: opaque and unlike the local backdrop (the halo is opaque but backdrop-coloured)
    unlike = np.abs(rgb - B).max(axis=2) > 0.12
    fgw = ((a > 0.98) & unlike).astype(np.float32)
    fgw = cv2.erode(fgw, k(0.5 * px))
    F = _fill(rgb, fgw, [1.5 * px, 4 * px, 12 * px])
    # the edge band: within `band` display px of the backdrop
    near = cv2.distanceTransform((bgw == 0).astype(np.uint8), cv2.DIST_L2, 5) <= band * px
    edge = near & (a > 0)
    key = _smooth(np.abs(rgb - B).max(axis=2), 0.02, 0.10)
    a2 = a.copy()
    a2[edge] = np.minimum(a, key)[edge]
    # colour: un-blend the backdrop out of every edge pixel that stays partly transparent
    al = np.maximum(a2, 1e-3)[..., None]
    U = np.clip((rgb - (1 - al) * B) / al, 0, 1)
    mix = _smooth(a2, 0.15, 0.6)[..., None]
    col = F + (U - F) * mix
    out = rgb.copy()
    soft = edge & (a2 < 0.995)
    out[soft] = col[soft]
    return out, a2
