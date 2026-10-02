# Media Hub 100:5522 (file LJIRtzU574JrA1BgK881Qm, drafts copy) -- frame 1052 wide, ~2641 tall. All values Figma px (x1.3688 for 1440). Absolute coords in frame.
Header 0-119 (same as landing; "Media Hub" nav item at x532 y33 is 9px Book #00b8ff like other top links). Footer top 2273 (same as landing, rounded-top 30, #004059, h368). Both reuse existing components.
## Hero (top119 h437, Banner3 1 = assets/media-hub/banner3.png 1052x500, image h114.42% left0 top0 w100%, overflow hidden)
H1 "Stay Informed" / "with Cambridge" Gotham Medium 39px lh normal #004059 left95 top260 w494
Sub Gotham Book 12px lh14 #6b6b6b left97 top338 w374 h27: "Explore the latest updates, medical insights, and key developments from Cambridge Hospital and beyond."
Button outline: left98 top384 w164 h30 radius7 border 1px #00b8ff; text "Book an Appointment" Gotham Medium 13px #00b8ff centered cx178.5 top393 w145 h15
## Explore Our Media
Title "Explore Our Media" Gotham Medium 28px #004059 centered cx521 top593 w430 h27
Sub Gotham Book 12px lh14 #6b6b6b centered cx520.5 top630 w577 h32 (2 lines): "Browse articles, events, conferences, and press releases to stay updated with our latest" / "activities and insights."
Select "Browse all categories": box left371 top699 w311 h35 radius10 border 0.5px #418ea2 (no fill); text Gotham Book 10px lh14 #004059 left386 top709; chevron select-chevron.svg 7x4.207 left658 top716
Category tiles (4, top777 w222 h342 radius15, gap 23/24): x48 | x293 | x538 | x783. Each = photo + overlay (tile-overlay-rectangle2.png, full tile, object-cover) + title + pill + corner arrow.
 photo: tile1 tile-al-khobar.png (img h99.92% left-177.49% top0 w314.41%) ; tile2 tile-doctor.png (object-cover) ; tile3 tile-patient1.png (h100% left-94.87% top0.14% w314.66%) ; tile4 tile-patient2.png (object-cover)
 title Gotham Medium ~20.26px white lh normal, left tile+16 (64,311,557.45,802.45) top1049 w147-190: "Lateral Epicondylitis" | "Pre-Maturity Awareness Day" | "1st Fujairah ICU Symposium" | "Newborn Brachial Plexus Injuries"
 pill: bg #00b8ff radius5.044 h22.82-23 top1021 left tile+16; label Gotham Medium 12.61px white UPPERCASE padding ~4.2/5.5: "HEALTH ARTICLES"(w132.866) | "EVENTS"(w70) | "CONFERENCES"(w110.436) | "PRESS RELEASES"(w132.866)
 corner arrow icon ~29.6px (rotated -45deg group, wrapper ~41.5 box) at tile top-right: tile1 left224 top778 (arrow tile-arrow-87.svg, extra rot -45.51deg skewX -1.02deg) | tile2 left472.06 top781.86 (tile-arrow-89) | tile3 left712.2 top781.86 (tile-arrow-88) | tile4 left957.2 top781.86 (tile-arrow-90)
 Carousel dots under tiles (visible in screenshot ~ y1160, 5 dots, 2nd active): NOT in the code output -> ask/measure (a Figma element outside the returned code?). 
Divider (divider-group620.svg 40.972x8.716) left506 top1183.
## Latest Blogs & Posts (bg #f2f2f2 left0 top1236 w1052 h656.769)
Eyebrow "WHAT’S TRENDING" Gotham Light 14.173px uppercase tracking 1.4173px #004059 centered top1301 w282
Title "Latest Blogs & Posts" Gotham Bold 29.076px lh34.336 #004059 centered cx526.66 top1345.64 w457.328
Cards (3) x115 | 401 | 685, image box top1411.64/1412.64 w248.389 h175.333 radius21.917 shadow 7.306 7.306 21.917 0 rgba(0,0,0,.2). Images: card1 card1-rectangle35.png object-cover; card2 card2-rectangle36.png (h167.11% left-95.59% top-57.97% w240.94%); card3 card3-rectangle37.png object-cover.
 Date badge: white, drop-shadow 2.922 2.922 5.479 rgba(0,0,0,.25), radius bottom 7.306, p7.306, gap3.653, h36.528, w~41.6 (40.181 for "13"), left card+36.53 top image-top. Day Poppins Medium 14.173 #2b2b2b ; weekday Poppins Regular 11.689 lh18.994 #808080. ("15 Wed", "13 Mon", "10 Fri")   [NOTE Poppins: not a Gotham weight -> flag; font not self-hosted yet]
 Title Gotham Medium 18.264px lh normal #004059 w248.389 top1609-1610 (left card+5..): "First Patients to Its New Saudi Facility" | "The Diamond sponsor for the 14th version of SEHA" | "The Eastern Province of KSA, is fully operational"
 Excerpt Gotham Book 11.689px lh18.994 #6b6b6b w248.389 top~1662: "The 60-bed medical facility provides the most recent rehabilitation...." | "Cambridge Medical and Rehabilitation Center has come forward...." | "In Q2 2019, Cambridge Medical & Rehabilitation, the UAE’s leading...."
 Arrow arrow-group33.svg 36.528x36.528 at card-x+219 (334,618,900) top1716.64
Divider again (divider-group620.svg) left506 top1812. Carousel dots under cards (y~1800 in screenshot, 3 dots, first active): same gap as above.
## Newsletter (white bg top1854 h409 ; pattern Logo Pattern 1 = logo-pattern.png 1045x497 opacity .55 centered top1893)
Card: white, radius20, shadow 7.31 7.31 21.92 -6 rgba(0,0,0,.25), w772 h267 centered (cx 526) top1953
Heading "Subscribe to" / "Our Newsletter" Gotham Medium 36px lh1.01 tracking .36px #004059 left208 top1986 w402
Sub Gotham Book 15px lh18.264 black centered cx~528.5 top2074 w641: "Sign up for free, and stay up to date on research advancements, health tips and more!"
Form: base white radius15 shadow 0 2.922 87.667 0 rgba(142,131,113,.15) left259 top2116 w535.497 h75.247 ; email icon box #f8f8f8 radius19.725 39.45 sq left276.53 top2133.53 with glyph "✉️" (emoji text, Nunito Sans SemiBold 18.994 #6c777c -- flag) ; placeholder "youremail123@gmail.com" Gotham Book 13.15px #57656c left334.25 top2143.76 ; button #00b8ff radius15 left632.31 top2127.69 w150.494 h51.869, label "SUBSCRIBE" Gotham BOLD 11.689px white left673 top2150  [Gotham Bold = 4th weight not in CLAUDE.md font list -- flag]
## Not present in this frame: pagination, load-more, search, filter pills, empty state, "Blogs/News/Events" pills. Only: category <select> + 4 category tiles + 3 latest posts + 2 dot indicators.
