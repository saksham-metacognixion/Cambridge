"""Care-page hero banners from the live site's own people cut-outs (missing-image audit, 9 Oct 2026).

    python3 -I tools/live-images/care-banners.py <manifest.json> [slug ...]

Before: every care page without a Figma banner showed the Post Acute Care (sections) or Inpatient Care (services) banner as a
placeholder (docs/open-decisions.md CT4). The live site gives each page its own hero: a transparent people cut-out (579x450 /
500x450, like the condition banners of bug 042) over the same gradient + pills. Here each cut-out is placed where the Figma
people stand (tools/region-photos/compose-subject.py), so the Figma composition stays:
  - UAE / Global (the shared files): src/assets/care/heroes/<slug>.png (flat) + -subject.png + -bg.png (the base banner's own
    background layer, so the cursor-follow layers work; identical copies dedupe in the build)
  - KSA: src/assets/regions/sa/care/heroes/<slug>-subject.png from the live /sa cut-out, placed over the UAE people's footprint
    (the shared background is repaired behind the people, clean_bg, so no regional background layer is needed)
  - the content file gets hero.banner = care/heroes/<slug> and heroLayout.small (the strip kept in view below 1024px, centred on
    the people, w 448 like the condition pages); CarePage passes `small` to PageHero
Base banners: care/banner-post-acute-care (1052x323, depth >= 2 pages) and care/banner-our-care (1052x500, services; the Inpatient
banner's background layer shows a smeared bed where its people were filled in). An opaque live photo (UAE Home Healthcare) is
fitted to the banner height, right-aligned (as the live page shows it) and feathered into the background on its left; its
cursor-follow layers come from tools/hero-layers (Apple Vision mask + split).
Pages WITH a Figma banner (inpatient, post-acute-rehab, the Our Care hub) are skipped. A page whose live cut-out is missing
(KSA PMNR: 404 on the live site) keeps the shared UAE people on /sa.
"""
import json, os, re, subprocess, sys
import numpy as np
from PIL import Image

manifest = json.load(open(sys.argv[1]))
only = set(sys.argv[2:])
LIVE, KSA = 'docs/cambridge-images-live', 'docs/cambridge-images-ksa'
SKIP = {'inpatient', 'post-acute-rehab'}
# live slug -> ours for the eight pages whose live URL differs (src/lib/redirects.ts LIVE_CARE_SLUGS)
OURS = {'central-nervous-system-anomalies-rehab': 'central-nervous-system', 'long-term-cardiac-anomalies-rehab': 'long-term-cardiac', 'post-acute-care': 'paediatric-post-acute-rehab', 'pediatric-transitional-care': 'paediatric-transitional', 'musculoskeletal-rehab': 'musculoskeletal-rehabilitation', 'spinal-cord-injury-rehab': 'spinal-cord-injury-rehabilitation', 'stroke-rehab': 'stroke-rehabilitation', 'traumatic-brain-injury-rehab': 'traumatic-brain-injury-rehabilitation'}
BASE = {1: 'care/banner-our-care', 2: 'care/banner-post-acute-care'}  # Our Care: its background layer is clean behind the people (the Inpatient one shows a smeared bed)
W, STRIP = 1052, 448
PY = sys.executable

depths = {}
def walk(nodes, depth):
    for n in nodes:
        depths[n['slug']] = depth
        walk(n.get('children', []), depth + 1)
walk(json.load(open('src/data/care.json'))['services'], 1)


def find(url):
    rel = re.sub(r'^https?://[^/]+/', '', url)
    for c in (f'{LIVE}/{rel}', f'{KSA}/{os.path.basename(rel)}'):
        if os.path.exists(c):
            return c
    return None


def clean_bg(base, out):
    """Background layer of a base banner with the people's footprint repaired: tools/hero-layers filled it row by row, which
    smears the pills; the pills are horizontal gradients, so each row is re-interpolated linearly between the clean pixels on
    either side of the footprint (constant where the footprint reaches the right edge)."""
    bg = np.array(Image.open(f'src/assets/{base}-bg.png').convert('RGBA')).astype(np.float32)
    a = np.array(Image.open(f'src/assets/{base}-subject.png').convert('RGBA'))[..., 3]
    h, w = a.shape
    for y in range(h):
        cols = np.where(a[y] > 10)[0]
        if not len(cols):
            continue
        x0, x1 = max(int(cols.min()) - 6, 1), min(int(cols.max()) + 6, w - 1)
        left = bg[y, x0 - 1]
        right = bg[y, x1 + 1] if x1 + 1 < w else left
        t = np.linspace(0, 1, x1 - x0 + 1)[:, None]
        bg[y, x0:x1 + 1] = left * (1 - t) + right * t
    Image.fromarray(bg.round().astype(np.uint8)).save(out)


def is_cutout(path):
    im = Image.open(path)
    return 'A' in im.mode and (np.array(im.convert('RGBA'))[..., 3] < 10).mean() > 0.05


def compose(footprint, cutout, out, feather=40):
    os.makedirs(os.path.dirname(out), exist_ok=True)
    subprocess.run([PY, '-I', 'tools/region-photos/compose-subject.py', footprint, cutout, out, '1.6', str(feather)], check=True, stdout=subprocess.DEVNULL)


WORK = os.path.join(os.environ.get('TMPDIR', '/tmp'), 'care-banners')


