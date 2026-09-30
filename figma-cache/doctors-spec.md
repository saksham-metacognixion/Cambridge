# Doctors 21:1204 -- Figma px, page coords (subtract nothing: x is page x, y is page y; section top ~1241)
Heading 21:1206 "Expert Care, Trusted Doctors": Gotham Medium 28px #004059 centered (cx 525.5) top1241 w417 h27 lh normal
Sub 21:1205 "Our specialists are committed to providing the right care at every stage of your journey.": Gotham Book 12px lh14px #6b6b6b centered cx525.5 top1276 w577 h27
Cards (6, left->right; ROW pitch ~212-214). Card = white bg, border 0.25px solid #418ea2, radius 15, 185x231, top1380.
  Card x: Amjad -118 | Ahmad 94 | Wael 306 | Suhaila 520 | Halawani 733 | Rober 945   (Amjad clipped at left edge, Rober clipped at right edge; Figma frame is 0..1052)
Inner grey panel: bg rgba(231,231,231,0.5), radius 15, 179x155, top1383, x = card x + 3
Name: Gotham Medium 12px #00415a lh normal, x = card x + 15 (Halawani w157, others w148), top1550, h15
Role: Gotham Book 8px lh10px #6b6b6b, x same, top1565, w148 h20
 Names/roles: Dr. Amjad Abdelqader / General Physician | Dr. Ahmad Al Khayer / Physical Medicine & Rehab Specialist | Dr. Wael Sary / ICU & Anesthesia Specialist | Dr. Suhaila Kallada / Physical Medicine & Rehab Specialist | Dr. Mohammed Halawani / Neuro Specialist | Dr. Rober Hanna Kassab / Physical Medicine & Rehab Specialist
Button pill: bg #00b8ff radius 5 71x13 top1582, x = card x + 15 (Amjad -103, Ahmad 109, Wael 321, Suhaila 535, Halawani 748, Rober 960)
 Button text: Gotham Medium 8px lh10px white w45 h10 top1584; x: Amjad -89 "Book Now" | 123, 335, 549, 762, 974 "See More" (Ahmad, Wael, Suhaila, Halawani, Rober)
Doctor photos (PNG, object-cover): Ahmad 116x132 @128,1406 | Amjed 144x144 @-99,1394 | Wael 144x144 @327,1394 | Suhaila 146x146 @542,1392 | Halawani 150x150 @755,1388 | Rober 150x150 @966,1388
Decorative shape (24:2401 "Group 8", frame 1246.13x161.52 @-117,1376): 6 masked groups, one per card, mask = mask-group.svg (mask-size 182.127x161.519, mask-position -6.669px -10.487px, alpha, no-repeat), fill = fill-group1.svg (fill-group2.svg for the LAST/Rober card). Inset % (t r b l of Group 8 frame) per card:
  Ahmad  21:1210 clip 24.29% 73.47% 72.85% 9.22% ; inner 24.48% 74.14% 72.51% 9.85%
  Amjad  21:1282 clip 24.29% 93.81% 72.85% -11.12% ; inner 24.48% 94.48% 72.51% -10.49%
  Suhaila 21:1308 clip 24.29% 33.16% 72.85% 49.52% ; inner 24.48% 33.83% 72.51% 50.16%
  Wael   21:1329 clip 24.29% 53.6% 72.85% 29.09% ; inner 24.48% 54.27% 72.51% 29.72%
  Halawani 21:1350 clip 24.29% 13.01% 72.85% 69.68% ; inner 24.48% 13.68% 72.51% 70.31%
  Rober  21:1371 clip 24.29% -7.33% 72.85% 90.02% ; inner 24.48% -6.66% 72.51% 90.65% (uses fill-group2)
Layer order (bottom->top): heading/sub, cards, grey panels, names/roles, pills, pill text, Amjad card stuff, Group 8 masked shapes, photos, "Book Now".
Interaction (user): scroll-snap row, swipe/scroll only, no arrows/dots. Filter pills (ALL/KSA/UAE at y1320) are loose layers, come later.

## Filter pills (moved into Doctors group via use_figma; values read via use_figma, colours #004059)
Positions root-relative (page): pill rects top1320 79x25 radius 12: ALL 23:2379 @371 FILL #004059 (stroke hidden) | KSA 21:1983 @470 NO fill, stroke 1px #004059 | UAE 21:1982 @571 NO fill, stroke 1px #004059
Texts Gotham Medium 10px lh10px centered w60 h10 top1328: "ALL" @380 white | "KSA" @479 #004059 | "UAE" @580 #004059
(Same pill style as Complete Care Support / News filters.)
## Slider dots 78:748 (Group 620): dots.svg 41x9 @506,1649.28 -- in Figma, static decorative
