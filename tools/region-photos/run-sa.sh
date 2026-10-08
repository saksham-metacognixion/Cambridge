#!/bin/sh
# KSA people photography (bug 063, 8 Oct 2026). Rebuilds src/assets/regions/sa/ from the live KSA site's own photos
# (docs/cambridge-images-ksa/, downloaded 8 Oct 2026 with the user's approval; _pages.json = which live /sa page shows
# which file). Run from the project root on macOS (Apple Vision, for the two card photos cut out here).
#   hero banners: <key>-subject.png = the KSA people cut-out placed over the Global people (compose-subject.py); the
#                 Global <key>-bg.png (gradient + pills) stays shared, so only the people change (heroLayers in src/lib/images.ts),
#                 except where the KSA people uncover the Global fill at the right edge (fix-bg-edge.py: a KSA <key>-bg.png)
#   cards / photos: the KSA file under the same key (img() picks regions/sa/<key> first)
# Keys not listed keep the shared (Global) photo on /sa: the live KSA site shows the same picture there, or a person with
# no regional dress, or it has no KSA version (docs/region-photos.md).
set -e
K=docs/cambridge-images-ksa
R=src/assets/regions/sa
WORK=${TMPDIR:-/tmp}/region-photos-sa
mkdir -p "$WORK"
swiftc -O tools/hero-layers/mask.swift -o "$WORK/hero-mask"

# Card photos used as hero people (the live KSA site has no banner for these pages): cut the people out first.
for f in International-Patients-KSA Patient-Testimonials-KSA; do
  mkdir -p "$WORK/$f"
  python3 -I -c "from PIL import Image; Image.open('$K/$f.avif').convert('RGB').save('$WORK/$f/src.png')"
  "$WORK/hero-mask" "$WORK/$f/src.png" "$WORK/$f" > /dev/null
  python3 -I -c "
from PIL import Image
im = Image.open('$WORK/$f/src.png').convert('RGBA'); im.putalpha(Image.open('$WORK/$f/mask-all.png').convert('L')); im.save('$WORK/$f/cut.png')"
done

subject() { # <key> <cut-out> [feather]
  mkdir -p "$R/$(dirname "$1")"
  python3 -I tools/region-photos/compose-subject.py "src/assets/$1-subject.png" "$2" "$R/$1-subject.png" 1.6 ${3:-40}
}
# hero/banner3 (Home): placed by hand in f142be7 from the same family cut-out; not regenerated here.
subject about/banner "$K/About-Cambridge-Banner-KSA-1.avif"
subject care/banner-inpatient-care "$K/Inpatient-Care-main-banner-KSA.avif"
subject care/banner-our-care "$K/Our-Care-Banner-KSA.avif"
subject care/banner-post-acute-care "$K/Post-Acute-Care-guy-Banner-KSA.avif"
subject contact-page/banner "$K/Contact-Us-KSA.avif"
subject faq/hero "$K/FAQs-Cambridge-Hospital-KSA.avif"
subject forms/feedback-hero "$K/FAQs-Cambridge-Hospital-KSA.avif" # Global uses the FAQ man here too
subject patient-hub/banner "$K/Patient-Hub-Cambridge-Hospital-KSA.avif"
subject why/banner "$K/Why-Cambridge-Banner-KSA-1.avif"
subject international/banner "$WORK/International-Patients-KSA/cut.png"
subject careers/banner "$WORK/International-Patients-KSA/cut.png" # Global careers banner = the international one
subject testimonials-page/banner "$WORK/Patient-Testimonials-KSA/cut.png" 70

# Where the KSA people leave part of the Global fill against the right edge in view, a cleaned KSA background
# (<key>-bg.png; only written when needed: About, Our Care, Post-Acute, Why, International / Careers, Testimonials).
rm -f "$R"/about/banner-bg.png "$R"/care/*-bg.png "$R"/why/banner-bg.png "$R"/international/banner-bg.png "$R"/careers/banner-bg.png "$R"/testimonials-page/banner-bg.png
for k in about/banner care/banner-inpatient-care care/banner-our-care care/banner-post-acute-care contact-page/banner faq/hero \
  forms/feedback-hero patient-hub/banner why/banner international/banner careers/banner testimonials-page/banner; do
  python3 -I tools/region-photos/fix-bg-edge.py "$k" sa
done

photo() { mkdir -p "$R/$(dirname "$1")"; cp "$K/$2.avif" "$R/$1.avif"; }
photo care/inpatient/icu-critical-care ICU-Critical-Care-KSA-1
photo care/inpatient/long-term-care Long-Term-Care-KSA
photo care/inpatient/palliative-care Palliative-Care-KSA-1
photo care/inpatient/post-acute-care Pot-Acute-Care-KSA
photo services/home-healthcare Home-Care-Cambridge-Hospital-KSA
photo services/outpatient Outpatient-Care-Cambridge-Hospital-KSA
photo patient-hub/card-international International-Patients-KSA
photo patient-hub/card-testimonials Patient-Testimonials-KSA
mkdir -p "$R/why"
python3 -I -c "
from PIL import Image
Image.open('$K/Multidisciplinary-Team-KSA-2.avif').convert('RGBA').save('$R/why/team.png', optimize=True)
p = Image.open('$K/Partnership-Image-KSA.avif').convert('RGBA')  # 1025x614 -> the Global 1.6:1 canvas, standing on its bottom
c = Image.new('RGBA', (1025, 641), (0, 0, 0, 0)); c.alpha_composite(p, (0, 641 - 614)); c.save('$R/why/accreditation.png', optimize=True)"
