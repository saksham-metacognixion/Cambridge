"""python3 -I .astro/qc-r184/cmp.py <shots dir> [panels dir]: each rendered hero vs its client composite (paths.json).
The client file is scaled to the rendered pill stack (562.31 live px = the stack's rendered width) and placed on it (mirrored when
the page mirrors the art). Then the client's own subject (keyed vs _bg.png) is SIFT-fitted between the render and the placed file:
`err` = max displacement (screen px) of the people box corners between where the page draws the people and where the client file
draws them relative to the pills; `diff` = mean |render - client| (0-255) inside the client's subject. Writes <shots>/cmp.json and,
with a panels dir, render | client | 50% blend panels."""
import json, os, sys
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageOps
sys.path.insert(0, 'tools/banners')
from hd import fit
from pill_place import STACK
C = 'docs/client-assets/website-images-oct16/'
LIVE = 500 / 1370
shots = sys.argv[1]; panels = sys.argv[2] if len(sys.argv) > 2 else None
mp = json.load(open('.astro/qc-r184/paths.json'))
rep = json.load(open(shots + '/report.json'))
bg = np.asarray(Image.open(C + '_bg.png').convert('RGB')).astype(np.float32) / 255
cache = {}
def client(f):
    if f not in cache:
        c = np.asarray(Image.open(C + f).convert('RGB')).astype(np.float32) / 255
        k = np.clip((np.abs(c - bg).max(axis=2) - 0.03) / 0.13, 0, 1)
        k = cv2.erode((k > 0.5).astype(np.uint8), np.ones((9, 9), np.uint8)).astype(np.float32)
        cache[f] = np.dstack([c, k])
    return cache[f]
res = []
for r in rep:
    if r.get('shape') is None or r['path'] not in mp:
        continue
    name = f"{r['path'].replace('/', '_') or '_'}-{r['w']}.png"
    S = np.asarray(Image.open(f'{shots}/{name}').convert('RGB')).astype(np.float32) / 255
    H, W = S.shape[:2]
    sx, sy, sw, sh = r['shape']
    f = sw / (STACK[2] * LIVE)  # screen px per composite px is LIVE * f
    k = LIVE * f
    cl = client(mp[r['path']])
    A = np.float32([[k, 0, sx - STACK[0] * k], [0, k, sy - STACK[1] * k]])
    if r['flip']:  # mirrored box: composite x -> stack right edge mirrored
        A = np.float32([[-k, 0, sx + sw + STACK[0] * k], [0, k, sy - STACK[1] * k]])
    canvas = cv2.warpAffine(cl, A, (W, H), flags=cv2.INTER_AREA, borderMode=cv2.BORDER_CONSTANT, borderValue=(1, 1, 1, 0))
    mask = canvas[..., 3] > 0.5
    px, py, pw, ph = r['people']
    box = (max(0, int(px)), max(0, int(py)), min(W, int(px + pw)), min(H, int(py + ph)))
    out = {'path': r['path'], 'w': r['w'], 'rtl': r['rtl'], 'flip': r['flip'], 'cutL': r['cutL'], 'cutR': r['cutR'], 'hscroll': r['hscroll'], 'edge': r['edge']}
    m = mask[box[1]:box[3], box[0]:box[2]]
    out['diff'] = round(float(np.abs(S - canvas[..., :3])[mask].mean() * 255), 1) if mask.any() else None
    try:
        cur = np.dstack([S, cv2.dilate(mask.astype(np.uint8), np.ones((15, 15), np.uint8)).astype(np.float32)])
        src = np.dstack([canvas[..., :3], mask.astype(np.float32)])
        fit(cur, src, max_rot=5)
        M = fit.last['M']
        pts = [(box[0], box[1]), (box[2], box[1]), (box[0], box[3]), (box[2], box[3])]
        out['err'] = round(max(float(np.hypot(*(M @ np.array([x, y, 1.0]) - np.array([x, y])))) for x, y in pts), 1)
        out['scale'] = round(float(np.hypot(M[0, 0], M[1, 0])), 3)
    except Exception as ex:
        out['err'] = None; out['fail'] = str(ex)
    res.append(out)
    if panels:
        os.makedirs(panels, exist_ok=True)
        a = Image.fromarray((S * 255).astype(np.uint8)); c = Image.fromarray((canvas[..., :3] * 255).clip(0, 255).astype(np.uint8))
        x0 = max(0, int(min(px, sx)) - 20) if not r['flip'] else max(0, int(px) - 20)
        x1 = min(W, int(max(px + pw, sx + sw)) + 20)
        crop = (x0, 0, x1, H)
        tiles = [('render', a.crop(crop)), ('client on the pills', c.crop(crop)), ('50%', Image.blend(a, c, 0.5).crop(crop))]
        tw = tiles[0][1].width
        sheet = Image.new('RGB', (tw * 3 + 20, H + 22), (40, 40, 40))
        for i, (t, im) in enumerate(tiles):
            sheet.paste(im, (i * (tw + 10), 22))
        ImageDraw.Draw(sheet).text((4, 4), f"{r['path']} @{r['w']}  err {out.get('err')} px  diff {out['diff']}", fill='white')
        if sheet.width > 2400:
            sheet = sheet.resize((sheet.width // 2, sheet.height // 2), Image.LANCZOS)
        sheet.save(f"{panels}/{name.replace('.png', '.jpg')}", quality=85)
json.dump(res, open(shots + '/cmp.json', 'w'), indent=1)
for o in res:
    flag = ' <--' if (o['err'] or 99) > 1.5 else ''
    print(f"{o['path']:44s} {o['w']:5d} err {o['err']!s:>6} diff {o['diff']!s:>5} cut L{o['cutL']} R{o['cutR']}{' HSCROLL' if o['hscroll'] else ''} {' '.join(o['edge'])}{flag}")
