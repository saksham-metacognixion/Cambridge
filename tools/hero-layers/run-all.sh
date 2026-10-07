#!/bin/sh
# Rebuild the cursor-follow layers of every inner-page hero banner (7 Oct 2026). Run from the project root on macOS
# (Apple Vision). Output: src/assets/<key>-subject.png + <key>-bg.png next to the flat Figma banner, picked up by
# heroLayers() in src/lib/images.ts. Not listed: hospitals/banner (no person: Vision picks the map, which must stay under the
# vector pins of HeroMap: handled as described below) and news post photos (no subject / background split, static).
# hospitals/banner: Vision's "subject" is the baked-in map + pins; that layer drifts together with HeroMap's vector overlay
# (PageHero follow="map", the live site's map motion), so the two maps never separate.
set -e
WORK=${TMPDIR:-/tmp}/hero-layers
mkdir -p "$WORK"
swiftc -O tools/hero-layers/mask.swift -o "$WORK/hero-mask"
for k in about/banner accreditations/banner care/banner-inpatient-care care/banner-our-care care/banner-post-acute-care \
  careers/banner conditions/accidents-rehabilitation conditions/banner conditions/stroke-rehabilitation contact-page/banner \
  doctors-page/banner faq/hero forms/feedback-hero hospital-detail/banner-abu-dhabi insurance-page/banner international/banner \
  media-hub/banner patient-hub/banner refer/banner testimonials-page/banner why/banner; do
  d="$WORK/$(echo "$k" | tr / _)"; mkdir -p "$d"
  "$WORK/hero-mask" "src/assets/$k.png" "$d" > /dev/null
  python3 tools/hero-layers/split.py "src/assets/$k.png" "$d/mask-all.png" "src/assets/$(dirname "$k")"
done
# Our Hospitals: the thin coastline strokes escape the mask, so the hole is grown more (15 px) before the fill.
d="$WORK/hospitals_banner"; mkdir -p "$d"; "$WORK/hero-mask" src/assets/hospitals/banner.png "$d" > /dev/null
python3 tools/hero-layers/split.py src/assets/hospitals/banner.png "$d/mask-all.png" src/assets/hospitals 15