def fade_photo(bg, src):
    """opaque photo (UAE Home Healthcare, 659x724): fitted to the banner height and right-aligned like the live page shows it,
    its left edge feathered into the background (smoothstep over the photo's left 35 %)"""
    w, h = bg.size
    photo = Image.open(src).convert('RGBA')
    sc = h / photo.height
    p = photo.resize((round(photo.width * sc), h), Image.LANCZOS)
    x = np.linspace(0, 1, p.width)
    t = np.clip(x / 0.35, 0, 1)
    p.putalpha(Image.fromarray((t * t * (3 - 2 * t) * 255).astype(np.uint8)[None, :].repeat(h, 0)))
    layer = Image.new('RGBA', bg.size, (0, 0, 0, 0))
    layer.paste(p, (w - p.width, 0))
    return Image.alpha_composite(bg, layer)


def split_layers(flat_path, out_dir):
    """cursor-follow layers of a flat banner: tools/hero-layers (mask.swift + split.py), as for the Figma banners"""
    os.makedirs(WORK, exist_ok=True)
    mask_bin = f'{WORK}/hero-mask'
    if not os.path.exists(mask_bin):
        subprocess.run(['swiftc', '-O', 'tools/hero-layers/mask.swift', '-o', mask_bin], check=True)
    d = f'{WORK}/{os.path.basename(flat_path)[:-4]}'
    os.makedirs(d, exist_ok=True)
    subprocess.run([mask_bin, flat_path, d], check=True, stdout=subprocess.DEVNULL)
    subprocess.run([PY, 'tools/hero-layers/split.py', flat_path, f'{d}/mask-all.png', out_dir], check=True, stdout=subprocess.DEVNULL)


def small_x(subject):
    a = np.array(Image.open(subject).convert('RGBA'))[..., 3]
    cols = np.where((a > 10).sum(axis=0) > 4)[0]
    cx = (cols.min() + cols.max() + 1) / 2
    return int(round(min(max(cx - STRIP / 2, 0), W - STRIP)))


def set_content(slug, key, x, url):
    for f in (f'src/data/content/care/{slug}.en.json', f'src/data/content/care/{slug}.sa.en.json'):
        if not os.path.exists(f):
            continue
        d = json.load(open(f))
        d.setdefault('hero', {})['banner'] = {'image': key, 'alt': ''}
        d.setdefault('heroLayout', {})['small'] = {'x': x, 'w': STRIP}
        d['_note'] = re.sub(r'\s*banner only where Figma had one; other pages use the shared placeholder banner \(docs/open-decisions\.md CT4\)\.?', '', d.get('_note', '')).rstrip()
        d['_note'] = (d['_note'] + f" Banner (missing-image audit, 9 Oct 2026): the live page's own people cut-out ({url}, saved through the user's Chrome) over the Figma banner background, tools/live-images/care-banners.py; heroLayout.small = the strip kept in view below 1024px.").strip()
        with open(f, 'w') as out:
            json.dump(d, out, ensure_ascii=False, indent=2)
            out.write('\n')


done, missing = [], []
for region in ('ae', 'sa'):
    for url, v in manifest['care'].items():
        if not url.startswith(f'/{region}/care/') or url == f'/{region}/care/':
            continue
        slug = url.rstrip('/').split('/')[-1]
        slug = OURS.get(slug, slug)
        if slug not in depths or slug in SKIP or (only and slug not in only):
            continue
        src = v['hero'] and find(v['hero'])
        if not src:
            missing.append(f'{region} {slug} ({os.path.basename(v["hero"] or "no hero")})')
            continue
        base = BASE[min(depths[slug], 2)]
        key = f'care/heroes/{slug}'
        if region == 'ae':
            out_dir = 'src/assets/care/heroes'
            os.makedirs(out_dir, exist_ok=True)
            if is_cutout(src):
                compose(f'src/assets/{base}-subject.png', src, f'{out_dir}/{slug}-subject.png')
                clean_bg(base, f'{out_dir}/{slug}-bg.png')
                bg = Image.open(f'{out_dir}/{slug}-bg.png').convert('RGBA')
                Image.alpha_composite(bg, Image.open(f'{out_dir}/{slug}-subject.png').convert('RGBA')).save(f'{out_dir}/{slug}.png')
            else:
                clean_bg(base, f'{out_dir}/{slug}-bg.png')
                fade_photo(Image.open(f'{out_dir}/{slug}-bg.png').convert('RGBA'), src).save(f'{out_dir}/{slug}.png')
                split_layers(f'{out_dir}/{slug}.png', out_dir)
            set_content(slug, key, small_x(f'{out_dir}/{slug}-subject.png'), url)
        else:
            # KSA people stand where the UAE people stand; when the UAE hero is an opaque photo, where the Figma people stand
            footprint = f'src/assets/care/heroes/{slug}-subject.png'
            ae_src = manifest['care'].get(url.replace('/sa/', '/ae/'), {}).get('hero')
            if not os.path.exists(footprint) or not (ae_src and find(ae_src) and is_cutout(find(ae_src))):
                footprint = f'src/assets/{base}-subject.png'
            compose(footprint, src, f'src/assets/regions/sa/care/heroes/{slug}-subject.png')
            # the shared -bg is repaired behind the people (clean_bg): nothing to uncover, no regional background layer
            if os.path.exists(f'src/assets/regions/sa/care/heroes/{slug}-bg.png'):
                os.remove(f'src/assets/regions/sa/care/heroes/{slug}-bg.png')
        done.append(f'{region} {slug} <- {os.path.basename(src)}')
print('\n'.join(done))
print(f'{len(done)} banners' + (f"; missing: {', '.join(missing)}" if missing else ''))
