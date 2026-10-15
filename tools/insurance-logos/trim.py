"""Home insurer-strip logo from a larger source (bug 137, 15 Oct 2026).

Flattens the source on white (the strip's background, like the 9 Oct files) and trims it to its artwork (every pixel further
than 8 levels from white), so the logo fills its Figma box with `fit="contain"` and no built-in margin; nothing is scaled,
sharpened or recoloured. Usage: python3 -I tools/insurance-logos/trim.py <source> <dest.png>
"""
import sys
from PIL import Image, ImageChops

src, dst = sys.argv[1:3]
im = Image.open(src).convert('RGBA')
flat = Image.new('RGBA', im.size, (255, 255, 255, 255))
flat.alpha_composite(im)
rgb = flat.convert('RGB')
diff = ImageChops.difference(rgb, Image.new('RGB', rgb.size, (255, 255, 255))).convert('L').point(lambda v: 255 if v > 8 else 0)
box = diff.getbbox()
if not box:
    sys.exit(f'{src}: no artwork found')
out = rgb.crop(box)
out.save(dst, optimize=True)
print(f'{dst}: {im.size[0]}x{im.size[1]} -> {out.size[0]}x{out.size[1]} (box {box})')
