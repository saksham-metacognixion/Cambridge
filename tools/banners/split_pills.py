"""Hospital-page banners: split the live cut-out into the building alone + the pill outlines as an SVG (15 Oct 2026).

The live hospital banner files (docs/cambridge-images-live, 579x450) have the building AND 3-5 pill outlines drawn into one
transparent image, the pills behind the building. Kept as one raster they cannot be sharpened: a larger building photo has no
pills, and the pills upscaled from the 1x file blur. This reads each live file, keeps the building as <key>-cutout.png and
fits every pill (a rounded rectangle: x, y, w, h, stroke colour, stroke width) into <key>-pills.svg in the same box, so the
pills are vector and the building can be replaced by any larger photo of the same framing (banners.json "hd").

    python3 -I tools/banners/split_pills.py [outdir]      # outdir = trial run with overlay PNGs; default writes src/assets

Pill ends hidden behind the building are extended under it (invisible there, the building is drawn on top).
"""
import glob
import json
import os
import sys

import cv2
import numpy as np
from PIL import Image

KEYS = ['abu-dhabi', 'al-mudeef-abu-dhabi', 'al-ain', 'al-khobar', 'dhahran', 'jeddah']
cfg = json.load(open('tools/banners/banners.json'))


def runs(row, min_len):
    out, x, W = [], 0, len(row)
    while x < W:
        if row[x]:
            x0 = x
            while x < W and row[x]:
                x += 1
            if x - x0 >= min_len:
                out.append((x0, x - 1))
        else:
            x += 1
    return out


def colour(a, al, pts):
    pix = np.array([a[y, x, :3] for y, x in pts if al[y, x] > 200]) if pts else np.zeros((0, 3))
    if not len(pix):
        pix = np.array([a[y, x, :3] for y, x in pts if al[y, x] > 50]) if pts else np.zeros((0, 3))
    c = np.median(pix, axis=0) if len(pix) else np.zeros(3)
    return '#%02x%02x%02x' % tuple(int(v) for v in c)


