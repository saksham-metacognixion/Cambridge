"""Bugs 241-247 (19 Oct 2026): client_cutout.py's key at composite resolution (its NEW_SCALE set to 1 in this process; the repo file is untouched), then ONE
Lanczos resample straight onto the people box a banner-art.json entry implies (fractional composite px), so an entry can be kept
as it is with no sub-px residual. Entry box: x1 = 2880 - end*K, y1 = 1370 + drop*K, w*K x h*K (K = 1370/500); output 2w x 2h.
    python3 -I tools/banners/cut_to_entry.py <composite.png> <pillmask.png> '<entry json>' <out.png>"""
import io, json, sys, contextlib
import os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from PIL import Image
import client_cutout as cc
K = 1370 / 500
comp_p, pill_p, e, out_p = sys.argv[1], sys.argv[2], json.loads(sys.argv[3]), sys.argv[4]
cc.NEW_SCALE = 1.0
tmp = out_p + '.full.png'
buf = io.StringIO()
with contextlib.redirect_stdout(buf):
    cc.main(comp_p, pill_p, tmp)
info = json.loads(buf.getvalue().strip().splitlines()[-1])
bx0, by0, bx1, by1 = info['box']
full = Image.open(tmp).convert('RGBA')                  # composite px, = comp crop + key alpha
comp = Image.open(comp_p).convert('RGB'); W, H = comp.size
alpha = Image.new('L', (W, H), 0); alpha.paste(full.getchannel('A'), (bx0, by0))
x1 = W - e['end'] * K; y1 = H + e.get('drop', 0) * K; x0 = x1 - e['w'] * K; y0 = y1 - e['h'] * K
size = (round(2 * e['w']), round(2 * e['h']))
# subject outside the entry box would be lost
lost = sum(1 for v in alpha.crop((0, 0, W, H)).getdata() if v > 128) - sum(1 for v in alpha.crop((max(0, round(x0)), max(0, round(y0)), min(W, round(x1)), min(H, round(y1)))).getdata() if v > 128)
box = (x0, y0, x1, y1)
out = comp.resize(size, Image.LANCZOS, box=box).convert('RGBA')
out.putalpha(alpha.resize(size, Image.LANCZOS, box=box))
out.save(out_p)
os.remove(tmp)
print(json.dumps({'tool_box': info['box'], 'bridged': info.get('bridged'), 'entry_box': [round(v, 2) for v in box], 'size': size,
                  'opaque_outside_box_px': lost}))
