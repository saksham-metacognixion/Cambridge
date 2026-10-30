#!/bin/sh
# Mobile-field country flags (bug 067, 14 Oct 2026). Figma draws only the UAE flag (kept: src/assets/forms/*flag-uae.svg);
# every other country in src/data/dial-codes.json gets its 3:2 flag from country-flag-icons (MIT, tools/flags/LICENSE),
# served as public/flags/<ISO>.svg and swapped in by src/scripts/forms.ts when that country is picked (one request, on demand).
#   npm pack country-flag-icons@1.5.19 && tar xzf country-flag-icons-1.5.19.tgz   # in an empty scratch folder
#   sh tools/flags/copy.sh <that folder>/package/3x2
set -e
SRC=$1
rm -rf public/flags && mkdir -p public/flags
for iso in $(python3 -I -c "import json; print(' '.join(c['iso'] for c in json.load(open('src/data/dial-codes.json'))['countries'] if c['iso'] != 'AE'))"); do
  cp "$SRC/$iso.svg" "public/flags/$iso.svg"
done
ls public/flags | wc -l
