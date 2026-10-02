# Doctor - Page 32:826 (file LJIRtzU574JrA1BgK881Qm). Figma px, frame 1052 wide. Header 112:15684 and Footer 112:11693 = same as the landing ones (NOT re-downloaded). Screenshot: ../doctor-profile.png
Page bg white. Fonts Gotham Book/Medium. No h1 tag in Figma: name is the h1.
## Breadcrumb band
Bar #00415a, 1052x67, top 119 (directly under header). Text "Home / Find a Doctor / Dr. Ahmad Al Khayer" Gotham Book 8px white, x94 top148 (w179).
## Photo card (32:1206)
Card: white bg, border 0.288px solid #418ea2, radius 17.298, 244.577x215 @ (104,240).
Inner grey panel: rgba(231,231,231,0.5), radius 17.298, 236.482x204.775 @ (107.96,243.96).
Decor: masked shape (mask photo-mask.svg, mask-size 240.613x204.222, mask-position -8.811px -4.689px, alpha, no-repeat), fill photo-shape.svg, inset [20.29% 67.75% 61.3% 11.1%] of the page frame (positions the cyan pill bars behind the doctor). Decorative => absolute inside the card.
Photo: dr-ahmad.png, 153.433x174.182 @ (148.92,274.35), object-cover, bottom flush with the inner panel bottom (y448.5).
## Name block
Name "Dr. Ahmad Al Khayer": Gotham Medium 20px #00415a lh normal, x~382 (inset left 36.31%), top ~245 (inset top 20.41%).
Role "Physical Medicine & Rehab Specialist": Gotham Book 9.226px lh 11.532px, colour #359446 (GREEN), same x, top ~258.
Button "Book an Appointment": bg #004059, radius 5.766, text Gotham Medium 9px white centred lh 11.532px; box inset [21.06% 9.22% 76.65% 78.33%] => x~824, w~144 (right edge ~955), h~16, top~252.
Rule under header block: rule-top.svg, 571 wide @ (384,305), stroke 0.5.
## Sub specialities
Heading "SUB SPECIALITIES": Gotham Medium 12.75px lh 16.337px #004059, left-aligned in the screenshot though Figma centre-translated (cx 444.5, top 317). Visible at x~384..
Items: 3 columns x, rows. Text Gotham Book 11px lh 20.7px #6b6b6b, text x = icon x + 17, icon arrow-icon.svg 10x10 (icon top = text top + 5).
 Col x (icon): 402 | 585 | 771 ; rows top 344, 376, 408 (pitch 32).
 Row1: Physical Rehabilitation | Spinal Cord Injury Care | Brain Injury Rehabilitation
 Row2: Sports Injury Treatment | EMG & Nerve Studies | Pain Management
 Row3: Acupuncture Therapy (col1 only)
=> grid of 3 columns, flows left-to-right, variable count.
## Professional Summary
Two rules rule-section.svg 857 wide centred (cx 526.5): y477 and y822.
Heading "Professional Summary": Gotham Medium 13px lh 16.362px #133c4f @ (100,500).
Body: Gotham Book 12px lh 15.4px #6b6b6b, text-align justify, w855 @ (100,514), h285. Paragraphs separated by blank lines (zero-width-space paragraphs) = bio HTML <p> with spacing; one paragraph pair has no blank line between (source quirk).
Full text in the Figma code (paragraphs): CEO/Chair of Rehabilitation Medicine at CMRC UAE, 25 yrs; Consultant PRM, UK training, fellowships Pain Medicine & Spinal Disorders, master's Orthopaedic Sciences & MBA; career across UAE, UK, Qatar, KSA, Ireland, Syria; leadership journey transformation; as CEO oversight across CMRC UAE facilities.
## NOT shown on the profile in Figma
No hospital, no languages, no country, no photo gallery, no contact info, no related doctors. Only: breadcrumb, photo, name, role, Book an Appointment, sub specialities, professional summary.
## Footer: starts y857 (rounded top corners 30px), same as landing footer.
