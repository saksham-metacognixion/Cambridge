"""Replace site images with higher-resolution copies of the same picture (client Website Images folder, 14 Oct 2026, and the
saved live originals), keeping each file's name, format and framing: tools/banners/hd.py aligns the original to the current
image, and patches back any area whose content differs (retouching). Run from the project root:

    python3 -I tools/images/hd-replace.py            # writes into src/assets (the current file is the alignment reference)
    python3 -I tools/images/hd-replace.py <outdir>   # trial run: writes to <outdir>, src/assets untouched

Re-running after a replacement aligns the original to the already-replaced copy (same result). Sources: docs/client-assets/
website-images-oct14 (copied from the client's folder) and docs/cambridge-images-live / docs/live-save-13oct (live originals).
"""
import os
import shutil
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'banners'))
from hd import hd_copy  # noqa: E402

C = 'docs/client-assets/website-images-oct14/'
JOBS = [
    # asset (src/assets/...), original, max scale. Checked visually (scratch trial run) before applying, 14 Oct 2026.
    ('why/accreditation.png', C + 'Global/Other - Other website images/Trusted-Standards-Global-Partnerships.png', 2),
    ('about/video-thumbnail.png', 'docs/cambridge-images-live/ae/wp-content/uploads/sites/2/2026/06/Video-Thumbnail.avif', 3),
    ('facilities/auh-new.png', C + 'Global/Other - Other website images/Cambridge-Hospital-Abu-Dhabi-Global.avif', 2),
    ('facilities/al-mudeef.png', 'docs/live-save-13oct/home_files/Al-Mudeef-Center.avif', 2),
    ('news/16th-hot-topics-in-pediatrics-conference-and-exhibition.avif', C + 'Global/Other - Media hub & news/16th-Hot-Topics-in-Pediatrics-Conference-and-Exhibition.png', 2),
    ('news/3rd-international-pediatric-neurodisability-and-neurorehabilitation-conference.avif', C + 'Global/Other - Media hub & news/3rd-International-Paediatric-Neurodisability-and-Neurorehabilitation-Conference.png', 2),
]
# Not used (trial run 14 Oct 2026):
# - facilities/al-ain.png <- live Cambridge-Hospital-Al-Ain.avif: the live original's sky differs; a visible seam where
#   our wider card frame is filled from the current image.
# - facilities/jeddah.png + hospitals/jeddah.png <- client Cambridge-Hospital-Jeddah.png (1672px): same building, different
#   moment (crowd, other sky); 45% patched back, blotchy sky.
# - insurance/daman.png + wp/daman.jpg <- client daman-insurance-uae.png: a brighter blue and slightly narrower mark than
#   our (live, navy) logo: a different version, not just more pixels (ask the client which is current).
# - insurance/neuron.png + wp/neuron.jpg <- client neuron webp: only 1.18x, a quarter of it patched back.
# - news/neck-pain.webp <- client Neck-Pain.png: a different picture.

outdir = sys.argv[1] if len(sys.argv) > 1 else None
for asset, orig, k in JOBS:
    cur = 'src/assets/' + asset
    out = os.path.join(outdir, asset.replace('/', '__')) if outdir else cur
    tmp = out + '.tmp' + os.path.splitext(out)[1]
    print(asset, '<-', orig)
    try:
        hd_copy(cur, orig, tmp, k=k, patch=True)
    except RuntimeError as e:
        print('  SKIPPED:', e)
        continue
    shutil.move(tmp, out)
