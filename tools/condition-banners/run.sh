#!/bin/sh
# Condition-page banners from the live site's own photos (bug 042 / R042). Run from the project root on macOS.
# Sources: the `conditions` entries of src/data/wp-images.json (live URL per condition). Files are looked for, per entry,
#   1. in docs/cambridge-images*/ under the URL path (saved with tools/make-image-grabber.mjs: <path> or <path>.webp),
#   2. in the folder given as $1 (e.g. the uploads sent by the client) by the URL's file name, or as <slug>.<ext>.
# Each found photo becomes src/assets/conditions/<slug>.png + -subject.png + -bg.png (tools/condition-banners/make.py);
# the content file src/data/content/conditions/<slug>.en.json already points at conditions/<slug>, so the page picks it up
# at the next build. Stroke Rehabilitation keeps the Figma photo and is skipped. Missing photos are listed at the end.
set -e
EXTRA=${1:-}
WORK=${TMPDIR:-/tmp}/condition-banners
mkdir -p "$WORK"
missing=""
for line in $(python3 -I -c "
import json
for x in json.load(open('src/data/wp-images.json'))['images']:
    if x.get('group') == 'conditions': print(x['key'].split('/')[-1] + '|' + x['source'].split('cambridgehospital.com/')[1])
"); do
  slug=${line%%|*}; rel=${line#*|}; name=$(basename "$rel"); stem=${name%.*}
  [ "$slug" = stroke-rehabilitation ] && continue
  f=""
  for d in docs/cambridge-images*/; do
    for c in "$d$rel" "$d$rel.webp"; do [ -z "$f" ] && [ -f "$c" ] && f="$c"; done
  done
  if [ -z "$f" ] && [ -n "$EXTRA" ]; then
    for c in "$EXTRA/$name" "$EXTRA/$stem".* "$EXTRA/$slug".*; do [ -z "$f" ] && [ -f "$c" ] && f="$c"; done
  fi
  if [ -z "$f" ]; then missing="$missing $slug ($name)\n"; continue; fi
  python3 -I tools/condition-banners/make.py "$f" "$slug" src/assets/conditions "$WORK"
done
[ -n "$missing" ] && printf "Still missing (placeholder shown, R042):\n$missing"
exit 0
