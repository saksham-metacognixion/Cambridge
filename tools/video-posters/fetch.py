"""Hospital video posters = each video's own YouTube thumbnail (user decision, 19 Oct 2026).

    python3 -I tools/video-posters/fetch.py

Before: every hospital page showed the same fixed poster (about/video-thumbnail) over its video. Now each hospital page with a
YouTube video (src/data/content/hospital-detail/<slug>.en.json -> video.host = "youtube", video.id) shows that video's
thumbnail, saved into the project so the page makes no request to YouTube before the play click and astro:assets serves it
as AVIF/WebP at 1x/2x like every other image:
  - maxresdefault.jpg (1280 x 720) when YouTube has it, else sddefault.jpg (640 x 480)
  - black bands on any edge are trimmed: sddefault letterboxes the 16:9 frame into 4:3, and some uploads carry bands in the
    thumbnail itself (Al Mudeef's maxresdefault), which object-fit: cover would otherwise show in the poster box
  -> src/assets/hospital-detail/<slug>/video-poster.jpg, referenced from the content file as video.poster
     = "hospital-detail/<slug>/video-poster" (EnvironmentBand.astro; no poster = the shared one).
Re-run after a hospital's video.id changes. Stops on any download error (never writes a partial set silently).
"""
import glob, io, json, os, sys, urllib.error, urllib.request
import numpy as np
from PIL import Image

CONTENT, OUT = 'src/data/content/hospital-detail', 'src/assets/hospital-detail'
QUALITIES = ('maxresdefault', 'sddefault')  # best first; YouTube 404s maxresdefault for some uploads


def download(video_id):
    for q in QUALITIES:
        url = f'https://i.ytimg.com/vi/{video_id}/{q}.jpg'
        try:
            with urllib.request.urlopen(url, timeout=20) as r:
                return q, Image.open(io.BytesIO(r.read())).convert('RGB')
        except urllib.error.HTTPError as e:
            if e.code != 404:
                raise
    sys.exit(f'{video_id}: no thumbnail at {", ".join(QUALITIES)}')


BAND = 24  # a row / column whose pixels are all darker than this (0-255, JPEG noise included) is part of a black band


def trim_bands(im):
    """Crop off the black bands on all four edges (a picture without bands is returned as is)."""
    g = np.asarray(im.convert('L'))
    rows = np.flatnonzero(np.percentile(g, 98, axis=1) >= BAND)
    cols = np.flatnonzero(np.percentile(g, 98, axis=0) >= BAND)
    if not len(rows) or not len(cols):
        sys.exit('thumbnail is entirely black')
    return im.crop((cols[0], rows[0], cols[-1] + 1, rows[-1] + 1))


for path in sorted(glob.glob(f'{CONTENT}/*.en.json')):
    slug = os.path.basename(path)[: -len('.en.json')]
    video = json.load(open(path)).get('video') or {}
    if video.get('host') != 'youtube' or not video.get('id'):
        continue
    quality, im = download(video['id'])
    im = trim_bands(im)
    os.makedirs(f'{OUT}/{slug}', exist_ok=True)
    out = f'{OUT}/{slug}/video-poster.jpg'
    im.save(out, quality=90, optimize=True)
    print(f'{slug}: {video["id"]} {quality} -> {out} ({im.width}x{im.height})')