def split(key):
    src = cfg[f'hospital-detail/banner-{key}']['global']
    im = Image.open(src).convert('RGBA')
    a = np.asarray(im).astype(np.float32)
    al = a[..., 3]
    H, W = al.shape
    anyp = (al > 8).astype(np.uint8)
    # building = the big solid shape: opening removes the thin outlines, keep the largest component, grow it back a little;
    # it keeps its own alpha (the Abu Dhabi fade)
    opened = cv2.morphologyEx(anyp, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7)))
    n, lab, stats, _ = cv2.connectedComponentsWithStats(opened)
    big = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
    core = (lab == big).astype(np.uint8)
    build = cv2.dilate(core, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5)))
    building = a.copy()
    building[..., 3] = np.where(build > 0, al, 0)
    # pill pixels: crisp strokes (soft shadows are not pills) outside the building core; a 1 px margin only, so the arcs
    # that touch a roof or tower edge stay (the building layer is drawn over them anyway)
    pills_m = (al > 100) & (cv2.dilate(core, np.ones((3, 3), np.uint8)) == 0)
    # 1. horizontal stroke runs, merged over consecutive rows
    strokes = []
    for y in range(H):
        for x0, x1 in runs(pills_m[y], 25):
            for s in strokes:
                if y - s['y1'] <= 1 and min(x1, s['x1']) - max(x0, s['x0']) > 0.8 * min(x1 - x0, s['x1'] - s['x0']):
                    s['y1'], s['x0'], s['x1'] = y, min(s['x0'], x0), max(s['x1'], x1)
                    s['rows'].append((y, x0, x1))
                    break
            else:
                strokes.append({'y0': y, 'y1': y, 'x0': x0, 'x1': x1, 'rows': [(y, x0, x1)]})
    strokes.sort(key=lambda s: s['y0'])
    used, bands = set(), []
    for i, t in enumerate(strokes):
        if i in used:
            continue
        for j in range(i + 1, len(strokes)):
            b = strokes[j]
            dy = b['y0'] - t['y1']
            ov = min(t['x1'], b['x1']) - max(t['x0'], b['x0'])
            if j not in used and 20 <= dy <= 40 and ov > 0.5 * min(t['x1'] - t['x0'], b['x1'] - b['x0']):
                used.update({i, j})
                bands.append({'y0': t['y0'], 'y1': b['y1'] + 1, 'sw': ((t['y1'] - t['y0'] + 1) + (b['y1'] - b['y0'] + 1)) / 2,
                              'xs0': min(t['x0'], b['x0']), 'xs1': max(t['x1'], b['x1']), 'top': t['rows'], 'bot': b['rows']})
                break
    # 2. rows where only the two end arcs show (the straight part behind a roof): arc components outside every band
    singles = []  # unpaired straight strokes: the other line of the row is hidden
    hb = int(np.median([bd['y1'] - bd['y0'] for bd in bands])) if bands else 27
    for i, st in enumerate(strokes):
        if i in used or any(bd['y0'] - 3 <= st['y0'] <= bd['y1'] + 3 for bd in bands):
            continue
        sw = st['y1'] - st['y0'] + 1
        below = pills_m[st['y1'] + 3:st['y0'] + hb - 3, max(0, st['x0'] - 20):st['x1'] + 20].any() if st['y0'] + hb <= H else False
        above = pills_m[max(0, st['y1'] - hb + 3):st['y0'] - 3, max(0, st['x0'] - 20):st['x1'] + 20].any() if st['y1'] - hb >= 0 else False
        if below:   # a top line with arc pixels under it
            bands.append({'y0': st['y0'], 'y1': st['y0'] + hb, 'sw': float(sw), 'xs0': st['x0'], 'xs1': st['x1'], 'top': st['rows'], 'bot': []})
        elif above:  # a bottom line
            bands.append({'y0': st['y1'] + 1 - hb, 'y1': st['y1'] + 1, 'sw': float(sw), 'xs0': st['x0'], 'xs1': st['x1'], 'top': [], 'bot': st['rows']})
        else:
            singles.append(st)
    covered = np.zeros_like(pills_m)
    for bd in bands:
        covered[bd['y0'] - 2:bd['y1'] + 2] = True
    n, lab, stats, cent = cv2.connectedComponentsWithStats((pills_m & ~covered).astype(np.uint8))
    if os.environ.get('PILLS_DEBUG'):
        print('  leftover components (x,y,w,h):', [tuple(int(v) for v in stats[i][:4]) for i in range(1, n) if stats[i, cv2.CC_STAT_AREA] > 8])
    comps = [(stats[i], cent[i]) for i in range(1, n) if stats[i, cv2.CC_STAT_AREA] > 8]
    arcs = [c for c in comps if c[0][3] >= 12 and c[0][2] <= 30]
    arcs.sort(key=lambda c: c[1][1])
    while arcs:
        s0, c0 = arcs.pop(0)
        same = [c for c in arcs if abs(c[1][1] - c0[1]) < 10]
        for c in same:
            arcs.remove(c)
        group = [(s0, c0)] + same
        group.sort(key=lambda c: c[0][0])
        y0 = int(min(c[0][1] for c in group))
        y1 = int(max(c[0][1] + c[0][3] for c in group))
        # bulge: a left end has its mid-row pixel left of its top/bottom pixels
        def bulge(st):
            x, y, w, h = (int(v) for v in st[:4])
            sub = pills_m[y:y + h, x:x + w]
            midx = np.nonzero(sub[h // 2])[0]
            topx = np.nonzero(sub[0])[0]
            return 'L' if midx.size and topx.size and midx.mean() < topx.mean() else 'R'
        l = group[0] if bulge(group[0][0]) == 'L' else None
        r = group[-1] if bulge(group[-1][0]) == 'R' else None
        xl = int(l[0][0]) if l else int(group[0][0][0]) - 40
        xr = int(r[0][0] + r[0][2]) if r else int(group[-1][0][0] + group[-1][0][2]) + 40
        pts = [(y, x) for y in range(y0, y1) for x in range(max(0, xl), min(W, xr)) if pills_m[y, x]]
        bands.append({'y0': y0, 'y1': y1, 'sw': 2.0, 'xs0': xl, 'xs1': xr, 'top': [], 'bot': [],
                      'arcs_only': (xl, xr, l is None, r is None, colour(a, al, pts))})
    bands.sort(key=lambda b: b['y0'])
    # 3. each band = a dark pill, plus (where an inner arc ")" shows) a lighter pill drawn behind it continuing to the right
    out = []
    for bd in bands:
        y0, y1, sw = bd['y0'], bd['y1'], bd['sw']
        h = y1 - y0
        r = h / 2
        yt, yb = y0 + sw / 2, y1 - sw / 2
        if 'arcs_only' in bd:
            xl, xr, ol, orr, col = bd['arcs_only']
            out.append({'kind': 'pill', 'x': xl + sw / 2, 'yt': yt, 'yb': yb, 'xr': xr - sw / 2, 'r': r - sw / 2, 'sw': sw, 'color': col, 'open_l': ol, 'open_r': orr})
            continue
        mid = pills_m[int(y0 + sw) + 3:int(y1 - sw) - 3]
        cols = np.nonzero(mid.any(axis=0))[0]
        xs0, xs1 = bd['xs0'], bd['xs1']
        left = cols[cols < xs0 + 3]
        right = cols[cols > xs1 - 3]
        inner = cols[(cols >= xs0 + 3) & (cols <= xs1 - 3)]
        open_l, open_r = not left.size, not right.size
        xl = float(left.min()) if left.size else xs0 - 40.0  # hidden end: run on under the building, no arc
        xr = float(right.max() + 1) if right.size else xs1 + 40.0
        # inner arcs: clusters of columns, extreme x at mid height
        splits = []
        if inner.size:
            groups = np.split(inner, np.nonzero(np.diff(inner) > 3)[0] + 1)
            for g in groups:
                if len(g) >= 4:
                    splits.append(float(g.max() + 1))  # a ")" arc: its rightmost column
        segs = [xl] + splits + [xr]
        for i in range(len(segs) - 1):
            x0, x1 = segs[i], segs[i + 1]
            pts = [(y, x) for rows in (bd['top'], bd['bot']) for (y, xa, xb) in rows for x in range(max(xa, int(x0)), min(xb, int(x1)) + 1)]
            col = colour(a, al, pts)
            if col == '#000000' and out:  # a segment with no solid stroke pixels (hidden end): keep the row's colour
                col = out[-1]['color']
            out.append({'kind': 'pill' if i == 0 else 'tail', 'x': x0 + sw / 2, 'yt': yt, 'yb': yb, 'xr': x1 - sw / 2, 'r': r - sw / 2, 'sw': sw,
                        'color': col, 'open_l': open_l and i == 0, 'open_r': open_r and i == len(segs) - 2})
    for st in singles:
        sw = st['y1'] - st['y0'] + 1
        pts = [(y, x) for (y, xa, xb) in st['rows'] for x in range(xa, xb + 1)]
        out.append({'kind': 'line', 'x': float(st['x0']), 'xr': float(st['x1'] + 1), 'yt': st['y0'] + sw / 2, 'sw': float(sw), 'color': colour(a, al, pts)})
    for p in out:
        for k, v in list(p.items()):
            if isinstance(v, float):
                p[k] = round(v, 1)
    return im, building, pills_m, out, (W, H)


def path(p):
    if p['kind'] == 'line':
        return f'<path d="M{p["x"]},{p["yt"]} H{p["xr"]}" stroke="{p["color"]}" stroke-width="{p["sw"]}"/>'
    """Outline as an open path: left arc (unless the pill continues behind another or is hidden), top line, right arc, bottom line."""
    x, xr, yt, yb, r = p['x'], p['xr'], p['yt'], p['yb'], p['r']
    d = ''
    if p['kind'] == 'pill' and not p.get('open_l'):
        d += f'M{x + r},{yb} A{r},{r} 0 0 1 {x + r},{yt} '  # left arc
    else:
        d += f'M{x},{yb} M{x},{yt} '
    d += f'H{xr - r} '
    d += f'A{r},{r} 0 0 1 {xr - r},{yb} ' if not p.get('open_r') else f'M{xr},{yb} '
    d += f'H{x + r if p["kind"] == "pill" and not p.get("open_l") else x}'
    return f'<path d="{d}" stroke="{p["color"]}" stroke-width="{p["sw"]}"/>'


def svg(pills, size):
    W, H = size
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}" fill="none" stroke-linecap="butt">'
            + ''.join(path(p) for p in pills) + '</svg>\n')


