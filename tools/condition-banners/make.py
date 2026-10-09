"""Condition-page hero banner from a supplied photo (bug 042, 8 Oct 2026).

    python3 -I tools/condition-banners/make.py <photo.(avif|png|jpg|webp)> <slug> [out-dir=src/assets/conditions] [work-dir]

Figma shows two condition banners (41:2373 Accidents, 67:3070 Stroke): a 1052x323 photo on the right that fades into the pale
gradient on the left (the title side). Every other condition page gets the same treatment from its own photo:
  - a transparent cut-out (how the live site stores its hero people, e.g. Epilepsy.avif) is placed over the Stroke banner's
    background layer with tools/region-photos/compose-subject.py (footprint = the Stroke man), like the KSA people (bug 063)
  - an opaque photo is cover-cropped to 1052x323 keeping its right side, then blended into that background with a left fade
Output: <out-dir>/<slug>.png (flat banner) + <slug>-subject.png + <slug>-bg.png (cursor-follow layers, heroLayers() in
src/lib/images.ts). The content file already points at the key conditions/<slug>; nothing else to wire.
"""
import os, subprocess, sys, tempfile
import numpy as np
from PIL import Image

src, slug = sys.argv[1], sys.argv[2]
out_dir = sys.argv[3] if len(sys.argv) > 3 else 'src/assets/conditions'
work = sys.argv[4] if len(sys.argv) > 4 else tempfile.mkdtemp(prefix='condition-banner-')
BASE_BG = 'src/assets/conditions/stroke-rehabilitation-bg.png'        # Figma gradient, the man filled out (tools/hero-layers)
BASE_SUBJECT = 'src/assets/conditions/stroke-rehabilitation-subject.png'  # footprint for compose-subject.py
W, H = 1052, 323
os.makedirs(out_dir, exist_ok=True)
os.makedirs(work, exist_ok=True)

bg = Image.open(BASE_BG).convert('RGBA')
assert bg.size == (W, H), bg.size
photo = Image.open(src).convert('RGBA')
alpha = np.array(photo)[..., 3]
cutout = (alpha < 10).mean() > 0.05  # a transparent people cut-out, not a full photo

subject_path = f'{out_dir}/{slug}-subject.png'
if cutout:
    subprocess.run([sys.executable, '-I', 'tools/region-photos/compose-subject.py', BASE_SUBJECT, src, subject_path, '1.6', '40'], check=True)
    subject = Image.open(subject_path).convert('RGBA')
    flat = Image.alpha_composite(bg, subject)
    bg_out = bg
else:
    # cover crop keeping the right side (the person) and the vertical middle
    s = max(W / photo.width, H / photo.height)
    p = photo.resize((round(photo.width * s), round(photo.height * s)), Image.LANCZOS)
    left, top = p.width - W, (p.height - H) // 2
    p = p.crop((left, top, left + W, top + H))
    # left fade like the Stroke banner: fully gradient up to 38 % of the width, fully photo from 64 %
    x = np.linspace(0, 1, W)
    t = np.clip((x - 0.38) / (0.64 - 0.38), 0, 1)
    ramp = (t * t * (3 - 2 * t) * 255).astype(np.uint8)
    p.putalpha(Image.fromarray(np.tile(ramp, (H, 1))))
    flat = Image.alpha_composite(bg, p)
    # cursor-follow layers from the flat banner, like every Figma banner (Apple Vision mask + row fill)
    flat_path = f'{work}/{slug}.png'
    flat.save(flat_path)
    mask_bin = f'{work}/hero-mask'
    if not os.path.exists(mask_bin):
        subprocess.run(['swiftc', '-O', 'tools/hero-layers/mask.swift', '-o', mask_bin], check=True)
    d = f'{work}/{slug}'
    os.makedirs(d, exist_ok=True)
    subprocess.run([mask_bin, flat_path, d], check=True, stdout=subprocess.DEVNULL)
    subprocess.run([sys.executable, 'tools/hero-layers/split.py', flat_path, f'{d}/mask-all.png', out_dir], check=True)
    bg_out = None

flat.save(f'{out_dir}/{slug}.png')
if bg_out is not None:
    bg_out.save(f'{out_dir}/{slug}-bg.png')
print(f'{out_dir}/{slug}.png ({"cut-out" if cutout else "photo"}) + -subject + -bg')
