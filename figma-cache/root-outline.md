# 93:894 Landing Page - sparse outline (y = absolute page y, frame is 1052 wide)
Frames (can be fetched as one node each):
- Header            112:13214  y0-119
- Hero Section      21:1425    y117-617   (bg image "Banner3 1" 21:1426)
- CTA Tab           21:1617    y560-642
- Doctors Section   21:1204    y1241-1611 (cards overflow x -118..1130)
- Facilities & Presence group 67:3725 y2054-2842
- Group 5 (health calculators + News banner) 67:4295 y3553-3997
- Footer (Group 670) 112:9555  y5285-5653
- Group 620/621/622 (small dividers) 78:748, 78:759, 80:808
- Frame 58/59/60 instances 80:797, 81:817, 81:821 (news card icons, y4516)
LOOSE layers directly under the root (no wrapping frame):
- Services "Delivering Excellence" y640-1193: 21:1397-21:1424 (bg 21:1397, texts, 4 cards 21:1400-1403, images 21:1412,1413,1422,1423,1424, buttons)
- Doctors filter pills y1320: 21:1982,21:1983,23:2379,21:1985,23:2380,21:1986
- Complete Care Support y1698-2054: 67:3653-67:3721
- Testimonials y2892-3313: 67:3796-67:3802, frame 67:3803, 81:825
- Start Your Recovery CTA y3367-3553: 67:4268-67:4294
- News & Insights y4041-4631: 67:4321-67:4343
- Insurance y4665-4842: 67:4345-67:4359, 81:826
- Contact y4906-5285: 67:4360-67:4401, 81:816, 67:4366
Hidden: Banner 1 21:665, Banner2 1 21:666

# === UPDATE: sections wrapped in Figma via use_figma (positions preserved; frames have no fill, clipsContent=false) ===
NEW FRAME IDs (page order):
- Services               2007:340  y640-1193   (28 layers: 21:1397-21:1424)
- Complete Care Support  2007:341  y1698-2054  (39 layers)
- Testimonials           2007:342  y2892-3313  (6: 67:3796,3797,3801,3802,3803, 81:825)
- Start Your Recovery    2007:343  y3367-3553  (7)
- News & Insights        2007:344  y4041-4631  (21, incl. 80:797/81:817/81:821 icons, 80:808 divider)
- Insurance              2007:345  y4665-4872  (17, incl. 81:826 + 81:827 "View All")
- Contact                2007:346  y4906-5403  (22)
Doctors filter pills (21:1982,21:1983,23:2379,21:1985,23:2380,21:1986) now INSIDE Doctors Section 21:1204 (a GROUP; still x-118 y1241 1248x370, 51 children). Their data comes from fetching 21:1204 again (NOT yet fetched: the call-6 fetch predates the move -> pills not in doctors-spec.md; positions known from root outline: rects 99 @571,1320 | 100 @470,1320 | 101 @371,1320 (79x25); texts UAE @580,1328 | KSA @479,1328 | ALL @380,1328 (60x10)).
Still loose at root: 78:748 Group 620 (506,1649 41x8.7), 78:759 Group 621 (506,537 41x8.7); not part of any fetched section.
Map pins exported: assets/map-pin.svg (42x43), map-pin-43x42.svg, map-pin-32.svg  -- all fill #00B8FF. Pin positions in facilities-spec.md.
