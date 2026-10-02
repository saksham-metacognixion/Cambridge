# Patient Hub 76:735 (file LJIRtzU574JrA1BgK881Qm) -- FULL get_design_context + screenshot (call log #34). Frame 1052 x 2739, bg white.
Coordinates = frame px (page y). Gotham = Figma 'Gotham:<weight>'. Preview: figma-cache/patient-hub.png (394x1024, low-res).
Assets: figma-cache/assets/patient-hub/* (md5 duplicates of cached files noted below).

## Header 112:14924 (y0-119) = landing header (same texts/positions). Reuse Header.astro.

## Hero 59:13723 (y119-556) -- same layout as Find a Doctor hero 62:180, different image and text
Banner 59:13724 hero-banner.png (1052x500 RASTER, NEW image, no 2x) in 1052x437 box @0,119, img h114.42% w100% left0 top0, overflow hidden
Title 59:13727 "Your Care, Simplified." Gotham Medium 39px #004059 lh normal @95,290 w422 (one line)
Text 59:13728 Gotham Book 12px lh14 #6b6b6b @97,337 w389 h27: "Access everything you need for your care journey — from finding specialists to referrals, insurance support, and patient resources, all in one place."
Button 59:13725 outline 1px #00b8ff radius 7, 164x30 @98,387 ; text 59:13726 "Book an Appointment" Gotham Medium 13px #00b8ff centered cx178.5 top396 w145 h15

## Intro
H2 59:13951 "Everything You Need, In One Place" Gotham Medium 28px #00415a lh normal @56,578 w558 h33
P 59:13912 Gotham Book 12px lh14 #6b6b6b @58,623 w937 h28: "Explore essential services and resources designed to support patients, families, and referring partners throughout every stage of care."

## Cards (6, 3 x 2). Card = white, border 0.334px #418ea2, radius 20.014, w296.21; image on top 296.21x325.564 radius-top 20.014, object-cover;
## title Gotham Medium 20.014px #004059 lh normal h20.014 ; 2-line text Gotham Book 12.008px lh13.343 #6b6b6b (explicit <br>) ;
## button #004059 radius 4.003 98.737x22.683 ; label Gotham Medium 10.674px lh13.343 white, left = button left + 9.33, top = button top + 5.34 (left-aligned, w88.062)
Row 1 (box top 678.34, h444.314; image top 674.33 -> image sits 4.01 ABOVE the box top):
 76:728 @53   img card-conditions.png (59:13932)  title "Conditions & Specialities" @75.68,1015.91 w290.873 | text "Explore conditions we treat / Expert care across specialties" @75.68,1045.26 w233.499 | btn @75.68,1082.62 "Explore Care"
 76:729 @378  img card-find-doctor.png (59:13947, top 673 not 674.33) | "Find a Doctor" @400.68,1015.91 | "Find the right specialist / Care tailored to your needs" @400.68,1045.26 | btn @400.68,1082.62 "Find a Doctor"
 76:730 @698.79 img card-refer.png (59:13949 "Home-Healthcare 1"; covers 59:13934 card-refer-under.png = services/inpatient.png, fully hidden) | "Refer a Patient" @716.14,1015.91 | "Simple referral process / Connect patients to care" @716.14,1045.26 | btn @716.14,1082.62 "Refer Now"
Row 2 (box tops 1161.35 / 1162.68 / 1162.68, h457.657 / 456.323 / 456.323; image tops 1157 / 1158.68 / 1157.34):
 76:733 @53   img card-international.png (59:13950) | "International Patients" @70.35,1508.26 w258.85 | "Care beyond borders / Support for global patients" @70.35,1536.28 | btn @70.35,1570.97 "Learn More"
 76:732 @371.89 img card-insurance.png (59:13933) | "Insurance & Networks" @403.92,1508.26 | "Check your coverage / Trusted insurance partners" @403.92,1537.61 | btn @403.92,1574.97 "View Insurance"
 76:731 @694.79 img card-testimonials.png (59:13948) | "Patient Testimonials" @726.81,1508.26 | "Real patient experiences / Stories of recovery & care" @726.81,1537.61 | btn @726.81,1574.97 "View Stories"
 Figma inconsistencies: column x 53/378/698.79 (row1) vs 53/371.89/694.79 (row2); text inset 22.68 / 22.68 / 17.35 (row1) and 17.35 / 32.03 / 32.02 (row2); row heights differ by 12-13px.
 All images 888x976 RASTER (= 3x of 296x325 Figma => ~2.2x at the 1440 build: OK).

## Recovery CTA 59:13953 (y1673-1941) = Contact page Recovery CTA 86:842 EXACTLY (same offsets relative to band top, same 4 tiles
## "Book an Appointment / Find a Doctor / Refer a Patient / Send an Inquiry", same icons, same text). cta-deco.svg == contact cta-corner-fill.svg
## up to ~0.0005px float noise. Reuse ContactRecovery.astro.

## Doctors
H2 59:13952 "Expert Care, Trusted Doctors" Gotham Medium 28px #00415a @56,1994 w558 h33
P 59:13913 Gotham Book 12px lh14 #6b6b6b @58,2030 w937 h26: "Our specialists are committed to providing the right care at every stage of your journey."
4 cards 215x268.46 at x 48 / 294 / 541 / 788, top 2069 (same as Find a Doctor grid row 1; same masks/bars/photos as cached): Ahmad Al Khayer, Wael Sary, Suhaila Kallada, Rober Hanna Kassab. Only "See More" (no Book Now). Static row, fits the frame (no overflow, no slider).
 Wael role 59:13994 is 8px/lh10 + capitalize (others 9.226/11.532) -- Figma inconsistency.

## Footer 112:10924 (y2371-2739) = landing footer (same texts). Reuse Footer.astro.

## Links on the page (targets not in Figma; frames for these pages unknown)
Hero "Book an Appointment" ; cards: Explore Care, Find a Doctor, Refer Now, Learn More (International Patients), View Insurance, View Stories ;
CTA tiles: Book an Appointment, Find a Doctor, Refer a Patient, Send an Inquiry ; doctor "See More" x4.
No forms, accordions, tabs or sliders in this frame.

## Build notes (2 Oct, src/pages/[...base]/patient-hub.astro)
- Screenshot at full size: figma-cache/patient-hub.png is now 1052x2739 (call #43). Hero original is only 1052x500 (call #42, hires/ = upscaled export).
- User decisions: all 6 cards use card 1 geometry (uniform grid); Wael role text = other cards (DoctorCard sizes).
- Recovery band heading sits 50 below the box top here (Contact: 43) -> ContactRecovery `headTop` prop.
- Verified at 1440: every measured box within 0.15 Figma px of the spec (scratchpad ph-measure.mjs), page height 2739.