def write(key, outdir=None):
    """Building-only cut-out + pills SVG for one hospital banner into src/assets (or a trial folder)."""
    im, building, pills_m, pills, size = split(key)
    if outdir:
        os.makedirs(outdir, exist_ok=True)
        Image.fromarray(building.clip(0, 255).astype(np.uint8)).save(f'{outdir}/{key}-building.png')
        open(f'{outdir}/{key}-pills.svg', 'w').write(svg(pills, size))
        ov = np.full((size[1], size[0], 3), 255, np.uint8)
        ov[pills_m] = (120, 120, 120)
        Image.fromarray(ov).save(f'{outdir}/{key}-overlay.png')
    else:
        d = f'src/assets/hospital-detail/banner-{key}'
        for old in glob.glob(d + '-cutout.*'):
            os.remove(old)
        Image.fromarray(building.clip(0, 255).astype(np.uint8)).save(d + '-cutout.png', optimize=True)
        open(d + '-pills.svg', 'w').write(svg(pills, size))
    return pills, size


if __name__ == '__main__':
    outdir = sys.argv[1] if len(sys.argv) > 1 else None
    manifest = {}
    for key in KEYS:
        pills, size = write(key, outdir)
        print(key, size, len(pills), 'shapes', [p['kind'][0] + ('<' if p.get('open_l') else '') + ('>' if p.get('open_r') else '') + p['color'] for p in pills])
        manifest[key] = pills
    json.dump(manifest, open(outdir + '/pills.json' if outdir else 'tools/banners/pills.json', 'w'), indent=1)
