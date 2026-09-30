# Page-level (read via use_figma)
Root 93:894 "Landing Page": 1052x5664, NO fill, clipsContent=true (everything beyond x0..1052 is cut).
Page bg 21:664: WHITE #ffffff rectangle 1052x5453 @0,200, radius 0, drop shadow 0 4px 4px rgba(0,0,0,0.06).
Hidden (visible=false, do not build): Banner 1 21:665, Banner2 1 21:666.
Loose pager dots (STATIC decorative, in Figma design): 78:759 Group 621 @506,537 41x8.7 (dots-hero.svg, light dots #F9F9F9, active #004059 r4.36) -> Hero bottom; 78:748 Group 620 @506,1649.28 (dots-doctors.svg, dots #D9D9D9) -> under Doctors; 80:808 Group 622 @(News frame) 446,544 (news/divider-group622.svg) already in News spec.
Vertical page layout (design px, y): Header 0-119 (on top, z highest) | Hero 117-617 | CTA Tab 560-642 (over hero) | Services 640-1193 | Doctors 1241-1611 (+pills 1320, dots 1649) | Care Support 1698-2054 | Facilities 2054-2842 | Testimonials 2892-3313 | Start Recovery 3367-3553 | Calculators 3553-3997 | News 4041-4631 | Insurance 4665-4872 | Contact 4906-5403 | Footer 5285-5653 (top radius 30; overlaps Contact bottom) | page height 5664
Z-order at root (bottom->top): 21:664, Doctors(21:1204), Hero, Services, CTA, Care, Facilities, Testimonials, Recovery, Calculators, Contact, dots, News, Insurance, Footer, Header
