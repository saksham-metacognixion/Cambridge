"""Swap a hero's people for the client's cut-out (client "Website Assets" folder, 9 Oct 2026; user decision: the site's images
must match the client folder, overriding the Figma people where they differ).

    python3 -I tools/client-assets/swap-hero.py <key> <global-cutout|-> [<ksa-cutout|-|drop>]

<key> = the hero image key (e.g. why/banner): the layers src/assets/<key>-bg.png + <key>-subject.png (tools/hero-layers).
Only the people change, as for the KSA layers (tools/region-photos/run-sa.sh):
  - the cut-out goes where the current Global people stand (compose-subject.py, max scale 1.6), so the composition, the
    gradient / pills background and the cursor-follow (people layer only) stay as they are
  - where the new people leave the old people's right-edge fill in view, the background's right edge is refilled
    (fix-bg-edge.py); written to <key>-bg.png (Global) or regions/sa/<key>-bg.png (KSA)
  - the flat <key>.png is rebuilt as background + people
Optional env SA_MAX_SCALE (default 1.6): cap for the KSA cut-out (a wide pair, e.g. the KSA handshake, else runs off the edge).
KSA argument: a cut-out = a new regions/sa/<key>-subject.png; 'drop' = remove the KSA layers so /sa shows the Global people;
'-' or absent = keep the KSA layers.
"""
import os, shutil, subprocess, sys, tempfile
from PIL import Image

key, g_cut = sys.argv[1], sys.argv[2]
s_cut = sys.argv[3] if len(sys.argv) > 3 else '-'
A, SA, TMP = 'src/assets', 'src/assets/regions/sa', 'src/assets/regions/zz-client-tmp'
PY = sys.executable
old_subject = f'{A}/{key}-subject.png'
work = tempfile.mkdtemp()
ref = f'{work}/old-subject.png'
shutil.copyfile(old_subject, ref)


def compose(cut, out, max_scale='1.6'):
    subprocess.run([PY, '-I', 'tools/region-photos/compose-subject.py', ref, cut, out, max_scale, '40'], check=True)


def edge_fix(subject, region_dir):
    """fix-bg-edge.py reads the OLD Global subject (the filled hole) at src/assets/<key>-subject.png, so run it first."""
    os.makedirs(os.path.dirname(f'{TMP}/{key}'), exist_ok=True)
    shutil.copyfile(subject, f'{TMP}/{key}-subject.png')
    subprocess.run([PY, '-I', 'tools/region-photos/fix-bg-edge.py', key, 'zz-client-tmp'], check=True)
    bg = f'{TMP}/{key}-bg.png'
    out = None
    if os.path.exists(bg):
        out = f'{work}/{region_dir}-bg.png'
        shutil.move(bg, out)
    return out


g_new = g_bg = s_new = s_bg = None
if g_cut != '-':
    g_new = f'{work}/global-subject.png'; compose(g_cut, g_new); g_bg = edge_fix(g_new, 'global')
if s_cut not in ('-', 'drop'):
    s_new = f'{work}/sa-subject.png'; compose(s_cut, s_new, os.environ.get('SA_MAX_SCALE', '1.6')); s_bg = edge_fix(s_new, 'sa')
shutil.rmtree(TMP, ignore_errors=True)

if g_new:
    shutil.copyfile(g_new, old_subject)
    if g_bg:
        shutil.copyfile(g_bg, f'{A}/{key}-bg.png')
    flat = Image.alpha_composite(Image.open(f'{A}/{key}-bg.png').convert('RGBA'), Image.open(old_subject).convert('RGBA'))
    for old in [f for f in os.listdir(os.path.dirname(f'{A}/{key}')) if os.path.splitext(f)[0] == os.path.basename(key)]:
        os.remove(f'{os.path.dirname(f"{A}/{key}")}/{old}')
    flat.convert('RGB').save(f'{A}/{key}.png', optimize=True)
if s_cut == 'drop' or s_new:
    for suffix in ('-subject', '-bg'):
        for ext in ('.png', '.avif', '.webp'):
            p = f'{SA}/{key}{suffix}{ext}'
            if os.path.exists(p):
                os.remove(p)
if s_new:
    os.makedirs(os.path.dirname(f'{SA}/{key}'), exist_ok=True)
    shutil.copyfile(s_new, f'{SA}/{key}-subject.png')
    if s_bg:
        shutil.copyfile(s_bg, f'{SA}/{key}-bg.png')
print(f'{key}: global {"<- " + os.path.basename(g_cut) if g_new else "kept"}{" (bg edge refilled)" if g_bg else ""}; '
      f'KSA {"<- " + os.path.basename(s_cut) if s_new else ("dropped (uses Global)" if s_cut == "drop" else "kept")}{" (bg edge refilled)" if s_bg else ""}')
shutil.rmtree(work)
