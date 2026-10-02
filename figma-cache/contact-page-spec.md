# Contact us PAGE 86:431 (1052 wide, drafts copy). Coordinates = frame px (page y). Gotham = Figma 'Gotham:<weight>'.
Header 112:17394 (y0-119) and Footer 112:13061 (y1581-1949, h368) = SAME as landing (text identical) -> reuse components.
Page bg white. Grey band 86:432 rgba(231,231,231,.5) 1052x667 @0,556.

## Hero 86:433 (y119, h437)
Banner 86:434 banner.png 1052x500 PNG shown in 1052x437 box @0,119, img h 114.42% left0 top0 w100% (cropped, overflow hidden)
Button outline 86:435: 1px #00b8ff, radius 7, 164x30 @98,384, transparent. Text "Inquire Now" Gotham Medium 13px #00b8ff centered cx178.5 top393 w145 h15
Title 86:437 "Speak with / Our Care Team" (2 paras) Gotham Medium 39px #004059 lh normal @95,297 w374

## Heading 86:879 "Contact US": Gotham Medium 28px #00415a centered cx526.5 top598 w651 h33

## Form card 86:773 (y652)
White card 86:774: 859x463 @67,652 radius 22.056
Navy panel 86:806: #004059 302x463 @682.2,652 radius right-top/right-bottom 19.409 (left square)
Map 86:807: map.png (1364x1726 RASTER, static) 307x375 @590,696 radius 28, object-cover
Fields (Gotham Book 15px lh18.82 #004059 labels @x117; inputs bg #ececec radius 10.754):
 "Full Name*" label @117,690 w88 | input 322x35 @205,682
 "E-mail*" label @117,745 | input 322x35 @205,737
 "Hospital*" label @117,800 | input 322x35 @205,792 ; placeholder-like "Select Hospital" Gotham Book 12px lh14 #6b6b6b @216,803 ; chevron select-chevron.svg 7x4.207 @507,810 => A SELECT (options NOT in Figma)
 "Subject*" label @117,855 | input 322x35 @205,847
 Message textarea: 410x86 @117,902 radius 10.754 ; placeholder "Type your Message*" Gotham Book ITALIC 12px lh14 #6b6b6b @124,910.94 w186
 Consent 86:799: checkbox.svg (circle 12x12, svg 15.47 incl inset -14.44%) @124,1012 ; text Gotham Light 9.87px lh10.5 #004059 @147,1008 : "I have read the " + "Privacy policy" (Gotham Book, underline) + " and I consent to the transfer and processing of" / line2 "my personal data."
 SUBMIT button 86:804: #00b8ff 108x36 radius 18.673, centre x = 50% - 355 (=171), top1049 ; text "SUBMIT" Gotham BOLD 10.8px white, left calc(50%-376.6) (=149.4), top ~1060.5 (calc(50%+84.46) of 1223 frame? treat: vertically centred in button)
Corner art 86:821/86:824/86:825 (clip path group): inset 34.07% 6.46% 43.68% 70.53% of frame; masked group opacity .30, mask card-corner-mask.svg size 242x435 pos -17.395,-2 ; fill card-corner-fill.svg  (decor on navy panel; frame 1052x2? percentages are of frame height 1949)

## Contact row (y1155-1190) Gotham Book 17.224px #004059
 mail icon icon-mail.svg inset 59.18% 86.72% 39.85% 11.31% | "info@cmrc.ae" @148.11
 globe icon-globe.svg 25.2x25.2 @40.21% left | "www.info@cmrc.ae" (sic) 
 phone icon-phone.svg 18x18 @left 73.48% | "+971 8002672" @800.56 w132.6 (both spans Gotham Book; font-family fallback Overpass SemiBold on wrapper, unused)
 (vertical: texts at top ~1157 ; centred on 50%+... of 1949 frame)

## Recovery CTA 86:842 (y1271, h268) navy #004059 938x268 @57 radius 15
 Para 86:844 Gotham Book 12px lh14 white @110,1443 w324 h44: "Care at Cambridge Hospital is a connected journey across inpatient, outpatient, home, and school services, supporting every stage of recovery."
 Heading 86:845 Gotham 28px white @109,1314 w331 h109: "Your recovery matters to us," (Gotham BOOK) + " and we are with you every step of the journey." (Gotham MEDIUM) -- line break before "the journey."
 4 tiles: white, border .15px #418ea2, radius 10, 194x68: @527,1322 | @742,1322 | @527,1423 | @742,1423
 Labels Gotham Medium 13px #00415a centered w148 h15: "Book an Appointment" cx624 top1365 | "Find a Doctor" cx834 top1365 | "Refer a Patient" cx620 top1464 | "Send an Inquiry" cx839 top1464
 Icons: calendar-clock 24 @609,1332 | search 23 @610,1432 | message-share 26 @826,1433 | stethoscope 26 @826,1331
 Corner art 86:847-851 (clip, mask cta-corner-mask.svg size 433x266.622 pos -17.395,127.28, opacity .3, fill cta-corner-fill.svg)
 NOTE: differs from the landing 'Start Your Recovery' banner (recovery-spec.md) -> NEW component.

## Vertical rhythm
Hero end 556 | Contact US heading 598 | card 652-1115 | contact row ~1157 | grey band ends 1223 | CTA 1271-1539 | footer 1581.
