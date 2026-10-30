"""python3 -I sweep.py <report.json>: per route x width, flags horizontal scroll, people cut by the viewport / section (cutL/cutR > 1 px),
a pill stack running off the viewport, people box below the section bottom (> 1 px), bleed/fade classes left on client banners."""
import json, sys
rep = json.load(open(sys.argv[1]))
bad = 0
for r in rep:
    if not r.get('people'):
        print('NO ART', r['path'], r['w']); bad += 1; continue
    issues = []
    if r['hscroll']: issues.append('hscroll')
    if r['cutL'] > 1: issues.append(f"people cut start {r['cutL']}")
    if r['cutR'] > 1: issues.append(f"people cut end {r['cutR']}")
    if r['cutB'] > 1: issues.append(f"people below section {r['cutB']}")
    if r.get('shape'):
        x, y, w, h = r['shape']
        if x < -1 or x + w > r['w'] + 1: issues.append(f'pills off screen x {x:.0f}..{x + w:.0f}')
    if r['edge']: issues.append('edge ' + ' '.join(r['edge']))
    if issues:
        bad += 1; print(f"{r['path']:44s} {r['w']:5d} " + '; '.join(issues))
print(bad, 'issues in', len(rep))
