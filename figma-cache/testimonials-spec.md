# Testimonials 2007:342 (frame 1204 wide, page x=-96, page y2892). Coords FRAME-relative => page x = value - 96
Blue panel 67:3796: bg #00b8ff radius 12.658 927.828x232.906 @158,0
Panel art 67:3797: bg-ellipses.svg 927.828x232.906 @158,4 (svg, 3 ellipses)
Title 67:3801 "Stories of Care and Recovery": Gotham Medium 28px white, text-transform capitalize, lh normal @402,34 w439
Sub 67:3802 "Hear from our patients as they share their journeys of recovery, care, and renewed independence." Gotham Book 12px lh14px white @333,70 w578
CARDS (6) 185x231 top117 white, border 0.25px #418ea2 radius 15. x: 0 | 203 | 406 | 609 | 812 | 1014   (page: -96 ... 918; first/last cut by page edge)
Per card (x = card x): quote text Gotham Book 9px lh13px #00415a @x+13,148 w159 h52 ; name Gotham BOLD(700) 9px lh13px #00b8ff @x+13,205 w159 h16 ; quote-icon.svg 12x12 @x+13,126 ; corner-vector.svg 53x53 @x+137,303, transform flipX (rotate180+scaleY-1) ; pattern box 107x115 @x,233 overflow clip radius-bottom-left 16
 c0   Mohamed Al Menhali : "Alhamdulillah, I regained my ability to walk in about 4 months with their help."; photo patient-6 117x146 @55,202 object-cover
 c203 Mohamed Salem Al Bloushi : "Thank God, I was able to get back to walking within a timeframe of almost 4 months with God’s will and the help of the team."; photo patient-1 114x142 @261,206 object-cover
 c406 Tamam’s Mother : "We are truly grateful for the significant improvements we have observed in Tamam’s communication abilities."; photo patient-2 127x158 @454,190 object-cover
 c609 Shamma’s Mother : "Shamma’s ability to communicate has improved remarkably and significantly, thanks to Cambridge."; photo shamma.png 157x175 @637,173, wrapper overflow hidden radius-bottom-right 16, img height 112.02% left 0 top -0.01% width 100%
 c812 Salem Bin Saleh : "Thank God, I was able to get back to walking within a timeframe of almost 4 months with God’s will and the help of the team."; photo patient-4 132x158 @865,190, wrapper overflow hidden radius-bottom-right 18, img height 119.62% left -0.14% width 114.67%
 c1014 Nujood Saeed : "With God’s grace and the team’s support, I was walking again in nearly 4 months."; photo patient-5 124x155 @1080,193 object-cover
Layer order INSIDE each card (after card bg), bottom->top:
 c0: pat, quote, photo, name, vec, qi | c203: pat, quote, name, photo, vec, qi | c406: qi, pat, photo, quote, name, vec | c609: pat, quote, photo, qi, name, vec | c812: qi, name, pat, photo, vec, quote | c1014: pat, qi, photo, quote, name, vec
PATTERN BOX (107x115): children = masked elements. Each element: absolute with inset(top right bottom left) of the box; mask-image: pattern-mask.svg, mask-mode alpha, mask-size 135.395px 117.928px, mask-position -4.959px -7.656px, no-repeat; content <img pattern-fill.svg fills it>.
  insets: A "4.11% 3.42% -12.46% -20.43%" ; B "4.11% -186.3% -12.46% 169.29%" ; C "4.11% -376.02% -12.46% 359.01%" ; D "4.11% -185.36% -12.46% 168.36%"
  c0: A,B | c203: A,B | c406: A,B | c609: A,B,B,C | c812: A,B,B,C,D | c1014: A,B,B,C,D
Button group 81:825: bg #00b8ff radius 7 166x30 @539,391 ; text "View More Stories" Gotham Medium 13px white centered cx621.5 top400 w145 h15 lh normal
Interaction (user): CSS scroll-snap row, swipe/scroll, no arrows/dots. Auto-scroll loop added 2 Oct 2026 at the user's request (live-site behaviour, see src/scripts/autoscroll.ts).
NOTE: introduces Gotham BOLD (700), a 4th weight -> tell user.
