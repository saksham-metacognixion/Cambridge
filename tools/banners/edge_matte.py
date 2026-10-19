"""Bugs 241-247 (19 Oct 2026): edge matting for a cut from cut_to_entry.py / client_cutout.py (removes the pale rim).
The key's mask runs ~1 composite px wide, so the outermost px are opaque but mostly the client's gradient: a light line along dark
garments and a pale ring where a navy pill stroke passes behind the people. For each outermost px (next to one with alpha < 128):
F = the mean colour of the interior (>= 5 px in, box radius R_IN), B = the gradient behind it (client_cutout.background(),
corrected by the local residual of the cut's own transparent px), and C = (1-t) F + t B gives the background share t. Alpha only
goes down (to 1-t) and the colour becomes (C - tB) / (1-t). Skipped where |F - B| < V_MIN (white cloth on the pale gradient:
t is ill-conditioned and the rim invisible), where the box holds < D_MIN/255 interior (fingers, crutches, hair strands), and where
C is not a mix of F and B within RES_MAX (metal, rim light). Render-back against the client files: neutral (Bugs 241-247 record).
    python3 -I tools/banners/edge_matte.py <composite.png> <cut.png> x0 y0 x1 y1 <out.png>   (box = cut_to_entry.py's "entry_box")"""
import json, sys
import os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from PIL import Image, ImageChops, ImageFilter, ImageMath
from client_cutout import background
Image.MAX_IMAGE_PIXELS = None
EDGE, V_MIN, R_IN, RES_MAX, D_MIN = 1, 80, 8, 10, 40
comp_p, cut_p = sys.argv[1:3]; x0, y0, x1, y1 = map(float, sys.argv[3:7]); out_p = sys.argv[7]
comp = Image.open(comp_p).convert('RGB')
cut = Image.open(cut_p).convert('RGBA'); w, h = cut.size
B = background(comp).resize(cut.size, Image.LANCZOS, box=(x0, y0, x1, y1))  # = crop + resize for an integer box
a = cut.getchannel('A')
# the linear model is up to ~7 off near the frame's end edge (Bugs 238-240): correct it by the local mean residual
# of the cut's own transparent px (their RGB is the composite's gradient), strokes left out (residual > 10)
bgpx = a.point(lambda v: 255 if v == 0 else 0)
res, ok = [], []
for C, Bc in zip(cut.split()[:3], B.split()):
    r = ImageMath.eval('convert(float(c) - float(b) + 128, "L")', c=C, b=Bc); res.append(r)
    ok.append(r.point(lambda v: 255 if abs(v - 128) <= 10 else 0))
m = ImageChops.multiply(ImageChops.multiply(ImageChops.multiply(bgpx, ok[0]), ok[1]), ok[2])
dm = m.filter(ImageFilter.BoxBlur(12))
B = Image.merge('RGB', [ImageMath.eval('convert(float(b) + (float(n) * 255 / max(float(d), 1) - 128) * (d >= 3), "L")', b=Bc,
                                       n=ImageChops.multiply(r, m).filter(ImageFilter.BoxBlur(12)), d=dm)
                        for Bc, r in zip(B.split(), res)])
notsolid = a.point(lambda v: 255 if v < 250 else 0)
# the outermost px: next to a mostly transparent one
band = ImageChops.multiply(a.point(lambda v: 255 if v < 128 else 0).filter(ImageFilter.MaxFilter(2 * EDGE + 1)), a.point(lambda v: 255 if v else 0))
inner = ImageChops.subtract(a.point(lambda v: 255 if v == 255 else 0), notsolid.filter(ImageFilter.MaxFilter(9)))
den = inner.filter(ImageFilter.BoxBlur(R_IN))
Fin = [ImageChops.multiply(ch, inner).filter(ImageFilter.BoxBlur(R_IN)) for ch in cut.split()[:3]]  # sum(C*m)/255 per box
Cp, Bp, ap, bp, dp = cut.load(), B.load(), a.load(), band.load(), den.load()
Fp = [f.load() for f in Fin]
out = cut.copy(); op = out.load()
n_edit = n_skip_v = n_skip_in = n_skip_res = 0; lost = 0
for y in range(h):
    for x in range(w):
        if not bp[x, y]: continue
        d = dp[x, y]
        if d < D_MIN: n_skip_in += 1; continue  # < ~16 % of the box is interior
        F = [Fp[k][x, y] * 255 / d for k in range(3)]
        Bc = Bp[x, y]; C = Cp[x, y]
        v = [Bc[k] - F[k] for k in range(3)]
        n2 = sum(q * q for q in v)
        if n2 < V_MIN * V_MIN: n_skip_v += 1; continue
        t = sum((C[k] - F[k]) * v[k] for k in range(3)) / n2
        t = min(1.0, max(0.0, t))
        if max(abs(C[k] - (1 - t) * F[k] - t * Bc[k]) for k in range(3)) > RES_MAX: n_skip_res += 1; continue  # not a mix of F and B (metal, rim light)
        al = min(ap[x, y], round(255 * (1 - t)))
        if 1 - t >= 0.3:
            col = tuple(min(255, max(0, round((C[k] - t * Bc[k]) / (1 - t)))) for k in range(3))
        else:
            col = tuple(min(255, max(0, round(F[k]))) for k in range(3))
        lost += ap[x, y] - al
        op[x, y] = (*col, al); n_edit += 1
out.save(out_p)
print(json.dumps({'edited': n_edit, 'skipped_white': n_skip_v, 'skipped_thin': n_skip_in, 'skipped_residual': n_skip_res, 'alpha_removed_px_equiv': round(lost / 255)}))
