# Forms + Welcome frames (file LJIRtzU574JrA1BgK881Qm, Page 2 = 1:2) — Figma px, build ×1.3688 (--u)
Fetched 2 Oct 2026, calls 35–47. Screenshots: figma-cache/forms/*.png. Assets: figma-cache/assets/forms/.
The page behind each pop-up (header, hero, CTA tab) is the cached Landing Page — not re-specified here.

## Common pop-up layer (all 4 pop-up frames)
- Frame 1052x642 (Your Opinion 1052x650). Whole frame has drop-shadow 0 4 2 rgba(0,0,0,.25) (canvas frame effect, not part of the pop-up).
- Backdrop "Rectangle 132": 1052x650 @0,-8, fill rgba(217,217,217,0.2), effect GLASS radius 8 (refraction 0, depth 1, light .8 @0°, dispersion .38).
- Panel "Rectangle 4304": fill rgba(255,255,255,0.1), radius 17.051, GLASS radius 100, refraction .74, depth 16.23, light .8 @335°, dispersion .32, splay .31.
  CSS approximation: backdrop-filter blur(radius/2) + inset white highlight (GLASS has no CSS equivalent).
- No close button in any pop-up frame. No error / success / consent design in any pop-up frame.
- Field box: radius 9.695, h 31.554, fill rgba(255,255,255,0.5); the Name box is rgba(255,255,255,0.7) in all three forms.
- Field label: Gotham Book 13.523 / lh 16.967 #004059, text top +7.21 in the row.
- Placeholder / select text: Gotham Book 13.523 #6b6b6b (select lh 12.622, top +9.92).
- Textarea placeholder: Gotham Book Italic (13.523 in Book; 10 in Inquiry + Opinion) #6b6b6b, lh 12.622.
- Mobile: dial box w 68.517 at label+56.8; flag 14.875x9.917 at (5.41, 9.91); "+971" at x 23.44; chevron 6.527x3.793 #6b6b6b at (56.8, 13.52).
  number box w 122.609 at +133.43, placeholder "xx xxx xxxx" at +8.24. Only the UAE (+971) option exists in Figma.
- Select chevrons #004059: speciality 6.527x3.793 at (234.4, 16.23); doctor 6.311x3.793 at (235.3, 16.23).
- Calendar icon 17.85x19.834 #6B6B6B at (221.78, 4.51) of the 256.037 row.
- Submit: #00b8ff, radius 9.917, h 33.056; label Gotham Bold 9.917 white, top +11.9, centred.
- Title: Gotham Bold 13.523 #00415a, centred.

## Book an Appointment — 106:246 ("Pop Up - Option 1"; an "Option 2" frame 106:510 exists, not fetched)
Panel 586x399.38 centred (x 233, y 138.81). Offsets below are from the panel's top-left.
- Title "Book an Appointment" top 21.64 (centre −3.4).
- Row 1 top 54.09, x 31.55, w 523.794, gap 11.72: [Select Speciality 256.037 (text +13.99)] [Select a Doctor (Optional) 256.037 (text +10.82)].
- "Patient Details:" Gotham Bold 11.72 #004059, top 105.48, x 31.55.
- Row 2 top 136.13: [Name* | box at +54.99 w 201.043 (0.7)] gap 11.72 [E-mail | box at +56.8 w 199.24].
- Row 3 top 187.52: [DOB* | box at +55.9 w 200.142, calendar] [Mobile* | dial + number].
- Gender row top 238.91: "Gender*" x 32.46; radio ON (Group 199, 11.72 box, svg 14.845) at x 117.2 y 241.6; "Male" x 136.13;
  radio OFF (Ellipse 43 stroke 9.917, #004059?) at x 194.28 y 242.51; "Female" x 210.06. Labels 13.523 Book #004059.
- Textarea top 274.07 x 31.55, 523.794x64.009, placeholder "Other details...." at (9.34, 11.72) Book Italic 13.523.
- SUBMIT 99.169x33.056 centred, top 351.6. Panel bottom pad 14.72.

## Send an Inquiry — 101:6336
Panel 321x399 (x 366, y 139).
- Title "Send an Inquiry" top 24 (centre +1). Divider: 251 wide, 0.5 white stroke, round caps, top 51.55, centred (+0.5). GLASS 100 on the line.
- Column top 73.55, w 256.037, centred, gap 14: Name* (+54.99, 201.043, 0.7) | Mobile* (h 32) | E-mail* (+56.8, 199.24) |
  textarea 256x115.552, placeholder "Tell us how we can help…" Book Italic 10 at (13, 10.4).
- SUBMIT 99.169x33.056 top 348.55 (centre +0.58). Panel bottom pad 17.4.

## Your Opinion Matters (pop-up) — 112:7878
Panel 586x564 (x 233, y 51).
- Title "Your Opinion Matters" top 30, box x 220 w 146 (= centred).
- Selects column x 36, top 84, w 260, h 83, gap 11.72, centred vertically -> first select at top 88.08. Same select specs as Book.
- "Your Details:" Bold 11.72 x 36 top 184.
- Details column x 36 top 205 w 266 h 175 gap 11.72 centred vertically (first row top 211.59):
  Name* (+54.99, 201.043, 0.7) | E-mail (+56.8, 199.24) | Date of Visit (label w 92, box +96.69 w 159 h 32, calendar at 221.78) | Mobile*.
- Rating card x 326 top 84, 205.04x289, white, radius 15.07, GLASS 88.4. Content origin (27.4, 22.09); rows at y 0 / 65.4 / 130.8 / 196.2:
  Overall Experience | Staff Friendliness | Wait Time | Communication — Gotham Medium 8.838 lh 11.155 #004059, centred on x 72.91.
  Options (icon centre x / label): Excellent 15.03 | Good 54.92 | Medium 94.82 | Poor 136.49. Icons 17.676 (svg 19.443, stroke 1.768) top 16.79;
  Poor icon 21.211 top 15.02. Labels Gotham Light 6.187 lh 11.155 #004059, top 37.12.
  Default icon colour #00415A. Selected colours (Figma shows one per row as a sample): Excellent #22B573, Good #15ADBF, Medium #FFD939, Poor #FF4E4E.
- Textarea x 32 top 390, 499x100.009, placeholder "Share your opinion in detail....." Book Italic 10 at (13.4, 15.82).
- "SUBMIT FEEDBACK" button 116x33 centred top 507, label Bold 9.917 at (8, 14). Panel bottom pad 24.

## Welcome Page — 76:196 (country pop-up, scope 2.3) — NOT BUILT, see open questions
- Card 400x287.324 at (326, 177), fill rgba(219,214,209,0.2), radius 18.913, GLASS 60 (refraction .8, depth 20, light .8 @−45°, dispersion .5).
- Map: image 1462x1600 (assets/forms/welcome/map.png) masked by rounded rect 238.229x275.654 r 14.085 at (483.34, 182.95); image box 253.119x276.861 at (476.1, 182.15).
- Pin: line 0.805x34.205 #D9D9D9 at (589.18, 281.54); dot 3.219 #1E88FB at (587.97, 314.54).
- Chip #d8d8d8 64.789x23.742 r 11.871 at (577.51, 272.69); round UAE flag 16.901 at (581.13, 276.31); "UAE" Gotham Black 10.272 #00415a at (605.68, 279.13).
- Logo (vertical colour logo, masked vector groups 76:431, inset 36.76% 55.89% 53.39% 33.27%) — export as one SVG when building.
- "You’re on Our UAE Website" Gotham Bold 9.066 #00415a centred at x 406.5, top 322.
- "Continue Here" button 98.994x19.316 #00415a r 11.871 at (357, 344); label Book 7.054 white.
- "OR" Bold 4.829 #00415a at (403, 370).
- "Go to Global Website" button 98.994x19.316 #f2f2f2, 0.402 inside stroke #00415a, r 11.871 at (357, 382); label Book 7.054 #00415a.
- Only a UAE variant exists. No KSA, no "other country" variant.

## Patient Feedback Form (page) — 188:964, 1052x2215
- Header 0–119 = site header (About Cambridge / EN AR / Global variant). Footer at y 1850 (h 368) = site footer.
- Hero image "PAR-inside 1" 1052x323 @0,118 (assets/forms/feedback-hero.png, only 1052x323 in Figma).
  Title "Your Opinion Matters" Gotham Medium 39 #004059 at (95, 218) w 385 (wraps to 2 lines).
  Outline button 164x30 r 7, 1px #00b8ff at (98, 298); "Consult for a Care Plan" Gotham Medium 13 #00b8ff centred, top 307.
- Intro: 3 lines, Gotham Book 12 lh 14 #6b6b6b, centred on x 530, top 502.
- Card 954x1179 at (53, 599), white, radius 14.32 (top-right 15), shadow 0 0 15.7 rgba(0,0,0,.25).
- Fields (page coordinates): field fill rgba(217,217,217,0.5) r 10.754 h 35; labels Gotham Book 15 lh 18.82 #004059 (text top = box top + 8).
  Name* label (100,676) box (184.55,668) w 319.889 | Hospital label (565,676) select (649.55,668) w 319.889, chevron 7.24x4.207 #004059 at (946,686)
  Mobile* label (101,730) dial box (188.08,722) w 74.901; flag 16.261x11 at (193.99,733); "+971" at 213.7; chevron 7.135 #6b6b6b at (250.17,737);
  number box (272.83,722) w 232.587, placeholder at 282 | Email label (565,730) box (652.13,722) w 316.489.
- "How likely are you to recommend us to your friends and family?" Bold 15 #004059 at (100,820) w 543.
  Options Never / Not Very Likely / Somewhat Likely / Likely / Very Likely: radio 12.812x13 at x 100, y 871 +28n; labels Book 15 at x 121, y 868 +28n.
  Figma shows ALL five as selected (cyan Group 199) — impossible for a radio group.
- "Please rate your satisfaction with the hospital and services provided by rating the following statements:" Bold 15 at (100,1032) w 612.
  Columns (centre x): Very Dissatisfied 387 | Dissatisfied 527 | Neutral 652 | Satisfied 760 | Very Satisfied 868; Book 15 lh 18.82 centred, w 96;
  1-line headers top 1099, 2-line top 1090.
  Rows (label x 103, Book 15 lh 18.82, top 1138 +58n; w 215, first row w 179):
  The overall quality of care received | Communication & Clarity of information provided | Cleanliness & Maintenance of hospital facilities |
  Information provided for diagnosis and treatment | Efficiency of admission & discharge process.
  Radios (grey, Group 675: fill+stroke #E7E7E7) 12.812x13 at column centre −6.4, top = row top + 9.
- "Tell us how we can improve:" Bold 15 at (100,1430). Textarea 797x194 r 8 at (103,1469), placeholder "Write Something..." Book 11 lh 14 #6b6b6b at (121,1486).
- SUBMIT 147.831x50 r 15 #00b8ff centred (+3.92) top 1679; label Bold 15 white centred, top +20.
